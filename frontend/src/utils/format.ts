export function formatNumber(value: number | null | undefined, options?: Intl.NumberFormatOptions): string {
  if (value == null || Number.isNaN(value as any)) return '—';
  try {
    const locale = typeof navigator !== 'undefined' && (navigator as any).language ? (navigator as any).language : undefined;
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 0, ...options }).format(value as number);
  } catch {
    return String(value);
  }
}

export function formatCompactNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value as any)) return '—';
  const absValue = Math.abs(value as number);
  const sign = (value as number) < 0 ? '-' : '';
  if (absValue < 1000) {
    return `${sign}${Math.round(absValue)}`;
  }
  const units = [
    { threshold: 1_000_000_000, divisor: 1_000_000_000, suffix: 'G' },
    { threshold: 1_000_000, divisor: 1_000_000, suffix: 'M' },
    { threshold: 1_000, divisor: 1_000, suffix: 'k' },
  ];
  const unit = units.find(u => absValue >= u.threshold) || units[units.length - 1];
  const valueScaled = absValue / unit.divisor;
  const display = valueScaled >= 100 ? Math.round(valueScaled) : Math.round(valueScaled * 10) / 10;
  return `${sign}${display}${unit.suffix}`;
}
