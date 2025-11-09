import React, { useMemo } from 'react';
import { Box, Text, Tooltip, useMantineColorScheme, useMantineTheme, rgba } from '@mantine/core';
import dayjs from 'dayjs';
import type { EntityChartRunPoint } from './EntityChartRun';
import { useTranslation } from 'react-i18next';

interface EntityWaffleRunProps {
  data: EntityChartRunPoint[];
  rows?: number;
  columns?: number;
  cutoff?: number;
}

type WaffleCell = {
  key: string;
  point: EntityChartRunPoint;
  color: string;
  out: boolean;
};

const hexToRgb = (hex: string) => {
  const normalized = hex.replace('#', '');
  const expanded = normalized.length === 3 ? normalized.repeat(2) : normalized;
  const bigint = parseInt(expanded, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
};

const ensureHex = (candidate: string | undefined, fallback: string) =>
  candidate && candidate.trim().startsWith('#') ? candidate : fallback;

const interpolateColor = (color1: string, color2: string, factor: number) => {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const clamped = Math.max(0, Math.min(1, factor));
  const r = Math.round(c1.r + (c2.r - c1.r) * clamped);
  const g = Math.round(c1.g + (c2.g - c1.g) * clamped);
  const b = Math.round(c1.b + (c2.b - c1.b) * clamped);
  return `rgb(${r}, ${g}, ${b})`;
};

const getRankColor = (rank: number | null, maxRank: number, mode: 'light' | 'dark') => {
  const lightPalette = {
    background: '#ebedf0',
    low: '#9be9a8',
    mid: '#40c463',
    high: '#30a14e',
    top: '#216e39',
  } as const;

  const darkPalette = {
    background: '#161b22',
    low: '#0e4429',
    mid: '#006d32',
    high: '#26a641',
    top: '#39d353',
  } as const;

  const palette = mode === 'dark' ? darkPalette : lightPalette;

  if (rank == null || rank <= 0) {
    return palette.background;
  }

  if (rank === 1) {
    return palette.top;
  }

  if (maxRank <= 1) {
    return palette.high;
  }

  const t = Math.min(1, Math.max(0, (maxRank - rank) / (maxRank - 1)));

  if (t > 0.66) {
    return palette.high;
  }

  if (t > 0.33) {
    return interpolateColor(palette.low, palette.mid, (t - 0.33) / 0.33);
  }

  return interpolateColor(palette.background, palette.low, t / 0.33);
};

const EntityWaffleRun: React.FC<EntityWaffleRunProps> = ({
  data,
  rows: _rows = 10,
  columns: _columns = 10,
  cutoff,
}) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const { t } = useTranslation();
  const cellSize = 10;
  const tooltipBg =
    colorScheme === 'dark'
      ? rgba(theme.colors.dark?.[7] ?? '#141517', 0.92)
      : rgba(theme.white ?? '#ffffff', 0.95);
  const tooltipColor =
    colorScheme === 'dark'
      ? theme.colors.gray?.[2] ?? '#e9ecef'
      : theme.colors.dark?.[7] ?? '#212529';

  const cells = useMemo<WaffleCell[]>(() => {
    if (!data?.length) return [];

    const ordered = [...data].sort((a, b) => dayjs(a.week).valueOf() - dayjs(b.week).valueOf());

    const numericPositions = ordered
      .map(point => point.position)
      .filter((value): value is number => typeof value === 'number' && value > 0);

    const maxRank = cutoff ?? (numericPositions.length ? Math.max(...numericPositions) : 100);
    const safeMaxRank = Math.max(maxRank, 1);

    const outsideColor =
      colorScheme === 'dark'
        ? ensureHex(theme.colors.gray?.[8], '#343a40')
        : ensureHex(theme.colors.gray?.[3], '#dee2e6');

    return ordered.map(point => {
      if (point.position == null) {
        return { key: point.week, point, color: outsideColor, out: true };
      }

      const tileColor = getRankColor(
        point.position,
        safeMaxRank,
        colorScheme === 'dark' ? 'dark' : 'light'
      );
      return { key: point.week, point, color: tileColor, out: false };
    });
  }, [cutoff, data, colorScheme, theme.colors.gray]);

  if (cells.length === 0) {
    return (
      <Box ta="center" c="dimmed" py="md">
        <Text size="sm">—</Text>
      </Box>
    );
  }

  return (
    <Box
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(0, ${cellSize}px))`,
        gap: 3,
        justifyContent: 'center',
        width: '100%',
        maxWidth: '100%',
        padding: 4,
      }}
    >
      {cells.map(cell => {
        const tooltipLabel = (
          <Box>
            <Text size="xs" fw={600} c={tooltipColor}>
              {cell.out
                ? t('library.detail.waffleTooltip.outTitle')
                : t('library.detail.waffleTooltip.positionTitle', {
                    position: cell.point.position,
                  })}
            </Text>
            <Text size="10px" c={tooltipColor}>
              {dayjs(cell.point.week).format('DD/MM/YYYY')}
            </Text>
            {cell.out ? (
              <Text size="10px" c={tooltipColor}>
                {t('library.detail.waffleTooltip.outDescription')}
              </Text>
            ) : (
              <Text size="10px" c={tooltipColor}>
                {t('library.detail.waffleTooltip.plays', {
                  plays: cell.point.plays.toLocaleString(),
                })}
              </Text>
            )}
          </Box>
        );

        return (
          <Tooltip
            key={cell.key}
            label={tooltipLabel}
            withinPortal
            withArrow
            styles={{
              tooltip: {
                backgroundColor: tooltipBg,
                color: tooltipColor,
              },
            }}
          >
            <Box
              style={{
                width: '100%',
                aspectRatio: '1 / 1',
                minWidth: cellSize,
                borderRadius: theme.radius.xs,
                backgroundColor: cell.color,
                border: `1px solid ${
                  colorScheme === 'dark' ? theme.colors.dark[7] : theme.colors.gray[4]
                }`,
              }}
            />
          </Tooltip>
        );
      })}
    </Box>
  );
};

export default EntityWaffleRun;
