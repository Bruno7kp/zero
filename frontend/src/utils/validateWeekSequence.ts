import dayjs from 'dayjs';
import { db } from '../db/indexedDb';

/**
 * Verifica se as semanas salvas para um chart e tipo estão em ordem e sem gaps.
 * Caso encontre gaps entre semanas com dados, retorna uma lista detalhada.
 */
export async function validateWeekSequence(chartId: string, chartType: string) {
  const rows = await db.charts_data
    .where(['chartId', 'chartType'])
    .equals([chartId, chartType])
    .sortBy('week');
  if (!rows.length)
    return { ok: true, gaps: [] as Array<{ after: string; expected: string; found: string }> };
  const seenWeeks = Array.from(new Set(rows.map(r => r.week))).sort();
  const gaps: Array<{ after: string; expected: string; found: string }> = [];
  for (let i = 1; i < seenWeeks.length; i++) {
    const prev = dayjs(seenWeeks[i - 1]);
    const expected = prev.add(7, 'day').format('YYYY-MM-DD');
    const current = seenWeeks[i];
    if (expected !== current) {
      gaps.push({ after: seenWeeks[i - 1], expected, found: current });
    }
  }
  return { ok: gaps.length === 0, gaps };
}

/**
 * Marca todas as semanas entre firstWeek e lastWeek como 'partial' caso não possuam nenhum registro,
 * para evitar falsos NEW consecutivos em presença de buracos.
 */
export async function markMissingWeeksAsPartial(
  chartId: string,
  firstWeek: string,
  lastWeek: string
) {
  const allEntityWeeks = await db.charts_data.where('chartId').equals(chartId).sortBy('week');
  if (!allEntityWeeks.length) return;
  const existingSet = new Set(allEntityWeeks.map(r => r.week));
  let cursor = dayjs(firstWeek);
  const end = dayjs(lastWeek);
  while (cursor.isBefore(end)) {
    const w = cursor.format('YYYY-MM-DD');
    if (!existingSet.has(w)) {
      try {
        await db.chart_weeks.put({ chartId, week: w, status: 'partial' });
      } catch {
        /* ignore */
      }
    }
    cursor = cursor.add(7, 'day');
  }
}
