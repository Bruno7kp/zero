import React from 'react';
import { Flex, Text } from '@mantine/core';
import type { ChartData } from '../../db/indexedDb';
import { DeltaBadge } from '../DeltaBadge';
import { CertificationIcon } from '../CertificationIcon';

export const RankCell: React.FC<{
  row: ChartData;
  showDeltaBadge: boolean;
  badgeStylesRank: any;
  scaleSize: (s: 'xs'|'sm'|'md'|'lg'|'xl') => 'xs'|'sm'|'md'|'lg'|'xl';
}> = ({ row, showDeltaBadge, badgeStylesRank, scaleSize }) => (
  <Flex direction="column" align="center">
    <Text fw={row.rank === 1 ? 700 : 600} size={scaleSize('lg')} c={row.rank === 1 ? 'blue' : undefined}>{row.rank}</Text>
    {showDeltaBadge && (
      <DeltaBadge delta={row.deltaRank} cfg={badgeStylesRank} kind="rank" textSize="xs" columnContext contextView="table" />
    )}
  </Flex>
);

export const PlaysCell: React.FC<{
  row: ChartData;
  showDeltaPlaysBadge: boolean;
  showDeltaPercentPlaysBadge: boolean;
  playsVariationLocation: 'hidden' | 'under' | 'column';
  badgeStylesPlays: any;
  scaleSize: (s: 'xs'|'sm'|'md'|'lg'|'xl') => 'xs'|'sm'|'md'|'lg'|'xl';
}> = ({ row, showDeltaPlaysBadge, showDeltaPercentPlaysBadge, playsVariationLocation, badgeStylesPlays, scaleSize }) => {
  const showUnder = playsVariationLocation === 'under' && (showDeltaPlaysBadge || showDeltaPercentPlaysBadge);
  return (
    <Flex direction="column" align="center">
      <Text fw={600} size={scaleSize('md')}>{row.plays}</Text>
      {showUnder && (
        <DeltaBadge delta={row.deltaPlays} cfg={badgeStylesPlays} kind="plays" showPercent={showDeltaPercentPlaysBadge} currentValue={row.plays} textSize="xs" columnContext contextView="table" />
      )}
    </Flex>
  );
};

export const PeakCell: React.FC<{
  stats: any;
  lastPeak: number | null | undefined;
  lastWeeksAtPeak: number | null | undefined;
  showPeakCount: boolean;
  scaleSize: (s: 'xs'|'sm'|'md'|'lg'|'xl') => 'xs'|'sm'|'md'|'lg'|'xl';
}> = ({ stats, lastPeak, lastWeeksAtPeak, showPeakCount, scaleSize }) => {
  const current = stats?.peak?.position;
  const display = (current != null) ? current : (lastPeak != null ? lastPeak : undefined);
  const hasStats = !!stats;
  const liveCount = stats?.peak?.weeksAtPeak;
  const rawCountAtOne = (liveCount != null ? liveCount : lastWeeksAtPeak);
  const renderedCountAtOne = display === 1 ? (hasStats ? Math.max(1, (rawCountAtOne as number) ?? 1) : 1) : null;
  return (
    <Flex direction="column" align="center">
      <Text fw={display === 1 ? 700 : 500} size={scaleSize('md')} c={display === 1 ? 'blue' : undefined} style={{ transition: 'color 120ms ease' }}>
        {display != null ? display : <span style={{ opacity: 0, display: 'inline-block', minWidth: 10 }}>0</span>}
      </Text>
      {showPeakCount && display === 1 && renderedCountAtOne != null && (
        <Text c="dimmed" style={{ lineHeight: 1, marginTop: 2, fontSize: '0.8em' }}>{`${renderedCountAtOne}x`}</Text>
      )}
    </Flex>
  );
};

export const WeeksCell: React.FC<{
  stats: any;
  lastWeeks: number | null | undefined;
  scaleSize: (s: 'xs'|'sm'|'md'|'lg'|'xl') => 'xs'|'sm'|'md'|'lg'|'xl';
}> = ({ stats, lastWeeks, scaleSize }) => {
  const current = stats?.totals?.withinCutoff;
  const display = (current != null) ? current : (lastWeeks != null ? lastWeeks : undefined);
  return (
    <Flex direction="column" align="center">
      <Text fw={500} size={scaleSize('md')} style={{ transition: 'color 120ms ease' }}>
        {display != null ? display : <span style={{ opacity: 0, display: 'inline-block', minWidth: 10 }}>0</span>}
      </Text>
    </Flex>
  );
};

export const AltVariationCell: React.FC<{
  row: ChartData;
  index: number;
  badgeStylesRank: any;
  altVariation?: (row: ChartData, index: number) => string | number | false | null | undefined;
}> = ({ row, index, badgeStylesRank, altVariation }) => {
  const rawVal: any = altVariation ? altVariation(row, index) : undefined;
  const value: any = (rawVal || rawVal === 0) ? (rawVal === '-' ? undefined : rawVal) : undefined;
  let cfg: any = badgeStylesRank;
  if (badgeStylesRank.iconPosition === 'split') {
    cfg = { ...badgeStylesRank, iconPosition: 'split', splitTall: badgeStylesRank.splitTall !== false };
  } else if (badgeStylesRank.iconPosition === 'hidden') {
    cfg = { ...badgeStylesRank, iconPosition: 'hidden', splitTall: false };
  } else {
    cfg = { ...badgeStylesRank, splitTall: false };
  }
  return (
    <Flex justify="center" align="center" style={{ width: '100%' }}>
      <DeltaBadge delta={value} cfg={cfg} kind="rank" textSize="md" columnContext noSidePadding contextView="table" />
    </Flex>
  );
};

export const AltPlaysVariationCell: React.FC<{
  row: ChartData;
  badgeStylesPlays: any;
  playsVariationDisplay: 'absolute' | 'percent' | 'hidden';
}> = ({ row, badgeStylesPlays, playsVariationDisplay }) => {
  const treatAsHiddenForWidth = badgeStylesPlays.hideLabel && badgeStylesPlays.iconPosition === 'before';
  const isCompact = badgeStylesPlays.iconPosition === 'hidden' || treatAsHiddenForWidth;
  const widthOverride = isCompact ? 50 : 65;
  return (
    <Flex justify="center" align="center" style={{ width: '100%' }}>
      <DeltaBadge
        delta={row.deltaPlays}
        cfg={badgeStylesPlays}
        kind="plays"
        textSize="md"
        columnContext
        noSidePadding
        contextView="table"
        showPercent={playsVariationDisplay === 'percent'}
        currentValue={row.plays}
        fixedWidthOverride={widthOverride}
      />
    </Flex>
  );
};

export const CertCell: React.FC<{
  row: ChartData;
  chart: any;
  type: 'album' | 'track';
  stats: any;
  scaleSize: (s: 'xs'|'sm'|'md'|'lg'|'xl') => 'xs'|'sm'|'md'|'lg'|'xl';
}> = ({ row, chart, type, stats, scaleSize }) => (
  <Flex direction="column" align="center">
    {stats ? (
      <CertificationIcon
        key={`cert-${row.entityId}-${chart?.lastfm_username || 'nouser'}`}
        chart={chart}
        chartType={type}
        totals={stats?.totals}
        entity={{ name: row.name, artistName: row.artistName || '' }}
        entityId={row.entityId}
        username={chart?.lastfm_username}
        size={24}
        deferMs={300}
      />
    ) : (
      <Text fw={700} size={scaleSize('xl')}>-</Text>
    )}
  </Flex>
);
