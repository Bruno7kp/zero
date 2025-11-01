import React from 'react';
import { ResponsiveBar } from '@nivo/bar';
import type { BarDatum } from '@nivo/bar';
import { Text, useMantineTheme, useComputedColorScheme } from '@mantine/core';
import { getColorForName } from '../../utils/colorHash';

type MiniSparkItem = BarDatum & {
  week: string;
  value: number;
  imageUrl?: string;
  subtitle?: string;
  barColor?: string;
};

interface MiniSparklineProps {
  items: Array<{
    id: string;
    value: number;
    imageUrl?: string;
    subtitle?: string;
    colorKey?: string;
  }>;
  color?: string;
  height?: number;
  onBarClick?: (itemId: string) => void;
  tooltipTitle?: string;
}

const MiniNumberOneBars: React.FC<MiniSparklineProps> = ({
  items,
  color,
  height = 140,
  onBarClick,
  tooltipTitle,
}) => {
  const theme = useMantineTheme();
  const colorScheme = useComputedColorScheme('dark');
  const isDark = colorScheme === 'dark';
  const chartColor = color || theme.colors.blue[5];

  const data = React.useMemo<MiniSparkItem[]>(
    () =>
      items.map(item => ({
        week: item.id,
        value: item.value,
        imageUrl: item.imageUrl ?? '',
        subtitle: item.subtitle ?? '',
        barColor: color || getColorForName(item.colorKey || item.subtitle || item.id),
      })),
    [items, color]
  );

  const imageLayer = React.useCallback((props: any) => {
    const { bars } = props;
    return (
      <g>
        {bars.map((bar: any) => {
          const datum = bar.data.data as MiniSparkItem;
          const imageSize = Math.min(36, bar.width - 4);
          if (!datum.imageUrl || imageSize <= 12) return null;
          return (
            <image
              key={bar.key}
              href={datum.imageUrl}
              x={bar.x + bar.width / 2 - imageSize / 2}
              y={bar.y - imageSize - 6}
              width={imageSize}
              height={imageSize}
              preserveAspectRatio="xMidYMid slice"
              style={{ pointerEvents: 'none' }}
            />
          );
        })}
      </g>
    );
  }, []);

  if (!data.length) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label={tooltipTitle}
      >
        <Text size="xs" c="dimmed">
          {tooltipTitle || '—'}
        </Text>
      </div>
    );
  }

  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveBar
        data={data}
        keys={['value']}
        indexBy="week"
        margin={{ top: 52, right: 12, bottom: 12, left: 12 }}
        padding={0.35}
        layout="vertical"
        colors={({ data: datum }) => (datum as MiniSparkItem).barColor || chartColor}
        enableGridX={false}
        enableGridY={false}
        axisBottom={null}
        axisLeft={null}
        enableLabel={false}
        borderRadius={6}
        layers={['grid', 'axes', 'bars', imageLayer, 'legends']}
        onClick={bar => {
          if (onBarClick) {
            const target = (bar.data as MiniSparkItem).week;
            onBarClick(String(target));
          }
        }}
        tooltip={({ indexValue, formattedValue, data: datum }) => (
          <div
            style={{
              background: isDark ? theme.colors.dark[6] : theme.white,
              color: isDark ? theme.white : theme.black,
              padding: '6px 10px',
              borderRadius: 6,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
              minWidth: 160,
            }}
          >
            <Text size="xs" fw={600}>
              {String(indexValue).replace(/-/g, '.')}
            </Text>
            {datum.subtitle && <Text size="xs">{datum.subtitle}</Text>}
            <Text size="xs">{formattedValue}</Text>
          </div>
        )}
        role="img"
        ariaLabel={tooltipTitle || 'mini-bar-chart-number-ones'}
        animate
        motionConfig="gentle"
      />
    </div>
  );
};

export default MiniNumberOneBars;
