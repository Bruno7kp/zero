// Shared sidebar component for Stats and Visualizations pages
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  Stack,
  NavLink,
  ScrollArea,
  Divider,
  Tooltip,
  ActionIcon,
  Title,
  Box,
  Flex,
  Drawer,
  useMantineTheme,
} from '@mantine/core';
import {
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconPin,
  IconPinFilled,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useStatsPreferences } from '../../hooks/useStatsPreferences';
import { getCardBackgroundByMode, type ThemeMode } from '../../theme/modes';

export interface NavItem {
  icon?: any;
  label?: string;
  path?: string;
  exact?: boolean;
  group?: string;
  divider?: boolean;
}

interface StatsSidebarProps {
  navItems: NavItem[];
  currentPath: string;
  title: string;
  drawerOpened?: boolean;
  onDrawerClose?: () => void;
}

const StatsSidebar: React.FC<StatsSidebarProps> = ({
  navItems,
  currentPath,
  title,
  drawerOpened = false,
  onDrawerClose,
}) => {
  const { t } = useTranslation();
  const theme = useMantineTheme();
  const themeMode = useSelector((state: any) => state.theme?.value || 'dark') as ThemeMode;
  const bgColor = getCardBackgroundByMode(theme, themeMode);
  const { preferences, updatePreference } = useStatsPreferences();

  const collapsed = preferences.collapsed;
  const fixedSidebarEnabled =
    typeof preferences.fixedSidebarEnabled === 'boolean' ? preferences.fixedSidebarEnabled : true;

  const toggleCollapsed = React.useCallback(() => {
    updatePreference('collapsed', !collapsed);
  }, [collapsed, updatePreference]);

  const enableFixedSidebar = React.useCallback(() => {
    updatePreference('fixedSidebarEnabled', true);
    if (onDrawerClose) {
      onDrawerClose();
    }
  }, [updatePreference, onDrawerClose]);

  const disableFixedSidebar = React.useCallback(() => {
    updatePreference('fixedSidebarEnabled', false);
  }, [updatePreference]);

  const isActive = React.useCallback(
    (item: NavItem) => {
      if (item.exact) {
        return currentPath === item.path;
      }
      if (!item.group) return false;
      const pathParts = currentPath.split('/');
      return pathParts.some(part => part === item.group);
    },
    [currentPath]
  );

  // Render sidebar content - used for both fixed and drawer modes
  const handleDrawerNavClick = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (!onDrawerClose) {
        return;
      }
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.shiftKey
      ) {
        return;
      }
      onDrawerClose();
    },
    [onDrawerClose]
  );

  const renderSidebarContent = React.useCallback(
    (isInDrawer: boolean = false) => (
      <>
        {/* Header with title and controls - only for fixed mode */}
        {!isInDrawer && (
          <Flex
            justify={collapsed ? 'center' : 'space-between'}
            align="center"
            mb={collapsed ? 0 : 'md'}
          >
            {/* For fixed collapsed: just centered controls at bottom */}
            {/* For fixed full: collapse on left, title in center, unpin on right */}
            {!collapsed && (
              <>
                <Tooltip label={t('stats.sidebar.collapse')} withArrow>
                  <ActionIcon
                    variant="subtle"
                    onClick={toggleCollapsed}
                    aria-label={t('stats.sidebar.collapse')}
                  >
                    <IconLayoutSidebarLeftCollapse size={18} />
                  </ActionIcon>
                </Tooltip>
                <Title order={4} style={{ flex: 1, textAlign: 'center' }}>
                  {title}
                </Title>
                <Tooltip label={t('stats.sidebar.disableFixedSidebar')} withArrow>
                  <ActionIcon
                    variant="light"
                    onClick={disableFixedSidebar}
                    aria-label={t('stats.sidebar.disableFixedSidebar')}
                  >
                    <IconPinFilled size={18} />
                  </ActionIcon>
                </Tooltip>
              </>
            )}
          </Flex>
        )}

        {/* Navigation items */}
        <ScrollArea.Autosize
          mah={isInDrawer ? '100%' : 700}
          type="hover"
          scrollbarSize={4}
          style={isInDrawer ? { flex: 1 } : undefined}
        >
          <Stack gap={0}>
            {navItems.map((item, index) =>
              item.divider ? (
                <Divider key={`divider-${index}`} my="xs" />
              ) : (
                <Tooltip
                  key={item.path || index}
                  label={item.label}
                  position="right"
                  disabled={!collapsed || isInDrawer}
                  withArrow
                >
                  <NavLink
                    component={Link}
                    to={item.path!}
                    active={isActive(item)}
                    label={collapsed && !isInDrawer ? undefined : item.label!}
                    leftSection={item.icon ? <item.icon size={18} /> : undefined}
                    onClick={isInDrawer ? handleDrawerNavClick : undefined}
                    styles={{
                      root: {
                        justifyContent: collapsed && !isInDrawer ? 'center' : 'flex-start',
                        paddingLeft: collapsed && !isInDrawer ? 8 : undefined,
                        paddingRight: collapsed && !isInDrawer ? 8 : undefined,
                        borderRadius: 8,
                      },
                      section: {
                        marginRight: collapsed && !isInDrawer ? 0 : undefined,
                      },
                    }}
                  />
                </Tooltip>
              )
            )}
          </Stack>
        </ScrollArea.Autosize>

        {/* Bottom controls - only shown when collapsed in fixed mode */}
        {collapsed && !isInDrawer && (
          <Flex
            direction="column"
            align={collapsed ? 'center' : 'initial'}
            gap="xs"
            mt="md"
            pt="md"
            style={{ borderTop: `1px solid ${theme.colors.gray[7]}` }}
          >
            <Tooltip label={t('stats.sidebar.expand')} withArrow>
              <ActionIcon
                variant="subtle"
                onClick={toggleCollapsed}
                aria-label={t('stats.sidebar.expand')}
              >
                <IconLayoutSidebarLeftExpand size={18} />
              </ActionIcon>
            </Tooltip>
          </Flex>
        )}
      </>
    ),
    [
      collapsed,
      navItems,
      isActive,
      t,
      title,
      toggleCollapsed,
      disableFixedSidebar,
      theme.colors.gray,
      handleDrawerNavClick,
    ]
  );

  const drawerTitle = (
    <Flex align="center" justify="center" style={{ position: 'relative', width: '100%' }}>
      <Tooltip
        label={
          fixedSidebarEnabled
            ? t('stats.sidebar.disableFixedSidebar')
            : t('stats.sidebar.enableFixedSidebar')
        }
        withArrow
      >
        <ActionIcon
          variant="light"
          onClick={fixedSidebarEnabled ? disableFixedSidebar : enableFixedSidebar}
          aria-label={
            fixedSidebarEnabled
              ? t('stats.sidebar.disableFixedSidebar')
              : t('stats.sidebar.enableFixedSidebar')
          }
          style={{ position: 'absolute', left: 0 }}
        >
          {fixedSidebarEnabled ? <IconPinFilled size={18} /> : <IconPin size={18} />}
        </ActionIcon>
      </Tooltip>
      <Title order={5} style={{ width: '100%', textAlign: 'center', margin: 0 }}>
        {title}
      </Title>
    </Flex>
  );

  return (
    <>
      {fixedSidebarEnabled && (
        <Box
          style={{
            flexShrink: 0,
            width: collapsed ? '55px' : '350px',
            transition: 'width 200ms ease',
          }}
          visibleFrom="md"
        >
          <Card
            p={collapsed ? 'xs' : 'md'}
            style={{ backgroundColor: bgColor, position: 'sticky', top: 70 }}
          >
            {renderSidebarContent(false)}
          </Card>
        </Box>
      )}

      <Drawer
        opened={drawerOpened}
        onClose={onDrawerClose ?? (() => {})}
        position="left"
        size="350px"
        title={drawerTitle}
        styles={{
          header: { justifyContent: 'center', position: 'relative', backgroundColor: bgColor },
          title: { width: '100%', display: 'flex', justifyContent: 'center' },
          close: { position: 'absolute', right: 'var(--mantine-spacing-sm)' },
          body: { padding: 'md', height: '100%', display: 'flex', flexDirection: 'column' },
          content: { backgroundColor: bgColor },
        }}
        visibleFrom="md"
      >
        <Flex direction="column" style={{ height: '100%' }}>
          {renderSidebarContent(true)}
        </Flex>
      </Drawer>
    </>
  );
};

export default StatsSidebar;
