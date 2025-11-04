import React from 'react';
import {
  Card,
  Stack,
  Text,
  Loader,
  Center,
  Flex,
  Button,
  Title,
  useMantineTheme,
  Alert,
  Anchor,
} from '@mantine/core';
import { IconArrowRight, IconInfoCircle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import MiniNumberOneBars from '../../../components/visualizations/MiniNumberOneBars';
import MiniBarWithImage from '../../../components/visualizations/MiniBarWithImage';
import { db } from '../../../db/indexedDb';
import { getTimesAtRank } from '../../../utils/statsQueries';
import { getCardBackgroundByMode, type ThemeMode } from '../../../theme/modes';
import { fetchSpotifyImagesBatch } from '../../../utils/spotifyImageLoader';
import { ChartSyncProgress } from '../../../components/chartPage/ChartSyncProgress';
import { ChartWeekTop1Summary } from '../../../components/chartPage/ChartWeekTop1Summary';
import { ChartLiveSummary } from '../../../components/chartPage/ChartLiveSummary';
import Masonry from 'react-masonry-css';

const LATEST_NUMBER_ONE_COUNT = 8;

interface RankLeaderPreview {
  id: string;
  value: number;
  entityId: string;
  artistName?: string;
  imageUrl?: string;
}

const StatsVisualizationsOverview: React.FC = () => {
  const { t } = useTranslation();
  const theme = useMantineTheme();
  const charts = useSelector((state: any) => state.charts.charts);
  const activeChartId = useSelector((state: any) => state.charts.activeChartId);
  const chart = charts.find((c: any) => c.id === activeChartId);
  const themeMode = useSelector((state: any) => state.theme?.value || 'dark') as ThemeMode;
  const cardBg = getCardBackgroundByMode(theme, themeMode);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const breakpointColumns = React.useMemo(
    () => ({
      default: 2,
      1100: 2,
      700: 1,
      500: 1,
    }),
    []
  );

  const [loading, setLoading] = React.useState(false);
  const [numberOneTrend, setNumberOneTrend] = React.useState<
    Array<{
      week: string;
      plays: number;
      name: string;
      artistName?: string;
      imageUrl?: string;
    }>
  >([]);
  const [rankLeaders, setRankLeaders] = React.useState<RankLeaderPreview[]>([]);

  React.useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (!chart) return;
      setLoading(true);
      try {
        const chartId = String(chart.id);

        const rankOneCollection = db.charts_data
          .where('[chartId+chartType]')
          .equals([chartId, 'track'])
          .and(item => item.rank === 1);

        const rankOne = await rankOneCollection.sortBy('week');
        const lastNumberOnes = rankOne.slice(-LATEST_NUMBER_ONE_COUNT);

        const lastImages = await fetchSpotifyImagesBatch(
          lastNumberOnes.map(item => ({
            entityId: item.entityId,
            name: item.name,
            artistName: item.artistName,
            type: 'track',
          }))
        );

        const leaders = await getTimesAtRank({
          chartId,
          chartType: 'track',
          rank: 1,
        });

        const topLeaders = leaders.slice(0, 8);
        const images = await fetchSpotifyImagesBatch(
          topLeaders.map(entity => ({
            entityId: entity.entityId,
            name: entity.name,
            artistName: entity.artistName,
            type: 'track',
          }))
        );

        if (!mounted) return;
        setNumberOneTrend(
          lastNumberOnes.map(item => ({
            week: item.week,
            plays: item.plays,
            name: item.name,
            artistName: item.artistName,
            imageUrl: lastImages[item.entityId],
          }))
        );
        setRankLeaders(
          topLeaders.map(entity => ({
            id: entity.name,
            value: entity.count,
            entityId: entity.entityId,
            artistName: entity.artistName,
            imageUrl: images[entity.entityId],
          }))
        );
      } catch (error) {
        console.error('[visualizations] Failed to load overview data', error);
        if (mounted) {
          setNumberOneTrend([]);
          setRankLeaders([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [chart]);

  if (!chart) {
    return (
      <Stack gap="lg">
        <Alert icon={<IconInfoCircle />} title={t('errors.warning')}>
          <Text>{t('errors.selectActiveChart')}</Text>
          {activeChartId === null && (
            <Text mt="sm">
              <Anchor component={Link} to="/settings">
                {t('errors.noActiveChart')}
              </Anchor>
            </Text>
          )}
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <Masonry
        breakpointCols={breakpointColumns}
        className="masonry-grid"
        columnClassName="masonry-column"
      >
        <ChartSyncProgress
          key="sync-progress"
          chart={chart}
          onSyncComplete={() => setRefreshKey(previous => previous + 1)}
        />

        <ChartWeekTop1Summary key="top1-summary" chartId={`${chart.id}`} refreshKey={refreshKey} />
        <ChartLiveSummary key="live-summary" />

        {loading ? (
          <Card key="visualizations-loading" withBorder p="lg" style={{ background: cardBg }}>
            <Center py="xl">
              <Loader size="lg" />
            </Center>
          </Card>
        ) : null}

        {!loading && (
          <Card key="latest-number-one" withBorder p="lg" style={{ background: cardBg }}>
            <Flex align="center" gap="md" mb="sm">
              <div style={{ flex: 1 }}>
                <Title order={4}>{t('stats.visualizations.overview.latestNumberOnePlays')}</Title>
                <Text size="sm" c="dimmed">
                  {t('stats.visualizations.overview.latestNumberOnePlaysDescription', {
                    weeks: numberOneTrend.length,
                  })}
                </Text>
              </div>
              <Button
                variant="light"
                size="xs"
                component={Link}
                to="/stats/visualizations/number-one-timeline"
                rightSection={<IconArrowRight size={14} />}
              >
                {t('stats.visualizations.actions.viewDetail')}
              </Button>
            </Flex>
            <MiniNumberOneBars
              items={numberOneTrend.map(item => ({
                id: item.week,
                value: item.plays,
                imageUrl: item.imageUrl,
                subtitle: `${item.name}${item.artistName ? ` • ${item.artistName}` : ''}`,
                colorKey: item.artistName || item.name,
              }))}
              tooltipTitle={t('stats.visualizations.overview.latestNumberOneTooltip')}
              height={140}
            />
          </Card>
        )}

        {!loading && (
          <Card key="rank-dominance" withBorder p="lg" style={{ background: cardBg }}>
            <Flex align="center" gap="md" mb="sm">
              <div style={{ flex: 1 }}>
                <Title order={4}>{t('stats.visualizations.overview.rankDominance')}</Title>
                <Text size="sm" c="dimmed">
                  {t('stats.visualizations.overview.rankDominanceDescription')}
                </Text>
              </div>
              <Button
                variant="light"
                size="xs"
                component={Link}
                to="/stats/visualizations/top-rank-leaders"
                rightSection={<IconArrowRight size={14} />}
              >
                {t('stats.visualizations.actions.viewDetail')}
              </Button>
            </Flex>
            <MiniBarWithImage
              items={rankLeaders.map(item => ({
                id: item.id,
                value: item.value,
                imageUrl: item.imageUrl,
                subtitle: item.artistName,
                colorKey: item.artistName,
              }))}
              height={160}
            />
          </Card>
        )}
      </Masonry>
    </Stack>
  );
};

export default StatsVisualizationsOverview;
