import React, { Suspense, lazy } from 'react';
import {
  Container,
  Flex,
  Card,
  Stack,
  NavLink,
  ScrollArea,
  Divider,
  Tooltip,
  ActionIcon,
  Title,
  Box,
  Center,
  Loader,
  Text,
  useMantineTheme,
} from '@mantine/core';
import {
  IconGraph,
  IconTimeline,
  IconCrown,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconMenu2,
  IconChartBar,
} from '@tabler/icons-react';
import { Link, useLocation, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDisclosure } from '@mantine/hooks';
import { useSelector } from 'react-redux';
import CreateHeader from '../../../components/createChart/CreateHeader';
import { useVisualizationPreferences } from '../../../hooks/useVisualizationPreferences';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { getCardBackgroundByMode, type ThemeMode } from '../../../theme/modes';

const StatsVisualizationsOverview = lazy(() => import('./StatsVisualizationsOverview'));
const NumberOneTimelineChart = lazy(() => import('./NumberOneTimelineChart'));
const TopRankLeadersChart = lazy(() => import('./TopRankLeadersChart'));

type NavItem = {
  icon?: any;
  label?: string;
  path?: string;
  exact?: boolean;
  group?: string;
  divider?: boolean;
};

const StatsVisualizationsPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const theme = useMantineTheme();
  const { preferences, updatePreference } = useVisualizationPreferences();
  const [opened, { toggle }] = useDisclosure(false);
  const isMobile = useIsMobile();
  const themeMode = useSelector((state: any) => state.theme?.value || 'dark') as ThemeMode;
  const cardBg = getCardBackgroundByMode(theme, themeMode);

  const navItems: NavItem[] = [
    {
      icon: IconChartBar,
      label: t('stats.sidebar.overview'),
      path: '/stats',
      exact: true,
    },
    {
      icon: IconGraph,
      label: t('stats.visualizations.sidebar.overview'),
      path: '/stats/visualizations',
      exact: true,
    },
    { divider: true },
    {
      icon: IconTimeline,
      label: t('stats.visualizations.sidebar.timeline'),
      path: '/stats/visualizations/number-one-timeline',
      group: 'number-one-timeline',
    },
    {
      icon: IconCrown,
      label: t('stats.visualizations.sidebar.rankDominance'),
      path: '/stats/visualizations/top-rank-leaders',
      group: 'top-rank-leaders',
    },
  ];

  const isActive = (item: NavItem) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    if (!item.group) return false;
    return location.pathname.includes(item.group);
  };

  const collapsed = preferences.collapsed;
  const toggleCollapsed = () => updatePreference('collapsed', !collapsed);

  const activeItem = navItems.find(item => !item.divider && item.path && isActive(item));
  const headerTitle = activeItem?.label || t('stats.visualizations.sidebar.title');
  const headerIcon = (activeItem?.icon || IconGraph) as any;

  return (
    <Container size={isMobile ? '100%' : preferences.containerSize} className="noPaddingMobile">
      <CreateHeader pageTitle={headerTitle} icon={headerIcon} />

      <Flex gap="md" direction={{ base: 'column', md: 'row' }}>
        <Box
          style={{
            flexShrink: 0,
            width: collapsed ? 55 : 320,
            transition: 'width 200ms ease',
          }}
          hiddenFrom="base"
          visibleFrom="md"
        >
          <Card
            p={collapsed ? 'xs' : 'md'}
            style={{ background: cardBg, position: 'sticky', top: 70 }}
          >
            <Flex
              justify={collapsed ? 'center' : 'space-between'}
              align="center"
              mb={collapsed ? 0 : 'md'}
            >
              <ActionIcon
                variant="subtle"
                onClick={toggleCollapsed}
                aria-label={collapsed ? t('stats.sidebar.expand') : t('stats.sidebar.collapse')}
              >
                {collapsed ? (
                  <IconLayoutSidebarLeftExpand size={18} />
                ) : (
                  <IconLayoutSidebarLeftCollapse size={18} />
                )}
              </ActionIcon>
              {!collapsed && (
                <Title order={4} style={{ flex: 1, textAlign: 'center', marginLeft: -34 }}>
                  {t('stats.visualizations.sidebar.title')}
                </Title>
              )}
            </Flex>

            <ScrollArea.Autosize mah={700} type="auto">
              <Stack gap={0}>
                {navItems.map((item, index) =>
                  item.divider ? (
                    <Divider key={`divider-${index}`} my="xs" />
                  ) : (
                    <Tooltip
                      key={item.path}
                      label={item.label}
                      position="right"
                      disabled={!collapsed}
                      withArrow
                    >
                      <NavLink
                        component={Link}
                        to={item.path!}
                        active={isActive(item)}
                        label={collapsed ? undefined : item.label!}
                        leftSection={<item.icon size={18} />}
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
          </Card>
        </Box>

        <Box hiddenFrom="md">
          <Card p="md" style={{ background: cardBg }}>
            <Flex justify="space-between" align="center" mb="sm">
              <Title order={4}>{t('stats.visualizations.sidebar.title')}</Title>
              <ActionIcon variant="subtle" onClick={toggle}>
                <IconMenu2 size={18} />
              </ActionIcon>
            </Flex>

            <ScrollArea.Autosize mah={400} type="auto">
              <Stack gap={0} display={opened ? 'flex' : 'none'}>
                {navItems.map((item, index) =>
                  item.divider ? (
                    <Divider key={`mobile-divider-${index}`} my="xs" />
                  ) : (
                    <NavLink
                      key={index}
                      component={Link}
                      to={item.path!}
                      active={isActive(item)}
                      label={item.label!}
                      leftSection={<item.icon size={18} />}
                      onClick={e => {
                        // Close only on regular left-click navigation; keep open for new-tab actions
                        if (
                          e.button === 0 &&
                          !e.ctrlKey &&
                          !e.metaKey &&
                          !e.shiftKey &&
                          !e.altKey
                        ) {
                          toggle();
                        }
                      }}
                      styles={{
                        root: {
                          borderRadius: 8,
                        },
                      }}
                    />
                  )
                )}
              </Stack>
            </ScrollArea.Autosize>
          </Card>
        </Box>

        <Box style={{ flex: 1, minWidth: 0 }}>
          <Suspense
            fallback={
              <Center py="xl">
                <Stack align="center" gap="md">
                  <Loader size="lg" />
                  <Text>{t('stats.loading')}</Text>
                </Stack>
              </Center>
            }
          >
            <Routes>
              <Route index element={<StatsVisualizationsOverview />} />
              <Route path="number-one-timeline" element={<NumberOneTimelineChart />} />
              <Route path="top-rank-leaders" element={<TopRankLeadersChart />} />
              <Route path="*" element={<StatsVisualizationsOverview />} />
            </Routes>
          </Suspense>
        </Box>
      </Flex>
    </Container>
  );
};

export default StatsVisualizationsPage;
