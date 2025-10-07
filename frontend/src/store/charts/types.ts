import type { ChartData } from '../../db/indexedDb';

export interface ChartsState {
  data: ChartData[];
  statsMap: Record<string, any>;
  loadingData: boolean;
  loadingStats: boolean;
  revalidatingStats: boolean;
  charts: any[];
  activeChartId: number | null;
  statsRequestId: string | null;
  statsCache: Record<string, { data: Record<string, any>; createdAt: number }>;
  statsBump: number;
}
