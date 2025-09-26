import React from 'react';
import { Paper, Group, Text, Box, Stack } from '@mantine/core';
import { ChartRun } from './ChartRun';

export interface ChartItemStatsProps {
  stats: any;
  highlightWeek?: string;
}

export const ChartItemStats: React.FC<ChartItemStatsProps> = ({ stats, highlightWeek }) => {
  // Defensive: handle both old and new stats shape
  const totals = stats.totals || {};
  const sequences = stats.sequences || {};
  const peak = stats.peak || {};
  // Try to get chartRun from stats.chartRun or stats.run or stats.chart_run
  const chartRun = stats.chartRun || stats.run || stats.chart_run || [];
  return (
    <Paper p="md" radius={0}>
      <Group justify="space-between" mb="md">
        <StatBox label="Top 1" value={sequences.rank1 ?? 0} />
        <StatBox label="Top 5" value={totals.top5 ?? 0} />
        <StatBox label="Top 10" value={totals.top10 ?? 0} />
        <StatBox label="Semanas" value={totals.withinCutoff ?? 0} />
        <StatBox label="Peak" value={peak.position ?? '-'} sub={peak.position !== undefined ? `(${peak.weeksAtPeak ?? 0}w)` : undefined} />
      </Group>
      <Box mt="md">
        <Text fw={600} mb={4}>Chart Run</Text>
        <ChartRun run={chartRun} highlightWeek={highlightWeek} />
      </Box>
    </Paper>
  );
};

interface StatBoxProps {
  label: string;
  value: number;
  sub?: string;
}

const StatBox: React.FC<StatBoxProps> = ({ label, value, sub }) => (
  <Stack gap={0} align="center" style={{ minWidth: 60 }}>
    <Text fw={700} size="lg">{value}</Text>
    <Text size="xs" color="dimmed">{label}</Text>
    {sub && <Text size="xs" color="blue.7">{sub}</Text>}
  </Stack>
);
