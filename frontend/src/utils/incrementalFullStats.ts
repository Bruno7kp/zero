// incrementalFullStats.ts
// Incremental update logic for full (general) stats per entity
import { db } from '../db/indexedDb';

export interface IncrementalApplyOptions {
  cutoff: number; // cutoff para métricas condicionais (points/topN/withinCutoff)
  persist?: boolean; // default true
}

// Bump when changing semantics. v3 changes:
// - peak.weeksAtPeak becomes cumulative (total weeks at peak position) instead of longest sequence
// - peak.longestSequenceAtPeak now stores the longest consecutive streak
// - chartRun is now maintained incrementally for UI (list of weeks with position/plays)
const SCHEMA_VERSION = 3;

function bootstrap(row: any, cutoff: number) {
  const rank = row.rank;
  const inside = typeof rank === 'number' && rank <= cutoff;
  return {
    chartId: row.chartId,
    chartType: row.chartType,
    entityId: row.entityId,
    peak: { position: rank, weeksAtPeak: 1, longestSequenceAtPeak: 1, weeksToPeak: 0 },
    sequences: { rank1: rank === 1 ? 1 : 0, top5: rank <= 5 ? 1 : 0, top10: rank <= 10 ? 1 : 0, withinCutoff: inside ? 1 : 0 },
    totals: {
      totalPoints: inside ? (101 - rank) : 0,
      totalPlays: row.plays || 0,
      top5: rank <= 5 ? 1 : 0,
      top10: rank <= 10 ? 1 : 0,
      withinCutoff: inside ? 1 : 0,
      appearances: 1,
      sumRanks: rank,
    },
    chartRun: [ { week: row.week, position: rank, plays: row.plays || 0 } ],
    _running: {
      lastWeek: row.week,
      lastRank: rank,
      weeksProcessed: 1,
      version: SCHEMA_VERSION,
      seqPeak: 1,
      seqRank1: rank === 1 ? 1 : 0,
      seqTop5: rank <= 5 ? 1 : 0,
      seqTop10: rank <= 10 ? 1 : 0,
      seqWithinCutoff: inside ? 1 : 0,
    }
  };
}

export async function applyWeekToFullStats(row: any, opts: IncrementalApplyOptions) {
  const { cutoff, persist = true } = opts;
  if (row.rank == null) return null; // ignorar ausência
  let stats: any = await db.charts_stats.get([row.chartId, row.chartType, row.entityId]);
  if (!stats || !stats._running) {
    stats = bootstrap(row, cutoff);
    if (persist) await db.charts_stats.put(stats);
    return stats;
  }
  // Version mismatch triggers rebuild outside (loader will detect _needsRebuild or version mismatch)
  if (stats._running.version !== SCHEMA_VERSION) {
    stats._needsRebuild = true;
    if (persist) await db.charts_stats.put(stats);
    return stats;
  }
  const r = stats._running;
  // Retroativo? se semana <= lastWeek marcar rebuild (simplesmente aborta; chamada de rebuild externa cuidará)
  if (r.lastWeek && row.week <= r.lastWeek) {
    stats._needsRebuild = true;
    return stats;
  }
  const lastWeekDate = r.lastWeek ? new Date(r.lastWeek).getTime() : null;
  const weekDate = new Date(row.week).getTime();
  const gap = lastWeekDate != null && (weekDate - lastWeekDate !== 7 * 86400000);
  if (gap) {
    r.seqPeak = 0; r.seqRank1 = 0; r.seqTop5 = 0; r.seqTop10 = 0; r.seqWithinCutoff = 0;
  }
  const rank: number = row.rank;
  const inside = rank <= cutoff;
  stats.totals.totalPlays += row.plays || 0;
  stats.totals.appearances += 1;
  stats.totals.sumRanks += rank;
  if (inside) {
    stats.totals.totalPoints += (101 - rank);
    stats.totals.withinCutoff += 1;
    if (rank <= 10) stats.totals.top10 += 1;
    if (rank <= 5) stats.totals.top5 += 1;
  }
  // Peak
  if (rank < stats.peak.position) {
    // Novo pico melhor -> reset contagem cumulativa para o novo pico
    stats.peak.position = rank;
    stats.peak.weeksToPeak = r.weeksProcessed;
    stats.peak.weeksAtPeak = 1; // cumulativo para este novo pico
    r.seqPeak = 1;
    stats.peak.longestSequenceAtPeak = Math.max(stats.peak.longestSequenceAtPeak || 1, 1);
  } else if (rank === stats.peak.position) {
    r.seqPeak++;
    stats.peak.weeksAtPeak += 1; // cumulativo
    if (r.seqPeak > (stats.peak.longestSequenceAtPeak || 0)) {
      stats.peak.longestSequenceAtPeak = r.seqPeak;
    }
  } else {
    r.seqPeak = 0; // quebra de sequência
  }
  // Sequências
  if (rank === 1) { r.seqRank1++; stats.sequences.rank1 = Math.max(stats.sequences.rank1, r.seqRank1); } else r.seqRank1 = 0;
  if (rank <= 5) { r.seqTop5++; stats.sequences.top5 = Math.max(stats.sequences.top5, r.seqTop5); } else r.seqTop5 = 0;
  if (rank <= 10) { r.seqTop10++; stats.sequences.top10 = Math.max(stats.sequences.top10, r.seqTop10); } else r.seqTop10 = 0;
  if (inside) { r.seqWithinCutoff++; stats.sequences.withinCutoff = Math.max(stats.sequences.withinCutoff, r.seqWithinCutoff); } else r.seqWithinCutoff = 0;
  // Finaliza
  r.lastWeek = row.week;
  r.lastRank = rank;
  r.weeksProcessed++;
  if (Array.isArray(stats.chartRun)) {
    stats.chartRun.push({ week: row.week, position: rank, plays: row.plays || 0 });
  } else {
    stats.chartRun = [{ week: row.week, position: rank, plays: row.plays || 0 }];
  }
  if (persist) await db.charts_stats.put(stats);
  return stats;
}

// Rebuild completo (fallback retroativo)
export async function rebuildFullStats(chartId: string, chartType: string, entityId: string, cutoff: number) {
  const rows = await db.charts_data.where(['chartId','chartType','entityId']).equals([chartId, chartType, entityId]).sortBy('week');
  if (!rows.length) return null;
  let stats: any = null;
  for (const row of rows) {
    stats = await applyWeekToFullStats(row, { cutoff, persist: false });
  }
  if (stats) {
    // Ensure version stamped
    if (stats._running) stats._running.version = SCHEMA_VERSION;
    await db.charts_stats.put(stats);
  }
  return stats;
}

// Batch apply para várias linhas recém inseridas (mesma semana ou semanas consecutivas)
export async function applyBatchWeeks(rows: any[], cutoff: number) {
  // Agrupa por entityId
  const byKey: Record<string, any[]> = {};
  for (const r of rows) {
    const key = `${r.chartId}|${r.chartType}|${r.entityId}`;
    (byKey[key] ||= []).push(r);
  }
  const toPut: any[] = [];
  for (const key of Object.keys(byKey)) {
    const list = byKey[key].sort((a,b)=>a.week.localeCompare(b.week));
    let stats: any = await db.charts_stats.get([list[0].chartId, list[0].chartType, list[0].entityId]);
    for (const row of list) {
      stats = await applyWeekToFullStats(row, { cutoff, persist: false });
    }
    if (stats) toPut.push(stats);
  }
  if (toPut.length) await db.charts_stats.bulkPut(toPut);
  return toPut.length;
}
