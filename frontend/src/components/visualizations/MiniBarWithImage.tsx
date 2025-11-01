import React from 'react';
import { ResponsiveBar } from '@nivo/bar';
import type { BarDatum } from '@nivo/bar';
import { useMantineTheme, Text, useComputedColorScheme } from '@mantine/core';
import { getColorForName } from '../../utils/colorHash';

type MiniBarItem = BarDatum & {
  entity: string;
  value: number;
  imageUrl: string;
  subtitle: string;
  barColor?: string;
};

interface MiniBarWithImageProps {
  items: Array<{
    id: string;
    value: number;
    imageUrl?: string;
    subtitle?: string;
    colorKey?: string;
  }>;
  height?: number;
  onBarClick?: (itemId: string) => void;
  color?: string;
}

const MiniBarWithImage: React.FC<MiniBarWithImageProps> = ({
  items,
  height = 120,
  onBarClick,
  color,
}) => {
  const theme = useMantineTheme();
  const colorScheme = useComputedColorScheme('dark');
  const isDark = colorScheme === 'dark';
  const chartColor = color || theme.colors.blue[5];

  const data = React.useMemo<MiniBarItem[]>(
    () =>
      items.map(item => ({
        entity: item.id,
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
          const datum = bar.data.data as MiniBarItem;
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
      >
        —
      </div>
    );
  }

  return (
    <div style={{ height, width: '100%' }}>
      <ResponsiveBar
        data={data}
        keys={['value']}
        indexBy="entity"
        margin={{ top: 48, right: 12, bottom: 24, left: 12 }}
        padding={0.3}
        layout="vertical"
        colors={({ data: datum }) => (datum as MiniBarItem).barColor || chartColor}
        enableGridX={false}
        enableGridY={false}
        axisBottom={null}
        axisLeft={null}
        enableLabel={false}
        borderRadius={6}
        layers={['grid', 'axes', 'bars', imageLayer, 'legends']}
        onClick={datum => {
          if (onBarClick) {
            const target = (datum.data as MiniBarItem).entity;
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
              {String(indexValue)}
            </Text>
            {datum.subtitle && <Text size="xs">{datum.subtitle}</Text>}
            <Text size="xs">{formattedValue}</Text>
          </div>
        )}
        role="img"
        ariaLabel="mini-bar-chart"
        animate
        motionConfig="gentle"
      />
    </div>
  );
};

export default MiniBarWithImage;
