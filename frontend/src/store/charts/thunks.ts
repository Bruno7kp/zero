import { createAsyncThunk } from '@reduxjs/toolkit';
import { db } from '../../db/indexedDb';
import type { ChartData } from '../../db/indexedDb';
import { apiUrl } from '../../config';
import { STATS_CACHE_STALE_GRACE_MS, STATS_CACHE_TTL_MS } from './defaults';
import { computeMinimalStatsUntilWeek, entityRowsCache, upsertRunCache } from './utils';
import { getToken } from '../../services/auth';

export const fetchChartData = createAsyncThunk(
  'charts/fetchChartData',
  async ({ chartId, chartType, week }: { chartId: string; chartType: string; week: string }, { dispatch, getState }) => {
    const rows = await db.charts_data
      .where(['chartId', 'chartType', 'week']).equals([chartId, chartType, week]).toArray();
    setTimeout(async () => {
      try {
        const st: any = getState();
        if (!rows.length) return;
        if (st.charts.statsRequestId || st.charts.loadingStats) return;
        const hasRich = Object.values(st.charts.statsMap || {}).some((s: any) => s && s.chartId == String(chartId) && s.chartType === chartType && s.totals && s.totals.withinCutoff > 1);
        if (hasRich) return;
        const olderExists = await db.charts_data
          .where('[chartId+chartType+week]').below([chartId, chartType, week]).limit(1).count();
        if (!olderExists) return;
        dispatch(fetchStatsMapIncremental({ chartId: String(chartId), chartType, data: rows, week }));
      } catch { /* silencioso */ }
    }, 60);
    return rows;
  }
);

export const computeWeekDeltas = createAsyncThunk(
  'charts/computeWeekDeltas',
  async ({ chartId, chartType, week, rows, cutoff = 100 }: { chartId: string; chartType: string; week: string; rows: ChartData[]; cutoff?: number }, { dispatch }) => {
    const updates: Array<{ entityId: string; deltaRank: string | number; deltaPlays: string | number }> = [];
    for (const r of rows) {
      if (r.week !== week) continue;
      try {
        const recent = await db.charts_data
          .where('[chartId+chartType+entityId+week]')
          .between([chartId, chartType, r.entityId, '0000'], [chartId, chartType, r.entityId, week])
          .reverse().limit(2).toArray();
        const current = recent.find(x => x.week === week) || r;
        const prev = recent.find(x => x.week !== week && x.rank != null);
        let deltaRank: string | number = 'NEW';
        let deltaPlays: string | number = 'NEW';
        if (prev) {
          const diffDays = Math.round((new Date(current.week).getTime() - new Date(prev.week).getTime()) / 86400000);
          const gap = diffDays !== 7;
          if (prev.rank && prev.rank <= cutoff && !gap) {
            deltaRank = (prev.rank && current.rank) ? (prev.rank - (current.rank || prev.rank)) : '-';
            deltaPlays = (typeof current.plays === 'number' && typeof prev.plays === 'number') ? current.plays - prev.plays : '-';
          } else { deltaRank = 'RE'; deltaPlays = 'RE'; }
        }
        updates.push({ entityId: r.entityId, deltaRank, deltaPlays });
      } catch { /* ignore */ }
    }
    if (updates.length) dispatch({ type: 'charts/updateRowDeltas', payload: updates });
    return updates.length;
  }
);

interface IncrementalArgs { chartId: string; chartType: string; data: ChartData[]; week: string; batchSize?: number }

export const fetchStatsMapIncremental = createAsyncThunk(
  'charts/fetchStatsMapIncremental',
  async ({ chartId, chartType, data, week, batchSize = 15 }: IncrementalArgs, { dispatch, getState }) => {
    if (!data || !data.length) return;
    const requestId = `${chartId}_${chartType}_${week}_${Date.now()}`;
    const cacheKey = `${chartId}_${chartType}_${week}`;
    const state0: any = getState();
    if (!state0.charts.statsCache || typeof state0.charts.statsCache !== 'object') state0.charts.statsCache = {};
    const cached = state0.charts.statsCache[cacheKey];
    const now = Date.now();
    for (const k of Object.keys(state0.charts.statsCache || {})) {
      try {
        const e = state0.charts.statsCache[k];
        if (!e) continue;
        const age = now - e.createdAt;
        if (age > STATS_CACHE_TTL_MS + STATS_CACHE_STALE_GRACE_MS) dispatch({ type: 'charts/removeStatsCacheEntry', payload: k });
      } catch { /* ignore */ }
    }
    let silentRevalidate = false;
    if (cached) {
      const age = now - cached.createdAt;
      if (age < STATS_CACHE_TTL_MS) { dispatch({ type: 'charts/replaceStatsSnapshot', payload: cached.data }); return; }
      else if (age < STATS_CACHE_TTL_MS + STATS_CACHE_STALE_GRACE_MS) { dispatch({ type: 'charts/replaceStatsSnapshot', payload: cached.data }); silentRevalidate = true; }
    } else {
      try {
        const existingIds = data.map(d => d.entityId);
        const statsMap = state0.charts.statsMap || {};
        let haveExisting = 0;
        for (const id of existingIds) { const s = statsMap[id]; if (s && s.chartId == chartId && s.chartType === chartType && s._status !== 'stub') haveExisting++; }
        if (haveExisting && haveExisting / existingIds.length >= 0.5) silentRevalidate = true;
      } catch { /* ignore */ }
    }
    dispatch({ type: silentRevalidate ? 'charts/beginStatsRevalidation' : 'charts/startStatsIncremental', payload: requestId });

    const entityIds = Array.from(new Set(data.map(d => d.entityId)));
    let fullStatsById: Record<string, any> = {};
    if (entityIds.length) {
      try {
        const compoundKeys = entityIds.map(id => [chartId, chartType, id] as [string, string, string]);
        const fullRows = await db.charts_stats.bulkGet(compoundKeys);
        fullRows.forEach((row, idx) => {
          if (row) fullStatsById[entityIds[idx]] = row;
        });
      } catch {
        fullStatsById = {};
      }
    }
    const mergeWithFullStats = (partial: Record<string, any>) => {
      if (!partial || !Object.keys(partial).length) return partial;
      if (!fullStatsById || !Object.keys(fullStatsById).length) return partial;
      const merged: Record<string, any> = {};
      for (const [id, minimal] of Object.entries(partial)) {
        const full = fullStatsById[id];
        if (full) {
          const combined = {
            ...full,
            ...minimal,
            peak: { ...(full.peak || {}), ...(minimal.peak || {}) },
            totals: { ...(full.totals || {}), ...(minimal.totals || {}) },
            sequences: full.sequences ?? minimal.sequences ?? null,
            _status: full._status || minimal._status || 'full',
          };
          merged[id] = combined;
          fullStatsById[id] = combined;
        } else {
          merged[id] = minimal;
          fullStatsById[id] = minimal;
        }
      }
      return merged;
    };

    if (data.length <= 60) {
      const entities = data.map(d => d.entityId);
      const entitySet = new Set(entities);
      const GLOBAL_LIMIT = 25;
      const ROWS_FACTOR_LIMIT = 180;
      const HARD_ABS_LIMIT = 120_000;
      let mode: 'global' | 'range' = 'range';
      let estimatedRows = 0;
      if (entities.length <= GLOBAL_LIMIT) {
        estimatedRows = await db.charts_data
          .where('[chartId+chartType+week]').belowOrEqual([chartId, chartType, week]).count();
        const rowPerEntityAvg = estimatedRows / Math.max(1, entities.length);
        const rowPressure = rowPerEntityAvg / ROWS_FACTOR_LIMIT;
        mode = (estimatedRows <= HARD_ABS_LIMIT && rowPressure <= 4) ? 'global' : 'range';
      }
      let perEntity: Array<readonly [string, ChartData[]]> = [];
      if (mode === 'global') {
        const globalRows = await db.charts_data
          .where('[chartId+chartType+week]').belowOrEqual([chartId, chartType, week]).toArray();
        const map: Record<string, ChartData[]> = {};
        for (const r of globalRows) { if (!entitySet.has(r.entityId)) continue; (map[r.entityId] ||= []).push(r); }
        for (const r of data) {
          if (r.week === week && entitySet.has(r.entityId)) {
            const arr = (map[r.entityId] ||= []);
            const idx = arr.findIndex(x => x.week === r.week);
            if (idx === -1) arr.push(r as any);
            else if (typeof r.rank === 'number') {
              const prev = arr[idx];
              if (prev.rank == null || (typeof prev.rank === 'number' && r.rank < prev.rank)) arr[idx] = { ...prev, rank: r.rank } as any;
            }
          }
        }
        perEntity = Object.entries(map) as Array<readonly [string, ChartData[]]>;
        for (const [id, rows] of perEntity) {
          rows.sort((a, b) => a.week.localeCompare(b.week));
          entityRowsCache.set(`${chartId}|${chartType}|${id}`, rows);
          upsertRunCache(chartId, chartType, id, rows);
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
              const partialUpdate = { [id]: { chartId, chartType, entityId: id, ...minimal, _status: 'minimal' } };
              const enriched = mergeWithFullStats(partialUpdate);
              if (Object.keys(enriched || {}).length) {
                dispatch({ type: 'charts/partialStatsLoaded', payload: { requestId, partial: enriched } });
              }
            }
          }
        }
      } else {
        const stSilent: any = getState();
        const isSilent = stSilent.charts.revalidatingStats && stSilent.charts.statsRequestId === requestId;
        if (!isSilent) {
          const stubPartial: Record<string, any> = {};
          for (const id of entities) {
            const existing = stSilent.charts.statsMap[id];
            if (existing && existing._status !== 'stub') continue;
            stubPartial[id] = { chartId, chartType, entityId: id, peak: null, sequences: null, totals: null, _status: 'stub' };
          }
          if (Object.keys(stubPartial).length && stSilent.charts.statsRequestId === requestId) {
            const enrichedStub = mergeWithFullStats(stubPartial);
            if (Object.keys(enrichedStub || {}).length) {
              dispatch({ type: 'charts/partialStatsLoaded', payload: { requestId, partial: enrichedStub } });
            }
          }
        }
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
        const currentWeekMap = new Map<string, ChartData>(data.filter(r => r.week === week).map(r => [r.entityId, r]));
        let concurrencyTarget = 1;
        const MAX_CONCURRENCY = 4;
        let active = 0; let idx = 0;
        const results: Array<readonly [string, ChartData[]]> = [];
        await new Promise<void>(resolve => {
          const launchNext = () => {
            if (idx >= entities.length && active === 0) { resolve(); return; }
            while (active < concurrencyTarget && idx < entities.length) {
              const id = entities[idx++]; active++;
              (async () => {
                const key = `${chartId}|${chartType}|${id}`;
                let rows = entityRowsCache.get(key);
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
                        if (delta.length) { rows = rows.concat(delta).sort((a, b) => a.week.localeCompare(b.week)); entityRowsCache.set(key, rows); }
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
                  const cw = currentWeekMap.get(id);
                  if (cw) {
                    const existingIdx = rows!.findIndex(x => x.week === week);
                    if (existingIdx === -1) { rows!.push(cw as any); rows!.sort((a,b)=>a.week.localeCompare(b.week)); }
                    else {
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
                      const partialUpdate = { [id]: { chartId, chartType, entityId: id, ...minimal, _status: 'minimal' } };
                      const enriched = mergeWithFullStats(partialUpdate);
                      if (Object.keys(enriched || {}).length) {
                        dispatch({ type: 'charts/partialStatsLoaded', payload: { requestId, partial: enriched } });
                      }
                    }
                  }
                } finally {
                  active--;
                  if (concurrencyTarget < MAX_CONCURRENCY && results.length >= 2) concurrencyTarget = MAX_CONCURRENCY;
                  setTimeout(launchNext, 0);
                }
              })();
            }
          };
          launchNext();
        });
        const snapshot: Record<string, any> = {};
        const halfway = Math.ceil(results.length / 2);
        for (let i = 0; i < results.length; i++) {
          const [id, rows] = results[i];
          if (!rows.length) continue;
          const stNow: any = getState();
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
          if (i === halfway) await new Promise(r => setTimeout(r, 0));
        }
        const st: any = getState();
        if (st.charts.statsRequestId === requestId) {
          const enrichedSnapshot = mergeWithFullStats(snapshot);
          if (Object.keys(enrichedSnapshot || {}).length) {
            dispatch({ type: 'charts/partialStatsLoaded', payload: { requestId, partial: enrichedSnapshot } });
          }
          dispatch({ type: 'charts/finishStatsIncremental', payload: requestId });
          if (Object.keys(enrichedSnapshot || {}).length) {
            dispatch({ type: 'charts/cacheStatsSnapshot', payload: { cacheKey, snapshot: enrichedSnapshot, now: Date.now() } });
          }
        }
        return;
      }
      const snapshot: Record<string, any> = {};
      const stAny: any = getState();
      for (const [id] of perEntity) {
        const minimal = computeMinimalStatsUntilWeek(chartId, chartType, id, week);
        if (minimal) {
          const existing = stAny.charts.statsMap[id];
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
          if (write) snapshot[id] = { chartId, chartType, entityId: id, ...minimal };
      }
      }
      const st: any = getState();
      if (st.charts.statsRequestId === requestId) {
        const enrichedSnapshot = mergeWithFullStats(snapshot);
        if (Object.keys(enrichedSnapshot || {}).length) {
          dispatch({ type: 'charts/partialStatsLoaded', payload: { requestId, partial: enrichedSnapshot } });
        }
        dispatch({ type: 'charts/finishStatsIncremental', payload: requestId });
        if (Object.keys(enrichedSnapshot || {}).length) {
          dispatch({ type: 'charts/cacheStatsSnapshot', payload: { cacheKey, snapshot: enrichedSnapshot, now: Date.now() } });
        }
      }
      return;
    }

    const allRows = await db.charts_data
      .where('[chartId+chartType+week]').belowOrEqual([chartId, chartType, week]).toArray();
    const rowsBy: Record<string, ChartData[]> = {};
    for (const r of allRows) (rowsBy[r.entityId] ||= []).push(r);
    for (const r of data) {
      if (r.week === week) {
        const list = (rowsBy[r.entityId] ||= []);
        const idx = list.findIndex(x => x.week === r.week);
        if (idx === -1) list.push(r as any);
        else if (typeof r.rank === 'number') {
          const prev = list[idx];
          if (prev.rank == null || (typeof prev.rank === 'number' && r.rank < prev.rank)) list[idx] = { ...prev, rank: r.rank } as any;
        }
      }
    }
    for (const k of Object.keys(rowsBy)) rowsBy[k].sort((a, b) => a.week.localeCompare(b.week));
    for (const [entityId, rows] of Object.entries(rowsBy)) upsertRunCache(chartId, chartType, entityId, rows);
    const entities = Object.keys(rowsBy);
    let dyn = batchSize; const MIN = 5, MAX = 60;
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
            if (newWeeks > oldWeeks) write = true; else if (newPeak != null && (oldPeak == null || newPeak < oldPeak)) write = true;
          }
          if (write) partial[id] = { chartId, chartType, entityId: id, ...minimal };
        }
      }
      const st: any = getState(); if (st.charts.statsRequestId !== requestId) return;
      const enriched = mergeWithFullStats(partial);
      if (Object.keys(enriched || {}).length) {
        dispatch({ type: 'charts/partialStatsLoaded', payload: { requestId, partial: enriched } });
      }
      i += slice.length;
      const dur = performance.now() - tBatch;
      if (dur > 50 && dyn > MIN) dyn = Math.max(MIN, Math.floor(dyn * 0.7));
      else if (dur < 16 && dyn < MAX) dyn = Math.min(MAX, Math.floor(dyn * 1.3));
      await new Promise(r => setTimeout(r, 0));
    }
    dispatch({ type: 'charts/finishStatsIncremental', payload: requestId });
    const finalState: any = getState();
    dispatch({ type: 'charts/cacheStatsSnapshot', payload: { cacheKey, snapshot: finalState.charts.statsMap, now: Date.now() } });
  }
);

export const fetchCharts = createAsyncThunk('charts/fetchCharts', async (_: void, { getState }) => {
  const st: any = getState();
  const token = getToken(st);
  const res = await fetch(apiUrl('/charts'), { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new Error('Erro ao buscar charts');
  return await res.json();
});

export const deleteChart = createAsyncThunk(
  'charts/deleteChart',
  async (chartId: number, { dispatch, getState, rejectWithValue }) => {
    try {
      const st: any = getState();
      const token = getToken(st);
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
  const token = getToken(st);
  const res = await fetch(apiUrl('/charts'), { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(chartData) });
  if (!res.ok) throw new Error('Erro ao criar chart');
  dispatch(fetchCharts());
  return await res.json();
});

export const updateChart = createAsyncThunk('charts/updateChart', async ({ chartId, chartData }: { chartId: number; chartData: any }, { dispatch, getState }) => {
  const st: any = getState();
  const token = getToken(st);
  const res = await fetch(apiUrl(`/charts/${chartId}`), { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(chartData) });
  if (!res.ok) throw new Error('Erro ao atualizar chart');
  dispatch(fetchCharts());
  return await res.json();
});
