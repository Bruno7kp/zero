import { db } from '../db/indexedDb';
import type { ChartStats, ChartData } from '../db/indexedDb';
import dayjs from 'dayjs';

export async function calculateStatsForEntityUntilWeek(chartId: string, chartType: string, entityId: string, cutoff: number, untilWeek: string) {
  // Busca todos os registros dessa entidade para o chart até a semana informada
  const items: ChartData[] = await db.charts_data
    .where(['chartId', 'chartType', 'entityId'])
    .equals([chartId, chartType, entityId])
    .sortBy('week');
  if (!items.length) return;

  // Filtra até a semana
  const filtered = items.filter(item => item.week <= untilWeek);
  if (!filtered.length) return;

  let prevRank: number | null = null, prevPlays: number | null = null;
  let peak = { position: Infinity, weeksAtPeak: 0, longestSequenceAtPeak: 0, weeksToPeak: 0 };
  let sequences = { rank1: 0, top5: 0, top10: 0, withinCutoff: 0 };
  let totals = { totalPoints: 0, totalPlays: 0, top5: 0, top10: 0, withinCutoff: 0 };

  let seqPeak = 0, seqRank1 = 0, seqTop5 = 0, seqTop10 = 0, seqWithinCutoff = 0;

  for (let idx = 0; idx < filtered.length; idx++) {
    const w = filtered[idx];
    let prevWeek = idx > 0 ? dayjs(filtered[idx - 1].week) : null;
    let currentWeek = dayjs(w.week);
    let hasGap = prevWeek && !prevWeek.add(7, 'day').isSame(currentWeek, 'day');
    let isCutoff = w.rank && w.rank > cutoff;

    if (hasGap) {
      seqPeak = 0;
      seqRank1 = 0;
      seqTop5 = 0;
      seqTop10 = 0;
      seqWithinCutoff = 0;
    }

    totals.totalPlays += w.plays || 0;

    if (!isCutoff) {
      totals.totalPoints += w.rank ? 101 - w.rank : 0;
      totals.withinCutoff += 1;
      totals.top10 += (w.rank && w.rank <= 10) ? 1 : 0;
      totals.top5 += (w.rank && w.rank <= 5) ? 1 : 0;

      if (w.rank && w.rank < peak.position) {
        peak.position = w.rank;
        peak.weeksToPeak = idx;
        seqPeak = 1;
      } else if (w.rank === peak.position) {
        seqPeak++;
      }
      peak.weeksAtPeak = Math.max(peak.weeksAtPeak, seqPeak);
      peak.longestSequenceAtPeak = peak.weeksAtPeak;

      if (w.rank === 1) { seqRank1++; sequences.rank1 = Math.max(sequences.rank1, seqRank1); } else seqRank1 = 0;
      if (w.rank && w.rank <= 5) { seqTop5++; sequences.top5 = Math.max(sequences.top5, seqTop5); } else seqTop5 = 0;
      if (w.rank && w.rank <= 10) { seqTop10++; sequences.top10 = Math.max(sequences.top10, seqTop10); } else seqTop10 = 0;
      if (w.rank && w.rank <= cutoff) { seqWithinCutoff++; sequences.withinCutoff = Math.max(sequences.withinCutoff, seqWithinCutoff); } else { seqWithinCutoff = 0; }
    } else {
      seqPeak = 0;
      seqRank1 = 0;
      seqTop5 = 0;
      seqTop10 = 0;
      seqWithinCutoff = 0;
    }

    prevRank = !isCutoff ? w.rank : null;
    prevPlays = !isCutoff ? w.plays : null;
  }

  const stats: ChartStats = {
    chartId,
    chartType,
    entityId,
    peak,
    sequences,
    totals,
  };
  return stats;
}
