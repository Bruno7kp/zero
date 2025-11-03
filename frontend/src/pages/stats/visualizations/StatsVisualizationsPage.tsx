import React, { Suspense, lazy } from 'react';
import {
  Container,
  Flex,
  Box,
  Center,
  Loader,
  Text,
  Stack,
} from '@mantine/core';
import {
  IconGraph,
  IconTimeline,
  IconCrown,
  IconChartBar,
} from '@tabler/icons-react';
import { Link, useLocation, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import CreateHeader from '../../../components/createChart/CreateHeader';
import { useVisualizationPreferences } from '../../../hooks/useVisualizationPreferences';
import { useIsMobile } from '../../../hooks/useIsMobile';
import StatsSidebar, { type NavItem } from '../../../components/stats/StatsSidebar';

const StatsVisualizationsOverview = lazy(() => import('./StatsVisualizationsOverview'));
const NumberOneTimelineChart = lazy(() => import('./NumberOneTimelineChart'));
const TopRankLeadersChart = lazy(() => import('./TopRankLeadersChart'));

const StatsVisualizationsPage: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { preferences: vizPreferences } = useVisualizationPreferences();
  const isMobile = useIsMobile();

  const navItems: NavItem[] = [
    {
      icon: IconGraph,
      label: t('stats.visualizations.sidebar.overview'),
      path: '/stats/visualizations',
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

  const activeItem = navItems.find(item => !item.divider && item.path && isActive(item));
  const headerTitle = activeItem?.label || t('stats.visualizations.sidebar.title');
  const headerIcon = (activeItem?.icon || IconGraph) as any;

  return (
    <Container size={isMobile ? '100%' : vizPreferences.containerSize} className="noPaddingMobile">
      <CreateHeader pageTitle={headerTitle} icon={headerIcon} />

      <Flex gap="md" direction={{ base: 'column', md: 'row' }}>
        {!isMobile && (
          <StatsSidebar
            navItems={navItems}
            currentPath={location.pathname}
            title={t('stats.visualizations.sidebar.title')}
          />
        )}

        {isMobile && (
          <MobileSidebar navItems={navItems} currentPath={location.pathname} />
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

const MobileSidebar: React.FC<{ navItems: NavItem[]; currentPath: string }> = ({ navItems, currentPath }) => {
  const { t } = useTranslation();
  const [opened, setOpened] = React.useState(false);
  const themeMode = useSelector((state: any) => state.theme?.value || 'dark');

  const isActive = (item: NavItem) => {
    if (item.exact) {
      return currentPath === item.path;
    }
    if (!item.group) return false;
    const pathParts = currentPath.split('/');
    return pathParts.some(part => part === item.group);
  };

  return (
    <Box>
      <Box
        p="md"
        style={{
          backgroundColor: themeMode === 'dark' ? 'var(--mantine-color-dark-6)' : 'var(--mantine-color-gray-0)',
          borderRadius: 'var(--mantine-radius-md)',
          border: '1px solid var(--mantine-color-dark-4)',
        }}
      >
        <Box onClick={() => setOpened(!opened)} style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text fw={500}>{t('stats.visualizations.sidebar.title')}</Text>
          <Box>{opened ? '▲' : '▼'}</Box>
        </Box>

        {opened && (
          <Stack gap={0} mt="md">
            {navItems.map((item, index) =>
              item.divider ? (
                <Box key={index} style={{ height: 1, backgroundColor: 'var(--mantine-color-dark-4)', margin: '8px 0' }} />
              ) : (
                <Box
                  key={index}
                  component={Link}
                  to={item.path!}
                  p="sm"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: isActive(item) ? 'var(--mantine-color-blue-6)' : 'inherit',
                    backgroundColor: isActive(item) ? 'var(--mantine-color-blue-1)' : 'transparent',
                  }}
                  onClick={(e: React.MouseEvent) => {
                    if (
                      !(e as any).ctrlKey &&
                      !(e as any).metaKey &&
                      !(e as any).shiftKey &&
                      !(e as any).altKey
                    ) {
                      setOpened(false);
                    }
                  }}
                >
                  {item.icon && <item.icon size={18} />}
                  <Text size="sm">{item.label}</Text>
                </Box>
              )
            )}
          </Stack>
        )}
      </Box>
    </Box>
  );
};

export default StatsVisualizationsPage;
