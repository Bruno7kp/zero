import React from 'react';
import { ResponsiveBar } from '@nivo/bar';
import type { BarCustomLayer, BarDatum, BarLayer } from '@nivo/bar';
import { Text, useMantineTheme, useComputedColorScheme } from '@mantine/core';
import { getColorForName } from '../../utils/colorHash';

type VerticalBarItem = BarDatum & {
  entity: string;
  label: string;
  value: number;
  subtitle?: string;
  barColor?: string;
  imageUrl?: string;
};

interface MiniVerticalBarChartProps {
  items: Array<{
    id: string;
    label?: string;
    value: number;
    subtitle?: string;
    colorKey?: string;
    imageUrl?: string;
  }>;
  height?: number;
  onBarClick?: (itemId: string) => void;
  color?: string;
  valueLabel?: string;
  layout?: 'vertical' | 'horizontal';
  showImages?: boolean;
  imageSize?: number;
  showAxisLabels?: boolean;
  showColorLegend?: boolean;
}

const MiniVerticalBarChart: React.FC<MiniVerticalBarChartProps> = ({
  items,
  height = 160,
  onBarClick,
  color,
  valueLabel,
  layout = 'vertical',
  showImages = false,
  imageSize = 32,
  showAxisLabels = true,
  showColorLegend = false,
}) => {
  const theme = useMantineTheme();
  const colorScheme = useComputedColorScheme('dark');
  const isDark = colorScheme === 'dark';
  const chartColor = color || theme.colors.blue[5];
  const isHorizontal = layout === 'horizontal';

  const effectiveHeight = React.useMemo(() => {
    if (isHorizontal) {
      const minRowSpacing = imageSize + 12;
      const computed = items.length ? items.length * minRowSpacing + 32 : height;
      return Math.max(height, computed);
    }
    return height;
  }, [height, imageSize, isHorizontal, items.length]);

  const orderedItems = React.useMemo(
    () => (isHorizontal ? [...items].reverse() : items),
    [items, isHorizontal]
  );

  const data = React.useMemo<VerticalBarItem[]>(
    () =>
      orderedItems.map(item => {
        const label = item.label ?? item.id;
        return {
          entity: item.id,
          label,
          value: item.value,
          subtitle: item.subtitle ?? '',
          barColor: color || getColorForName(item.colorKey || item.subtitle || label),
          imageUrl: item.imageUrl ?? '',
        };
      }),
    [orderedItems, color]
  );

  const textColor = isDark ? theme.colors.gray[2] : theme.colors.dark[7] ?? theme.colors.gray[7];
  const gridColor = isDark ? theme.colors.dark[4] : theme.colors.gray[3];

  const nivoTheme = React.useMemo(
    () => ({
      textColor,
      axis: {
        domain: {
          line: {
            stroke: gridColor,
            strokeWidth: 1,
          },
        },
        ticks: {
          line: {
            stroke: gridColor,
            strokeWidth: 1,
          },
          text: {
            fill: textColor,
            fontSize: 12,
            fontWeight: 500,
          },
        },
        legend: {
          text: {
            fill: textColor,
            fontSize: 12,
          },
        },
      },
      grid: {
        line: {
          stroke: gridColor,
          strokeWidth: 1,
          strokeDasharray: '4 4',
        },
      },
      tooltip: {
        container: {
          background: isDark ? theme.colors.dark[6] : theme.white,
          color: isDark ? theme.white : theme.black,
        },
      },
    }),
    [gridColor, isDark, textColor, theme.black, theme.colors.dark, theme.white]
  );

  const labelMap = React.useMemo(() => {
    const map = new Map<string, string>();
    data.forEach(item => {
      map.set(item.entity, item.label);
    });
    return map;
  }, [data]);

  const axisLabelFormatter = React.useCallback(
    (value: string) => {
      const label = labelMap.get(value) ?? value;
      const maxLen = isHorizontal ? 24 : 12;
      return label.length > maxLen ? `${label.substring(0, maxLen)}...` : label;
    },
    [isHorizontal, labelMap]
  );

  const imageLayer = React.useCallback<BarCustomLayer<VerticalBarItem>>(
    ({ bars }) => {
      if (!showImages || !isHorizontal) {
        return null;
      }

      return (
        <g>
          {bars.map(bar => {
            const datum = bar.data.data as VerticalBarItem;
            if (!datum.imageUrl) {
              return null;
            }

            const imageX = bar.x + bar.width + 8;
            const imageY = bar.y + bar.height / 2 - imageSize / 2;

            return (
              <image
                key={`${bar.key}-thumb`}
                href={datum.imageUrl}
                x={imageX}
                y={imageY}
                width={imageSize}
                height={imageSize}
                preserveAspectRatio="xMidYMid slice"
                style={{ borderRadius: 6 }}
              />
            );
          })}
        </g>
      );
    },
    [imageSize, isHorizontal, showImages]
  );

  const layers = React.useMemo<BarLayer<VerticalBarItem>[]>(() => {
    if (showImages) {
      return ['grid', 'axes', imageLayer, 'bars', 'markers', 'legends'];
    }
    return ['grid', 'axes', 'bars', 'markers', 'legends'];
  }, [imageLayer, showImages]);

  if (!data.length) {
    return (
      <div
        style={{
          height: effectiveHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        —
      </div>
    );
  }

  const legendItems = data.map((datum, index) => ({
    key: `${datum.entity}-${index}`,
    label: datum.label,
    color: datum.barColor || chartColor,
  }));

  const horizontalLeftMargin = !isHorizontal
    ? 48
    : showAxisLabels
    ? showImages
      ? imageSize + 140
      : 120
    : 16;

  const rightMargin = showImages ? imageSize + 24 : 20;

  const axisLeftConfig = showAxisLabels
    ? {
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        format: axisLabelFormatter,
      }
    : null;

  return (
    <>
      <div style={{ height: effectiveHeight, width: '100%' }}>
        <ResponsiveBar
          data={data}
          keys={['value']}
          indexBy="entity"
          margin={
            isHorizontal
              ? {
                  top: 12,
                  right: rightMargin,
                  bottom: 48,
                  left: horizontalLeftMargin,
                }
              : { top: 12, right: 24, bottom: 48, left: 48 }
          }
          padding={0.35}
          layout={layout}
          colors={({ data: datum }) => (datum as VerticalBarItem).barColor || chartColor}
          enableGridX={isHorizontal}
          enableGridY={!isHorizontal}
          gridXValues={isHorizontal ? 5 : undefined}
          gridYValues={!isHorizontal ? 5 : undefined}
          axisBottom={{
            tickSize: 0,
            tickPadding: 8,
            legend: isHorizontal && valueLabel ? valueLabel : undefined,
            legendOffset: isHorizontal && valueLabel ? 36 : 0,
            format: (rawValue: string | number) => {
              if (isHorizontal) {
                return String(rawValue);
              }
              return axisLabelFormatter(String(rawValue));
            },
          }}
          axisLeft={axisLeftConfig as any}
          enableLabel={false}
          borderRadius={6}
          onClick={datum => {
            if (onBarClick) {
              const target = (datum.data as VerticalBarItem).entity;
              onBarClick(String(target));
            }
          }}
          theme={nivoTheme}
          tooltip={({ indexValue, formattedValue, data: datum }) => {
            const typedDatum = datum as VerticalBarItem;
            const displayLabel = labelMap.get(String(indexValue)) ?? typedDatum.label;
            return (
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
                  {displayLabel}
                </Text>
                {typedDatum.subtitle && <Text size="xs">{typedDatum.subtitle}</Text>}
                <Text size="xs">
                  {formattedValue} {valueLabel || ''}
                </Text>
              </div>
            );
          }}
          role="img"
          ariaLabel="mini-vertical-bar-chart"
          animate
          motionConfig="gentle"
          layers={layers}
        />
      </div>
      {showColorLegend && legendItems.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            marginTop: 12,
          }}
        >
          {legendItems.map(item => (
            <div key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 999,
                  background: item.color,
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.15)',
                }}
              />
              <Text size="xs" style={{ color: textColor }}>
                {item.label}
              </Text>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default MiniVerticalBarChart;
