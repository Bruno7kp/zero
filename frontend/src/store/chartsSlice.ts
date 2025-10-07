import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { db } from '../db/indexedDb';
import { apiUrl } from '../config';
import type { ChartData } from '../db/indexedDb';

export interface ChartsState {
  data: ChartData[];
  statsMap: Record<string, any>;
  loadingData: boolean;
  loadingStats: boolean;
  revalidatingStats: boolean; // modo "silencioso" (não mostrar loading) enquanto revalida cache/stats existentes
  charts: any[];
  activeChartId: number | null;
  statsRequestId: string | null;
  statsCache: Record<string, { data: Record<string, any>; createdAt: number }>;
  statsBump: number; // monotonic bump to force UI loaders to re-run
}

const STATS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 min fresco
const STATS_CACHE_STALE_GRACE_MS = 15 * 60 * 1000; // +15 min stale utilizável

const initialState: ChartsState = {
  data: [],
  statsMap: {},
  loadingData: false,
  loadingStats: false,
  revalidatingStats: false,
  charts: [],
  activeChartId: null,
  statsRequestId: null,
  statsCache: {},
  statsBump: 0,
};


// Cache leve de "chart run" (array de {week, rank}) por entidade para cálculos rápidos de peak/totalWeeks até certa semana
const runCache: Map<string, Array<{ week: string; rank: number | null | undefined }>> = (globalThis as any).__zeroRunMiniCache || ((globalThis as any).__zeroRunMiniCache = new Map());

function upsertRunCache(chartId: string, chartType: string, entityId: string, rows: ChartData[]) {
  const key = `${chartId}|${chartType}|${entityId}`;
  // Armazena apenas week + rank (ordenado)
  if (!rows || !rows.length) return;
  const simplified = rows.map(r => ({ week: r.week, rank: r.rank })).sort((a, b) => a.week.localeCompare(b.week));
  runCache.set(key, simplified);
}

// Garante que a semana atual esteja presente no runCache sem perder histórico prévio
function ensureRunCacheWeek(chartId: string | number, chartType: string, entityId: string, week: string, rank: number | null | undefined) {
  const key = `${chartId}|${chartType}|${entityId}`;
  const existing = runCache.get(key);
  if (!existing) {
    runCache.set(key, [{ week, rank }]);
    return;
  }
  const found = existing.find(r => r.week === week);
  if (found) {
    // Atualiza rank se mudou
    if (found.rank !== rank) found.rank = rank as any;
    return;
  }
  // Inserção mantendo ordenação (runs normalmente curtos, custo ok)
  existing.push({ week, rank });
  existing.sort((a, b) => a.week.localeCompare(b.week));
}

function computeMinimalStatsUntilWeek(chartId: string, chartType: string, entityId: string, untilWeek: string) {
  const key = `${chartId}|${chartType}|${entityId}`;
  const run = runCache.get(key);
  if (!run || !run.length) return null;
  let peak = Infinity;
  let weeksWithin = 0;
  let weeksAtOne = 0;
  for (const r of run) {
    if (r.week > untilWeek) break; // já passou
    // Conta qualquer aparição no chart (rank != null) para total de semanas
    if (r.rank != null) {
      weeksWithin++;
      // Peak: menor posição atingida (independente de cutoff); se quiser limitar ao cutoff, reintroduzir checagem
      if (typeof r.rank === 'number' && r.rank < peak) peak = r.rank;
      if (r.rank === 1) weeksAtOne++;
    }
  }
  const peakPos = peak === Infinity ? null : peak;
  return {
    peak: { position: peakPos, weeksAtPeak: peakPos === 1 ? weeksAtOne : undefined },
    totals: { withinCutoff: weeksWithin },
    sequences: null,
    _minimal: true,
  };
}


export const fetchChartData = createAsyncThunk(
  'charts/fetchChartData',
  async ({ chartId, chartType, week }: { chartId: string; chartType: string; week: string }, { dispatch, getState }) => {
    const rows = await db.charts_data
      .where(['chartId', 'chartType', 'week'])
      .equals([chartId, chartType, week])
      .toArray();
    // Agenda um backfill automático de stats mínimos caso só tenhamos a semana atual e exista histórico anterior no DB.
    // Resolve o caso dos álbuns que ficam travados em (peak=rank atual, weeks=1) até trocar de tipo.
    setTimeout(async () => {
      try {
        const st: any = getState();
        if (!rows.length) return;
        // Já existe uma requisição de stats em andamento? então não interfere.
        if (st.charts.statsRequestId || st.charts.loadingStats) return;
        // Se já temos algum stats desse chart com weeks > 1 não precisa.
        const hasRich = Object.values(st.charts.statsMap || {}).some((s: any) => s && s.chartId == String(chartId) && s.chartType === chartType && s.totals && s.totals.withinCutoff > 1);
        if (hasRich) return;
        // Verifica rapidamente se existe pelo menos 1 linha histórica anterior à semana atual.
        const olderExists = await db.charts_data
          .where('[chartId+chartType+week]')
          .below([chartId, chartType, week])
          .limit(1)
          .count();
        if (!olderExists) return; // nada a enriquecer
        // Dispara incremental rápido para preencher runCache completo.
        dispatch(fetchStatsMapIncremental({ chartId: String(chartId), chartType, data: rows, week }));
      } catch { /* silencioso */ }
    }, 60); // pequeno atraso para permitir pintura inicial
    return rows;
  }
);

// Recalcula rapidamente deltas (deltaRank, deltaPlays) para as linhas da semana atual sem precisar recomputar todos stats.
export const computeWeekDeltas = createAsyncThunk(
  'charts/computeWeekDeltas',
  async ({ chartId, chartType, week, rows, cutoff = 100 }: { chartId: string; chartType: string; week: string; rows: ChartData[]; cutoff?: number }, { dispatch }) => {
    const updates: Array<{ entityId: string; deltaRank: string | number; deltaPlays: string | number }> = [];
    for (const r of rows) {
      if (r.week !== week) continue;
      try {
        // Busca últimas 2 ocorrências até a semana atual (incluindo a própria se já persistida)
        const recent = await db.charts_data
          .where('[chartId+chartType+entityId+week]')
          .between([chartId, chartType, r.entityId, '0000'], [chartId, chartType, r.entityId, week])
          .reverse()
          .limit(2)
          .toArray();
  const current = recent.find(x => x.week === week) || r; // se a semana atual ainda não estiver em DB, usa row em memória
        const prev = recent.find(x => x.week !== week && x.rank != null);
        // Calcula deltaRank / deltaPlays
        let deltaRank: string | number = 'NEW';
        let deltaPlays: string | number = 'NEW';
        if (prev) {
          const diffDays = Math.round((new Date(current.week).getTime() - new Date(prev.week).getTime()) / 86400000);
            const gap = diffDays !== 7; // se gap, trata como RE
            if (prev.rank && prev.rank <= cutoff && !gap) {
              // delta numérico
              deltaRank = (prev.rank && current.rank) ? (prev.rank - (current.rank || prev.rank)) : '-';
              deltaPlays = (typeof current.plays === 'number' && typeof prev.plays === 'number') ? current.plays - prev.plays : '-';
            } else {
              deltaRank = 'RE';
              deltaPlays = 'RE';
            }
        }
        updates.push({ entityId: r.entityId, deltaRank, deltaPlays });
      } catch { /* ignore entity errors */ }
    }
    if (updates.length) dispatch(updateRowDeltas(updates));
    return updates.length;
  }
);

// fetchStatsMap (full stats) removido: substituído por caminho minimal + incremental.

interface IncrementalArgs { chartId: string; chartType: string; data: ChartData[]; week: string; batchSize?: number }

// Cache em memória de linhas por entidade (histórico cumulativo). Sobrevive enquanto a aba estiver aberta.
const entityRowsCache: Map<string, ChartData[]> = (globalThis as any).__zeroEntityRowsCache || ((globalThis as any).__zeroEntityRowsCache = new Map());

export const fetchStatsMapIncremental = createAsyncThunk(
  'charts/fetchStatsMapIncremental',
  async ({ chartId, chartType, data, week, batchSize = 15 }: IncrementalArgs, { dispatch, getState }) => {
    if (!data || !data.length) return;
    const requestId = `${chartId}_${chartType}_${week}_${Date.now()}`;
    const cacheKey = `${chartId}_${chartType}_${week}`;
  // const tGlobal = performance.now(); // debug only
    const state0: any = getState();
    if (!state0.charts.statsCache || typeof state0.charts.statsCache !== 'object') state0.charts.statsCache = {};
    const cached = state0.charts.statsCache[cacheKey];
    const now = Date.now();
    // Purga preguiçosa de caches muito antigos
    for (const k of Object.keys(state0.charts.statsCache || {})) {
      try {
        const e = state0.charts.statsCache[k];
        if (!e) continue;
        const age = now - e.createdAt;
        if (age > STATS_CACHE_TTL_MS + STATS_CACHE_STALE_GRACE_MS) dispatch(removeStatsCacheEntry(k));
      } catch { /* ignore */ }
    }
    let silentRevalidate = false;
    if (cached) {
      const age = now - cached.createdAt;
      if (age < STATS_CACHE_TTL_MS) {
        // Cache fresco: simplesmente usa e sai (nenhum flicker)
        dispatch(replaceStatsSnapshot(cached.data));
        return;
      } else if (age < STATS_CACHE_TTL_MS + STATS_CACHE_STALE_GRACE_MS) {
        // Cache morno/stale porém aceitável: usa snapshot imediato e revalida em modo silencioso
        dispatch(replaceStatsSnapshot(cached.data));
        silentRevalidate = true;
      }
    } else {
      // Sem cache, mas talvez já tenhamos stats mínimos inseridos por fetchChartData (semana atual) -> revalidar silenciosamente para evitar piscada
      try {
        const existingIds = data.map(d => d.entityId);
        const statsMap = state0.charts.statsMap || {};
        let haveExisting = 0;
        for (const id of existingIds) {
          const s = statsMap[id];
            if (s && s.chartId == chartId && s.chartType === chartType && s._status !== 'stub') haveExisting++;
        }
        if (haveExisting && haveExisting / existingIds.length >= 0.5) silentRevalidate = true; // maioria já tem algo mostrado
      } catch { /* ignore */ }
    }
    if (silentRevalidate) dispatch(beginStatsRevalidation(requestId)); else dispatch(startStatsIncremental(requestId));

    // FAST-PATH: até 60 entidades
    if (data.length <= 60) {
      const entities = data.map(d => d.entityId);
      const entitySet = new Set(entities);
      const GLOBAL_LIMIT = 25;
      const ROWS_FACTOR_LIMIT = 180; // baseline aceitável de semanas por entidade
      const HARD_ABS_LIMIT = 120_000; // segurança para bases gigantes
      let mode: 'global' | 'range' = 'range';
      // Decisão prévia: se poucas entidades (<=GLOBAL_LIMIT) testamos possibilidade global
  // const tPreflight = performance.now(); // debug only
      let estimatedRows = 0;
      if (entities.length <= GLOBAL_LIMIT) {
        estimatedRows = await db.charts_data
          .where('[chartId+chartType+week]')
          .belowOrEqual([chartId, chartType, week])
          .count();
        // Heurística: escolhe global se não for absurdamente maior que (entidades * fator) OU ainda abaixo do limite absoluto
        const rowPerEntityAvg = estimatedRows / Math.max(1, entities.length);
        const rowPressure = rowPerEntityAvg / ROWS_FACTOR_LIMIT; // >1 significa acima do fator base
        if (estimatedRows <= HARD_ABS_LIMIT && rowPressure <= 4) {
          mode = 'global';
        } else {
          mode = 'range';
        }
        // dev-only preflight log removed
      } else {
        // Muitas entidades: range direto (cada entidade já tem cache incremental de rows)
        mode = 'range';
      }

  // const tQueryStart = performance.now(); // debug only
      let perEntity: Array<readonly [string, ChartData[]]> = [];
  // removed: globalRowsCount (only used for debug logs)
      if (mode === 'global') {
        const globalRows = await db.charts_data
          .where('[chartId+chartType+week]')
          .belowOrEqual([chartId, chartType, week])
          .toArray();
        // const globalRowsCount = globalRows.length; // debug only
        const map: Record<string, ChartData[]> = {};
        for (const r of globalRows) {
          if (!entitySet.has(r.entityId)) continue;
          (map[r.entityId] ||= []).push(r);
        }
        // Injeta/atualiza a linha da semana atual (melhor rank ou ausência)
        for (const r of data) {
          if (r.week === week && entitySet.has(r.entityId)) {
            const arr = (map[r.entityId] ||= []);
            const idx = arr.findIndex(x => x.week === r.week);
            if (idx === -1) {
              arr.push(r as any);
            } else if (typeof r.rank === 'number') {
              const prev = arr[idx];
              if (prev.rank == null || (typeof prev.rank === 'number' && r.rank < prev.rank)) {
                arr[idx] = { ...prev, rank: r.rank } as any;
              }
            }
          }
        }
        perEntity = Object.entries(map) as Array<readonly [string, ChartData[]]>;
        for (const [id, rows] of perEntity) {
          rows.sort((a, b) => a.week.localeCompare(b.week));
          entityRowsCache.set(`${chartId}|${chartType}|${id}`, rows);
          upsertRunCache(chartId, chartType, id, rows);
          // Overwrite incremental improvement immediately
          const minimal = computeMinimalStatsUntilWeek(chartId, chartType, id, week);
          if (minimal) {
            const stNow: any = getState();
            const existing = stNow.charts.statsMap[id];
            let shouldWrite = false;
            if (!existing || existing._status === 'stub') shouldWrite = true;
            else if (existing._status === 'minimal') {
              const oldWeeks = existing?.totals?.withinCutoff || 0;
              const newWeeks = minimal?.totals?.withinCutoff || 0;
              const oldPeak = existing?.peak?.position ?? null;
              const newPeak = minimal?.peak?.position ?? null;
              if (newWeeks > oldWeeks || (newPeak != null && (oldPeak == null || newPeak < oldPeak))) shouldWrite = true;
            }
            if (shouldWrite) {
              dispatch(partialStatsLoaded({ requestId, partial: { [id]: { chartId, chartType, entityId: id, ...minimal, _status: 'minimal' } } }));
            }
          }
        }
      } else { // range
        // 1) Envia stubs somente para entidades que ainda não possuem stats quando NÃO estamos em modo silencioso.
        const stSilent: any = getState();
        const isSilent = stSilent.charts.revalidatingStats && stSilent.charts.statsRequestId === requestId;
        if (!isSilent) {
          const stubPartial: Record<string, any> = {};
          for (const id of entities) {
            const existing = stSilent.charts.statsMap[id];
            if (existing && existing._status !== 'stub') continue; // já tem algo visível
            stubPartial[id] = { chartId, chartType, entityId: id, peak: null, sequences: null, totals: null, _status: 'stub' };
          }
          if (Object.keys(stubPartial).length && stSilent.charts.statsRequestId === requestId) {
            dispatch(partialStatsLoaded({ requestId, partial: stubPartial }));
          }
        }
        // 2) Pequena pausa para permitir pintura inicial (duplo rAF) antes das queries pesadas
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        // Mapa rápido da linha da semana atual em memória (pode ainda não estar persistida)
        const currentWeekMap = new Map<string, ChartData>(data.filter(r => r.week === week).map(r => [r.entityId, r]));
        // 3) Carrega cada entidade de forma independente e faz streaming dos resultados completos
        //    Concurrency adaptativo: começa baixo para evitar pico de latência no frame de troca de semana
        let concurrencyTarget = 1;
        const MAX_CONCURRENCY = 4;
        let active = 0;
        let idx = 0;
        const results: Array<readonly [string, ChartData[]]> = [];
        await new Promise<void>(resolve => {
          const launchNext = () => {
            if (idx >= entities.length && active === 0) { resolve(); return; }
            while (active < concurrencyTarget && idx < entities.length) {
              const id = entities[idx++];
              active++;
              (async () => {
                const key = `${chartId}|${chartType}|${id}`;
                let rows = entityRowsCache.get(key);
                // const tEntityStart = performance.now(); // debug only
                try {
                  if (rows) {
                    const lastWeek = rows.length ? rows[rows.length - 1].week : null;
                    if (!lastWeek || lastWeek < week) {
                      const from = lastWeek ? lastWeek : '0000';
                      const delta = await db.charts_data
                        .where('[chartId+chartType+entityId+week]')
                        .between([chartId, chartType, id, from], [chartId, chartType, id, week])
                        .toArray();
                      if (delta.length) {
                        if (lastWeek && delta[0]?.week === lastWeek) delta.shift();
                        if (delta.length) {
                          rows = rows.concat(delta).sort((a, b) => a.week.localeCompare(b.week));
                          entityRowsCache.set(key, rows);
                        }
                      }
                    }
                  } else {
                    rows = await db.charts_data
                      .where('[chartId+chartType+entityId+week]')
                      .between([chartId, chartType, id, '0000'], [chartId, chartType, id, week])
                      .toArray();
                    rows.sort((a, b) => a.week.localeCompare(b.week));
                    entityRowsCache.set(key, rows);
                  }
                  results.push([id, rows!] as const);
                  // Minimal stats (peak + total weeks) for responsiveness
                  // Injeta/atualiza a linha da semana atual se ainda não estiver nas rows provenientes do IndexedDB
                  const cw = currentWeekMap.get(id);
                  if (cw) {
                    const existingIdx = rows!.findIndex(x => x.week === week);
                    if (existingIdx === -1) {
                      rows!.push(cw as any);
                      rows!.sort((a,b)=>a.week.localeCompare(b.week));
                    } else {
                      // Se a versão em memória tem rank melhor (menor) ou diferente, atualiza
                      const existing = rows![existingIdx];
                      if (typeof cw.rank === 'number' && (existing.rank == null || (typeof existing.rank === 'number' && cw.rank < existing.rank))) {
                        rows![existingIdx] = { ...existing, rank: cw.rank } as any;
                      }
                    }
                  }
                  upsertRunCache(chartId, chartType, id, rows!);
                  const minimal = computeMinimalStatsUntilWeek(chartId, chartType, id, week);
                  if (minimal) {
                    const stNow: any = getState();
                    const existing = stNow.charts.statsMap[id];
                    let shouldWrite = false;
                    if (!existing || existing._status === 'stub') shouldWrite = true;
                    else if (existing._status === 'minimal') {
                      const oldWeeks = existing?.totals?.withinCutoff || 0;
                      const newWeeks = minimal?.totals?.withinCutoff || 0;
                      const oldPeak = existing?.peak?.position ?? null;
                      const newPeak = minimal?.peak?.position ?? null;
                      if (newWeeks > oldWeeks || (newPeak != null && (oldPeak == null || newPeak < oldPeak))) shouldWrite = true;
                    }
                    if (shouldWrite && stNow.charts.statsRequestId === requestId) {
                      dispatch(partialStatsLoaded({ requestId, partial: { [id]: { chartId, chartType, entityId: id, ...minimal, _status: 'minimal' } } }));
                    }
                  }
                  // dev-only per-entity slow log removed
                } finally {
                  active--;
                  // Após as primeiras 2 entidades, aumenta gradualmente a concorrência para acelerar o restante
                  if (concurrencyTarget < MAX_CONCURRENCY && results.length >= 2) {
                    concurrencyTarget = MAX_CONCURRENCY;
                  }
                  // micro-yield para permitir pintura entre entidades
                  setTimeout(launchNext, 0);
                }
              })();
            }
          };
          launchNext();
        });
        perEntity = results;
      }
  // const queryMs = performance.now() - tQueryStart + (performance.now() - tPreflight); // debug only
      const snapshot: Record<string, any> = {};
  // const tComputeStart = performance.now(); // debug only
      const halfway = Math.ceil(perEntity.length / 2);
      for (let i = 0; i < perEntity.length; i++) {
        const [id, rows] = perEntity[i];
        if (!rows.length) continue;
        // Se já veio streaming full para essa entidade, não sobrescreve (já despachamos antes)
        const stNow: any = getState();
        // Sempre calcula minimal atual (pode ser melhoria em relação ao seed inicial com apenas a semana corrente)
        upsertRunCache(chartId, chartType, id, rows);
        const minimal = computeMinimalStatsUntilWeek(chartId, chartType, id, week);
        if (minimal) {
          const existing = stNow.charts.statsMap[id];
            let shouldWrite = false;
            if (!existing) shouldWrite = true;
            else if (existing._status === 'stub') shouldWrite = true;
            else if (existing._status === 'minimal') {
              const oldWeeks = existing?.totals?.withinCutoff || 0;
              const newWeeks = minimal?.totals?.withinCutoff || 0;
              const oldPeak = existing?.peak?.position ?? null;
              const newPeak = minimal?.peak?.position ?? null;
              if (newWeeks > oldWeeks) shouldWrite = true;
              else if (newPeak != null && (oldPeak == null || newPeak < oldPeak)) shouldWrite = true;
            }
            if (shouldWrite) snapshot[id] = { chartId, chartType, entityId: id, ...minimal };
        }
        if (i === halfway) await new Promise(r => setTimeout(r, 0)); // micro-yield
      }
  // const computeMs = performance.now() - tComputeStart; // debug only
      const st: any = getState();
      if (st.charts.statsRequestId === requestId) {
        dispatch(partialStatsLoaded({ requestId, partial: snapshot }));
        dispatch(finishStatsIncremental(requestId));
        dispatch(cacheStatsSnapshot({ cacheKey, snapshot, now: Date.now() }));
      }
  // const total = performance.now() - tGlobal; // debug only
      // dev-only summary logs removed
      return;
    }

    // CAMINHO INCREMENTAL (muitas entidades)
  // const tQueryAll = performance.now(); // debug only
    const allRows = await db.charts_data
      .where('[chartId+chartType+week]')
      .belowOrEqual([chartId, chartType, week])
      .toArray();
    const rowsBy: Record<string, ChartData[]> = {};
    for (const r of allRows) (rowsBy[r.entityId] ||= []).push(r);
    // Garante inclusão das linhas da semana corrente (podem ainda não estar na tabela persistida se recém carregadas)
    for (const r of data) {
      if (r.week === week) {
        const list = (rowsBy[r.entityId] ||= []);
        const idx = list.findIndex(x => x.week === r.week);
        if (idx === -1) {
          list.push(r as any);
        } else if (typeof r.rank === 'number') {
          const prev = list[idx];
          if (prev.rank == null || (typeof prev.rank === 'number' && r.rank < prev.rank)) {
            list[idx] = { ...prev, rank: r.rank } as any;
          }
        }
      }
    }
    for (const k of Object.keys(rowsBy)) rowsBy[k].sort((a, b) => a.week.localeCompare(b.week));
  // Atualiza run cache uma vez (já limitado por untilWeek)
  for (const [entityId, rows] of Object.entries(rowsBy)) upsertRunCache(chartId, chartType, entityId, rows);
  // const queryAllMs = performance.now() - tQueryAll; // debug only

    const entities = Object.keys(rowsBy);
    let dyn = batchSize;
    const MIN = 5, MAX = 60;
    for (let i = 0; i < entities.length;) {
      const tBatch = performance.now();
      const slice = entities.slice(i, i + dyn);
      const partial: Record<string, any> = {};
      for (const id of slice) {
        const minimal = computeMinimalStatsUntilWeek(chartId, chartType, id, week);
        if (minimal) {
          const existing = (getState() as any).charts.statsMap[id];
          let write = false;
          if (!existing || existing._status === 'stub') write = true;
          else if (existing._status === 'minimal') {
            const oldWeeks = existing?.totals?.withinCutoff || 0;
            const newWeeks = minimal?.totals?.withinCutoff || 0;
            const oldPeak = existing?.peak?.position ?? null;
            const newPeak = minimal?.peak?.position ?? null;
            if (newWeeks > oldWeeks) write = true;
            else if (newPeak != null && (oldPeak == null || newPeak < oldPeak)) write = true;
          }
          if (write) partial[id] = { chartId, chartType, entityId: id, ...minimal };
        }
      }
      const st: any = getState();
      if (st.charts.statsRequestId !== requestId) return; // abort se iniciou outro request
      dispatch(partialStatsLoaded({ requestId, partial }));
      i += slice.length;
      const dur = performance.now() - tBatch;
      if (dur > 50 && dyn > MIN) dyn = Math.max(MIN, Math.floor(dyn * 0.7));
      else if (dur < 16 && dyn < MAX) dyn = Math.min(MAX, Math.floor(dyn * 1.3));
      await new Promise(r => setTimeout(r, 0));
    }
    dispatch(finishStatsIncremental(requestId));
    const finalState: any = getState();
    dispatch(cacheStatsSnapshot({ cacheKey, snapshot: finalState.charts.statsMap, now: Date.now() }));
    // dev-only incremental summary log removed
  }
);

// CRUD de charts no backend
export const fetchCharts = createAsyncThunk('charts/fetchCharts', async (_: void, { getState }) => {
  const st: any = getState();
  const token = st.auth?.token || localStorage.getItem('user-token');
  const res = await fetch(apiUrl('/charts'), { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new Error('Erro ao buscar charts');
  return await res.json();
});

export const deleteChart = createAsyncThunk(
  'charts/deleteChart',
  async (chartId: number, { dispatch, getState, rejectWithValue }) => {
    try {
      const st: any = getState();
      const token = st.auth?.token || localStorage.getItem('user-token');
      const res = await fetch(apiUrl(`/charts/${chartId}`), { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : { 'Accept': 'application/json' } });
      if (!res.ok) {
        let msg = `Erro ao deletar chart (${res.status})`;
        try { const d = await res.json(); if (d?.message) msg = d.message; } catch { /* ignore */ }
        return rejectWithValue(msg);
      }
      await db.charts_data.where('chartId').equals(String(chartId)).delete();
      await db.charts_stats.where('chartId').equals(String(chartId)).delete();
      try { await db.chart_weeks.where('chartId').equals(String(chartId)).delete(); } catch { /* ignore old schema */ }
      dispatch(fetchCharts());
      return chartId;
    } catch (e: any) {
      return rejectWithValue(e.message || 'Erro ao deletar chart');
    }
  }
);

export const clearChartLocalData = createAsyncThunk('charts/clearChartLocalData', async (chartId: number) => {
  await db.charts_data.where('chartId').equals(String(chartId)).delete();
  await db.charts_stats.where('chartId').equals(String(chartId)).delete();
  try { await db.chart_weeks.where('chartId').equals(String(chartId)).delete(); } catch { /* ignore */ }
  return chartId;
});

export const createChart = createAsyncThunk('charts/createChart', async (chartData: any, { dispatch, getState }) => {
  const st: any = getState();
  const token = st.auth?.token || localStorage.getItem('user-token');
  const res = await fetch(apiUrl('/charts'), { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(chartData) });
  if (!res.ok) throw new Error('Erro ao criar chart');
  dispatch(fetchCharts());
  return await res.json();
});

export const updateChart = createAsyncThunk('charts/updateChart', async ({ chartId, chartData }: { chartId: number; chartData: any }, { dispatch, getState }) => {
  const st: any = getState();
  const token = st.auth?.token || localStorage.getItem('user-token');
  const res = await fetch(apiUrl(`/charts/${chartId}`), { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(chartData) });
  if (!res.ok) throw new Error('Erro ao atualizar chart');
  dispatch(fetchCharts());
  return await res.json();
});

const chartsSlice = createSlice({
  name: 'charts',
  initialState,
  reducers: {
    setActiveChartId(state, action: PayloadAction<number | null>) { state.activeChartId = action.payload; },
    setCharts(state, action) { state.charts = action.payload; },
    startStatsIncremental(state, action: PayloadAction<string>) { state.statsRequestId = action.payload; state.loadingStats = true; },
    beginStatsRevalidation(state, action: PayloadAction<string>) { state.statsRequestId = action.payload; state.revalidatingStats = true; /* mantém loadingStats=false para evitar flicker */ },
    partialStatsLoaded(state, action: PayloadAction<{ requestId: string; partial: Record<string, any> }>) { if (state.statsRequestId !== action.payload.requestId) return; state.statsMap = { ...state.statsMap, ...action.payload.partial }; },
    finishStatsIncremental(state, action: PayloadAction<string>) { if (state.statsRequestId === action.payload) { state.loadingStats = false; state.revalidatingStats = false; } },
    // Antes: substituía completamente o statsMap, causando perda de entries já calculadas
    // Agora: faz merge para não apagar stats existentes quando um snapshot parcial é aplicado
    replaceStatsSnapshot(state, action: PayloadAction<Record<string, any>>) {
      state.statsMap = { ...state.statsMap, ...action.payload };
    },
    cacheStatsSnapshot(state, action: PayloadAction<{ cacheKey: string; snapshot: Record<string, any>; now: number }>) {
      const { cacheKey, snapshot, now } = action.payload;
      if (!state.statsCache) state.statsCache = {} as any;
      const prev = state.statsCache[cacheKey]?.data || {};
      state.statsCache[cacheKey] = { data: { ...prev, ...snapshot }, createdAt: now };
    },
    bumpStats(state) { state.statsBump++; },
    clearStatsCache(state) { state.statsCache = {}; },
    removeStatsCacheEntry(state, action: PayloadAction<string>) { delete state.statsCache[action.payload]; },
    invalidateStatsForChart(state, action: PayloadAction<{ chartId: string | number; chartType?: string; fromWeek?: string }>) {
      const { chartId, chartType, fromWeek } = action.payload;
      for (const k of Object.keys(state.statsCache || {})) {
        const parts = k.split('_');
        if (parts.length < 3) continue;
        const [cid, ctype, ...rest] = parts;
        const kWeek = rest.join('_');
        if (String(cid) !== String(chartId)) continue;
        if (chartType && ctype !== chartType) continue;
        if (fromWeek && kWeek < fromWeek) continue;
        delete state.statsCache[k];
      }
    },
    updateRowDeltas(state, action: PayloadAction<Array<{ entityId: string; deltaRank: string | number; deltaPlays: string | number }>>) {
      const indexById: Record<string, number> = {};
      for (let i = 0; i < state.data.length; i++) indexById[state.data[i].entityId] = i;
      for (const u of action.payload) {
        const idx = indexById[u.entityId];
        if (idx != null) {
          (state.data[idx] as any).deltaRank = u.deltaRank;
          (state.data[idx] as any).deltaPlays = u.deltaPlays;
        }
      }
    }
  },
  extraReducers: builder => {
    builder.addCase(fetchChartData.pending, s => { s.loadingData = true; });
    builder.addCase(fetchChartData.fulfilled, (s, a) => {
        if (!s.statsCache || typeof s.statsCache !== 'object') s.statsCache = {};
        s.data = a.payload as ChartData[]; s.loadingData = false;
        if (s.data.length) {
          const { week, chartId, chartType } = s.data[0];
          for (const k of Object.keys(s.statsCache || {})) {
            const parts = k.split('_'); if (parts.length < 3) continue;
            const [cid, ctype, ...rest] = parts; const kWeek = rest.join('_');
            if (cid === String(chartId) && ctype === chartType && kWeek >= week) delete s.statsCache[k];
          }
          // Recalcula stats mínimos imediatamente para a semana atual (peak + totalWeeks) usando runCache, evitando mostrar valor de uma semana futura
          const partial: Record<string, any> = {};
          // Primeiro garante que o runCache contem a semana atual sem sobrescrever histórico
          for (const row of s.data) {
            ensureRunCacheWeek(String(chartId), String(chartType), row.entityId, week, row.rank);
          }
          for (const row of s.data) {
            const minimal = computeMinimalStatsUntilWeek(String(chartId), String(chartType), row.entityId, week);
            if (minimal) {
              partial[row.entityId] = { chartId: String(chartId), chartType: String(chartType), entityId: row.entityId, ...minimal, _status: 'minimal' };
            }
          }
          if (Object.keys(partial).length) {
            s.statsMap = { ...s.statsMap, ...partial };
          }
        }
      });
    builder.addCase(computeWeekDeltas.fulfilled, () => { /* no-op, data já atualizada pelo reducer */ });
    builder.addCase(fetchCharts.pending, s => { s.loadingData = true; });
    builder.addCase(fetchCharts.fulfilled, (s, a) => { s.charts = a.payload; s.loadingData = false; });
    builder.addCase(deleteChart.fulfilled, (s, a) => { s.charts = s.charts.filter(c => c.id !== a.payload); for (const k of Object.keys(s.statsCache || {})) if (k.startsWith(String(a.payload) + '_')) delete s.statsCache[k]; });
    builder.addCase(clearChartLocalData.fulfilled, (s, a) => { if (s.activeChartId === a.payload) { s.data = []; s.statsMap = {}; } for (const k of Object.keys(s.statsCache || {})) if (k.startsWith(String(a.payload) + '_')) delete s.statsCache[k]; });
    // Purga caches em memória também fora do builder após os cases (não temos acesso a 'a' dentro dos callbacks acima para runCache purging sem replicar código)
  }
});

// Monkey-patch builder case reducers para incluir purga dos caches em memória
// (alternativa simples sem reestruturar slice): intercept original reducers
const origDeleteChartFulfilled = (chartsSlice as any).caseReducers[deleteChart.fulfilled.type];
(chartsSlice as any).caseReducers[deleteChart.fulfilled.type] = function(state: any, action: any) {
  if (origDeleteChartFulfilled) {
    origDeleteChartFulfilled(state, action);
  }
  const chartId = String(action.payload);
  try {
    // Purga runCache
    for (const key of Array.from(runCache.keys())) {
      if (key.startsWith(chartId + '|')) runCache.delete(key);
    }
    // Purga entityRowsCache
    for (const key of Array.from(entityRowsCache.keys())) {
      if (key.startsWith(chartId + '|')) entityRowsCache.delete(key);
    }
  } catch { /* ignore */ }
};
const origClearChartFulfilled = (chartsSlice as any).caseReducers[clearChartLocalData.fulfilled.type];
(chartsSlice as any).caseReducers[clearChartLocalData.fulfilled.type] = function(state: any, action: any) {
  if (origClearChartFulfilled) {
    origClearChartFulfilled(state, action);
  }
  const chartId = String(action.payload);
  try {
    for (const key of Array.from(runCache.keys())) {
      if (key.startsWith(chartId + '|')) runCache.delete(key);
    }
    for (const key of Array.from(entityRowsCache.keys())) {
      if (key.startsWith(chartId + '|')) entityRowsCache.delete(key);
    }
  } catch { /* ignore */ }
};

export const { setActiveChartId, setCharts, startStatsIncremental, beginStatsRevalidation, partialStatsLoaded, finishStatsIncremental, replaceStatsSnapshot, cacheStatsSnapshot, bumpStats, clearStatsCache, removeStatsCacheEntry, invalidateStatsForChart, updateRowDeltas } = chartsSlice.actions;
export default chartsSlice.reducer;
