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
  Grid,
  Divider
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
  IconCalendarUp
} from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { getCardBackgroundByMode } from '../theme/modes';
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

const StatsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [opened, { toggle }] = useDisclosure(false);
  const theme = useMantineTheme();
  const themeMode = useSelector((state: any) => state.theme?.value || 'dark');
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
      exact: true
    },
    { divider: true },
    { 
      icon: IconCrown, 
      label: t('stats.timesAtTopByArtist.title', { n: 1 }), 
      path: '/stats/times_at_top_by_artist/1/track',
      group: 'times_at_top_by_artist'
    },
    { 
      icon: IconTrophy, 
      label: t('stats.rank.title', { n: 1 }), 
      path: '/stats/rank/1/track',
      group: 'rank'
    },
    { 
      icon: IconStar, 
      label: t('stats.timesAtRank.title', { n: 1 }), 
      path: '/stats/times_at_rank/1/track',
      group: 'times_at_rank'
    },
    { 
      icon: IconCalendarUp, 
      label: t('stats.timesAtTop.title', { n: trackCutoff }), 
      path: `/stats/times_at_top/${trackCutoff}/track`,
      group: 'times_at_top'
    },
    { divider: true },
    { 
      icon: IconRocket, 
      label: t('stats.debuts.title'), 
      path: '/stats/debuts/all/track',
      group: 'debuts'
    },
    { 
      icon: IconHeadphones, 
      label: t('stats.plays.title'), 
      path: '/stats/plays/all/track',
      group: 'plays'
    },
    { divider: true },
    { 
      icon: IconFlame, 
      label: t('stats.pak.title'), 
      path: '/stats/pak',
      group: 'pak'
    },
    { 
      icon: IconCoin, 
      label: t('stats.points.title'), 
      path: '/stats/points/track',
      group: 'points'
    }
  ];

  const isActive = (item: typeof navItems[0]) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    // Match the group more precisely to avoid false positives
    // e.g., times_at_top_by_artist shouldn't match times_at_top
    const pathParts = location.pathname.split('/');
    return pathParts.some(part => part === item.group);
  };

  if (!chart) {
    return (
      <Container size="100%" py="xl" className="noPaddingMobile">
        <Center>
          <Stack align="center" gap="md">
            <Text>{t('errors.selectActiveChart')}</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="100%" className="noPaddingMobile">
      <CreateHeader pageTitle={t('stats.title')} icon={IconChartBar} />
      
      <Grid gutter="md">
        {/* Sidebar */}
        <Grid.Col span={{ base: 12, md: 3 }}>
          <Card p="md" style={{ backgroundColor: bgColor, position: 'sticky', top: 70 }}>
            <Flex justify="space-between" align="center" mb={{ base: 0 }}>
              <Title order={4} hiddenFrom="md">{t('stats.sidebar.title')}</Title>
              <ActionIcon 
                variant="subtle" 
                onClick={toggle}
                hiddenFrom="md"
              >
                <IconMenu2 size={18} />
              </ActionIcon>
            </Flex>
            
            <ScrollArea.Autosize mah={600} type="auto">
              <Stack gap={0} display={{ base: opened ? 'flex' : 'none', md: 'flex' }}>
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
                    />
                  )
                )}
              </Stack>
            </ScrollArea.Autosize>
          </Card>
        </Grid.Col>

        {/* Main Content */}
        <Grid.Col span={{ base: 12, md: 9 }}>
          <Suspense fallback={
            <Center py="xl">
              <Stack align="center" gap="md">
                <Loader size="lg" />
                <Text>{t('stats.loading')}</Text>
              </Stack>
            </Center>
          }>
            <Routes>
              <Route path="/" element={<StatsHome />} />
              <Route path="/rank/:rank/:type" element={<RankStats />} />
              <Route path="/pak" element={<PerfectAllKillStats />} />
              <Route path="/times_at_rank/:rank/:type" element={<TimesAtRankStats />} />
              <Route path="/times_at_top/:topN/:type" element={<TimesAtTopStats />} />
              <Route path="/plays/:position/:type" element={<PlaysStats />} />
              <Route path="/debuts/:position/:type" element={<DebutsStats />} />
              <Route path="/points/:type" element={<PointsStats />} />
              <Route path="/times_at_top_by_artist/:rank/:type" element={<TimesAtTopByArtistStats />} />
            </Routes>
          </Suspense>
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default StatsPage;
