// src/utils/calculateStatsForEntity.ts
import { db } from '../db/indexedDb';
import type { ChartStats, ChartData } from '../db/indexedDb';
import dayjs from 'dayjs';

export async function calculateStatsForEntity(chartId: string, chartType: string, entityId: string, cutoff: number) {
  // Busca todos os registros dessa entidade para o chart
  const items: ChartData[] = await db.charts_data
    .where(['chartId', 'chartType', 'entityId'])
    .equals([chartId, chartType, entityId])
    .sortBy('week');
  if (!items.length) return;

  let prevRank: number | null = null, prevPlays: number | null = null;
  const peak = { position: Infinity, weeksAtPeak: 0, longestSequenceAtPeak: 0, weeksToPeak: 0 };
  const sequences = { rank1: 0, top5: 0, top10: 0, withinCutoff: 0 };
  const totals = { totalPoints: 0, totalPlays: 0, top5: 0, top10: 0, withinCutoff: 0 };

  let seqPeak = 0, seqRank1 = 0, seqTop5 = 0, seqTop10 = 0, seqWithinCutoff = 0;


  for (let idx = 0; idx < items.length; idx++) {
    const w = items[idx];
    // Lógica de reinício de sequências
  const prevWeek = idx > 0 ? dayjs(items[idx - 1].week) : null;
  const currentWeek = dayjs(w.week);
  const hasGap = prevWeek && !prevWeek.add(7, 'day').isSame(currentWeek, 'day');
  const isCutoff = w.rank && w.rank > cutoff;

    if (hasGap) {
      seqPeak = 0;
      seqRank1 = 0;
      seqTop5 = 0;
      seqTop10 = 0;
      seqWithinCutoff = 0;
      // IMPORTANT: ao haver um gap a entidade esteve ausente pelo menos 1 semana.
      // Precisamos forçar detecção de RE-ENTRY na próxima avaliação de delta.
      prevRank = null;
      prevPlays = null;
    }

    totals.totalPlays += w.plays || 0;

    // Apenas calcula o resto se estiver dentro do cutoff
    if (!isCutoff) {
      totals.totalPoints += w.rank ? 101 - w.rank : 0;
      totals.withinCutoff += 1;
      totals.top10 += (w.rank && w.rank <= 10) ? 1 : 0;
      totals.top5 += (w.rank && w.rank <= 5) ? 1 : 0;

      // Delta
      let deltaRank: number | string = '-';
      let deltaPlays: number | string = '-';
      if (prevRank === null) {
        // Se houve aparição anterior dentro do cutoff => RE, caso contrário NEW
        const previousAppear = items.find((it, i2) => i2 < idx && it.rank && it.rank <= cutoff);
        deltaRank = previousAppear ? 'RE' : 'NEW';
      } else {
        deltaRank = (prevRank && w.rank) ? prevRank - w.rank : '-';
      }

      if (prevPlays === null) deltaPlays = 'NEW';
      else deltaPlays = (w.plays !== undefined && prevPlays !== undefined) ? w.plays - prevPlays : '-';

      // Salva os deltas no ChartData
      await db.charts_data.update(w.id!, { deltaRank, deltaPlays });

      // Pico
      if (w.rank && w.rank < peak.position) {
        peak.position = w.rank;
        peak.weeksToPeak = idx;
        seqPeak = 1;
      } else if (w.rank === peak.position) {
        seqPeak++;
      }
      peak.weeksAtPeak = Math.max(peak.weeksAtPeak, seqPeak);
      peak.longestSequenceAtPeak = peak.weeksAtPeak;

      // Sequências
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

    // Se a semana está fora do cutoff, reset para que próxima aparição seja NEW/RE
    prevRank = !isCutoff ? w.rank : null;
    prevPlays = !isCutoff ? w.plays : null;
  }

  // Monta o chartRun (todas as semanas, posição e plays)
  const chartRun = items.map(w => ({ week: w.week, position: w.rank, plays: w.plays }));

  const stats: ChartStats = {
    chartId,
    chartType,
    entityId,
    peak,
    sequences,
    totals,
    chartRun,
  };
  await db.charts_stats.put(stats);
}
