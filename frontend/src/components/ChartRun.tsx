import React from 'react';
import { Box, Group, Text } from '@mantine/core';

export interface ChartRunProps {
  run: Array<{ week: string; position: number; plays: number }>;
  highlightWeek?: string;
}

export const ChartRun: React.FC<ChartRunProps> = ({ run, highlightWeek }) => {
  return (
    <Group gap={4} wrap="nowrap">
      {run.map((point) => (
        <Box
          key={point.week}
          style={(theme: any) => ({
            border: point.week === highlightWeek ? `2px solid ${theme.colors.blue[6]}` : '1px solid #ccc',
            borderRadius: 4,
            padding: 4,
            minWidth: 32,
            background: point.week === highlightWeek ? theme.colors.blue[0] : '#f8f9fa',
            textAlign: 'center',
          })}
        >
          <Text size="xs" fw={700}>{point.position}</Text>
          <Text size="10px" color="dimmed">{point.plays}</Text>
        </Box>
      ))}
    </Group>
  );
};
