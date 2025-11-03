// Main stats page with sidebar and routing
import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import {
  Container,
  Text,
  Loader,
  Center,
  Stack,
  Box,
} from '@mantine/core';
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
  IconCalendarUp,
  IconBoxMultiple1,
  IconSparkles,
  IconMusicPlus,
  IconStairsUp,
  IconCoins,
  IconGraph,
} from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { useStatsPreferences } from '../hooks/useStatsPreferences';
import { useIsMobile } from '../hooks/useIsMobile';
import CreateHeader from '../components/createChart/CreateHeader';
import StatsSidebar, { type NavItem } from '../components/stats/StatsSidebar';
import { MobileSidebar } from '../components/stats/MobileSidebar';

// Lazy load stat components for performance
const StatsVisualizationsOverview = lazy(() => import('./stats/visualizations/StatsVisualizationsOverview'));
const RankStats = lazy(() => import('./stats/RankStats'));
const PerfectAllKillStats = lazy(() => import('./stats/PerfectAllKillStats'));
const TimesAtRankStats = lazy(() => import('./stats/TimesAtRankStats'));
const TimesAtTopStats = lazy(() => import('./stats/TimesAtTopStats'));
const PlaysStats = lazy(() => import('./stats/PlaysStats'));
const DebutsStats = lazy(() => import('./stats/DebutsStats'));
const PointsStats = lazy(() => import('./stats/PointsStats'));
const MostSalesStats = lazy(() => import('./stats/MostSalesStats'));
const TimesAtTopByArtistStats = lazy(() => import('./stats/TimesAtTopByArtistStats'));
const DebutsAtOneByArtistStats = lazy(() => import('./stats/DebutsAtOneByArtistStats'));
const LongestConsecutiveAtOneStats = lazy(() => import('./stats/LongestConsecutiveAtOneStats'));
const MostSimultaneousByArtistStats = lazy(() => import('./stats/MostSimultaneousByArtistStats'));
const WeeksToNumberOneStats = lazy(() => import('./stats/WeeksToNumberOneStats'));

const StatsPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { preferences } = useStatsPreferences();
  const isMobile = useIsMobile();

  const charts = useSelector((state: any) => state.charts.charts);
  const activeChartId = useSelector((state: any) => state.charts.activeChartId);
  const chart = charts.find((c: any) => c.id === activeChartId);

  // Get chart cutoff for track type
  const trackCutoff = chart?.music_cutoff || 100;

  // Navigation items
  const navItems: NavItem[] = [
    {
      icon: IconChartBar,
      label: t('stats.sidebar.overview'),
      path: '/stats',
      exact: true,
    },
    {
      icon: IconGraph,
      label: t('stats.sidebar.viewVisualizations'),
      path: '/stats/visualizations',
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
      icon: IconBoxMultiple1,
      label: t('stats.longestConsecutiveAtOne.title'),
      path: '/stats/longest_consecutive_at_one/track',
      group: 'longest_consecutive_at_one',
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
      icon: IconMusicPlus,
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
    {
      icon: IconStairsUp,
      label: t('stats.weeksToNumberOne.title'),
      path: '/stats/weeks_to_number_one/track',
      group: 'weeks_to_number_one',
    },
    { divider: true },
    {
      icon: IconFlame,
      label: t('stats.pak.title'),
      path: '/stats/pak',
      group: 'pak',
    },
    {
      icon: IconCoins,
      label: t('stats.points.title'),
      path: '/stats/points/track',
      group: 'points',
    },
    {
      icon: IconCoin,
      label: t('stats.mostSales.title'),
      path: '/stats/most_sales/track',
      group: 'most_sales',
    },
  ];

  const isActive = (item: NavItem) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    if (!item.group) return false;
    const pathParts = location.pathname.split('/');
    return pathParts.some(part => part === item.group);
  };

  // Get page title based on current route
  const getPageTitle = () => {
    const activeItem = navItems.find(item => !item.divider && isActive(item));
    return activeItem?.label || t('stats.title');
  };

  // Get page icon based on current route
  const getPageIcon = () => {
    const activeItem = navItems.find(item => !item.divider && isActive(item));
    return activeItem?.icon || IconChartBar;
  };

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
      <CreateHeader pageTitle={getPageTitle()} icon={getPageIcon()} />

      <Box display={{ base: 'flex', md: 'flex' }} style={{ gap: 'var(--mantine-spacing-md)', flexDirection: isMobile ? 'column' : 'row' }}>
        {!isMobile && (
          <StatsSidebar 
            navItems={navItems} 
            currentPath={location.pathname}
            title={t('stats.sidebar.title')}
          />
        )}

        {isMobile && (
          <MobileSidebar navItems={navItems} currentPath={location.pathname} title={t('stats.sidebar.title')} />
        )}

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
              <Route path="/" element={<StatsVisualizationsOverview />} />
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
              <Route path="/most_sales/:type" element={<MostSalesStats />} />
              <Route path="/weeks_to_number_one/:type" element={<WeeksToNumberOneStats />} />
            </Routes>
          </Suspense>
        </Box>
      </Box>
    </Container>
  );
};

export default StatsPage;
