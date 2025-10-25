// Main stats page with sidebar and routing
import React, { Suspense, lazy } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { 
  AppShell, 
  Container, 
  Title, 
  Text, 
  Loader, 
  Center,
  Stack,
  NavLink,
  ScrollArea,
  Box,
  Burger,
  Group,
  useMantineColorScheme
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
  IconCrown
} from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { getCardBackgroundByMode } from '../theme/modes';

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
  const [opened, { toggle, close }] = useDisclosure(false);
  const { colorScheme } = useMantineColorScheme();
  const themeMode = useSelector((state: any) => state.theme?.value || 'dark');
  const bgColor = getCardBackgroundByMode(themeMode, colorScheme);

  const charts = useSelector((state: any) => state.charts.charts);
  const activeChartId = useSelector((state: any) => state.charts.activeChartId);
  const chart = charts.find((c: any) => c.id === activeChartId);

  // Navigation items
  const navItems = [
    { 
      icon: IconChartBar, 
      label: t('stats.sidebar.overview'), 
      path: '/stats',
      exact: true
    },
    { 
      icon: IconTrophy, 
      label: t('stats.rank.title', { n: 1 }), 
      path: '/stats/rank/1/artist',
      group: 'rank'
    },
    { 
      icon: IconFlame, 
      label: t('stats.pak.title'), 
      path: '/stats/pak',
      group: 'pak'
    },
    { 
      icon: IconStar, 
      label: t('stats.timesAtRank.title', { n: 1 }), 
      path: '/stats/times_at_rank/1/artist',
      group: 'times_at_rank'
    },
    { 
      icon: IconStar, 
      label: t('stats.timesAtTop.title', { n: 10 }), 
      path: '/stats/times_at_top/10/artist',
      group: 'times_at_top'
    },
    { 
      icon: IconHeadphones, 
      label: t('stats.plays.title'), 
      path: '/stats/plays/all/artist',
      group: 'plays'
    },
    { 
      icon: IconRocket, 
      label: t('stats.debuts.title'), 
      path: '/stats/debuts/all/artist',
      group: 'debuts'
    },
    { 
      icon: IconCoin, 
      label: t('stats.points.title'), 
      path: '/stats/points/artist',
      group: 'points'
    },
    { 
      icon: IconCrown, 
      label: t('stats.timesAtTopByArtist.title', { n: 1 }), 
      path: '/stats/times_at_top_by_artist/1/track',
      group: 'times_at_top_by_artist'
    }
  ];

  const isActive = (item: typeof navItems[0]) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.includes(`/${item.group}`);
  };

  if (!chart) {
    return (
      <Container size="md" py="xl">
        <Center>
          <Stack align="center" gap="md">
            <Text>{t('errors.selectActiveChart')}</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  return (
    <AppShell
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !opened }
      }}
      padding={0}
    >
      <AppShell.Navbar p="md" style={{ backgroundColor: bgColor }}>
        <AppShell.Section>
          <Title order={3} mb="md">{t('stats.sidebar.title')}</Title>
        </AppShell.Section>
        
        <AppShell.Section grow component={ScrollArea}>
          <Stack gap="xs">
            {navItems.map((item, index) => (
              <NavLink
                key={index}
                active={isActive(item)}
                label={item.label}
                leftSection={<item.icon size={18} />}
                onClick={() => {
                  navigate(item.path);
                  close();
                }}
              />
            ))}
          </Stack>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Box style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: bgColor }}>
          <Container size="xl" py="md">
            <Group>
              <Burger
                opened={opened}
                onClick={toggle}
                hiddenFrom="sm"
                size="sm"
              />
              <Title order={2}>{t('stats.title')}</Title>
            </Group>
          </Container>
        </Box>

        <Container size="xl" py="md">
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
        </Container>
      </AppShell.Main>
    </AppShell>
  );
};

export default StatsPage;
