import React, { useMemo, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import { fetchChartData, fetchStatsMapIncremental, computeWeekDeltas } from '../store/charts';
import { useProgressiveReveal } from '../hooks/useProgressiveReveal';
import { Flex, Text, useMantineTheme, useMantineColorScheme } from '@mantine/core';
import type { ChartData } from '../db/indexedDb';
import { ChartWeekListRow } from './chartList/ChartWeekListRow.tsx';

interface ChartWeekListProps {
  chart: any;
  week?: string;
  type: string;
  altVariation?: (row: ChartData, index: number) => string | number | false | null | undefined;
  clientId: string;
  clientSecret: string;
}

// Row moved to ./chartList/ChartWeekListRow.tsx

export const ChartWeekList: React.FC<ChartWeekListProps> = ({ chart, week, type, altVariation, clientId, clientSecret }) => {
  const dispatch = useDispatch<AppDispatch>();
  const data = useSelector((state: any) => state.charts.data);
  const [displayedData, setDisplayedData] = useState<any[]>(data);
  const [lastNonEmptyDisplayedData, setLastNonEmptyDisplayedData] = useState<any[]>(Array.isArray(data) && data.length ? data : []);
  const [displayedKey, setDisplayedKey] = useState<string | null>(null);
  const [switchHoldUntil, setSwitchHoldUntil] = useState<number | null>(null);
  const currentKey = `${chart?.id || 'x'}|${type}|${week || 'n/a'}`;
  const isDeltasReady = React.useCallback((rows: any[], targetWeek?: string) => {
    if (!Array.isArray(rows) || !rows.length || !targetWeek) return false;
    const cur = rows.filter((r: any) => r.week === targetWeek);
    if (!cur.length) return false;
    let ready = 0;
    for (const r of cur) {
      const d = (r as any).deltaRank;
      if (d !== undefined && d !== null && d !== '-') ready++;
    }
    return ready >= Math.ceil(cur.length * 0.9);
  }, []);
  useEffect(() => {
    if (!Array.isArray(data) || data.length === 0) return;
    const sameKey = displayedKey === currentKey;
    const ready = isDeltasReady(data as any[], week);
    if (!sameKey) {
      if (ready) {
        requestAnimationFrame(() => {
          setDisplayedData(data);
          setLastNonEmptyDisplayedData(data);
          setDisplayedKey(currentKey);
          setSwitchHoldUntil(null);
        });
      } else {
        if (!switchHoldUntil) requestAnimationFrame(() => setSwitchHoldUntil(Date.now() + 450));
      }
    } else {
      if (ready) {
        requestAnimationFrame(() => {
          setDisplayedData(data);
          setLastNonEmptyDisplayedData(data);
        });
      }
    }
  }, [data, week, type, chart?.id, displayedKey, currentKey, isDeltasReady, switchHoldUntil]);
  useEffect(() => {
    if (!switchHoldUntil) return;
    const id = setInterval(() => {
      const ready = isDeltasReady(data as any[], week);
      if (ready || Date.now() >= switchHoldUntil) {
        if (Array.isArray(data) && data.length) {
          requestAnimationFrame(() => {
            setDisplayedData(data);
            setLastNonEmptyDisplayedData(data);
            setDisplayedKey(currentKey);
          });
        }
        requestAnimationFrame(() => setSwitchHoldUntil(null));
      }
    }, 60);
    return () => clearInterval(id);
  }, [switchHoldUntil, data, week, isDeltasReady, currentKey]);
  const safeDisplayedData = (displayedData && displayedData.length > 0) ? displayedData : lastNonEmptyDisplayedData;
  const columns = useSelector((state: any) => (state.columns?.views?.list?.columns) || state.columns?.columns || []);
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const listBackground = useSelector((state: any) => (state.columns?.views?.list?.settings?.listBackground) || 'default');
  const viewConfig = useSelector((state: any) => (state as any).columns?.views?.list);
  const fontScale = (viewConfig?.settings as any)?.fontScale ?? 0;
  const listPeakWeeksCombined = (viewConfig?.settings as any)?.listPeakWeeksCombined || false;
  const visibleColumns = useMemo(() => columns.filter((c: any) => c.visible), [columns]);
  const showAltVariationRedux = columns.find((c: any) => c.key === 'altVariation')?.visible;
  const showDeltaBadge = columns.find((c: any) => c.key === 'deltaRankBadge')?.visible;
  const showDeltaPlaysBadge = columns.find((c: any) => c.key === 'deltaPlaysBadge')?.visible;
  const showDeltaPercentPlaysBadge = columns.find((c: any) => c.key === 'deltaPercentPlaysBadge')?.visible;
  const showAltPlaysVariationRedux = columns.find((c: any) => c.key === 'altPlaysVariation')?.visible;
  const showImage = columns.find((c: any) => c.key === 'image')?.visible;
  const filteredColumns = visibleColumns.filter((c: any) => c.isColumn);

  const useProgressive = safeDisplayedData.length > 120;
  const progressiveAll = useProgressiveReveal(safeDisplayedData, { initial: 40, step: 50, intervalMs: 18, adaptive: true, disableBelow: 260, targetDurationMs: 260 });
  const progressive = useProgressive ? progressiveAll : { items: safeDisplayedData, done: true, total: safeDisplayedData.length } as any;
  const visibleRows = progressive.items as ChartData[];
  const showLoadingTail = useProgressive && !progressive.done;

  // Data fetch + stats flow
  useEffect(() => {
    if (!week || !chart?.id) return;
    dispatch(fetchChartData({ chartId: `${chart.id}`, chartType: type, week }));
  }, [chart?.id, week, type, dispatch]);
  useEffect(() => {
    if (!data.length || !week || !chart?.id) return;
    dispatch(computeWeekDeltas({ chartId: `${chart.id}`, chartType: type, week, rows: data }));
  }, [data, week, chart?.id, type, dispatch]);
  useEffect(() => {
    if (!data.length || !week || !chart?.id) return;
    const wantsStats = columns.some((c: any) => (
      (c.key === 'peak' || c.key === 'totalWeeks' || (c.key === 'cert' && type !== 'artist')) && c.visible
    ));
    if (!wantsStats) return;
    let cancelled = false;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const id = setTimeout(() => {
        if (cancelled) return;
        dispatch(fetchStatsMapIncremental({ chartId: `${chart.id}`, chartType: type, data, week }));
      }, 900);
      (window as any).__listStatsTimer = id;
    }));
    return () => {
      cancelled = true;
      if ((window as any).__listStatsTimer) clearTimeout((window as any).__listStatsTimer);
    };
  }, [data, chart?.id, type, week, dispatch, columns]);
  const statsColumnsVisible = useMemo(() => columns.some((c: any) => (
    (c.key === 'peak' || c.key === 'totalWeeks' || (c.key === 'cert' && type !== 'artist')) && c.visible
  )), [columns, type]);
  const statsColsPrevRef = React.useRef(statsColumnsVisible);
  useEffect(() => {
    if (statsColumnsVisible && !statsColsPrevRef.current && data.length && week && chart?.id) {
      dispatch(fetchStatsMapIncremental({ chartId: `${chart.id}`, chartType: type, data, week }));
    }
    statsColsPrevRef.current = statsColumnsVisible;
  }, [statsColumnsVisible, data, week, chart?.id, type, dispatch]);
  useEffect(() => {
    if (!statsColumnsVisible || !data.length || !week || !chart?.id) return;
    const id = setTimeout(() => {
      dispatch(fetchStatsMapIncremental({ chartId: `${chart.id}`, chartType: type, data, week }));
    }, 1300);
    return () => clearTimeout(id);
  }, [statsColumnsVisible, data, week, chart?.id, type, dispatch]);

  return (
    <Flex direction="column" gap="sm">
      {visibleRows.map((row: ChartData, idx: number) => (
        <ChartWeekListRow
          key={row.id}
          row={row}
          idx={idx}
          filteredColumns={filteredColumns}
          showDeltaBadge={showDeltaBadge}
          showDeltaPlaysBadge={showDeltaPlaysBadge}
          showDeltaPercentPlaysBadge={showDeltaPercentPlaysBadge}
          showAltVariationRedux={showAltVariationRedux}
          showImage={showImage}
          showAltPlaysVariationRedux={showAltPlaysVariationRedux}
          altVariation={altVariation}
          type={type}
          clientId={clientId}
          clientSecret={clientSecret}
          colorScheme={colorScheme}
          theme={theme}
          week={week}
          listBackground={listBackground}
          fontScale={fontScale}
          listPeakWeeksCombined={listPeakWeeksCombined}
        />
      ))}
      {showLoadingTail && (
        <Flex justify="center" py="sm">
          <Text size="xs" c="dimmed">Carregando {visibleRows.length}/{progressive.total}…</Text>
        </Flex>
      )}
    </Flex>
  );
};
