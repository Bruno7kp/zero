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

  const toggleCollapsed = () => {
    updatePreference('collapsed', !collapsed);
  };

  const toggleSidebarMode = () => {
    const newMode = sidebarMode === 'fixed' ? 'speedDial' : 'fixed';
    updatePreference('sidebarMode', newMode);
    if (newMode === 'speedDial') {
      setSpeedDialOpen(false);
    }
  };

  const isActive = (item: NavItem) => {
    if (item.exact) {
      return currentPath === item.path;
    }
    if (!item.group) return false;
    const pathParts = currentPath.split('/');
    return pathParts.some(part => part === item.group);
  };

  const renderNavItems = (isMobile = false, isSpeedDial = false) => (
    <Stack gap={0}>
      {navItems.map((item, index) =>
        item.divider ? (
          <Divider key={`divider-${index}`} my="xs" />
        ) : (
          <Tooltip
            key={item.path || index}
            label={item.label}
            position="right"
            disabled={!collapsed || isMobile}
            withArrow
            zIndex={isSpeedDial ? 1001 : undefined}
          >
            <NavLink
              component={Link}
              to={item.path!}
              active={isActive(item)}
              label={collapsed && !isMobile ? undefined : item.label!}
              leftSection={item.icon ? <item.icon size={18} /> : undefined}
              onClick={() => {
                // Don't close speed dial menu when clicking links
                // User can close it manually or by clicking outside
              }}
              styles={{
                root: {
                  justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                  paddingLeft: collapsed && !isMobile ? 8 : undefined,
                  paddingRight: collapsed && !isMobile ? 8 : undefined,
                  borderRadius: 8,
                },
                section: {
                  marginRight: collapsed && !isMobile ? 0 : undefined,
                },
              }}
            />
          </Tooltip>
        )
      )}
    </Stack>
  );

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
          <Flex
            justify={collapsed ? 'center' : 'space-between'}
            align="center"
            mb={collapsed ? 0 : 'md'}
          >
            {!collapsed && (
              <Title order={4} style={{ flex: 1, textAlign: 'center' }}>
                {title}
              </Title>
            )}
          </Flex>

          <ScrollArea.Autosize mah={700} type="auto" scrollbarSize={6}>
            {renderNavItems()}
          </ScrollArea.Autosize>

          {/* Bottom controls */}
          <Flex direction="column" gap="xs" mt="md" pt="md" style={{ borderTop: `1px solid ${theme.colors.gray[7]}` }}>
            <Tooltip label={collapsed ? t('stats.sidebar.expand') : t('stats.sidebar.collapse')} withArrow>
              <ActionIcon
                variant="subtle"
                onClick={toggleCollapsed}
                aria-label={collapsed ? t('stats.sidebar.expand') : t('stats.sidebar.collapse')}
                fullWidth
              >
                {collapsed ? (
                  <IconLayoutSidebarLeftExpand size={18} />
                ) : (
                  <Flex align="center" gap="xs" justify="center">
                    <IconLayoutSidebarLeftCollapse size={18} />
                    <span style={{ fontSize: '0.875rem' }}>{t('stats.sidebar.collapse')}</span>
                  </Flex>
                )}
              </ActionIcon>
            </Tooltip>
            <Tooltip label={t('stats.sidebar.toggleSpeedDial')} withArrow>
              <ActionIcon
                variant="light"
                onClick={toggleSidebarMode}
                aria-label={t('stats.sidebar.toggleSpeedDial')}
                fullWidth
              >
                {collapsed ? (
                  <IconMenu2 size={18} />
                ) : (
                  <Flex align="center" gap="xs" justify="center">
                    <IconMenu2 size={18} />
                    <span style={{ fontSize: '0.875rem' }}>{t('stats.sidebar.toggleSpeedDial')}</span>
                  </Flex>
                )}
              </ActionIcon>
            </Tooltip>
          </Flex>
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
              <Flex
                justify={collapsed ? 'center' : 'space-between'}
                align="center"
                mb={collapsed ? 0 : 'md'}
              >
                {!collapsed && (
                  <Title order={4} style={{ flex: 1, textAlign: 'center' }}>
                    {title}
                  </Title>
                )}
              </Flex>

              <ScrollArea.Autosize mah={500} type="auto" scrollbarSize={6}>
                {renderNavItems(false, true)}
              </ScrollArea.Autosize>

              {/* Bottom controls */}
              <Flex direction="column" gap="xs" mt="md" pt="md" style={{ borderTop: `1px solid ${theme.colors.gray[7]}` }}>
                <Tooltip label={collapsed ? t('stats.sidebar.expand') : t('stats.sidebar.collapse')} withArrow zIndex={1001}>
                  <ActionIcon
                    variant="subtle"
                    onClick={toggleCollapsed}
                    aria-label={collapsed ? t('stats.sidebar.expand') : t('stats.sidebar.collapse')}
                    fullWidth
                  >
                    {collapsed ? (
                      <IconLayoutSidebarLeftExpand size={18} />
                    ) : (
                      <Flex align="center" gap="xs" justify="center">
                        <IconLayoutSidebarLeftCollapse size={18} />
                        <span style={{ fontSize: '0.875rem' }}>{t('stats.sidebar.collapse')}</span>
                      </Flex>
                    )}
                  </ActionIcon>
                </Tooltip>
                <Tooltip label={t('stats.sidebar.toggleSpeedDial')} withArrow zIndex={1001}>
                  <ActionIcon
                    variant="light"
                    onClick={toggleSidebarMode}
                    aria-label={t('stats.sidebar.toggleSpeedDial')}
                    fullWidth
                  >
                    {collapsed ? (
                      <IconMenu2 size={18} />
                    ) : (
                      <Flex align="center" gap="xs" justify="center">
                        <IconMenu2 size={18} />
                        <span style={{ fontSize: '0.875rem' }}>{t('stats.sidebar.toggleSpeedDial')}</span>
                      </Flex>
                    )}
                  </ActionIcon>
                </Tooltip>
              </Flex>
            </Card>
          </Box>
        )}
      </Transition>
    </>
  );
};

export default StatsSidebar;
