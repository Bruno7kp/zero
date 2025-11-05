import React, { useMemo } from 'react';
import type { MantineColor } from '@mantine/core';
import {
  alpha,
  Box,
  ScrollArea,
  Stack,
  Text,
  useMantineColorScheme,
  useMantineTheme,
} from '@mantine/core';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ReferenceLine,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import type { TooltipProps } from 'recharts';

export interface EntityChartRunPoint {
  week: string;
  position: number | null;
  plays: number;
}

interface EntityChartRunProps {
  data: EntityChartRunPoint[];
  cutoff?: number | null;
  color?: MantineColor | string;
  colorKey?: string;
  height?: number;
  legendLabel?: string;
}

const MIN_WIDTH = 600;
const POINT_WIDTH = 28;
const COLOR_PALETTE: MantineColor[] = [
  'blue',
  'grape',
  'violet',
  'teal',
  'cyan',
  'indigo',
  'lime',
  'orange',
  'pink',
  'red',
  'green',
  'yellow',
];

const clampShade = (value: number) => Math.min(Math.max(Math.round(value), 0), 9);

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
};

const isCssColor = (value: string) =>
  value.startsWith('#') ||
  value.startsWith('rgb') ||
  value.startsWith('hsl') ||
  value.startsWith('var(');

const EntityChartRun: React.FC<EntityChartRunProps> = ({
  data,
  cutoff,
  color,
  colorKey,
  height = 380,
  legendLabel,
}) => {
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();
  const { t } = useTranslation();
  const fallbackPalette = theme.primaryColor || 'blue';
  const fallbackToken = `${fallbackPalette}.6` as MantineColor;

  const resolveColor = (value: MantineColor | string, fallbackShade = 6) => {
    const token = String(value);
    if (isCssColor(token)) return token;
    const [name, shadeToken] = token.split('.');
    const palette = theme.colors[name as keyof typeof theme.colors];
    const rawShade = Number.isFinite(Number(shadeToken)) ? Number(shadeToken) : fallbackShade;
    const shade = clampShade(rawShade);
    if (palette) {
      return palette[shade] ?? palette[palette.length - 1] ?? token;
    }
    const fallback = theme.colors[fallbackPalette as keyof typeof theme.colors];
    if (fallback) {
      return fallback[shade] ?? fallback[fallback.length - 1] ?? token;
    }
    return token;
  };

  const selectedColorToken = useMemo(() => {
    if (color) {
      const token = String(color);
      if (isCssColor(token)) return token;
      return token.includes('.') ? token : `${token}.6`;
    }
    if (colorKey) {
      const hash = Math.abs(hashString(colorKey));
      const palette = COLOR_PALETTE[hash % COLOR_PALETTE.length] ?? fallbackPalette;
      return `${palette}.6`;
    }
    return fallbackToken;
  }, [color, colorKey, fallbackPalette, fallbackToken]);

  const paletteMeta = useMemo(() => {
    if (isCssColor(selectedColorToken)) {
      return { name: fallbackPalette, shade: 6 };
    }
    const [name, shadeToken] = String(selectedColorToken).split('.');
    return {
      name: name || fallbackPalette,
      shade: clampShade(Number.isFinite(Number(shadeToken)) ? Number(shadeToken) : 6),
    };
  }, [selectedColorToken, fallbackPalette]);

  const chartSeriesColor = useMemo(() => {
    if (isCssColor(selectedColorToken)) {
      return `${paletteMeta.name}.${paletteMeta.shade}` as MantineColor;
    }
    return selectedColorToken as MantineColor;
  }, [paletteMeta.name, paletteMeta.shade, selectedColorToken]);

  const chartData = useMemo(
    () =>
      data.map(point => ({
        week: point.week,
        rank: point.position ?? null,
        plays: point.plays,
      })),
    [data]
  );

  const effectiveCutoff = Math.max(1, cutoff || 100);
  const numericRanks = chartData.filter(point => typeof point.rank === 'number') as Array<{
    week: string;
    rank: number;
    plays: number;
  }>;
  const maxRankFromData = numericRanks.length
    ? Math.max(...numericRanks.map(point => point.rank))
    : effectiveCutoff;
  const domainMax = Math.max(effectiveCutoff, maxRankFromData, 1);
  const minWidth = Math.max(chartData.length * POINT_WIDTH, MIN_WIDTH);
  const resolvedLineColor = resolveColor(chartSeriesColor, paletteMeta.shade);
  const regularDotFill = alpha(resolvedLineColor, 0.35);
  const regularDotOutline = resolveColor(
    `${paletteMeta.name}.${clampShade(paletteMeta.shade + 1)}`,
    paletteMeta.shade + 1
  );
  const peakRingColor = resolveColor(
    `${paletteMeta.name}.${clampShade(paletteMeta.shade - 2)}`,
    paletteMeta.shade - 2
  );
  const gradientId = useMemo(() => {
    const seed = colorKey || color || 'chart-run-gradient';
    return `entity-chart-run-${Math.abs(hashString(String(seed)))}`;
  }, [color, colorKey]);

  const renderDot = (props: any) => {
    const rank = props?.payload?.rank as number | null | undefined;
    if (rank == null || props?.cx == null || props?.cy == null) return null;
    if (rank === 1) {
      return (
        <g>
          <circle
            cx={props.cx}
            cy={props.cy}
            r={6}
            fill={resolvedLineColor}
            stroke={peakRingColor}
            strokeWidth={3}
          />
          <circle cx={props.cx} cy={props.cy} r={2.6} fill={theme.white} stroke="none" />
        </g>
      );
    }
    return (
      <circle
        cx={props.cx}
        cy={props.cy}
        r={3.5}
        fill={regularDotFill}
        stroke={regularDotOutline}
        strokeWidth={1.5}
      />
    );
  };

  const renderTooltip = (props: TooltipProps<number, string>) => {
    const { active, payload, label } = props as any;
    if (!active || !payload || payload.length === 0) return null;
    const item = payload[0]?.payload as
      | { week: string; rank: number | null; plays: number }
      | undefined;
    if (!item) return null;
    const rankLabel = item.rank != null ? `#${item.rank}` : t('charts.rankLabel');
    const playsLabel = Number.isFinite(item.plays)
      ? `${item.plays.toLocaleString()} ${t('charts.plays')}`
      : t('charts.plays');

    const tooltipBackground =
      colorScheme === 'dark' ? alpha(theme.colors.dark[7], 0.92) : theme.colors.gray[0];
    const tooltipColor = colorScheme === 'dark' ? theme.colors.gray[2] : theme.colors.dark[7];

    return (
      <Box
        px="sm"
        py={6}
        style={{
          background: tooltipBackground,
          color: tooltipColor,
          borderRadius: theme.radius.md,
          boxShadow: theme.shadows.sm,
        }}
      >
        <Stack gap={4}>
          <Text size="xs" c="dimmed">
            {label}
          </Text>
          <Text size="sm" fw={600}>
            {rankLabel}
          </Text>
          <Text size="xs" c="dimmed">
            {playsLabel}
          </Text>
        </Stack>
      </Box>
    );
  };

  if (!chartData.length) return null;

  const gridColor = alpha(
    colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[4],
    colorScheme === 'dark' ? 0.45 : 0.65
  );
  const axisColor = colorScheme === 'dark' ? theme.colors.gray[3] : theme.colors.dark[4];

  return (
    <ScrollArea type="auto" offsetScrollbars>
      <Box style={{ height, minWidth }}>
        <Text size="sm" fw={600} c={axisColor} mb={6}>
          {legendLabel || t('charts.rank')}
        </Text>
        <ResponsiveContainer width="100%" height={height - 20}>
          <ComposedChart data={chartData} margin={{ top: 16, right: 12, bottom: 12, left: 12 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor={resolvedLineColor} stopOpacity={0} />
                <stop
                  offset="55%"
                  stopColor={resolvedLineColor}
                  stopOpacity={colorScheme === 'dark' ? 0.25 : 0.15}
                />
                <stop
                  offset="100%"
                  stopColor={resolvedLineColor}
                  stopOpacity={colorScheme === 'dark' ? 0.7 : 0.45}
                />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="4 4" stroke={gridColor} vertical={false} />

            <XAxis
              dataKey="week"
              tick={{ fill: axisColor, fontSize: 11 }}
              interval="preserveStartEnd"
              minTickGap={32}
            />

            <YAxis
              yAxisId={0}
              domain={[1, domainMax]}
              reversed
              tickFormatter={value => `#${value}`}
              tick={{ fill: axisColor, fontSize: 11 }}
              width={46}
              allowDecimals={false}
            />

            <RechartsTooltip content={renderTooltip as any} wrapperStyle={{ outline: 'none' }} />
            <ReferenceLine y={1} stroke={alpha(resolvedLineColor, 0.35)} strokeDasharray="3 3" />

            {/* Gradiente de fundo, desenhado mesmo com nulls */}
            <Area
              yAxisId={0}
              type="monotone"
              dataKey="rank"
              stroke="none"
              fill={`url(#${gradientId})`}
              baseValue={domainMax}
              connectNulls={false}
              isAnimationActive={false}
            />

            {/* Linha com buracos visuais */}
            <Line
              yAxisId={0}
              type="monotone"
              dataKey="rank"
              stroke={resolvedLineColor}
              strokeWidth={2}
              dot={renderDot as any}
              activeDot={{ r: 6, strokeWidth: 0 }}
              connectNulls={false} // mantém as pausas
            />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </ScrollArea>
  );
};

export default EntityChartRun;
