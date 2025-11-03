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
  onDrawerClose
}) => {
  const { t } = useTranslation();
  const theme = useMantineTheme();
  const themeMode = useSelector((state: any) => state.theme?.value || 'dark') as ThemeMode;
  const bgColor = getCardBackgroundByMode(theme, themeMode);
  const { preferences, updatePreference } = useStatsPreferences();

  const collapsed = preferences.collapsed;
  const sidebarMode = preferences.sidebarMode;

  const toggleCollapsed = React.useCallback(() => {
    updatePreference('collapsed', !collapsed);
  }, [collapsed, updatePreference]);

  const pinSidebar = React.useCallback(() => {
    updatePreference('sidebarMode', 'fixed');
    // Keep current collapsed state when pinning
    if (onDrawerClose) {
      onDrawerClose();
    }
  }, [updatePreference, onDrawerClose]);

  const unpinSidebar = React.useCallback(() => {
    updatePreference('sidebarMode', 'drawer');
  }, [updatePreference]);

  const isActive = React.useCallback((item: NavItem) => {
    if (item.exact) {
      return currentPath === item.path;
    }
    if (!item.group) return false;
    const pathParts = currentPath.split('/');
    return pathParts.some(part => part === item.group);
  }, [currentPath]);

  // Render sidebar content - used for both fixed and drawer modes
  const renderSidebarContent = React.useCallback((isInDrawer: boolean = false) => (
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
              <Tooltip label={t('stats.sidebar.unpinSidebar')} withArrow>
                <ActionIcon
                  variant="light"
                  onClick={unpinSidebar}
                  aria-label={t('stats.sidebar.unpinSidebar')}
                >
                  <IconPinFilled size={18} />
                </ActionIcon>
              </Tooltip>
            </>
          )}
        </Flex>
      )}

      {/* Navigation items */}
      <ScrollArea.Autosize mah={isInDrawer ? 'calc(100vh - 200px)' : 700} type="hover" scrollbarSize={4}>
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
        <Flex direction="column" gap="xs" mt="md" pt="md" style={{ borderTop: `1px solid ${theme.colors.gray[7]}` }}>
          <Tooltip label={t('stats.sidebar.expand')} withArrow>
            <ActionIcon
              variant="subtle"
              onClick={toggleCollapsed}
              aria-label={t('stats.sidebar.expand')}
            >
              <IconLayoutSidebarLeftExpand size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={t('stats.sidebar.unpinSidebar')} withArrow>
            <ActionIcon
              variant="light"
              onClick={unpinSidebar}
              aria-label={t('stats.sidebar.unpinSidebar')}
            >
              <IconPinFilled size={18} />
            </ActionIcon>
          </Tooltip>
        </Flex>
      )}
    </>
  ), [collapsed, navItems, isActive, t, title, toggleCollapsed, unpinSidebar, theme.colors.gray]);

  // Desktop sidebar - fixed mode
  if (sidebarMode === 'fixed') {
    return (
      <Box
        style={{
          flexShrink: 0,
          width: collapsed ? '55px' : '350px',
          transition: 'width 200ms ease',
        }}
        hiddenFrom="base"
        visibleFrom="md"
      >
        <Card
          p={collapsed ? 'xs' : 'md'}
          style={{ backgroundColor: bgColor, position: 'sticky', top: 70 }}
        >
          {renderSidebarContent(false)}
        </Card>
      </Box>
    );
  }

  // Drawer mode - controlled from parent
  // Custom header for drawer with pin button on left
  const drawerHeader = (
    <Flex justify="space-between" align="center" mb="md">
      <Tooltip label={t('stats.sidebar.pinSidebar')} withArrow>
        <ActionIcon
          variant="light"
          onClick={pinSidebar}
          aria-label={t('stats.sidebar.pinSidebar')}
        >
          <IconPin size={18} />
        </ActionIcon>
      </Tooltip>
    </Flex>
  );

  return (
    <Drawer
      opened={drawerOpened}
      onClose={onDrawerClose ?? (() => {})}
      position="left"
      size="350px"
      title={title}
      styles={{
        body: { padding: 'md' },
        content: { backgroundColor: bgColor },
      }}
      hiddenFrom="base"
      visibleFrom="md"
    >
      {drawerHeader}
      {renderSidebarContent(true)}
    </Drawer>
  );
};

export default StatsSidebar;
