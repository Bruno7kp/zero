import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import { fetchChartData, fetchStatsMapIncremental, computeWeekDeltas } from '../store/chartsSlice';
import { useProgressiveReveal } from '../hooks/useProgressiveReveal';
import { Card, Flex, Text, Collapse, ActionIcon, Box, Divider, useMantineTheme, useMantineColorScheme } from '@mantine/core';
import { DeltaBadge } from './DeltaBadge';
import { selectResolvedBadge } from '../store/badgeStylesSlice';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { SpotifyImageWithModal } from './SpotifyImageWithModal';
import type { ChartData } from '../db/indexedDb';
import { ChartItemStatsLoader } from './ChartItemStatsLoader';
import { CertificationIcon } from './CertificationIcon';

interface ChartWeekListProps {
  chart: any;
  week?: string;
  type: string;
  altVariation?: (row: ChartData, index: number) => string | number | false | null | undefined;
  clientId: string;
  clientSecret: string;
}


// Componente de linha memoizado para minimizar rerenders quando statsMap parcial é atualizado
const ChartWeekListRow: React.FC<{
  row: ChartData;
  idx: number;
  filteredColumns: any[];
  chart: any;
  showDeltaBadge: boolean;
  showDeltaPlaysBadge: boolean;
  showDeltaPercentPlaysBadge: boolean;
  showAltVariationRedux: boolean;
  showAltPlaysVariationRedux: boolean;
  showImage: boolean;
  altVariation?: (row: ChartData, index: number) => string | number | false | null | undefined;
  type: string;
  clientId: string;
  clientSecret: string;
  colorScheme: string;
  theme: any;
  week?: string;
  listBackground?: 'default' | 'transparent';
}> = React.memo(({ row, idx, filteredColumns, chart, showDeltaBadge, showDeltaPlaysBadge, showDeltaPercentPlaysBadge, showAltVariationRedux, showAltPlaysVariationRedux, showImage, altVariation, type, clientId, clientSecret, colorScheme, theme, week, listBackground = 'default' }) => {
  const stats = useSelector((state: any) => state.charts.statsMap[row.entityId]);
  const loadingStats = useSelector((state: any) => state.charts.loadingStats);
  const badgeStylesRank = useSelector((s: any) => selectResolvedBadge(s, 'rank', 'list'));
  const badgeStylesPlays = useSelector((s: any) => selectResolvedBadge(s, 'plays', 'list'));
  const playsVariationLocation = (useSelector((state: any) => state.columns?.views?.list?.settings?.playsVariationLocation) || 'under') as 'hidden' | 'under' | 'column';
  const playsVariationDisplay = (useSelector((state: any) => state.columns?.views?.list?.settings?.playsVariationDisplay) || 'percent') as 'hidden' | 'absolute' | 'percent';
  const [expanded, setExpanded] = useState(false);
  const [imageForceUpdate, setImageForceUpdate] = useState<number>(0);
  const [lastImageUrl, setLastImageUrl] = useState<string | null>(null);
  const globalStatsMap = useSelector((state: any) => state.charts.statsMap);
  const [lastPeakById, setLastPeakById] = useState<Record<string, number | null>>({});
  const [lastWeeksById, setLastWeeksById] = useState<Record<string, number | null>>({});
  const [lastWeeksAtPeakById, setLastWeeksAtPeakById] = useState<Record<string, number | null>>({});
  const peakCountStyle = useSelector((state: any) => state.columns?.views?.list?.settings?.peakCountStyle) || 'noCount';
  const showPeakCount = peakCountStyle === 'withCount';
  useEffect(() => {
    try {
      const nextPeak = { ...lastPeakById };
      const nextWeeks = { ...lastWeeksById };
      let changed = false;
      for (const [entityId, s] of Object.entries(globalStatsMap || {})) {
        const peak = (s as any)?.peak?.position;
        if (peak != null && nextPeak[entityId] !== peak) { nextPeak[entityId] = peak; changed = true; }
        const weeks = (s as any)?.totals?.withinCutoff;
        if (weeks != null && nextWeeks[entityId] !== weeks) { nextWeeks[entityId] = weeks; changed = true; }
        const weeksAtPeak = (s as any)?.peak?.weeksAtPeak;
        if (weeksAtPeak != null && lastWeeksAtPeakById[entityId] !== weeksAtPeak) { lastWeeksAtPeakById[entityId] = weeksAtPeak; changed = true; }
      }
      if (changed) { setLastPeakById(nextPeak); setLastWeeksById(nextWeeks); setLastWeeksAtPeakById({ ...lastWeeksAtPeakById }); }
    } catch { /* noop */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalStatsMap]);

  const toggle = useCallback(() => setExpanded(e => !e), []);
  const rowId = String(row.id);

  const isTransparent = listBackground === 'transparent';
  return (
    <Card key={rowId} shadow={isTransparent ? 'none' : 'md'} p={0} radius="md" style={{ background: isTransparent ? 'transparent' : (colorScheme === 'dark' ? theme.colors.dark[7] : 'white') }}>
      <Flex align="stretch" gap="md" px="md" wrap="nowrap" style={{ height: 72 }}>
        <Flex align="center" gap="md" wrap="wrap" style={{ flex: 1 }}>
          {filteredColumns.map((col: any) => {
            if (col.key === 'rank') {
              return (
                <Flex key={col.key} direction="column" align="center" style={{ minWidth: 48, maxWidth: 48, flex: '0 0 48px' }}>
                  <Text fw={700} size="xl" c={row.rank === 1 ? 'blue' : undefined}>{row.rank}</Text>
                  {showDeltaBadge && <DeltaBadge delta={row.deltaRank} cfg={badgeStylesRank} kind="rank" textSize="xs" columnContext contextView="list" />}
                </Flex>
              );
            }
            if (col.key === 'plays') {
              return (
                <Flex key={col.key} direction="column" align="center" mr="sm" style={{ minWidth: 72, maxWidth: 72, flex: '0 0 72px' }}>
                  <Text fw={700} size="xl">{row.plays}</Text>
                  {playsVariationLocation === 'under' && (showDeltaPlaysBadge || showDeltaPercentPlaysBadge) && (
                    <DeltaBadge delta={row.deltaPlays} cfg={badgeStylesPlays} kind="plays" showPercent={showDeltaPercentPlaysBadge} currentValue={row.plays} textSize="xs" columnContext contextView="list" />
                  )}
                </Flex>
              );
            }
            if (col.key === 'name') {
              return (
                <Flex key={col.key} direction="row" align="center" style={{ flex: 1, minWidth: 0 }}>
                  {showImage && (
                    <SpotifyImageWithModal
                      entityId={row.entityId}
                      name={row.name}
                      artistName={row.artistName}
                      type={type as 'artist' | 'album' | 'track'}
                      clientId={clientId}
                      clientSecret={clientSecret}
                      forceUpdate={imageForceUpdate}
                      width={72}
                      height={72}
                      borderRadius={0}
                      style={{ minWidth: 72, maxWidth: 72 }}
                      lastImageUrl={lastImageUrl}
                      onImageChange={() => {
                        // Force update counter
                        setImageForceUpdate(f => f + 1);
                      }}
                      onImageLoad={(url: string) => {
                        if (row.entityId && url && lastImageUrl !== url) setLastImageUrl(url);
                      }}
                    />
                  )}
                  <Flex direction="column" align="flex-start" ml="sm" style={{ justifyContent: 'center', height: '100%', flex: 1, minWidth: 0 }}>
                    <Text fw={700} size="lg" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{row.name}</Text>
                    {row.artistName && <Text size="sm" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{row.artistName}</Text>}
                  </Flex>
                </Flex>
              );
            }
            if (col.key === 'peak') {
              const current = stats?.peak?.position;
              const stable = lastPeakById[row.entityId];
              const display = (current != null) ? current : (stable != null ? stable : undefined);
              const showCount = showPeakCount;
              const hasStats = !!stats;
              const liveCount = stats?.peak?.weeksAtPeak;
              const stableWeeksAtPeak = lastWeeksAtPeakById[row.entityId];
              const rawCountAtOne = (liveCount != null ? liveCount : stableWeeksAtPeak);
              const renderedCountAtOne = display === 1 ? (hasStats ? Math.max(1, (rawCountAtOne as number) ?? 1) : 1) : null;
              return (
                <Flex key={col.key} direction="column" align="center" mr="sm" style={{ minWidth: 48, maxWidth: 48, flex: '0 0 48px' }}>
                  <Text fw={700} size="xl" c={display === 1 ? 'blue' : undefined} style={{ transition: 'color 120ms ease' }}>
                    {display != null ? display : <span style={{ opacity: 0, display: 'inline-block', minWidth: 10 }}>0</span>}
                  </Text>
                  {showCount && display === 1 && renderedCountAtOne != null ? (
                    <Text c="dimmed" mt={2} style={{ lineHeight: 1, fontSize: '0.6em', letterSpacing: 0.5 }}>{`${renderedCountAtOne}x`}</Text>
                  ) : row.rank === 1 && (
                    <Text c="dimmed" mt={2} style={{ lineHeight: 1, fontSize: '0.6em', letterSpacing: 0.5 }}>
                      PEAK
                    </Text>
                  )}
                </Flex>
              );
            }
            if (col.key === 'cert' && type !== 'artist') {
              return (
                <Flex key={col.key} direction="column" align="center" mr="sm" style={{ minWidth: 48, maxWidth: 48, flex: '0 0 48px' }}>
                  {(type === 'album' || type === 'track') && (stats
                    ? <CertificationIcon
                      key={`cert-${row.entityId}-${chart?.lastfm_username || 'nouser'}`}
                      chart={chart}
                      chartType={type as 'album' | 'track'}
                      totals={stats?.totals}
                      entity={{ name: row.name, artistName: row.artistName || '' }}
                      entityId={row.entityId}
                      username={chart?.lastfm_username}
                      size={24}
                      deferMs={450}
                    />
                    : (loadingStats ? <Text fw={700} size="xl">…</Text> : <Text fw={700} size="xl">-</Text>))}
                </Flex>
              );
            }
            if (col.key === 'totalWeeks') {
              const current = stats?.totals?.withinCutoff;
              const stable = lastWeeksById[row.entityId];
              const display = (current != null) ? current : (stable != null ? stable : undefined);
              return (
                <Flex key={col.key} direction="column" align="center" mr="sm" style={{ minWidth: 48, maxWidth: 48, flex: '0 0 48px' }}>
                  <Text fw={700} size="xl" style={{ transition: 'color 120ms ease' }}>
                    {display != null ? display : <span style={{ opacity: 0, display: 'inline-block', minWidth: 10 }}>0</span>}
                  </Text>
                  {row.rank === 1 && (
                    <Text c="dimmed" mt={2} style={{ lineHeight: 1, fontSize: '0.6em', letterSpacing: 0.5 }}>
                      WEEKS
                    </Text>
                  )}
                </Flex>
              );
            }
            if (col.key === 'altVariation' && showAltVariationRedux) {
              // Always render a placeholder to avoid layout shift while computing deltas when switching week/type
              const rawVal: any = altVariation ? altVariation(row, idx) : undefined;
              const value: any = (rawVal || rawVal === 0) ? (rawVal === '-' ? undefined : rawVal) : undefined;
              let cfg: any = badgeStylesRank;
              if (badgeStylesRank.iconPosition === 'split') {
                cfg = { ...badgeStylesRank, iconPosition: 'split', splitTall: badgeStylesRank.splitTall !== false };
              } else if (badgeStylesRank.iconPosition === 'hidden') {
                cfg = { ...badgeStylesRank, iconPosition: 'hidden', splitTall: false };
              } else {
                cfg = { ...badgeStylesRank, splitTall: false };
              }
              // Alt variation as its own column-like block -> use larger font size
              return <DeltaBadge delta={value} cfg={cfg} kind="rank" textSize="md" columnContext noSidePadding contextView="list" />;
            }
            if (col.key === 'altPlaysVariation' && showAltPlaysVariationRedux) {
              const treatAsHiddenForWidth = badgeStylesPlays.hideLabel && badgeStylesPlays.iconPosition === 'before';
              const isCompact = badgeStylesPlays.iconPosition === 'hidden' || treatAsHiddenForWidth; // only icon or only text
              const widthOverride = isCompact ? 50 : 65; // plays: 50 (compact) / 65 (icon+text)
              return (
                <DeltaBadge
                  delta={row.deltaPlays}
                  cfg={badgeStylesPlays}
                  kind="plays"
                  textSize="sm"
                  columnContext
                  noSidePadding
                  contextView="list"
                  showPercent={playsVariationDisplay === 'percent'}
                  currentValue={row.plays}
                  fixedWidthOverride={widthOverride}
                />
              );
            }
            return null;
          })}
          <ActionIcon variant="subtle" onClick={toggle}>
            {expanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
          </ActionIcon>
        </Flex>
      </Flex>
      <Collapse in={expanded} p={0}>
        {expanded && (
          <>
            <Divider size="xs" />
            <Box p={0}>
              <ChartItemStatsLoader chartId={row.chartId} chartType={row.chartType} entityId={row.entityId} week={week} />
            </Box>
          </>
        )}
      </Collapse>
    </Card>
  )
});

// renderStyledBadge removed (use DeltaBadge)

export const ChartWeekList: React.FC<ChartWeekListProps> = ({ chart, week, type, altVariation, clientId, clientSecret }) => {
  const dispatch = useDispatch<AppDispatch>();
  const data = useSelector((state: any) => state.charts.data);
  // Persist previous non-empty data to avoid flicker/shifting while switching week/type
  const [displayedData, setDisplayedData] = useState<any[]>(data);
  const prevDataRef = React.useRef<any[]>(data);
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
    if (!Array.isArray(data) || data.length === 0) return; // keep previous
    const sameKey = displayedKey === currentKey;
    const ready = isDeltasReady(data as any[], week);
    if (!sameKey) {
      if (ready) {
        setDisplayedData(data);
        prevDataRef.current = data;
        setDisplayedKey(currentKey);
        setSwitchHoldUntil(null);
      } else {
        if (!switchHoldUntil) setSwitchHoldUntil(Date.now() + 450);
      }
    } else {
      if (ready) {
        setDisplayedData(data);
        prevDataRef.current = data;
      }
    }
  }, [data, week, type, chart?.id, displayedKey, currentKey, isDeltasReady, switchHoldUntil]);
  useEffect(() => {
    if (!switchHoldUntil) return;
    const id = setInterval(() => {
      const ready = isDeltasReady(data as any[], week);
      if (ready || Date.now() >= switchHoldUntil) {
        if (Array.isArray(data) && data.length) {
          setDisplayedData(data);
          prevDataRef.current = data;
          setDisplayedKey(currentKey);
        }
        setSwitchHoldUntil(null);
      }
    }, 60);
    return () => clearInterval(id);
  }, [switchHoldUntil, data, week, isDeltasReady, currentKey]);
  const safeDisplayedData = displayedData && displayedData.length > 0 ? displayedData : prevDataRef.current;
  const columns = useSelector((state: any) => (state.columns?.views?.list?.columns) || state.columns?.columns || []);
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const listBackground = useSelector((state: any) => (state.columns?.views?.list?.settings?.listBackground) || 'default');

  // Buscar dados ao trocar semana/tipo/chart
  useEffect(() => {
    if (!week || !chart?.id) return;
    dispatch(fetchChartData({ chartId: `${chart.id}`, chartType: type, week }));
  }, [chart?.id, week, type, dispatch]);

  useEffect(() => {
    if (!data.length || !week || !chart?.id) return;
    dispatch(computeWeekDeltas({ chartId: `${chart.id}`, chartType: type, week, rows: data }));
  }, [data, week, chart?.id, type, dispatch]);

  // Stats diferidos: só agenda se colunas que dependem de stats estiverem visíveis (peak/totalWeeks/cert; ignore cert for artist charts)
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

  // Refetch incremental quando usuário habilita colunas de stats depois
  const statsColumnsVisible = useMemo(() => columns.some((c: any) => (
    (c.key === 'peak' || c.key === 'totalWeeks' || (c.key === 'cert' && type !== 'artist')) && c.visible
  )), [columns, type]);
  const [statsColsPrev, setStatsColsPrev] = useState(statsColumnsVisible);
  useEffect(() => {
    if (statsColumnsVisible && !statsColsPrev && data.length && week && chart?.id) {
      dispatch(fetchStatsMapIncremental({ chartId: `${chart.id}`, chartType: type, data, week }));
    }
    if (statsColsPrev !== statsColumnsVisible) setStatsColsPrev(statsColumnsVisible);
  }, [statsColumnsVisible, statsColsPrev, data, week, chart?.id, type, dispatch]);

  // Fallback de reforço se stats não chegarem
  useEffect(() => {
    if (!statsColumnsVisible || !data.length || !week || !chart?.id) return;
    const state: any = (window as any).__reduxStateCache; // opcional se existir caching global
    const hasAny = data.some((r: any) => {
      const s = (state?.charts?.statsMap || ({} as any))[r.entityId];
      return s && s.totals && s.totals.withinCutoff != null;
    });
    // Se não temos acesso a state global via hack, fazemos checagem via dispatch indireta (omitido). Simplesmente agenda fallback:
    if (hasAny) return;
    const id = setTimeout(() => {
      dispatch(fetchStatsMapIncremental({ chartId: `${chart.id}`, chartType: type, data, week }));
    }, 1300);
    return () => clearTimeout(id);
  }, [statsColumnsVisible, data, week, chart?.id, type, dispatch]);

  const visibleColumns = useMemo(() => columns.filter((c: any) => c.visible), [columns]);
  const showAltVariationRedux = columns.find((c: any) => c.key === 'altVariation')?.visible;
  const showDeltaBadge = columns.find((c: any) => c.key === 'deltaRankBadge')?.visible;
  const showDeltaPlaysBadge = columns.find((c: any) => c.key === 'deltaPlaysBadge')?.visible;
  const showDeltaPercentPlaysBadge = columns.find((c: any) => c.key === 'deltaPercentPlaysBadge')?.visible;
  const showAltPlaysVariationRedux = columns.find((c: any) => c.key === 'altPlaysVariation')?.visible;
  const showImage = columns.find((c: any) => c.key === 'image')?.visible;
  const filteredColumns = visibleColumns.filter((c: any) => c.isColumn);

  // Badge util agora está fora

  const useProgressive = safeDisplayedData.length > 120;
  const progressiveAll = useProgressiveReveal(safeDisplayedData, { initial: 40, step: 50, intervalMs: 18, adaptive: true, disableBelow: 260, targetDurationMs: 260 });
  const progressive = useProgressive ? progressiveAll : { items: safeDisplayedData, done: true, total: safeDisplayedData.length } as any;
  const visibleRows = progressive.items as ChartData[];
  const showLoadingTail = useProgressive && !progressive.done;

  return (
    <Flex direction="column" gap="sm">
      {visibleRows.map((row: ChartData, idx: number) => (
        <ChartWeekListRow
          key={row.id}
          row={row}
          idx={idx}
          filteredColumns={filteredColumns}
          chart={chart}
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
