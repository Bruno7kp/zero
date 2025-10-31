import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ChartData } from '../db/indexedDb';
import { initialState } from './charts/defaults';
import {
  ensureRunCacheWeek,
  computeMinimalStatsUntilWeek,
  entityRowsCache,
  runCache,
} from './charts/utils';
import {
  fetchChartData,
  fetchCharts,
  deleteChart,
  clearChartLocalData,
  computeWeekDeltas,
} from './charts/thunks';

// Stats/run caches and helpers now come from './charts/utils'

const chartsSlice = createSlice({
  name: 'charts',
  initialState,
  reducers: {
    setActiveChartId(state, action: PayloadAction<number | null>) {
      state.activeChartId = action.payload;
    },
    setCharts(state, action) {
      state.charts = action.payload;
    },
    startStatsIncremental(state, action: PayloadAction<string>) {
      state.statsRequestId = action.payload;
      state.loadingStats = true;
    },
    beginStatsRevalidation(state, action: PayloadAction<string>) {
      state.statsRequestId = action.payload;
      state.revalidatingStats = true; /* mantém loadingStats=false para evitar flicker */
    },
    partialStatsLoaded(
      state,
      action: PayloadAction<{ requestId: string; partial: Record<string, any> }>
    ) {
      if (state.statsRequestId !== action.payload.requestId) return;
      state.statsMap = { ...state.statsMap, ...action.payload.partial };
    },
    finishStatsIncremental(state, action: PayloadAction<string>) {
      if (state.statsRequestId === action.payload) {
        state.loadingStats = false;
        state.revalidatingStats = false;
      }
    },
    // Antes: substituía completamente o statsMap, causando perda de entries já calculadas
    // Agora: faz merge para não apagar stats existentes quando um snapshot parcial é aplicado
    replaceStatsSnapshot(state, action: PayloadAction<Record<string, any>>) {
      state.statsMap = { ...state.statsMap, ...action.payload };
    },
    cacheStatsSnapshot(
      state,
      action: PayloadAction<{ cacheKey: string; snapshot: Record<string, any>; now: number }>
    ) {
      const { cacheKey, snapshot, now } = action.payload;
      if (!state.statsCache) state.statsCache = {} as any;
      const prev = state.statsCache[cacheKey]?.data || {};
      state.statsCache[cacheKey] = { data: { ...prev, ...snapshot }, createdAt: now };
    },
    bumpStats(state) {
      state.statsBump++;
    },
    clearStatsCache(state) {
      state.statsCache = {};
    },
    removeStatsCacheEntry(state, action: PayloadAction<string>) {
      delete state.statsCache[action.payload];
    },
    invalidateStatsForChart(
      state,
      action: PayloadAction<{ chartId: string | number; chartType?: string; fromWeek?: string }>
    ) {
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
    updateRowDeltas(
      state,
      action: PayloadAction<
        Array<{ entityId: string; deltaRank: string | number; deltaPlays: string | number }>
      >
    ) {
      const indexById: Record<string, number> = {};
      for (let i = 0; i < state.data.length; i++) indexById[state.data[i].entityId] = i;
      for (const u of action.payload) {
        const idx = indexById[u.entityId];
        if (idx != null) {
          (state.data[idx] as any).deltaRank = u.deltaRank;
          (state.data[idx] as any).deltaPlays = u.deltaPlays;
        }
      }
    },
  },
  extraReducers: builder => {
    builder.addCase(fetchChartData.pending, s => {
      s.loadingData = true;
    });
    builder.addCase(fetchChartData.fulfilled, (s, a) => {
      if (!s.statsCache || typeof s.statsCache !== 'object') s.statsCache = {};
      s.data = a.payload as ChartData[];
      s.loadingData = false;
      if (s.data.length) {
        const { week, chartId, chartType } = s.data[0];
        for (const k of Object.keys(s.statsCache || {})) {
          const parts = k.split('_');
          if (parts.length < 3) continue;
          const [cid, ctype, ...rest] = parts;
          const kWeek = rest.join('_');
          if (cid === String(chartId) && ctype === chartType && kWeek >= week)
            delete s.statsCache[k];
        }
        // Recalcula stats mínimos imediatamente para a semana atual (peak + totalWeeks) usando runCache, evitando mostrar valor de uma semana futura
        const partial: Record<string, any> = {};
        // Primeiro garante que o runCache contem a semana atual sem sobrescrever histórico
        for (const row of s.data) {
          ensureRunCacheWeek(String(chartId), String(chartType), row.entityId, week, row.rank);
        }
        for (const row of s.data) {
          const minimal = computeMinimalStatsUntilWeek(
            String(chartId),
            String(chartType),
            row.entityId,
            week
          );
          if (minimal) {
            partial[row.entityId] = {
              chartId: String(chartId),
              chartType: String(chartType),
              entityId: row.entityId,
              ...minimal,
              _status: 'minimal',
            };
          }
        }
        if (Object.keys(partial).length) {
          s.statsMap = { ...s.statsMap, ...partial };
        }
      }
    });
    builder.addCase(computeWeekDeltas.fulfilled, () => {
      /* no-op, data já atualizada pelo reducer */
    });
    builder.addCase(fetchCharts.pending, s => {
      s.loadingData = true;
    });
    builder.addCase(fetchCharts.fulfilled, (s, a) => {
      s.charts = a.payload;
      s.loadingData = false;
    });
    builder.addCase(deleteChart.fulfilled, (s, a) => {
      s.charts = s.charts.filter(c => c.id !== a.payload);
      for (const k of Object.keys(s.statsCache || {}))
        if (k.startsWith(String(a.payload) + '_')) delete s.statsCache[k];
    });
    builder.addCase(clearChartLocalData.fulfilled, (s, a) => {
      if (s.activeChartId === a.payload) {
        s.data = [];
        s.statsMap = {};
      }
      for (const k of Object.keys(s.statsCache || {}))
        if (k.startsWith(String(a.payload) + '_')) delete s.statsCache[k];
    });
    // Purga caches em memória também fora do builder após os cases (não temos acesso a 'a' dentro dos callbacks acima para runCache purging sem replicar código)
  },
});

// Monkey-patch builder case reducers para incluir purga dos caches em memória
// (alternativa simples sem reestruturar slice): intercept original reducers
const origDeleteChartFulfilled = (chartsSlice as any).caseReducers[deleteChart.fulfilled.type];
(chartsSlice as any).caseReducers[deleteChart.fulfilled.type] = function (state: any, action: any) {
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
  } catch {
    /* ignore */
  }
};
const origClearChartFulfilled = (chartsSlice as any).caseReducers[
  clearChartLocalData.fulfilled.type
];
(chartsSlice as any).caseReducers[clearChartLocalData.fulfilled.type] = function (
  state: any,
  action: any
) {
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
  } catch {
    /* ignore */
  }
};

export const {
  setActiveChartId,
  setCharts,
  startStatsIncremental,
  beginStatsRevalidation,
  partialStatsLoaded,
  finishStatsIncremental,
  replaceStatsSnapshot,
  cacheStatsSnapshot,
  bumpStats,
  clearStatsCache,
  removeStatsCacheEntry,
  invalidateStatsForChart,
  updateRowDeltas,
} = chartsSlice.actions;
export default chartsSlice.reducer;
