// src/utils/calculateStatsForEntity.ts
// DEPRECADO: Mantido como stub para chamadas antigas. Usa rebuild incremental.
import { rebuildFullStats } from './incrementalFullStats';
export async function calculateStatsForEntity(
  chartId: string,
  chartType: string,
  entityId: string,
  cutoff: number
) {
  await rebuildFullStats(chartId, chartType, entityId, cutoff);
}
