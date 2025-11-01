import type { ChartData } from '../../db/indexedDb';

// Cache leve de "chart run" (array de {week, rank}) por entidade
export const runCache: Map<string, Array<{ week: string; rank: number | null | undefined }>> = (
  globalThis as any
).__zeroRunMiniCache || ((globalThis as any).__zeroRunMiniCache = new Map());

export function upsertRunCache(
  chartId: string,
  chartType: string,
  entityId: string,
  rows: ChartData[]
) {
  const key = `${chartId}|${chartType}|${entityId}`;
  if (!rows || !rows.length) return;
  const simplified = rows
    .map(r => ({ week: r.week, rank: r.rank }))
    .sort((a, b) => a.week.localeCompare(b.week));
  runCache.set(key, simplified);
}

export function ensureRunCacheWeek(
  chartId: string | number,
  chartType: string,
  entityId: string,
  week: string,
  rank: number | null | undefined
) {
  const key = `${chartId}|${chartType}|${entityId}`;
  const existing = runCache.get(key);
  if (!existing) {
    runCache.set(key, [{ week, rank }]);
    return;
  }
  const found = existing.find(r => r.week === week);
  if (found) {
    if (found.rank !== rank) found.rank = rank as any;
    return;
  }
  existing.push({ week, rank });
  existing.sort((a, b) => a.week.localeCompare(b.week));
}

export function computeMinimalStatsUntilWeek(
  chartId: string,
  chartType: string,
  entityId: string,
  untilWeek: string
) {
  const key = `${chartId}|${chartType}|${entityId}`;
  const run = runCache.get(key);
  if (!run || !run.length) return null;
  let peak = Infinity;
  let weeksWithin = 0;
  let weeksAtOne = 0;
  for (const r of run) {
    if (r.week > untilWeek) break;
    if (r.rank != null) {
      weeksWithin++;
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

// Cache em memória de linhas por entidade (histórico cumulativo)
export const entityRowsCache: Map<string, ChartData[]> =
  (globalThis as any).__zeroEntityRowsCache ||
  ((globalThis as any).__zeroEntityRowsCache = new Map());
