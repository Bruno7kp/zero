import type { ChartsState } from './types';

export const STATS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 min fresco
export const STATS_CACHE_STALE_GRACE_MS = 15 * 60 * 1000; // +15 min stale utilizável

export const initialState: ChartsState = {
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
