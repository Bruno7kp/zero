import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Flex, Text, Collapse, ActionIcon, Divider, Box } from '@mantine/core';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { selectResolvedBadge } from '../../store/badgeStylesSlice';
import { useSelector } from 'react-redux';
import { SpotifyImageWithModal } from '../SpotifyImageWithModal';
import type { ChartData } from '../../db/indexedDb';
import { ChartItemStatsLoader } from '../ChartItemStatsLoader';
import { makeScaleSize } from '../../hooks/useFontScale';
import { getCardBackgroundByMode, type ThemeMode } from '../../theme/modes';
import { calculateFormulaValue } from '../../utils/certification';
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
  theme: any;
  week?: string;
  listBackground?: 'default' | 'transparent';
  fontScale: -2 | -1 | 0 | 1 | 2;
  listPeakWeeksCombined: boolean;
  chart: any;
  isDropped?: boolean;
}> = React.memo(({ row, idx, filteredColumns, showDeltaBadge, showDeltaPlaysBadge, showDeltaPercentPlaysBadge, showAltVariationRedux, showAltPlaysVariationRedux, showImage, altVariation, type, clientId, clientSecret, theme, week, listBackground = 'default', fontScale, listPeakWeeksCombined, chart, isDropped = false }) => {
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
  const showFormulaInsteadOfPlays = (useSelector((state: any) => state.columns?.views?.list?.settings?.showFormulaInsteadOfPlays) || false) as boolean;

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

  const isTransparent = listBackground === 'transparent' || isDropped;
  const themeMode = useSelector((s: any) => (s.theme?.value as ThemeMode) || 'dark');
  
  // Dropped items styling: smaller font scale
  const effectiveFontScale = isDropped ? Math.max(-2, fontScale - 1) as -2 | -1 | 0 | 1 | 2 : fontScale;
  const droppedScaleSize = useMemo(() => makeScaleSize(-2), []);
  const normalScaleSize = useMemo(() => makeScaleSize(effectiveFontScale), [effectiveFontScale]);
  const effectiveScaleSize = isDropped ? droppedScaleSize : normalScaleSize;
  
  return (
  <Card key={rowId} shadow={isTransparent ? 'none' : 'md'} p={0} radius="md" style={{ background: isTransparent ? 'transparent' : getCardBackgroundByMode(theme, themeMode) }}>
      <Flex align="stretch" gap="md" px="md" wrap="nowrap" style={{ height: isDropped ? 60 : 72 }}>
        <Flex align="center" gap="md" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
          {filteredColumns.map((col: any) => {
            if (col.key === 'rank') {
              return (
                <RankCellList key={col.key} row={row} showDeltaBadge={showDeltaBadge} badgeStylesRank={badgeStylesRank} scaleSize={effectiveScaleSize as any} />
              );
            }
            if (col.key === 'plays') {
              const formulaValue = showFormulaInsteadOfPlays && chart && (type === 'album' || type === 'track')
                ? calculateFormulaValue({
                    chart,
                    chartType: type as 'album' | 'track',
                    totalPoints: stats?.totals?.totalPoints || 0,
                    totalPlays: stats?.totals?.totalPlays || 0,
                  })
                : undefined;
              return (
                <PlaysCellList
                  key={col.key}
                  row={row}
                  playsVariationLocation={playsVariationLocation}
                  showDeltaPlaysBadge={showDeltaPlaysBadge}
                  showDeltaPercentPlaysBadge={showDeltaPercentPlaysBadge}
                  badgeStylesPlays={badgeStylesPlays}
                  scaleSize={effectiveScaleSize as any}
                  showFormulaInsteadOfPlays={showFormulaInsteadOfPlays}
                  formulaValue={formulaValue}
                />
              );
            }
            if (col.key === 'name') {
              const imageSize = isDropped ? 36 : 72;
              return (
                <Flex key={col.key} direction="row" align="center" style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  {showImage && (
                    <SpotifyImageWithModal
                      entityId={row.entityId}
                      name={row.name}
                      artistName={row.artistName}
                      type={type as 'artist' | 'album' | 'track'}
                      clientId={clientId}
                      clientSecret={clientSecret}
                      forceUpdate={imageForceUpdate}
                      width={imageSize}
                      height={imageSize}
                      borderRadius={0}
                      style={{ minWidth: imageSize, maxWidth: imageSize }}
                      lastImageUrl={lastImageUrl}
                      onImageChange={() => {
                        setImageForceUpdate(f => f + 1);
                      }}
                      onImageLoad={(url: string) => {
                        if (row.entityId && url && lastImageUrl !== url) setLastImageUrl(url);
                      }}
                    />
                  )}
                  <Flex direction="column" align="flex-start" ml="sm" style={{ justifyContent: 'center', height: '100%', flex: 1, minWidth: 0, overflow: 'hidden' }}>
                    <Text fw={700} size={effectiveScaleSize('lg')} style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%' }}>{row.name}</Text>
                    {row.artistName && <Text size={effectiveScaleSize('sm')} style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%' }}>{row.artistName}</Text>}
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
                    scaleSize={effectiveScaleSize as any}
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
                <PeakCellList key={col.key} display={display} renderedCountAtOne={renderedCountAtOne} showPeakCount={showCount} scaleSize={effectiveScaleSize as any} rank={row.rank} />
              );
            }
            if (col.key === 'cert' && type !== 'artist') {
              return (
                <CertCellList
                  key={col.key}
                  row={row}
                  chart={chart}
                  type={type as 'album' | 'track'}
                  stats={stats}
                  fontSize={String(theme.fontSizes[effectiveScaleSize('xl')])}
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
                <WeeksCellList key={col.key} display={display} rank={row.rank} scaleSize={effectiveScaleSize as any} />
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
