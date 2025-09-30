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
  charts: any[];
  activeChartId: number | null;
  statsRequestId: string | null;
  statsCache: Record<string, { data: Record<string, any>; createdAt: number }>;
}

const STATS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 min fresco
const STATS_CACHE_STALE_GRACE_MS = 15 * 60 * 1000; // +15 min stale utilizável

const initialState: ChartsState = {
  data: [],
  statsMap: {},
  loadingData: false,
  loadingStats: false,
  charts: [],
  activeChartId: null,
  statsRequestId: null,
  statsCache: {},
};

// Utilitário de cálculo (compartilhado por fast-path e incremental)
function computeStatsFromRows(rows: ChartData[], cutoff: number) {
  const peak = { position: Infinity, weeksAtPeak: 0, longestSequenceAtPeak: 0, weeksToPeak: 0 };
  const sequences = { rank1: 0, top5: 0, top10: 0, withinCutoff: 0 };
  const totals = { totalPoints: 0, totalPlays: 0, top5: 0, top10: 0, withinCutoff: 0 };
  let seqPeak = 0, seqRank1 = 0, seqTop5 = 0, seqTop10 = 0, seqWithin = 0;
  for (let i = 0; i < rows.length; i++) {
    const w: any = rows[i];
    if (i > 0) {
      const prev = rows[i - 1].week;
      const diffDays = Math.round((new Date(w.week).getTime() - new Date(prev).getTime()) / 86400000);
      if (diffDays !== 7) { seqPeak = seqRank1 = seqTop5 = seqTop10 = seqWithin = 0; }
    }
    const isCutoff = w.rank && w.rank > cutoff;
    totals.totalPlays += w.plays || 0;
    if (!isCutoff) {
      totals.totalPoints += w.rank ? 101 - w.rank : 0;
      totals.withinCutoff += 1;
      totals.top10 += (w.rank && w.rank <= 10) ? 1 : 0;
      totals.top5 += (w.rank && w.rank <= 5) ? 1 : 0;
      if (w.rank && w.rank < peak.position) { peak.position = w.rank; peak.weeksToPeak = i; seqPeak = 1; }
      else if (w.rank === peak.position) { seqPeak++; }
      peak.weeksAtPeak = Math.max(peak.weeksAtPeak, seqPeak);
      peak.longestSequenceAtPeak = peak.weeksAtPeak;
      if (w.rank === 1) { seqRank1++; sequences.rank1 = Math.max(sequences.rank1, seqRank1); } else seqRank1 = 0;
      if (w.rank && w.rank <= 5) { seqTop5++; sequences.top5 = Math.max(sequences.top5, seqTop5); } else seqTop5 = 0;
      if (w.rank && w.rank <= 10) { seqTop10++; sequences.top10 = Math.max(sequences.top10, seqTop10); } else seqTop10 = 0;
      if (w.rank && w.rank <= cutoff) { seqWithin++; sequences.withinCutoff = Math.max(sequences.withinCutoff, seqWithin); } else seqWithin = 0;
    } else {
      seqPeak = seqRank1 = seqTop5 = seqTop10 = seqWithin = 0;
    }
  }
  return { peak, sequences, totals };
}

export const fetchChartData = createAsyncThunk(
  'charts/fetchChartData',
  async ({ chartId, chartType, week }: { chartId: string; chartType: string; week: string }) => {
    return db.charts_data
      .where(['chartId', 'chartType', 'week'])
      .equals([chartId, chartType, week])
      .toArray();
  }
);

export const fetchStatsMap = createAsyncThunk(
  'charts/fetchStatsMap',
  async ({ chartId, chartType, data, cutoff, week }: { chartId: string; chartType: string; data: ChartData[]; cutoff: number; week: string }) => {
    const mod = await import('../utils/calculateStatsForEntityUntilWeek');
    const res = await Promise.all(
      data.map(r => mod.calculateStatsForEntityUntilWeek(chartId, chartType, r.entityId, cutoff, week).then(s => [r.entityId, s] as const))
    );
    const next: Record<string, any> = {};
    for (const [id, stats] of res) if (id && stats) next[id] = stats;
    return next;
  }
);

interface IncrementalArgs { chartId: string; chartType: string; data: ChartData[]; cutoff: number; week: string; batchSize?: number }
export const fetchStatsMapIncremental = createAsyncThunk(
  'charts/fetchStatsMapIncremental',
  async ({ chartId, chartType, data, cutoff, week, batchSize = 15 }: IncrementalArgs, { dispatch, getState }) => {
    if (!data || !data.length) return;
    const requestId = `${chartId}_${chartType}_${week}_${Date.now()}`;
    const cacheKey = `${chartId}_${chartType}_${week}`;
    const state0: any = getState();
    if (!state0.charts.statsCache || typeof state0.charts.statsCache !== 'object') state0.charts.statsCache = {};
    const cached = state0.charts.statsCache[cacheKey];
    const now = Date.now();
    // Lazy purge caches muito velhos
    for (const k of Object.keys(state0.charts.statsCache || {})) {
      try {
        const e = state0.charts.statsCache[k];
        if (!e) continue;
        const age = now - e.createdAt;
        if (age > STATS_CACHE_TTL_MS + STATS_CACHE_STALE_GRACE_MS) dispatch(removeStatsCacheEntry(k));
      } catch { /* ignore */ }
    }
    if (cached) {
      const age = now - cached.createdAt;
      if (age < STATS_CACHE_TTL_MS) {
        // Fresh
        dispatch(replaceStatsSnapshot(cached.data));
        return;
      } else if (age < STATS_CACHE_TTL_MS + STATS_CACHE_STALE_GRACE_MS) {
        // Stale: mostra rápido e revalida
        dispatch(replaceStatsSnapshot(cached.data));
        // segue para recomputar
      }
    }
    dispatch(startStatsIncremental(requestId));

    // FAST PATH (até 60 entidades) - otimizado: usa modo global para <=25 entidades, senão range por entidade.
    if (data.length <= 60) {
      try {
        const t0 = performance.now();
        const entities = data.map(d => d.entityId);
        const entitySet = new Set(entities);
        let perEntity: Array<readonly [string, ChartData[]]> = [];
        const tQueryStart = performance.now();
        const GLOBAL_LIMIT = 25;
        let mode: 'global' | 'range' = entities.length <= GLOBAL_LIMIT ? 'global' : 'range';
        let globalRowsCount = 0;
        if (mode === 'global') {
          const globalRows = await db.charts_data
            .where('[chartId+chartType+week]')
            .belowOrEqual([chartId, chartType, week])
            .toArray();
          globalRowsCount = globalRows.length;
          // Heurísticas de fallback: se rows >> entidades * fator ou query lenta, troca para range.
          const queryMsPreview = performance.now() - tQueryStart;
          const ROWS_FACTOR_LIMIT = 180; // média histórica de semanas por entidade que aceitamos antes de considerar excessivo
          const MAX_GLOBAL_QUERY_MS = 250;
          if (globalRowsCount > entities.length * ROWS_FACTOR_LIMIT || queryMsPreview > MAX_GLOBAL_QUERY_MS) {
            mode = 'range';
            // eslint-disable-next-line no-console
            console.log(`[stats] fast-path global fallback→range reason=${globalRowsCount > entities.length * ROWS_FACTOR_LIMIT ? 'rows' : 'time'} rows=${globalRowsCount} ms=${queryMsPreview.toFixed(1)} ent=${entities.length}`);
          } else {
            const map: Record<string, ChartData[]> = {};
            for (const r of globalRows) {
              if (!entitySet.has(r.entityId)) continue;
              (map[r.entityId] ||= []).push(r);
            }
            perEntity = Object.entries(map) as Array<readonly [string, ChartData[]]>;
            for (const [, rows] of perEntity) rows.sort((a, b) => a.week.localeCompare(b.week));
          }
        }
        if (mode === 'range') {
          perEntity = await Promise.all(
            entities.map(async id => {
              const rows = await db.charts_data
                .where('[chartId+chartType+entityId+week]')
                .between([chartId, chartType, id, '0000'], [chartId, chartType, id, week])
                .toArray();
              rows.sort((a, b) => a.week.localeCompare(b.week));
              return [id, rows] as const;
            })
          );
          // Ajusta início de medição da query para incluir tempo gasto na estratégia global se houve fallback.
          if (mode === 'range' && entities.length <= GLOBAL_LIMIT) {
            // Se começou global e caiu pra range, tQueryStart permanece.
          } else {
            // Caso puro range inicial, atualiza tQueryStart para precisão.
            // (não altera se global fallback, pois queremos o custo total)
          }
        }
        const queryMs = performance.now() - tQueryStart;
        const snapshot: Record<string, any> = {};
        const tComputeStart = performance.now();
        const halfway = Math.ceil(perEntity.length / 2);
        for (let idx = 0; idx < perEntity.length; idx++) {
          const [id, rows] = perEntity[idx];
          if (!rows.length) continue;
          snapshot[id] = { chartId, chartType, entityId: id, ...computeStatsFromRows(rows, cutoff) };
          if (idx === halfway) {
            // micro-yield para evitar travar pintura
            await new Promise(r => setTimeout(r, 0));
          }
        }
        const computeMs = performance.now() - tComputeStart;
        const st: any = getState();
        if (st.charts.statsRequestId === requestId) {
          dispatch(partialStatsLoaded({ requestId, partial: snapshot }));
          dispatch(finishStatsIncremental(requestId));
          dispatch(cacheStatsSnapshot({ cacheKey, snapshot, now: Date.now() }));
        }
        const total = performance.now() - t0;
        // eslint-disable-next-line no-console
        console.log(`[stats] fast-path ${entities.length} entidades total=${total.toFixed(1)}ms (query=${queryMs.toFixed(1)} compute=${computeMs.toFixed(1)}) modo=${mode}${mode==='global'?` rows=${globalRowsCount}`:''}`);
        if (total > 400) {
          // eslint-disable-next-line no-console
          console.warn('[stats] fast-path lento; considerar worker ou fallback incremental');
        }
        return;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('[stats] fast-path falhou, usando incremental', e);
      }
    }

    const tGlobal = performance.now();
    // Query abrangente até a semana alvo (inclusive)
    const allRows = await db.charts_data
      .where('[chartId+chartType+week]')
      .belowOrEqual([chartId, chartType, week])
      .toArray();
    const rowsBy: Record<string, ChartData[]> = {};
    for (const r of allRows) (rowsBy[r.entityId] ||= []).push(r);
    // Garante inclusão de linhas da semana corrente vindas de 'data'
    for (const r of data) {
      if (r.week === week) {
        const list = (rowsBy[r.entityId] ||= []);
        if (!list.some(x => x.week === r.week)) list.push(r as any);
      }
    }
    for (const k in rowsBy) rowsBy[k].sort((a, b) => a.week.localeCompare(b.week));

    function computeEntity(id: string) {
      const rows = rowsBy[id];
      if (!rows || !rows.length) return;
      return { chartId, chartType, entityId: id, ...computeStatsFromRows(rows, cutoff) };
    }

    const entities = data.map(d => d.entityId);
    let dyn = batchSize;
    const MIN = 5, MAX = 60;
    for (let i = 0; i < entities.length;) {
      const tBatch = performance.now();
      const slice = entities.slice(i, i + dyn);
      const partial: Record<string, any> = {};
      for (const id of slice) {
        const stats = computeEntity(id);
        if (stats) partial[id] = stats;
      }
      const st: any = getState();
      if (st.charts.statsRequestId !== requestId) return; // abort se iniciou outro
      dispatch(partialStatsLoaded({ requestId, partial }));
      i += slice.length;
      const dur = performance.now() - tBatch;
      if (dur > 50 && dyn > MIN) dyn = Math.max(MIN, Math.floor(dyn * 0.7));
      else if (dur < 16 && dyn < MAX) dyn = Math.min(MAX, Math.floor(dyn * 1.3));
      await new Promise(r => setTimeout(r, 0)); // cede ao layout
    }
    dispatch(finishStatsIncremental(requestId));
    const finalState: any = getState();
    dispatch(cacheStatsSnapshot({ cacheKey, snapshot: finalState.charts.statsMap, now: Date.now() }));
    // eslint-disable-next-line no-console
    console.log(`[stats] incremental concluído ${(performance.now() - tGlobal).toFixed(1)}ms cacheKey=${cacheKey}`);
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
    partialStatsLoaded(state, action: PayloadAction<{ requestId: string; partial: Record<string, any> }>) { if (state.statsRequestId !== action.payload.requestId) return; state.statsMap = { ...state.statsMap, ...action.payload.partial }; },
    finishStatsIncremental(state, action: PayloadAction<string>) { if (state.statsRequestId === action.payload) state.loadingStats = false; },
    replaceStatsSnapshot(state, action: PayloadAction<Record<string, any>>) { state.statsMap = { ...action.payload }; },
    cacheStatsSnapshot(state, action: PayloadAction<{ cacheKey: string; snapshot: Record<string, any>; now: number }>) { state.statsCache[action.payload.cacheKey] = { data: action.payload.snapshot, createdAt: action.payload.now }; },
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
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchChartData.pending, s => { s.loadingData = true; })
      .addCase(fetchChartData.fulfilled, (s, a) => {
        if (!s.statsCache || typeof s.statsCache !== 'object') s.statsCache = {};
        s.data = a.payload as ChartData[]; s.loadingData = false;
        if (s.data.length) {
          const { week, chartId, chartType } = s.data[0];
          for (const k of Object.keys(s.statsCache || {})) {
            const parts = k.split('_'); if (parts.length < 3) continue;
            const [cid, ctype, ...rest] = parts; const kWeek = rest.join('_');
            if (cid === String(chartId) && ctype === chartType && kWeek >= week) delete s.statsCache[k];
          }
        }
      })
      .addCase(fetchStatsMap.pending, s => { s.loadingStats = true; })
      .addCase(fetchStatsMap.fulfilled, (s, a) => { s.statsMap = a.payload as Record<string, any>; s.loadingStats = false; })
      .addCase(fetchCharts.pending, s => { s.loadingData = true; })
      .addCase(fetchCharts.fulfilled, (s, a) => { s.charts = a.payload; s.loadingData = false; })
      .addCase(deleteChart.fulfilled, (s, a) => { s.charts = s.charts.filter(c => c.id !== a.payload); for (const k of Object.keys(s.statsCache || {})) if (k.startsWith(String(a.payload) + '_')) delete s.statsCache[k]; })
      .addCase(clearChartLocalData.fulfilled, (s, a) => { if (s.activeChartId === a.payload) { s.data = []; s.statsMap = {}; } for (const k of Object.keys(s.statsCache || {})) if (k.startsWith(String(a.payload) + '_')) delete s.statsCache[k]; });
  }
});

export const { setActiveChartId, setCharts, startStatsIncremental, partialStatsLoaded, finishStatsIncremental, replaceStatsSnapshot, cacheStatsSnapshot, clearStatsCache, removeStatsCacheEntry, invalidateStatsForChart } = chartsSlice.actions;
export default chartsSlice.reducer;
