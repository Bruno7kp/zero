import React, { Suspense, lazy } from 'react';
import { Container, Flex, Box, Center, Loader, Text, Stack } from '@mantine/core';
import {
  IconGraph,
  IconTimeline,
  IconCrown,
  IconChartBar,
  IconCoins,
  IconHeadphones,
  IconRocket,
} from '@tabler/icons-react';
import { useLocation, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CreateHeader from '../../../components/createChart/CreateHeader';
import { useVisualizationPreferences } from '../../../hooks/useVisualizationPreferences';
import { useStatsPreferences } from '../../../hooks/useStatsPreferences';
import { useIsMobile } from '../../../hooks/useIsMobile';
import StatsSidebar, { type NavItem } from '../../../components/stats/StatsSidebar';
import { MobileSidebar } from '../../../components/stats/MobileSidebar';

const StatsVisualizationsOverview = lazy(() => import('./StatsVisualizationsOverview'));
const NumberOneTimelineChart = lazy(() => import('./NumberOneTimelineChart'));
const TopRankLeadersChart = lazy(() => import('./TopRankLeadersChart'));
const TopPointsLeadersChart = lazy(() => import('./TopPointsLeadersChart'));
const TopWeeklyPlaysChart = lazy(() => import('./TopWeeklyPlaysChart'));
const TopWeeklyDebutsChart = lazy(() => import('./TopWeeklyDebutsChart'));

const StatsVisualizationsPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { preferences: vizPreferences } = useVisualizationPreferences();
  const { preferences: statsPreferences } = useStatsPreferences();
  const isMobile = useIsMobile();
  const [drawerOpened, setDrawerOpened] = React.useState(false);

  // Extract current type from URL (track, album, or artist)
  const getCurrentType = (): 'track' | 'album' | 'artist' => {
    const pathParts = location.pathname.split('/');
    // Check if the last part is a type
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart === 'album' || lastPart === 'artist' || lastPart === 'track') {
      return lastPart as 'track' | 'album' | 'artist';
    }
    // Check if the part before last is a type (when in a subpage)
    const secondLast = pathParts[pathParts.length - 2];
    if (secondLast === 'album' || secondLast === 'artist' || secondLast === 'track') {
      return secondLast as 'track' | 'album' | 'artist';
    }
    return 'track'; // default
  };

  const currentType = getCurrentType();

  const navItems: NavItem[] = [
    {
      icon: IconGraph,
      label: t('stats.visualizations.sidebar.overview'),
      path: `/stats/visualizations`,
      exact: true,
    },
    {
      icon: IconChartBar,
      label: t('stats.sidebar.viewTables'),
      path: '/stats',
      exact: true,
    },
    { divider: true },
    {
      icon: IconTimeline,
      label: t('stats.visualizations.sidebar.timeline'),
      path: `/stats/visualizations/number-one-timeline/${currentType}`,
      group: 'number-one-timeline',
    },
    {
      icon: IconCrown,
      label: t('stats.visualizations.sidebar.rankDominance'),
      path: `/stats/visualizations/top-rank-leaders/${currentType}`,
      group: 'top-rank-leaders',
    },
    {
      icon: IconCoins,
      label: t('stats.visualizations.sidebar.pointsDominance'),
      path: `/stats/visualizations/top-points-leaders/${currentType}`,
      group: 'top-points-leaders',
    },
    {
      icon: IconHeadphones,
      label: t('stats.visualizations.sidebar.weeklyPlays'),
      path: `/stats/visualizations/top-weekly-plays/${currentType}`,
      group: 'top-weekly-plays',
    },
    {
      icon: IconRocket,
      label: t('stats.visualizations.sidebar.weeklyDebuts'),
      path: `/stats/visualizations/top-weekly-debuts/${currentType}`,
      group: 'top-weekly-debuts',
    },
  ];

  const isActive = (item: NavItem) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    if (!item.group) return false;
    return location.pathname.includes(item.group);
  };

  const activeItem = navItems.find(item => !item.divider && item.path && isActive(item));
  const headerTitle = activeItem?.label || t('stats.visualizations.sidebar.title');
  const headerIcon = (activeItem?.icon || IconGraph) as any;

  return (
    <Container size={isMobile ? '100%' : vizPreferences.containerSize} className="noPaddingMobile">
      <CreateHeader
        pageTitle={headerTitle}
        icon={headerIcon}
        onDrawerToggle={() => setDrawerOpened(prev => !prev)}
        drawerToggleLabel={t('stats.sidebar.toggleDrawer')}
        isSidebarVisible={statsPreferences.fixedSidebarEnabled}
      />

      <Flex gap="md" direction={{ base: 'column', md: 'row' }}>
        {/* Desktop Sidebar - Mantine handles visibility */}
        <StatsSidebar
          navItems={navItems}
          currentPath={location.pathname}
          title={t('stats.visualizations.sidebar.title')}
          drawerOpened={drawerOpened}
          onDrawerClose={() => setDrawerOpened(false)}
        />

        {/* Mobile Sidebar - Mantine handles visibility */}
        <MobileSidebar
          navItems={navItems}
          currentPath={location.pathname}
          title={t('stats.visualizations.sidebar.title')}
        />

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
              <Route path="number-one-timeline/:type" element={<NumberOneTimelineChart />} />
              <Route path="top-rank-leaders/:type" element={<TopRankLeadersChart />} />
              <Route path="top-points-leaders/:type" element={<TopPointsLeadersChart />} />
              <Route path="top-weekly-plays/:type" element={<TopWeeklyPlaysChart />} />
              <Route path="top-weekly-debuts/:type" element={<TopWeeklyDebutsChart />} />
              <Route path="*" element={<StatsVisualizationsOverview />} />
            </Routes>
          </Suspense>
        </Box>
      </Flex>
    </Container>
  );
};

export default StatsVisualizationsPage;
