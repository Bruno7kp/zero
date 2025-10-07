import React from 'react';
import { Flex, rem, ThemeIcon, Title } from '@mantine/core';
import { IconFlame } from '@tabler/icons-react';

type Props = { title: string };

const LiveTitle: React.FC<Props> = ({ title }) => (
  <Flex justify="center" align="center" gap="sm">
    <Title order={2} style={{ display: 'flex', alignItems: 'center', gap: rem(8) }}>
      <ThemeIcon variant="light" color="red" size="md">
        <IconFlame style={{ width: rem(20), height: rem(20) }} />
      </ThemeIcon>
      {title}
    </Title>
  </Flex>
);

export default LiveTitle;
