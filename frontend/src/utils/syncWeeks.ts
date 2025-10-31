import { getClosedChartWeeks } from './chartWeekUtils';

export function getRecentWeeks(
  startDate: string,
  dayOfWeek: number,
  timezone: string,
  limit: number
): string[] {
  const all = getClosedChartWeeks(startDate, dayOfWeek, timezone);
  return all.slice(-limit);
}

export function diffMissingWeeks(existing: string[], desired: string[]): string[] {
  const set = new Set(existing);
  return desired.filter(w => !set.has(w));
}
