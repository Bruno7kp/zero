// Canonical implementation for mini Nivo bar charts with optional images.
import React from 'react';
import { ResponsiveBar } from '@nivo/bar';
import type { BarDatum, BarCustomLayer } from '@nivo/bar';
import { Text, useMantineTheme, useComputedColorScheme } from '@mantine/core';
import { getColorForName } from '../../utils/colorHash';

type MiniBarItem = BarDatum & {
  entity: string;
  value: number;
  imageUrl?: string;
  subtitle?: string;
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
  layout?: 'vertical' | 'horizontal';
  showImages?: boolean;
}

const MiniBarWithImage: React.FC<MiniBarWithImageProps> = ({
  items,
  height = 120,
  onBarClick,
  color,
  layout = 'vertical',
  showImages = true,
}) => {
  const theme = useMantineTheme();
  const colorScheme = useComputedColorScheme('dark');
  const isDark = colorScheme === 'dark';
  const chartColor = color || theme.colors.blue[5];

  const isHorizontal = layout === 'horizontal';

  const data = React.useMemo<MiniBarItem[]>(() => {
    const ordered = isHorizontal ? [...items].reverse() : items;
    return ordered.map(i => ({
      entity: i.id,
      value: i.value,
      imageUrl: i.imageUrl ?? '',
      subtitle: i.subtitle ?? '',
      barColor: color || getColorForName(i.colorKey || i.subtitle || i.id),
    }));
  }, [items, color, isHorizontal]);

  // Increase image size to 36 per design request
  const IMAGE_SIZE = 36;

  const effectiveHeight = React.useMemo(() => {
    if (isHorizontal) {
      const minRowSpacing = IMAGE_SIZE + 12;
      const computed = items.length ? items.length * minRowSpacing + 36 : height;
      return Math.max(height, computed);
    }
    return height;
  }, [height, isHorizontal, items.length]);

  const imageLayer = React.useCallback<BarCustomLayer<MiniBarItem>>(
    ({ bars }) => {
      if (!showImages) return null;
      return (
        <g>
          {bars.map(bar => {
            const datum = bar.data.data as MiniBarItem;
            if (!datum.imageUrl) return null;
            const imageSize = Math.min(IMAGE_SIZE, isHorizontal ? bar.height - 4 : bar.width - 4);
            if (imageSize <= 12) return null;

            const x = isHorizontal ? bar.x + bar.width + 8 : bar.x + bar.width / 2 - imageSize / 2;
            const y = isHorizontal ? bar.y + bar.height / 2 - imageSize / 2 : bar.y - imageSize - 6;

            return (
              <image
                key={`${bar.key}-img`}
                href={datum.imageUrl}
                x={x}
                y={y}
                width={imageSize}
                height={imageSize}
                preserveAspectRatio="xMidYMid slice"
                style={{ pointerEvents: 'none' }}
              />
            );
          })}
        </g>
      );
    },
    [isHorizontal, showImages]
  );

  // For horizontal layouts we need more right margin for the image; however 160px
  // was making the chart area much smaller. Use a smaller right margin so bars
  // can occupy more width while still showing the image to the right.
  const margin = isHorizontal
    ? { top: 12, right: IMAGE_SIZE + 56, bottom: 12, left: 12 }
    : { top: 48, right: 12, bottom: 24, left: 12 };

  return (
    <div style={{ height: effectiveHeight, width: '100%' }}>
      <ResponsiveBar
        data={data}
        keys={['value']}
        indexBy="entity"
        margin={margin}
        padding={0.3}
        layout={layout}
        colors={({ data: datum }) => (datum as MiniBarItem).barColor || chartColor}
        enableGridX={false}
        enableGridY={false}
        axisBottom={null}
        axisLeft={null}
        enableLabel={false}
        borderRadius={6}
        layers={['grid', 'axes', 'bars', imageLayer as any]}
        onClick={d => {
          if (onBarClick) {
            const target = (d.data as MiniBarItem).entity;
            onBarClick(String(target));
          }
        }}
        tooltip={({ indexValue, formattedValue, data: datum }) => {
          const typed = datum as MiniBarItem;
          return (
            <div
              style={{
                background: isDark ? theme.colors.dark[6] : theme.white,
                color: isDark ? theme.white : theme.black,
                padding: '6px 10px',
                borderRadius: 6,
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                minWidth: 160,
              }}
            >
              <Text size="xs" fw={600}>
                {String(indexValue)}
              </Text>
              {typed.subtitle && <Text size="xs">{typed.subtitle}</Text>}
              <Text size="xs">{formattedValue}</Text>
            </div>
          );
        }}
        role="img"
        ariaLabel="mini-bar-chart"
        animate
        motionConfig="gentle"
      />
    </div>
  );
};

export default MiniBarWithImage;
