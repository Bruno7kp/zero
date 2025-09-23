import { db } from '../db/indexedDb';

export async function getChartStats(chartId: string, chartType: string, entityId: string) {
  return db.charts_stats.get([chartId, chartType, entityId]);
}
