import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Flex, Text, Collapse, ActionIcon, Divider, Box } from '@mantine/core';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { selectResolvedBadge } from '../../store/badgeStylesSlice';
import { useSelector } from 'react-redux';
import { SpotifyImageWithModal } from '../SpotifyImageWithModal';
import type { ChartData } from '../../db/indexedDb';
import { ChartItemStatsLoader } from '../ChartItemStatsLoader';
import { makeScaleSize } from '../../hooks/useFontScale';
import {
  RankCellList,
  PlaysCellList,
  CombinedPeakWeeksBlock,
  PeakCellList,
  WeeksCellList,
  AltVariationCellList,
  AltPlaysVariationCellList,
  CertCellList,
} from './ListCells';

export const ChartWeekListRow: React.FC<{
  row: ChartData;
  idx: number;
  filteredColumns: any[];
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
  fontScale: -2 | -1 | 0 | 1 | 2;
  listPeakWeeksCombined: boolean;
}> = React.memo(({ row, idx, filteredColumns, showDeltaBadge, showDeltaPlaysBadge, showDeltaPercentPlaysBadge, showAltVariationRedux, showAltPlaysVariationRedux, showImage, altVariation, type, clientId, clientSecret, colorScheme, theme, week, listBackground = 'default', fontScale, listPeakWeeksCombined }) => {
  const stats = useSelector((state: any) => state.charts.statsMap[row.entityId]);
  const loadingStats = useSelector((state: any) => state.charts.loadingStats);
  const badgeStylesRank = useSelector((s: any) => selectResolvedBadge(s, 'rank', 'list'));
  const badgeStylesPlays = useSelector((s: any) => selectResolvedBadge(s, 'plays', 'list'));
  const playsVariationLocation = (useSelector((state: any) => state.columns?.views?.list?.settings?.playsVariationLocation) || 'under') as 'hidden' | 'under' | 'column';
  const playsVariationDisplay = (useSelector((state: any) => state.columns?.views?.list?.settings?.playsVariationDisplay) || 'percent') as 'hidden' | 'absolute' | 'percent';
  const chartFromStore = useSelector((s: any) => s.charts.chart);
  const [expanded, setExpanded] = useState(false);
  const [imageForceUpdate, setImageForceUpdate] = useState<number>(0);
  const [lastImageUrl, setLastImageUrl] = useState<string | null>(null);
  const globalStatsMap = useSelector((state: any) => state.charts.statsMap);
  const [lastPeakById, setLastPeakById] = useState<Record<string, number | null>>({});
  const [lastWeeksById, setLastWeeksById] = useState<Record<string, number | null>>({});
  const [lastWeeksAtPeakById, setLastWeeksAtPeakById] = useState<Record<string, number | null>>({});
  const peakCountStyle = useSelector((state: any) => state.columns?.views?.list?.settings?.peakCountStyle) || 'noCount';
  const showPeakCount = peakCountStyle === 'withCount';

  // Mantine token shifter for font scale
  const scaleSize = useMemo(() => makeScaleSize(fontScale), [fontScale]);

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
                <RankCellList key={col.key} row={row} showDeltaBadge={showDeltaBadge} badgeStylesRank={badgeStylesRank} scaleSize={scaleSize as any} />
              );
            }
            if (col.key === 'plays') {
              return (
                <PlaysCellList
                  key={col.key}
                  row={row}
                  playsVariationLocation={playsVariationLocation}
                  showDeltaPlaysBadge={showDeltaPlaysBadge}
                  showDeltaPercentPlaysBadge={showDeltaPercentPlaysBadge}
                  badgeStylesPlays={badgeStylesPlays}
                  scaleSize={scaleSize as any}
                />
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
                        setImageForceUpdate(f => f + 1);
                      }}
                      onImageLoad={(url: string) => {
                        if (row.entityId && url && lastImageUrl !== url) setLastImageUrl(url);
                      }}
                    />
                  )}
                  <Flex direction="column" align="flex-start" ml="sm" style={{ justifyContent: 'center', height: '100%', flex: 1, minWidth: 0 }}>
                    <Text fw={700} size={scaleSize('lg')} style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{row.name}</Text>
                    {row.artistName && <Text size={scaleSize('sm')} style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{row.artistName}</Text>}
                  </Flex>
                </Flex>
              );
            }
            if (col.key === 'peak') {
              const alsoHasWeeks = filteredColumns.some((c: any) => c.key === 'totalWeeks');
              if (listPeakWeeksCombined && alsoHasWeeks) {
                const currentPeak = stats?.peak?.position;
                const stablePeak = lastPeakById[row.entityId];
                const displayPeak = (currentPeak != null) ? currentPeak : (stablePeak != null ? stablePeak : undefined);
                const currentWeeks = stats?.totals?.withinCutoff;
                const stableWeeks = lastWeeksById[row.entityId];
                const displayWeeks = (currentWeeks != null) ? currentWeeks : (stableWeeks != null ? stableWeeks : undefined);
                const hasStats = !!stats;
                const liveWeeksAtOne = stats?.peak?.weeksAtPeak;
                const stableWeeksAtOne = lastWeeksAtPeakById[row.entityId];
                const rawCountAtOne = (liveWeeksAtOne != null ? liveWeeksAtOne : stableWeeksAtOne);
                const renderedCountAtOne = displayPeak === 1 ? (hasStats ? Math.max(1, (rawCountAtOne as number) ?? 1) : 1) : null;
                return (
                  <CombinedPeakWeeksBlock
                    key="peakWeeksCombined"
                    displayPeak={displayPeak}
                    displayWeeks={displayWeeks}
                    renderedCountAtOne={renderedCountAtOne}
                    showPeakCount={showPeakCount}
                    scaleSize={scaleSize as any}
                    theme={theme}
                  />
                );
              }
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
                <PeakCellList key={col.key} display={display} renderedCountAtOne={renderedCountAtOne} showPeakCount={showCount} scaleSize={scaleSize as any} rank={row.rank} />
              );
            }
            if (col.key === 'cert' && type !== 'artist') {
              return (
                <CertCellList
                  key={col.key}
                  row={row}
                  chart={chartFromStore}
                  type={type as 'album' | 'track'}
                  stats={stats}
                  fontSize={String(theme.fontSizes[scaleSize('xl')])}
                  loading={loadingStats}
                />
              );
            }
            if (col.key === 'totalWeeks') {
              const alsoHasPeak = filteredColumns.some((c: any) => c.key === 'peak');
              if (listPeakWeeksCombined && alsoHasPeak) return null;
              const current = stats?.totals?.withinCutoff;
              const stable = lastWeeksById[row.entityId];
              const display = (current != null) ? current : (stable != null ? stable : undefined);
              return (
                <WeeksCellList key={col.key} display={display} rank={row.rank} scaleSize={scaleSize as any} />
              );
            }
            if (col.key === 'altVariation' && showAltVariationRedux) {
              return (
                <AltVariationCellList key={col.key} value={(altVariation ? altVariation(row, idx) : undefined) as any} cfg={badgeStylesRank} />
              );
            }
            if (col.key === 'altPlaysVariation' && showAltPlaysVariationRedux) {
              return (
                <AltPlaysVariationCellList key={col.key} row={row} cfg={badgeStylesPlays} playsVariationDisplay={playsVariationDisplay} />
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
  );
});
