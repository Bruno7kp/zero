import React from 'react';
import { Divider, Flex, rem, ThemeIcon, Title } from '@mantine/core';
import { IconPlaylist } from '@tabler/icons-react';

type Props = { pageTitle: string };

const CreateHeader: React.FC<Props> = ({ pageTitle }) => {
  return (
    <Flex direction="column" p="xs" gap="sm">
      <Flex justify="center" align="center" gap="sm">
        <Title order={2} fw={600} style={{ display: 'flex', alignItems: 'center', gap: rem(8) }}>
          <ThemeIcon variant="light" size="md">
            <IconPlaylist style={{ width: rem(20), height: rem(20) }} />
          </ThemeIcon>
          {pageTitle}
        </Title>
      </Flex>
      <Divider variant="solid" size="sm" my="md" />
    </Flex>
  );
};

export default CreateHeader;
