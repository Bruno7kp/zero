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
  Affix,
  Transition,
  useMantineTheme,
} from '@mantine/core';
import {
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconMenu2,
  IconX,
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
}

const StatsSidebar: React.FC<StatsSidebarProps> = ({ navItems, currentPath, title }) => {
  const { t } = useTranslation();
  const theme = useMantineTheme();
  const themeMode = useSelector((state: any) => state.theme?.value || 'dark') as ThemeMode;
  const bgColor = getCardBackgroundByMode(theme, themeMode);
  const { preferences, updatePreference } = useStatsPreferences();

  const collapsed = preferences.collapsed;
  const sidebarMode = preferences.sidebarMode;
  const [speedDialOpen, setSpeedDialOpen] = React.useState(false);

  const toggleCollapsed = React.useCallback(() => {
    updatePreference('collapsed', !collapsed);
  }, [collapsed, updatePreference]);

  const toggleSidebarMode = React.useCallback(() => {
    const newMode = sidebarMode === 'fixed' ? 'speedDial' : 'fixed';
    updatePreference('sidebarMode', newMode);
    if (newMode === 'speedDial') {
      setSpeedDialOpen(false);
    }
  }, [sidebarMode, updatePreference]);

  const isActive = React.useCallback((item: NavItem) => {
    if (item.exact) {
      return currentPath === item.path;
    }
    if (!item.group) return false;
    const pathParts = currentPath.split('/');
    return pathParts.some(part => part === item.group);
  }, [currentPath]);

  // Render sidebar content - memoized to avoid recreating on each render
  const renderSidebarContent = React.useCallback((isSpeedDial: boolean = false) => (
    <>
      {/* Header with title and controls */}
      <Flex
        justify={collapsed ? 'center' : 'space-between'}
        align="center"
        mb={collapsed ? 0 : 'md'}
      >
        {!collapsed && (
          <>
            <Tooltip label={t('stats.sidebar.collapse')} withArrow zIndex={isSpeedDial ? 1001 : undefined}>
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
            <Tooltip label={t('stats.sidebar.toggleSpeedDial')} withArrow zIndex={isSpeedDial ? 1001 : undefined}>
              <ActionIcon
                variant="light"
                onClick={toggleSidebarMode}
                aria-label={t('stats.sidebar.toggleSpeedDial')}
              >
                <IconMenu2 size={18} />
              </ActionIcon>
            </Tooltip>
          </>
        )}
      </Flex>

      {/* Navigation items */}
      <ScrollArea.Autosize mah={isSpeedDial ? 500 : 700} type="hover" scrollbarSize={4}>
        <Stack gap={0}>
          {navItems.map((item, index) =>
            item.divider ? (
              <Divider key={`divider-${index}`} my="xs" />
            ) : (
              <Tooltip
                key={item.path || index}
                label={item.label}
                position="right"
                disabled={!collapsed}
                withArrow
                zIndex={isSpeedDial ? 1001 : undefined}
              >
                <NavLink
                  component={Link}
                  to={item.path!}
                  active={isActive(item)}
                  label={collapsed ? undefined : item.label!}
                  leftSection={item.icon ? <item.icon size={18} /> : undefined}
                  styles={{
                    root: {
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      paddingLeft: collapsed ? 8 : undefined,
                      paddingRight: collapsed ? 8 : undefined,
                      borderRadius: 8,
                    },
                    section: {
                      marginRight: collapsed ? 0 : undefined,
                    },
                  }}
                />
              </Tooltip>
            )
          )}
        </Stack>
      </ScrollArea.Autosize>

      {/* Bottom controls - only shown when collapsed */}
      {collapsed && (
        <Flex direction="column" gap="xs" mt="md" pt="md" style={{ borderTop: `1px solid ${theme.colors.gray[7]}` }}>
          <Tooltip label={t('stats.sidebar.expand')} withArrow zIndex={isSpeedDial ? 1001 : undefined}>
            <ActionIcon
              variant="subtle"
              onClick={toggleCollapsed}
              aria-label={t('stats.sidebar.expand')}
            >
              <IconLayoutSidebarLeftExpand size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={t('stats.sidebar.toggleSpeedDial')} withArrow zIndex={isSpeedDial ? 1001 : undefined}>
            <ActionIcon
              variant="light"
              onClick={toggleSidebarMode}
              aria-label={t('stats.sidebar.toggleSpeedDial')}
            >
              <IconMenu2 size={18} />
            </ActionIcon>
          </Tooltip>
        </Flex>
      )}
    </>
  ), [collapsed, navItems, isActive, t, title, toggleCollapsed, toggleSidebarMode, theme.colors.gray]);

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

  // Desktop sidebar - speed dial mode
  return (
    <>
      {/* Speed dial button */}
      <Affix position={{ bottom: 20, left: 20 }} hiddenFrom="base" visibleFrom="md">
        <ActionIcon
          size="xl"
          radius="xl"
          variant="filled"
          color="blue"
          onClick={() => setSpeedDialOpen(!speedDialOpen)}
          aria-label={speedDialOpen ? t('stats.sidebar.closeSpeedDial') : t('stats.sidebar.openSpeedDial')}
        >
          {speedDialOpen ? <IconX size={24} /> : <IconMenu2 size={24} />}
        </ActionIcon>
      </Affix>

      {/* Floating sidebar */}
      <Transition mounted={speedDialOpen} transition="slide-right" duration={200}>
        {styles => (
          <Box
            style={{
              ...styles,
              position: 'fixed',
              bottom: 80,
              left: 20,
              zIndex: 1000,
              width: collapsed ? '55px' : '350px',
              maxHeight: 'calc(100vh - 150px)',
            }}
            hiddenFrom="base"
            visibleFrom="md"
          >
            <Card p={collapsed ? 'xs' : 'md'} shadow="xl" style={{ backgroundColor: bgColor }}>
              {renderSidebarContent(true)}
            </Card>
          </Box>
        )}
      </Transition>
    </>
  );
};

export default StatsSidebar;
