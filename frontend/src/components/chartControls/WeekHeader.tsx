import React from 'react';
import { Title, Text, Grid } from '@mantine/core';
import dayjs from 'dayjs';

interface WeekHeaderProps {
  inputValue: Date;
  topLabel: string;
}

export const WeekHeader: React.FC<WeekHeaderProps> = ({ inputValue, topLabel }) => {
  const start = dayjs(inputValue);
  const end = start.add(6, 'day');
  return (
    <Grid.Col span={12} ta="center">
      <Title order={2}>{topLabel}</Title>
      <Text fw={600} size="sm">{`${start.format('YYYY.MM.DD')} - ${end.format('YYYY.MM.DD')}`}</Text>
    </Grid.Col>
  );
};

export default WeekHeader;
