import React from 'react';
import { Divider, Flex, rem, ThemeIcon, Title } from '@mantine/core';
import { IconPlaylist } from '@tabler/icons-react';
import type { Icon } from '@tabler/icons-react';

type Props = {
  pageTitle: string;
  icon?: React.ForwardRefExoticComponent<Omit<Icon, 'ref'> & React.RefAttributes<Icon>>;
};

const CreateHeader: React.FC<Props> = ({ pageTitle, icon: CustomIcon }) => {
  const IconComponent = CustomIcon || IconPlaylist;

  return (
    <Flex direction="column" p="xs" gap="sm">
      <Flex justify="center" align="center" gap="sm">
        <Title order={2} fw={600} style={{ display: 'flex', alignItems: 'center', gap: rem(8) }}>
          <ThemeIcon variant="light" size="md">
            <IconComponent style={{ width: rem(20), height: rem(20) }} />
          </ThemeIcon>
          {pageTitle}
        </Title>
      </Flex>
      <Divider variant="solid" size="sm" my="md" />
    </Flex>
  );
};

export default CreateHeader;
