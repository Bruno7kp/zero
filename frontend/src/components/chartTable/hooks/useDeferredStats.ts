import { useEffect, useMemo, useRef } from 'react';
import type { AppDispatch } from '../../../store';
import { fetchStatsMapIncremental } from '../../../store/charts';

export function useDeferredStats(
  dispatch: AppDispatch,
  params: { chartId: string; chartType: string; data: any[]; week?: string },
  columns: any[]
) {
  const wantsStats = useMemo(
    () =>
      columns.some(
        (c: any) => (c.key === 'peak' || c.key === 'totalWeeks' || c.key === 'cert') && c.visible
      ),
    [columns]
  );

  useEffect(() => {
    const { chartId, chartType, data, week } = params;
    if (!data.length || !week) return;
    if (!wantsStats) return;
    let cancelled = false;
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        const id = setTimeout(() => {
          if (cancelled) return;
          dispatch(fetchStatsMapIncremental({ chartId: `${chartId}`, chartType, data, week }));
        }, 600);
        (window as any).__tableStatsTimer = id;
      })
    );
    return () => {
      cancelled = true;
      if ((window as any).__tableStatsTimer) clearTimeout((window as any).__tableStatsTimer);
    };
  }, [dispatch, wantsStats, params]);

  const statsColumnsVisible = wantsStats;
  // Track previous visibility without causing renders
  const prevVisibleRef = useRef(statsColumnsVisible);
  useEffect(() => {
    const { chartId, chartType, data, week } = params;
    const wasVisible = prevVisibleRef.current;
    if (statsColumnsVisible && !wasVisible && data.length && week) {
      dispatch(fetchStatsMapIncremental({ chartId: `${chartId}`, chartType, data, week }));
    }
    prevVisibleRef.current = statsColumnsVisible;
  }, [statsColumnsVisible, dispatch, params]);

  return { statsColumnsVisible };
}
