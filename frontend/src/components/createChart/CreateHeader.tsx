import React from 'react';
import { Divider, Flex, rem, ThemeIcon, Title, ActionIcon, Tooltip } from '@mantine/core';
import { IconPlaylist, IconMenu2 } from '@tabler/icons-react';
import type { Icon } from '@tabler/icons-react';

type Props = {
  pageTitle: string;
  icon?: React.ForwardRefExoticComponent<Omit<Icon, 'ref'> & React.RefAttributes<Icon>>;
  onDrawerToggle?: () => void;
  showDrawerToggle?: boolean;
  drawerToggleLabel?: string;
};

const CreateHeader: React.FC<Props> = ({ 
  pageTitle, 
  icon: CustomIcon,
  onDrawerToggle,
  showDrawerToggle = false,
  drawerToggleLabel = 'Toggle menu'
}) => {
  const IconComponent = CustomIcon || IconPlaylist;

  return (
    <Flex direction="column" p="xs" gap="sm">
      <Flex justify="center" align="center" gap="sm" pos="relative">
        {/* Drawer toggle button - positioned at far left */}
        {showDrawerToggle && onDrawerToggle && (
          <Tooltip label={drawerToggleLabel} withArrow>
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={onDrawerToggle}
              aria-label={drawerToggleLabel}
              style={{ position: 'absolute', left: 0 }}
              hiddenFrom="base"
              visibleFrom="md"
            >
              <IconMenu2 size={20} />
            </ActionIcon>
          </Tooltip>
        )}
        
        {/* Centered title */}
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
