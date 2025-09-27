export function getPrevNextWeek(weeks: string[], currentWeek?: string) {
  if (!weeks.length || !currentWeek) return { prev: undefined, next: undefined };
  const idx = weeks.indexOf(currentWeek);
  return {
    prev: idx > 0 ? weeks[idx - 1] : undefined,
    next: idx >= 0 && idx < weeks.length - 1 ? weeks[idx + 1] : undefined,
  };
}
