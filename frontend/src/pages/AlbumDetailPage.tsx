import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Container,
  Title,
  Text,
  Card,
  Grid,
  Stack,
  Button,
  Loader,
  Center,
  Group,
  Avatar,
  Badge,
  Box,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { IconArrowLeft } from '@tabler/icons-react';
import { decodeLastFmSlug } from '../utils/urlEncoding';
import { useEntityStats } from '../hooks/useEntityStats';
import { useSpotifyImage } from '../hooks/useSpotifyImage';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../services/SpotifyApi';
import CreateHeader from '../components/createChart/CreateHeader';
import { LineChart } from '@mantine/charts';

export const AlbumDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { artist, album } = useParams<{ artist: string; album: string }>();
  const navigate = useNavigate();
  const charts = useSelector((state: any) => state.charts.charts);
  const activeChartId = useSelector((state: any) => state.charts.activeChartId);
  const chart = useMemo(
    () => charts.find((c: any) => c.id === activeChartId) || null,
    [charts, activeChartId]
  );

  // Decode the names from URL
  const artistName = artist ? decodeLastFmSlug(artist) : '';
  const albumName = album ? decodeLastFmSlug(album) : '';
  const entityId = `album-${artistName}-${albumName}`;

  // Fetch stats
  const { loading, stats, error } = useEntityStats(
    chart?.id,
    'album',
    entityId
  );

  // Fetch Spotify image
  const { imageUrl } = useSpotifyImage({
    entityId,
    name: albumName,
    artist: artistName,
    type: 'album',
    clientId: SPOTIFY_TOKEN,
    clientSecret: SPOTIFY_SECRET,
  });

  // Prepare chart data for visualization
  const chartData = useMemo(() => {
    if (!stats?.chartRun) return [];
    return stats.chartRun.map(item => ({
      week: item.week,
      position: 101 - item.position, // Invert for visual (higher is better)
      plays: item.plays,
    }));
  }, [stats]);

  if (!chart) {
    return (
      <Container size="lg" py="xl">
        <Center>
          <Text>{t('errors.selectActiveChart')}</Text>
        </Center>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container size="lg" py="xl">
        <Center>
          <Stack align="center" gap="md">
            <Loader size="xl" />
            <Text>{t('library.detail.loading')}</Text>
          </Stack>
        </Center>
      </Container>
    );
  }

  if (error || !stats) {
    return (
      <Container size="lg" py="xl">
        <Stack gap="md">
          <Button
            leftSection={<IconArrowLeft size={16} />}
            variant="subtle"
            onClick={() => navigate('/library')}
          >
            {t('library.detail.backToLibrary')}
          </Button>
          <Center>
            <Text>{error || t('library.detail.notFound')}</Text>
          </Center>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xl" py="md">
      <CreateHeader pageTitle={albumName} />
      
      <Stack gap="md">
        <Button
          leftSection={<IconArrowLeft size={16} />}
          variant="subtle"
          onClick={() => navigate('/library')}
          size="sm"
        >
          {t('library.detail.backToLibrary')}
        </Button>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group wrap="nowrap" gap="lg">
            <Avatar
              src={imageUrl}
              alt={albumName}
              size={120}
              radius="md"
            />
            <Stack gap="xs" style={{ flex: 1 }}>
              <Title order={2}>{stats.name}</Title>
              <Text size="lg" c="dimmed">{stats.artistName}</Text>
              <Group gap="xs">
                <Badge color="green" variant="light">
                  {t('library.detail.album')}
                </Badge>
              </Group>
            </Stack>
          </Group>
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Title order={3} mb="md">{t('library.detail.overview')}</Title>
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">{t('library.detail.peakPosition')}</Text>
                <Text size="xl" fw={700}>#{stats.peak}</Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">{t('library.detail.totalWeeks')}</Text>
                <Text size="xl" fw={700}>{stats.totalWeeks}</Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">{t('library.detail.weeksAtPeak')}</Text>
                <Text size="xl" fw={700}>{stats.weeksAtPeak}</Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">{t('library.detail.totalPlays')}</Text>
                <Text size="xl" fw={700}>{stats.totalPlays.toLocaleString()}</Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">{t('library.detail.firstAppearance')}</Text>
                <Text size="lg" fw={600}>{stats.firstAppearance}</Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">{t('library.detail.lastAppearance')}</Text>
                <Text size="lg" fw={600}>{stats.lastAppearance}</Text>
              </Stack>
            </Grid.Col>
          </Grid>
        </Card>

        {chartData.length > 0 && (
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={3} mb="md">{t('library.detail.chartRun')}</Title>
            <Box style={{ height: 400 }}>
              <LineChart
                h={380}
                data={chartData}
                dataKey="week"
                series={[
                  { name: 'position', color: 'green.6', label: 'Position' },
                ]}
                curveType="monotone"
                yAxisProps={{
                  domain: [0, 100],
                  tickFormatter: (value: number) => `#${101 - value}`,
                }}
                withLegend
                gridAxis="xy"
              />
            </Box>
          </Card>
        )}
      </Stack>
    </Container>
  );
};

export default AlbumDetailPage;
