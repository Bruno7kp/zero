import React from 'react';
import { Divider, Flex, rem, ThemeIcon, Title, ActionIcon, Tooltip } from '@mantine/core';
import { IconPlaylist, IconMenu2, IconSettings } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { t } from 'i18next';

type Props = {
  pageTitle: string;
  icon?: typeof IconPlaylist;
  onDrawerToggle?: () => void;
  showDrawerToggle?: boolean;
  drawerToggleLabel?: string;
  isSidebarVisible?: boolean;
};

const CreateHeader: React.FC<Props> = ({
  pageTitle,
  icon: CustomIcon,
  onDrawerToggle,
  showDrawerToggle = true,
  drawerToggleLabel = 'Toggle menu',
  isSidebarVisible = true,
}) => {
  const IconComponent = CustomIcon || IconPlaylist;
  const canShowToggle = Boolean(onDrawerToggle) && showDrawerToggle;
  const toggleOffset = isSidebarVisible ? rem(11) : 0;

  return (
    <Flex direction="column" py="xs" gap="sm">
      <Flex justify="center" align="center" gap="sm" pos="relative">
        {/* Drawer toggle button - positioned at far left */}
        {canShowToggle && (
          <Tooltip label={drawerToggleLabel} withArrow>
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={onDrawerToggle}
              aria-label={drawerToggleLabel}
              pos="absolute"
              left={toggleOffset}
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

        <Tooltip label={t('settings.title')} withArrow>
          <ActionIcon
            variant="subtle"
            size="lg"
            component={Link}
            to="/settings"
            pos="absolute"
            right={toggleOffset}
            visibleFrom="md"
          >
            <IconSettings size={20} />
          </ActionIcon>
        </Tooltip>
      </Flex>
      <Divider variant="solid" size="sm" my="md" />
    </Flex>
  );
};

export default CreateHeader;
