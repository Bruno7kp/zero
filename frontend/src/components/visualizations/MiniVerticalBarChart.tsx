import React from 'react';
import { ResponsiveBar } from '@nivo/bar';
import type { BarDatum } from '@nivo/bar';
import { Text, useMantineTheme, useComputedColorScheme } from '@mantine/core';
import { getColorForName } from '../../utils/colorHash';

type VerticalBarItem = BarDatum & {
  entity: string;
  value: number;
  subtitle?: string;
  barColor?: string;
};

interface MiniVerticalBarChartProps {
  items: Array<{
    id: string;
    value: number;
    subtitle?: string;
    colorKey?: string;
  }>;
  height?: number;
  onBarClick?: (itemId: string) => void;
  color?: string;
  valueLabel?: string;
}

const MiniVerticalBarChart: React.FC<MiniVerticalBarChartProps> = ({
  items,
  height = 160,
  onBarClick,
  color,
  valueLabel,
}) => {
  const theme = useMantineTheme();
  const colorScheme = useComputedColorScheme('dark');
  const isDark = colorScheme === 'dark';
  const chartColor = color || theme.colors.blue[5];

  const data = React.useMemo<VerticalBarItem[]>(
    () =>
      items.map(item => ({
        entity: item.id,
        value: item.value,
        subtitle: item.subtitle ?? '',
        barColor: color || getColorForName(item.colorKey || item.subtitle || item.id),
      })),
    [items, color]
  );

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
        margin={{ top: 12, right: 12, bottom: 32, left: 48 }}
        padding={0.3}
        layout="vertical"
        colors={({ data: datum }) => (datum as VerticalBarItem).barColor || chartColor}
        enableGridX={false}
        enableGridY={true}
        gridYValues={5}
        axisBottom={{
          tickSize: 0,
          tickPadding: 8,
          format: (value: string) => {
            const maxLen = 12;
            return value.length > maxLen ? value.substring(0, maxLen) + '...' : value;
          },
        }}
        axisLeft={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: 0,
        }}
        enableLabel={false}
        borderRadius={6}
        onClick={datum => {
          if (onBarClick) {
            const target = (datum.data as VerticalBarItem).entity;
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
            <Text size="xs">
              {formattedValue} {valueLabel || ''}
            </Text>
          </div>
        )}
        role="img"
        ariaLabel="mini-vertical-bar-chart"
        animate
        motionConfig="gentle"
      />
    </div>
  );
};

export default MiniVerticalBarChart;
