import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Gera uma lista de datas de início de semanas fechadas para um chart.
 * @param startDate string (YYYY-MM-DD)
 * @param dayOfWeek número do dia de início da semana (0=domingo, 1=segunda, ...)
 * @param timezoneStr string do timezone (ex: 'America/Sao_Paulo')
 * @returns string[] datas (YYYY-MM-DD) de início de cada semana fechada
 */
export function getClosedChartWeeks(
  startDate: string,
  dayOfWeek: number,
  timezoneStr: string
): string[] {
  let week = dayjs.tz(startDate, timezoneStr).startOf('day');
  const diff = (week.day() - dayOfWeek + 7) % 7;
  week = week.subtract(diff, 'day');
  const now = dayjs().tz(timezoneStr);
  const weeksArr: string[] = [];
  while (true) {
    const weekEnd = week.add(7, 'day').subtract(1, 'second');
    if (weekEnd.isAfter(now)) break;
    weeksArr.push(week.format('YYYY-MM-DD'));
    week = week.add(7, 'day');
  }
  return weeksArr;
}
