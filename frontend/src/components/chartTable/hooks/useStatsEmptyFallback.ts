import { useEffect } from 'react';

export function useStatsEmptyFallback(
  enabled: boolean,
  statsMap: any,
  data: any[],
  week: string | undefined,
  trigger: () => void,
) {
  useEffect(() => {
    if (!enabled || !data.length || !week) return;
    const hasAnyStats = data.some((r: any) => {
      const s = (statsMap as any)[r.entityId];
      return s && s.totals && s.totals.withinCutoff != null;
    });
    if (hasAnyStats) return;
    const id = setTimeout(() => {
      const stillEmpty = data.every((r: any) => {
        const s = (statsMap as any)[r.entityId];
        return !s || !s.totals || s.totals.withinCutoff == null;
      });
      if (stillEmpty) trigger();
    }, 1200);
    return () => clearTimeout(id);
  }, [enabled, statsMap, data, week, trigger]);
}
