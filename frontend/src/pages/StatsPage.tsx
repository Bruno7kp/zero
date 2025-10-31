// Main stats page with sidebar and routing
import React, { Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Loader,
  Center,
  Stack,
  NavLink,
  ScrollArea,
  Card,
  Flex,
  ActionIcon,
  useMantineTheme,
  Divider,
  Box,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import {
  IconChartBar,
  IconTrophy,
  IconFlame,
  IconStar,
  IconHeadphones,
  IconRocket,
  IconCoin,
  IconCrown,
  IconMenu2,
  IconCalendarUp,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
  IconSparkles,
} from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { useStatsPreferences } from '../hooks/useStatsPreferences';
import { useIsMobile } from '../hooks/useIsMobile';
import { getCardBackgroundByMode, type ThemeMode } from '../theme/modes';
import CreateHeader from '../components/createChart/CreateHeader';

// Lazy load stat components for performance
const StatsHome = lazy(() => import('./stats/StatsHome'));
const RankStats = lazy(() => import('./stats/RankStats'));
const PerfectAllKillStats = lazy(() => import('./stats/PerfectAllKillStats'));
const TimesAtRankStats = lazy(() => import('./stats/TimesAtRankStats'));
const TimesAtTopStats = lazy(() => import('./stats/TimesAtTopStats'));
const PlaysStats = lazy(() => import('./stats/PlaysStats'));
const DebutsStats = lazy(() => import('./stats/DebutsStats'));
const PointsStats = lazy(() => import('./stats/PointsStats'));
const TimesAtTopByArtistStats = lazy(() => import('./stats/TimesAtTopByArtistStats'));
const DebutsAtOneByArtistStats = lazy(() => import('./stats/DebutsAtOneByArtistStats'));
const LongestConsecutiveAtOneStats = lazy(() => import('./stats/LongestConsecutiveAtOneStats'));
const MostSimultaneousByArtistStats = lazy(() => import('./stats/MostSimultaneousByArtistStats'));

const StatsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [opened, { toggle }] = useDisclosure(false);
  // collapsed state is persisted via stats preferences
  const theme = useMantineTheme();
  const themeMode = useSelector((state: any) => state.theme?.value || 'dark') as ThemeMode;
  const bgColor = getCardBackgroundByMode(theme, themeMode);

  const charts = useSelector((state: any) => state.charts.charts);
  const activeChartId = useSelector((state: any) => state.charts.activeChartId);
  const chart = charts.find((c: any) => c.id === activeChartId);

  // Get chart cutoff for track type
  const trackCutoff = chart?.music_cutoff || 100;

  // Navigation items
  const navItems: Array<{
    icon?: any;
    label?: string;
    path?: string;
    exact?: boolean;
    group?: string;
    divider?: boolean;
  }> = [
    {
      icon: IconChartBar,
      label: t('stats.sidebar.overview'),
      path: '/stats',
      exact: true,
    },
    { divider: true },
    {
      icon: IconCrown,
      label: t('stats.timesAtTopByArtist.title', { n: 1 }),
      path: '/stats/times_at_top_by_artist/1/track',
      group: 'times_at_top_by_artist',
    },
    {
      icon: IconTrophy,
      label: t('stats.rank.title', { n: 1 }),
      path: '/stats/rank/1/track',
      group: 'rank',
    },
    {
      icon: IconStar,
      label: t('stats.timesAtRank.title', { n: 1 }),
      path: '/stats/times_at_rank/1/track',
      group: 'times_at_rank',
    },
    {
      icon: IconCalendarUp,
      label: t('stats.timesAtTop.title', { n: trackCutoff }),
      path: `/stats/times_at_top/${trackCutoff}/track`,
      group: 'times_at_top',
    },
    {
      icon: IconCalendarUp,
      label: t('stats.longestConsecutiveAtOne.title'),
      path: '/stats/longest_consecutive_at_one/track',
      group: 'times_at_top',
    },
    { divider: true },
    {
      icon: IconRocket,
      label: t('stats.debuts.title'),
      path: '/stats/debuts/all/track',
      group: 'debuts',
    },
    {
      icon: IconSparkles,
      label: t('stats.debutsAtOneByArtist.title', { n: 1 }),
      path: '/stats/debuts_at_one_by_artist/track',
      group: 'debuts_at_one_by_artist',
    },
    {
      icon: IconHeadphones,
      label: t('stats.mostSimultaneousByArtist.title'),
      path: '/stats/most_simultaneous_by_artist/track',
      group: 'most_simultaneous_by_artist',
    },
    {
      icon: IconHeadphones,
      label: t('stats.plays.title'),
      path: '/stats/plays/all/track',
      group: 'plays',
    },
    { divider: true },
    {
      icon: IconFlame,
      label: t('stats.pak.title'),
      path: '/stats/pak',
      group: 'pak',
    },
    {
      icon: IconCoin,
      label: t('stats.points.title'),
      path: '/stats/points/track',
      group: 'points',
    },
  ];

  const isActive = (item: (typeof navItems)[0]) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    // Match the group more precisely to avoid false positives
    // e.g., times_at_top_by_artist shouldn't match times_at_top
    const pathParts = location.pathname.split('/');
    return pathParts.some(part => part === item.group);
  };

  // Get page title based on current route
  const getPageTitle = () => {
    const activeItem = navItems.find(item => !item.divider && isActive(item));
    return activeItem?.label || t('stats.title');
  };

  const { preferences, updatePreference } = useStatsPreferences();
  const isMobile = useIsMobile();

  const collapsed = preferences.collapsed;
  const toggleCollapsed = () => updatePreference('collapsed', !collapsed);

  if (!chart) {
    return (
      <Container
        size={isMobile ? '100%' : preferences.containerSize}
        py="xl"
        className="noPaddingMobile"
      >
        <Center>
          <Stack align="center" gap="md">
            <Text>{t('errors.selectActiveChart')}</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  return (
    <Container size={isMobile ? '100%' : preferences.containerSize} className="noPaddingMobile">
      <CreateHeader pageTitle={getPageTitle()} icon={IconChartBar} />

      <Flex gap="md" direction={{ base: 'column', md: 'row' }}>
        {/* Sidebar */}
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
              {/* Collapse button - desktop only */}
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

              {/* Title - centered */}
              {!collapsed && (
                <Title order={4} style={{ flex: 1, textAlign: 'center', marginLeft: -34 }}>
                  {t('stats.sidebar.title')}
                </Title>
              )}
            </Flex>

            <ScrollArea.Autosize mah={600} type="auto">
              <Stack gap={0}>
                {navItems.map((item, index) =>
                  item.divider ? (
                    <Divider key={index} my="xs" />
                  ) : (
                    <Tooltip
                      key={index}
                      label={item.label}
                      position="right"
                      disabled={!collapsed}
                      withArrow
                    >
                      <NavLink
                        active={isActive(item)}
                        label={collapsed ? undefined : item.label!}
                        leftSection={<item.icon size={18} />}
                        onClick={() => {
                          if (item.path) {
                            navigate(item.path);
                          }
                        }}
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

        {/* Mobile Sidebar */}
        <Box hiddenFrom="md" style={{ width: '100%' }}>
          <Card p="md" style={{ backgroundColor: bgColor }}>
            <Flex justify="space-between" align="center" mb={0}>
              <Title order={4}>{t('stats.sidebar.title')}</Title>
              <ActionIcon variant="subtle" onClick={toggle}>
                <IconMenu2 size={18} />
              </ActionIcon>
            </Flex>

            <ScrollArea.Autosize mah={600} type="auto">
              <Stack gap={0} display={opened ? 'flex' : 'none'}>
                {navItems.map((item, index) =>
                  item.divider ? (
                    <Divider key={index} my="xs" />
                  ) : (
                    <NavLink
                      key={index}
                      active={isActive(item)}
                      label={item.label!}
                      leftSection={<item.icon size={18} />}
                      onClick={() => {
                        if (item.path) {
                          navigate(item.path);
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

        {/* Main Content */}
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
              <Route path="/" element={<StatsHome />} />
              <Route path="/rank/:rank/:type" element={<RankStats />} />
              <Route path="/pak" element={<PerfectAllKillStats />} />
              <Route path="/times_at_rank/:rank/:type" element={<TimesAtRankStats />} />
              <Route path="/times_at_top/:topN/:type" element={<TimesAtTopStats />} />
              <Route path="/plays/:position/:type" element={<PlaysStats />} />
              <Route path="/debuts/:position/:type" element={<DebutsStats />} />
              <Route path="/points/:type" element={<PointsStats />} />
              <Route
                path="/times_at_top_by_artist/:rank/:type"
                element={<TimesAtTopByArtistStats />}
              />
              <Route path="/debuts_at_one_by_artist/:type" element={<DebutsAtOneByArtistStats />} />
              <Route
                path="/longest_consecutive_at_one/:type"
                element={<LongestConsecutiveAtOneStats />}
              />
              <Route
                path="/most_simultaneous_by_artist/:type"
                element={<MostSimultaneousByArtistStats />}
              />
            </Routes>
          </Suspense>
        </Box>
      </Flex>
    </Container>
  );
};

export default StatsPage;
