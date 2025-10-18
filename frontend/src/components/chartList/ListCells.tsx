import React from 'react';
import { Box, Flex, Text } from '@mantine/core';
import type { ChartData } from '../../db/indexedDb';
import { DeltaBadge } from '../DeltaBadge';
import { CertificationIcon } from '../CertificationIcon';
import { t } from 'i18next';
import { formatNumber, formatCompactNumber } from '../../utils/format';
import { computeWeeklyFormulaMetrics } from '../../utils/certification';

export const RankCellList: React.FC<{
  row: ChartData;
  showDeltaBadge: boolean;
  badgeStylesRank: any;
  scaleSize: (s: 'xs'|'sm'|'md'|'lg'|'xl') => 'xs'|'sm'|'md'|'lg'|'xl';
}> = ({ row, showDeltaBadge, badgeStylesRank, scaleSize }) => (
  <Flex direction="column" align="center" style={{ minWidth: 48, maxWidth: 48, flex: '0 0 48px' }}>
    <Text fw={600} size={scaleSize('xl')} className={row.rank === 1 ? 'peak' : undefined}>{row.rank}</Text>
    {showDeltaBadge && (
      <DeltaBadge delta={row.deltaRank} cfg={badgeStylesRank} kind="rank" textSize="xs" columnContext contextView="list" />
    )}
  </Flex>
);

export const PlaysCellList: React.FC<{
  row: ChartData;
  playsVariationLocation: 'hidden' | 'under' | 'column';
  showDeltaPlaysBadge: boolean;
  showDeltaPercentPlaysBadge: boolean;
  badgeStylesPlays: any;
  scaleSize: (s: 'xs'|'sm'|'md'|'lg'|'xl') => 'xs'|'sm'|'md'|'lg'|'xl';
  showFormulaInsteadOfPlays?: boolean;
  chart?: any;
  chartType?: string;
}> = ({ row, playsVariationLocation, showDeltaPlaysBadge, showDeltaPercentPlaysBadge, badgeStylesPlays, scaleSize, showFormulaInsteadOfPlays, chart, chartType }) => {
  const metrics = showFormulaInsteadOfPlays && chart ? computeWeeklyFormulaMetrics({
    chart,
    chartType: chartType || 'album',
    rank: row.rank,
    plays: row.plays,
    deltaRank: row.deltaRank,
    deltaPlays: row.deltaPlays,
  }) : null;
  const numericDisplay = showFormulaInsteadOfPlays
    ? (metrics && typeof metrics.currentValue === 'number' ? metrics.currentValue : null)
    : (typeof row.plays === 'number' ? row.plays : null);
  const formattedValue = formatNumber(numericDisplay);
  const deltaValue = showFormulaInsteadOfPlays && metrics
    ? (metrics.delta !== undefined && metrics.delta !== null ? metrics.delta : row.deltaPlays)
    : row.deltaPlays;
  const badgeCurrentValue = showFormulaInsteadOfPlays && metrics && typeof metrics.currentValue === 'number'
    ? metrics.currentValue
    : (typeof row.plays === 'number' ? row.plays : undefined);
  const showUnder = playsVariationLocation === 'under' && (showDeltaPlaysBadge || showDeltaPercentPlaysBadge);
  const computePercentOverride = showFormulaInsteadOfPlays && metrics && metrics.previousValue
    ? (deltaNumeric: number) => {
        const prev = metrics.previousValue as number;
        if (!prev) return null;
        const percent = (deltaNumeric / prev) * 100;
        return `${deltaNumeric > 0 ? '+' : ''}${percent.toFixed(0)}%`;
      }
    : undefined;
  const labelOverride = showFormulaInsteadOfPlays && typeof deltaValue === 'number' && deltaValue !== 0 && !showDeltaPercentPlaysBadge
    ? formatCompactNumber(deltaValue)
    : undefined;
  return (
    <Flex direction="column" align="center" mr="sm" style={{ minWidth: 72, maxWidth: 72, flex: '0 0 72px' }}>
      <Text fw={600} size={scaleSize('xl')}>{formattedValue}</Text>
      {showUnder && (
        <DeltaBadge
          delta={deltaValue}
          cfg={badgeStylesPlays}
          kind="plays"
          showPercent={showDeltaPercentPlaysBadge}
          currentValue={typeof badgeCurrentValue === 'number' ? badgeCurrentValue : undefined}
          textSize="xs"
          columnContext
          contextView="list"
          computePercent={computePercentOverride}
          labelOverride={labelOverride}
        />
      )}
    </Flex>
  );
};

export const CombinedPeakWeeksBlock: React.FC<{
  displayPeak?: number | null;
  displayWeeks?: number | null;
  renderedCountAtOne?: number | null;
  showPeakCount: boolean;
  scaleSize: (s: 'xs'|'sm'|'md'|'lg'|'xl') => 'xs'|'sm'|'md'|'lg'|'xl';
  theme: any;
}> = ({ displayPeak, displayWeeks, renderedCountAtOne, showPeakCount, scaleSize, theme }) => (
  <Box
    mr="sm"
    style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gridAutoRows: 'min-content',
      columnGap: 6,
      rowGap: 0,
      alignItems: 'center',
      minWidth: 96,
      maxWidth: 96,
      flex: '0 0 96px',
      fontSize: theme.fontSizes[scaleSize('xl')]
    }}
  >
    <Text size={scaleSize('xs')} tt="uppercase" style={{ lineHeight: 1, letterSpacing: 0.5, textAlign: 'right' }}>{t('charts.peak')}</Text>
    <Flex align="center" gap={6} style={{ justifySelf: 'start' }}>
      <Text fw={600} size={scaleSize('xl')} className={displayPeak === 1 ? 'peak' : undefined} style={{ transition: 'color 120ms ease', textAlign: 'left', lineHeight: 1.2 }}>
        {displayPeak != null ? displayPeak : <span style={{ opacity: 0, display: 'inline-block', minWidth: 10 }}>0</span>}
      </Text>
      {showPeakCount && displayPeak === 1 && renderedCountAtOne != null && (
        <Text c="dimmed" size={scaleSize('xs')} style={{ lineHeight: 1 }}>{`${renderedCountAtOne}x`}</Text>
      )}
    </Flex>
    <Text size={scaleSize('xs')} tt="uppercase" style={{ lineHeight: 1, letterSpacing: 0.5, textAlign: 'right' }}>{t('charts.weeks')}</Text>
    <Text fw={600} size={scaleSize('sm')} style={{ transition: 'color 120ms ease', textAlign: 'left', lineHeight: 1.2 }}>
      {displayWeeks != null ? displayWeeks : <span style={{ opacity: 0, display: 'inline-block', minWidth: 10 }}>0</span>}
    </Text>
  </Box>
);

export const PeakCellList: React.FC<{
  display?: number | null;
  renderedCountAtOne?: number | null;
  showPeakCount: boolean;
  scaleSize: (s: 'xs'|'sm'|'md'|'lg'|'xl') => 'xs'|'sm'|'md'|'lg'|'xl';
  rank?: number;
}> = ({ display, renderedCountAtOne, showPeakCount, scaleSize, rank }) => (
  <Flex direction="column" align="center" mr="sm" style={{ minWidth: 48, maxWidth: 48, flex: '0 0 48px' }}>
    <Text fw={600} size={scaleSize('xl')} className={display === 1 ? 'peak' : undefined} style={{ transition: 'color 120ms ease' }}>
      {display != null ? display : <span style={{ opacity: 0, display: 'inline-block', minWidth: 10 }}>0</span>}
    </Text>
    {showPeakCount && display === 1 && renderedCountAtOne != null ? (
      <Text c="dimmed" mt={2} style={{ lineHeight: 1, letterSpacing: 0.5, fontSize: '0.6em' }}>{`${renderedCountAtOne}x`}</Text>
    ) : (rank === 1 ? (
      <Text c="dimmed" mt={2} tt="uppercase" style={{ lineHeight: 1, letterSpacing: 0.5, fontSize: '0.6em' }}>{t('charts.peak')}</Text>
    ) : null)}
  </Flex>
);

export const WeeksCellList: React.FC<{
  display?: number | null;
  rank?: number;
  scaleSize: (s: 'xs'|'sm'|'md'|'lg'|'xl') => 'xs'|'sm'|'md'|'lg'|'xl';
}> = ({ display, rank, scaleSize }) => (
  <Flex direction="column" align="center" mr="sm" style={{ minWidth: 48, maxWidth: 48, flex: '0 0 48px' }}>
    <Text fw={600} size={scaleSize('xl')} style={{ transition: 'color 120ms ease' }}>
      {display != null ? display : <span style={{ opacity: 0, display: 'inline-block', minWidth: 10 }}>0</span>}
    </Text>
    {rank === 1 && (
      <Text c="dimmed" mt={2} tt="uppercase" style={{ lineHeight: 1, letterSpacing: 0.5, fontSize: '0.6em' }}>
        {t('charts.weeks')}
      </Text>
    )}
  </Flex>
);

export const AltVariationCellList: React.FC<{
  value: string | number | false | null | undefined;
  cfg: any;
}> = ({ value, cfg }) => {
  const normalized = (value || value === 0) ? (value === '-' ? undefined : value) : undefined;
  let nextCfg: any = cfg;
  if (cfg?.iconPosition === 'split') {
    nextCfg = { ...cfg, iconPosition: 'split', splitTall: cfg.splitTall !== false };
  } else if (cfg?.iconPosition === 'hidden') {
    nextCfg = { ...cfg, iconPosition: 'hidden', splitTall: false };
  } else {
    nextCfg = { ...cfg, splitTall: false };
  }
  return (
    <DeltaBadge delta={normalized} cfg={nextCfg} kind="rank" textSize="md" columnContext noSidePadding contextView="list" />
  );
};

export const AltPlaysVariationCellList: React.FC<{
  row: ChartData;
  cfg: any;
  playsVariationDisplay: 'absolute' | 'percent' | 'hidden';
  showFormulaInsteadOfPlays?: boolean;
  chart?: any;
  chartType?: string;
}> = ({ row, cfg, playsVariationDisplay, showFormulaInsteadOfPlays, chart, chartType }) => {
  const metrics = showFormulaInsteadOfPlays && chart ? computeWeeklyFormulaMetrics({
    chart,
    chartType: chartType || 'album',
    rank: row.rank,
    plays: row.plays,
    deltaRank: row.deltaRank,
    deltaPlays: row.deltaPlays,
  }) : null;
  const deltaValue = showFormulaInsteadOfPlays && metrics
    ? (metrics.delta !== undefined && metrics.delta !== null ? metrics.delta : row.deltaPlays)
    : row.deltaPlays;
  const currentValue = showFormulaInsteadOfPlays && metrics && typeof metrics.currentValue === 'number'
    ? metrics.currentValue
    : (typeof row.plays === 'number' ? row.plays : undefined);
  const computePercentOverride = showFormulaInsteadOfPlays && metrics && metrics.previousValue
    ? (deltaNumeric: number) => {
        const prev = metrics.previousValue as number;
        if (!prev) return null;
        const percent = (deltaNumeric / prev) * 100;
        return `${deltaNumeric > 0 ? '+' : ''}${percent.toFixed(0)}%`;
      }
    : undefined;
  const labelOverride = showFormulaInsteadOfPlays && typeof deltaValue === 'number' && deltaValue !== 0 && playsVariationDisplay !== 'percent'
    ? formatCompactNumber(deltaValue)
    : undefined;
  const treatAsHiddenForWidth = cfg.hideLabel && cfg.iconPosition === 'before';
  const isCompact = cfg.iconPosition === 'hidden' || treatAsHiddenForWidth;
  const widthOverride = !isCompact ? 65 : 50;
  return (
    <DeltaBadge
      delta={deltaValue}
      cfg={cfg}
      kind="plays"
      textSize="sm"
      columnContext
      noSidePadding
      contextView="list"
      showPercent={playsVariationDisplay === 'percent'}
      currentValue={typeof currentValue === 'number' ? currentValue : undefined}
      fixedWidthOverride={widthOverride}
      computePercent={computePercentOverride}
      labelOverride={labelOverride}
    />
  );
};

export const CertCellList: React.FC<{
  row: ChartData;
  chart: any;
  type: 'album' | 'track';
  stats: any;
  fontSize: string;
  loading?: boolean;
}> = ({ row, chart, type, stats, fontSize, loading }) => (
  <Flex direction="column" align="center" mr="sm" style={{ minWidth: 48, maxWidth: 48, flex: '0 0 48px' }}>
    {(type === 'album' || type === 'track') && (stats
      ? <CertificationIcon
          key={`cert-${row.entityId}-${chart?.lastfm_username || 'nouser'}`}
          chart={chart || {}}
          chartType={type}
          totals={stats?.totals}
          entity={{ name: row.name, artistName: row.artistName || '' }}
          entityId={row.entityId}
          username={chart?.lastfm_username}
          size={24}
          deferMs={450}
        />
      : <Text fw={600} style={{ fontSize }}>{loading ? '…' : '-'}</Text>)}
  </Flex>
);
