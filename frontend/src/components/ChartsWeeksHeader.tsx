import React from 'react';
import { Title, ThemeIcon, rem, Flex } from '@mantine/core';
import { IconListNumbers } from '@tabler/icons-react';

interface ChartsWeeksHeaderProps {
  title: string;
}

export const ChartsWeeksHeader: React.FC<ChartsWeeksHeaderProps> = ({ title }) => {
  return (
    <Flex justify="center" align="center" gap="sm">
      <Title order={2} style={{ display: 'flex', alignItems: 'center', gap: rem(8) }}>
        <ThemeIcon variant="light" size="md">
          <IconListNumbers style={{ width: rem(20), height: rem(20) }} />
        </ThemeIcon>
        {title}
      </Title>
    </Flex>
  );
};

export default ChartsWeeksHeader;
