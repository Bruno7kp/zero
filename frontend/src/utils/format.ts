export function formatNumber(value: number | null | undefined, options?: Intl.NumberFormatOptions): string {
  if (value == null || Number.isNaN(value as any)) return '—';
  try {
    const locale = typeof navigator !== 'undefined' && (navigator as any).language ? (navigator as any).language : undefined;
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 0, ...options }).format(value as number);
  } catch {
    return String(value);
  }
}
