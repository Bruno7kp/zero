import React from 'react';
import {
  Card,
  Text,
  Badge,
  Box,
  ActionIcon,
  Group,
  useMantineTheme,
  useMantineColorScheme,
} from '@mantine/core';
import { useSelector } from 'react-redux';
import {
  getCardBackgroundByMode,
  getSecondaryCardBackgroundByMode,
  type ThemeMode,
} from '../../theme/modes';
import { IconPlus } from '@tabler/icons-react';
import type { ChartData } from '../../db/indexedDb';
import { SpotifyImageWithModal } from '../SpotifyImageWithModal';
import { formatNumber } from '../../utils/format';
import { t } from 'i18next';
import type { BadgeStyleConfig } from '../../store/badgeStylesSlice';

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
  scaleSize: (s: 'xs' | 'sm' | 'md' | 'lg' | 'xl') => 'xs' | 'sm' | 'md' | 'lg' | 'xl';
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
  stats:
    | {
        peak?: { position?: number | null; weeksAtPeak?: number | null } | null;
        totals?: { withinCutoff?: number | null } | null;
      }
    | undefined;
  showPeakCount: boolean;
  isDropped?: boolean;
  badgeStylesRank: BadgeStyleConfig;
  showFormulaInsteadOfPlays?: boolean;
  formulaValue?: number;
  formulaName?: string;
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
  isDropped = false,
  badgeStylesRank,
  showFormulaInsteadOfPlays,
  formulaValue,
  formulaName,
}) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const themeMode = useSelector((s: any) => (s.theme?.value as ThemeMode) || 'dark');
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

  const getFrostedBackground = () => {
    const isDark = colorScheme === 'dark';
    return isDark ? 'rgba(0, 0, 0, 0.18)' : 'rgba(0, 0, 0, 0.18)';
  };

  // Dropped items styling: smaller sizes and transparent background
  const droppedScaleSize = (
    s: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  ): 'xs' | 'sm' | 'md' | 'lg' | 'xl' => {
    if (!isDropped) return scaleSize(s);
    const sizeMap: Record<string, 'xs' | 'sm' | 'md' | 'lg' | 'xl'> = {
      xl: 'md',
      lg: 'sm',
      md: 'xs',
      sm: 'xs',
      xs: 'xs',
    };
    return sizeMap[scaleSize(s)];
  };

  const cardBackground = isDropped
    ? getSecondaryCardBackgroundByMode(theme, themeMode)
    : getCardBackgroundByMode(theme, themeMode);
  const rankBadgeSize = isDropped ? 'lg' : 'xl';
  const rankBadgeFontSize = isDropped ? 24 : 32;
  const rankBadgeMinWidth = isDropped ? 32 : 40;
  const isTransparentRankBadge = badgeStylesRank.variant === 'transparent';
  const rankBadgeVariant = isTransparentRankBadge
    ? 'filled'
    : badgeStylesRank.variant === 'outline'
    ? 'outline'
    : badgeStylesRank.variant;
  const frostedBackground = getFrostedBackground();
  const rankBadgeColor = row.rank === 1 ? 'lazuli' : deltaColor;
  const opacity = isDropped ? 0 : 1;

  return (
    <Card
      shadow="sm"
      radius="md"
      p={0}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: cardBackground,
      }}
    >
      <Box
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1/1',
          background: 'transparent',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'flex-start',
        }}
      >
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
          color={rankBadgeColor}
          size={rankBadgeSize}
          variant={rankBadgeVariant as any}
          py="xl"
          px="xs"
          style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            zIndex: 2,
            fontWeight: 800,
            fontSize: rankBadgeFontSize,
            minWidth: rankBadgeMinWidth,
            borderTopRightRadius: 12,
            borderTopLeftRadius: 0,
            borderBottomRightRadius: 0,
            borderBottomLeftRadius: 0,
            ...(isTransparentRankBadge
              ? {
                  background: frostedBackground,
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  color: theme.white,
                  '@supports not (backdropFilter: blur(8px))': {
                    background: frostedBackground.replace(/0\.\d+\)$/, '0.95)'),
                  },
                }
              : {
                  backdropFilter: undefined,
                  WebkitBackdropFilter: undefined,
                }),
          }}
        >
          <Box
            component="span"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              lineHeight: 1,
            }}
          >
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
            opacity={opacity}
          />
        )}
      </Box>
      <Box
        px="sm"
        py={8}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 64,
        }}
      >
        <Text
          fw={600}
          size={droppedScaleSize('md')}
          className="entity-name"
          lineClamp={2}
          style={{ width: '100%', textAlign: 'center' }}
        >
          {row.name}
        </Text>
        {row.artistName && (
          <Text
            size={droppedScaleSize('sm')}
            c="dimmed"
            lineClamp={1}
            style={{ width: '100%', textAlign: 'center' }}
          >
            {row.artistName}
          </Text>
        )}
      </Box>
      {(showPlays || showPeak || showTotalWeeks) && (
        <Group
          px="sm"
          pb="sm"
          style={{
            minHeight: 36,
            width: '100%',
            justifyContent: 'space-between',
            gap: 4,
            display: 'flex',
          }}
        >
          {showPeak && (
            <Box style={{ textAlign: 'center', flex: 1 }}>
              <Text size={droppedScaleSize('xs')} c="dimmed">
                {t('charts.peak')}
              </Text>
              {(() => {
                const display = stats?.peak?.position ?? undefined;
                const hasStats = !!stats;
                const liveCount = stats?.peak?.weeksAtPeak;
                const renderedCountAtOne =
                  display === 1 ? (hasStats ? Math.max(1, (liveCount as number) ?? 1) : 1) : null;
                return (
                  <Text
                    fw={600}
                    size={droppedScaleSize('sm')}
                    className={display === 1 ? 'peak' : undefined}
                    style={{ transition: 'color 120ms ease' }}
                  >
                    {display != null ? (
                      display
                    ) : (
                      <span style={{ opacity: 0, display: 'inline-block', minWidth: 10 }}>0</span>
                    )}
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
              <Text size={droppedScaleSize('xs')} tt="capitalize" c="dimmed">
                {showFormulaInsteadOfPlays && formulaName ? formulaName : 'Plays'}
              </Text>
              <Text fw={600} size={droppedScaleSize('sm')}>
                {formatNumber(
                  (showFormulaInsteadOfPlays && formulaValue != null
                    ? Math.floor(formulaValue)
                    : row.plays) as any
                )}
              </Text>
            </Box>
          )}
          {showTotalWeeks && (
            <Box style={{ textAlign: 'center', flex: 1 }}>
              <Text size={droppedScaleSize('xs')} c="dimmed">
                {t('charts.weeks')}
              </Text>
              {(() => {
                const display = stats?.totals?.withinCutoff ?? undefined;
                return (
                  <Text
                    fw={600}
                    size={droppedScaleSize('sm')}
                    style={{ transition: 'color 120ms ease' }}
                  >
                    {display != null ? (
                      display
                    ) : (
                      <span style={{ opacity: 0, display: 'inline-block', minWidth: 10 }}>0</span>
                    )}
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
