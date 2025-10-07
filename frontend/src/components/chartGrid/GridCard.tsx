import React from 'react';
import { Card, Text, Badge, Box, ActionIcon, Group, useMantineTheme, useMantineColorScheme } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import type { ChartData } from '../../db/indexedDb';
import { SpotifyImageWithModal } from '../SpotifyImageWithModal';
import { formatNumber } from '../../utils/format';

export interface GridCardProps {
  row: ChartData;
  type: 'artist' | 'album' | 'track';
  clientId: string;
  clientSecret: string;
  rankVariationLocation: 'under' | 'corner' | 'hidden' | 'column';
  showImage: boolean;
  showPeak: boolean;
  showPlays: boolean;
  showTotalWeeks: boolean;
  scaleSize: (s: 'xs'|'sm'|'md'|'lg'|'xl') => 'xs'|'sm'|'md'|'lg'|'xl';
  onOpenModal: (row: ChartData) => void;
  imageForceUpdate: number | undefined;
  lastImageUrl?: string | null;
  onImageChange: () => void;
  onImageLoad: (url: string) => void;
  // Variation under-rank rendering (precomputed from ChartWeekGrid for consistency with badge style rules)
  renderUnderRankVariation: (deltaValue: any) => React.ReactNode;
  // Optional corner overlay
  cornerOverlay?: React.ReactNode;
  // Stats area
  stats: {
    peak?: { position?: number | null; weeksAtPeak?: number | null } | null;
    totals?: { withinCutoff?: number | null } | null;
  } | undefined;
  showPeakCount: boolean;
}

export const GridCard: React.FC<GridCardProps> = ({
  row,
  type,
  clientId,
  clientSecret,
  rankVariationLocation,
  showImage,
  showPeak,
  showPlays,
  showTotalWeeks,
  scaleSize,
  onOpenModal,
  imageForceUpdate,
  lastImageUrl,
  onImageChange,
  onImageLoad,
  renderUnderRankVariation,
  cornerOverlay,
  stats,
  showPeakCount,
}) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const deltaValue = (row as any).deltaRank;
  const deltaColor = (() => {
    if (deltaValue === 'NEW') return 'lazuli';
    if (deltaValue === 'RE') return 'bee';
    if (typeof deltaValue === 'number') {
      if (deltaValue > 0) return 'grass';
      if (deltaValue < 0) return 'cherry';
      return 'gray';
    }
    return 'gray';
  })();

  return (
    <Card shadow="sm" radius="md" p={0} style={{ height: '100%', display: 'flex', flexDirection: 'column', background: colorScheme === 'dark' ? theme.colors.dark[7] : 'white' }}>
      <Box style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: 'transparent', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start' }}>
        {rankVariationLocation === 'corner' && cornerOverlay}
        <ActionIcon
          size="sm"
          variant="filled"
          color="gray"
          style={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}
          onClick={() => onOpenModal(row)}
        >
          <IconPlus size={16} />
        </ActionIcon>
        <Badge
          color={row.rank === 1 ? 'lazuli' : deltaColor}
          size="xl"
          variant="filled"
          py="xl"
          px="xs"
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            zIndex: 2,
            fontWeight: 800,
            fontSize: 32,
            minWidth: 40,
            borderTopRightRadius: 12,
            borderTopLeftRadius: 0,
            borderBottomRightRadius: 0,
            borderBottomLeftRadius: 0,
          }}
        >
          <Box component="span" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
            <span>{row.rank}</span>
            {rankVariationLocation === 'under' ? renderUnderRankVariation(deltaValue) : null}
          </Box>
        </Badge>
        {showImage && (
          <SpotifyImageWithModal
            entityId={row.entityId}
            name={row.name}
            artistName={row.artistName}
            type={type}
            clientId={clientId}
            clientSecret={clientSecret}
            forceUpdate={imageForceUpdate}
            width={'100%'}
            height={'100%'}
            style={{ aspectRatio: '1/1', minHeight: 0, minWidth: 0 }}
            lastImageUrl={lastImageUrl}
            onImageChange={onImageChange}
            onImageLoad={onImageLoad}
          />
        )}
      </Box>
      <Box px="sm" py={8} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 64 }}>
        <Text fw={700} size={scaleSize('md')} lineClamp={2} style={{ width: '100%', textAlign: 'center' }}>{row.name}</Text>
        {row.artistName && <Text size={scaleSize('sm')} c="dimmed" lineClamp={1} style={{ width: '100%', textAlign: 'center' }}>{row.artistName}</Text>}
      </Box>
      {(showPlays || showPeak || showTotalWeeks) && (
        <Group px="sm" pb="sm" style={{ minHeight: 36, width: '100%', justifyContent: 'space-between', gap: 4, display: 'flex' }}>
          {showPeak && (
            <Box style={{ textAlign: 'center', flex: 1 }}>
              <Text size={scaleSize('xs')} c="dimmed">Peak</Text>
              {(() => {
                const display = stats?.peak?.position ?? undefined;
                const hasStats = !!stats;
                const liveCount = stats?.peak?.weeksAtPeak;
                const renderedCountAtOne = display === 1
                  ? (hasStats ? Math.max(1, (liveCount as number) ?? 1) : 1)
                  : null;
                return (
                  <Text fw={700} size={scaleSize('sm')} c={display === 1 ? 'blue' : undefined} style={{ transition: 'color 120ms ease' }}>
                    {display != null ? display : <span style={{ opacity: 0, display: 'inline-block', minWidth: 10 }}>0</span>}
                    {showPeakCount && display === 1 && renderedCountAtOne != null && (
                      <span
                        style={{
                          marginLeft: 6,
                          fontWeight: 500,
                          fontSize: '0.75em',
                        }}
                      >
                        {`${renderedCountAtOne}`}x
                      </span>
                    )}
                  </Text>
                );
              })()}
            </Box>
          )}
          {showPlays && (
            <Box style={{ textAlign: 'center', flex: 1 }}>
              <Text size={scaleSize('xs')} c="dimmed">Plays</Text>
              <Text fw={700} size={scaleSize('sm')}>{formatNumber(row.plays as any)}</Text>
            </Box>
          )}
          {showTotalWeeks && (
            <Box style={{ textAlign: 'center', flex: 1 }}>
              <Text size={scaleSize('xs')} c="dimmed">Weeks</Text>
              {(() => {
                const display = stats?.totals?.withinCutoff ?? undefined;
                return (
                  <Text fw={700} size={scaleSize('sm')} style={{ transition: 'color 120ms ease' }}>
                    {display != null ? display : <span style={{ opacity: 0, display: 'inline-block', minWidth: 10 }}>0</span>}
                  </Text>
                );
              })()}
            </Box>
          )}
        </Group>
      )}
    </Card>
  );
};

export default GridCard;
