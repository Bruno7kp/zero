import React from 'react';
import { Card, Divider, Grid, Text } from '@mantine/core';
import { formatNumber } from '../utils/format';

type GridSpan =
  | number
  | {
      base?: number;
      sm?: number;
      md?: number;
      lg?: number;
      xl?: number;
    };

export interface StatsBoxProps {
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
  span?: GridSpan;
  format?: 'auto' | 'number' | 'plain';
  valueClassName?: string;
}

export const StatsBox: React.FC<StatsBoxProps> = ({
  label,
  value,
  sub,
  color,
  span,
  format = 'auto',
  valueClassName,
}) => {
  const shouldFormatNumber =
    format === 'number' ||
    (format === 'auto' && typeof value === 'number' && Number.isFinite(value));

  const displayValue =
    shouldFormatNumber && typeof value === 'number' ? formatNumber(value) : value;

  return (
    <Grid.Col span={span ?? { base: 6, sm: 3, md: 2 }}>
      <Card p="sm" withBorder style={{ textAlign: 'center' }}>
        <Text fw={600} tt="uppercase" size="xs" ta="center">
          {label}
        </Text>
        <Divider my="xs" variant="dashed" size="sm" />
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 4 }}>
          <Text fw={600} size="xl" c={color} className={valueClassName} style={{ lineHeight: 1 }}>
            {displayValue}
          </Text>
          {sub && (
            <Text size="xs" c="dimmed" style={{ lineHeight: 1 }}>
              {sub}
            </Text>
          )}
        </div>
      </Card>
    </Grid.Col>
  );
};
