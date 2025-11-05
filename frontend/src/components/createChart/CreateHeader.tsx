import React, { type ReactNode } from 'react';
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
  leftSection?: ReactNode;
  showSettings?: boolean;
};

const CreateHeader: React.FC<Props> = ({
  pageTitle,
  icon: CustomIcon,
  onDrawerToggle,
  showDrawerToggle = true,
  drawerToggleLabel = 'Toggle menu',
  isSidebarVisible = true,
  leftSection,
  showSettings = true,
}) => {
  const IconComponent = CustomIcon || IconPlaylist;
  const canShowToggle = Boolean(onDrawerToggle) && showDrawerToggle;
  const lateralPadding = canShowToggle ? rem(isSidebarVisible ? 12 : 0) : undefined;

  return (
    <Flex direction="column" py="xs" gap="sm">
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto 1fr',
          alignItems: 'center',
          columnGap: rem(12),
        }}
      >
        <Flex
          align="center"
          gap="xs"
          style={{
            justifySelf: 'start',
            justifyContent: 'flex-start',
            minWidth: 0,
            paddingLeft: lateralPadding,
          }}
        >
          {canShowToggle && (
            <Tooltip label={drawerToggleLabel} withArrow>
              <ActionIcon
                variant="subtle"
                size="lg"
                onClick={onDrawerToggle}
                aria-label={drawerToggleLabel}
                visibleFrom="md"
              >
                <IconMenu2 size={20} />
              </ActionIcon>
            </Tooltip>
          )}
          {leftSection}
        </Flex>

        <Flex justify="center" align="center" style={{ justifySelf: 'center', minWidth: 0 }}>
          <Title order={2} fw={600} style={{ display: 'flex', alignItems: 'center', gap: rem(8) }}>
            <ThemeIcon variant="light" size="md">
              <IconComponent style={{ width: rem(20), height: rem(20) }} />
            </ThemeIcon>
            {pageTitle}
          </Title>
        </Flex>

        <Flex
          align="center"
          justify="flex-end"
          style={{ justifySelf: 'end', minWidth: 0, paddingRight: lateralPadding }}
        >
          {showSettings && (
            <Tooltip label={t('settings.title')} withArrow>
              <ActionIcon
                variant="subtle"
                size="lg"
                component={Link}
                to="/settings"
                visibleFrom="md"
                aria-label={t('settings.title')}
              >
                <IconSettings size={20} />
              </ActionIcon>
            </Tooltip>
          )}
        </Flex>
      </div>
      <Divider variant="solid" size="sm" my="md" />
    </Flex>
  );
};

export default CreateHeader;
