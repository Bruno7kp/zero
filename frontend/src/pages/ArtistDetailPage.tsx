import React, { useMemo, useState } from 'react';
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
  Tabs,
  Box,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { IconArrowLeft, IconMicrophone } from '@tabler/icons-react';
import { decodeLastFmSlug } from '../utils/urlEncoding';
import { useEntityStats } from '../hooks/useEntityStats';
import { useSpotifyImage } from '../hooks/useSpotifyImage';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../services/SpotifyApi';
import CreateHeader from '../components/createChart/CreateHeader';
import EntityChartRun from '../components/library/EntityChartRun';
import EntityWaffleRun from '../components/library/EntityWaffleRun';
import { ChartRun } from '../components/ChartRun';
import { ImageEditModal } from '../components/dialogs/ImageEditModal';

export const ArtistDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const { artist } = useParams<{ artist: string }>();
  const navigate = useNavigate();
  const charts = useSelector((state: any) => state.charts.charts);
  const activeChartId = useSelector((state: any) => state.charts.activeChartId);
  const chart = useMemo(
    () => charts.find((c: any) => c.id === activeChartId) || null,
    [charts, activeChartId]
  );

  // Decode the artist name from URL
  const artistName = artist ? decodeLastFmSlug(artist) : '';
  const entityId = `artist-${artistName}-`;

  // Fetch stats
  const { loading, stats, error } = useEntityStats(chart, 'artist', entityId);
  const cutoff = chart?.artist_cutoff || chart?.music_cutoff || 100;

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);

  // Fetch Spotify image
  const { imageUrl } = useSpotifyImage({
    entityId,
    name: artistName,
    artist: artistName,
    type: 'artist',
    clientId: SPOTIFY_TOKEN,
    clientSecret: SPOTIFY_SECRET,
  });
  const effectiveImageUrl = customImageUrl ?? imageUrl ?? undefined;

  // Prepare chart data for visualization
  const chartRun = useMemo(() => stats?.chartRun ?? [], [stats]);
  const [chartView, setChartView] = useState<'timeline' | 'line' | 'waffle'>('timeline');
  const chartRunLatestWeek = chartRun.length > 0 ? chartRun[chartRun.length - 1]?.week : undefined;
  const timelineRun = useMemo(
    () =>
      chartRun.map(item => ({
        week: item.week,
        position: item.position ?? cutoff + 1,
        plays: item.plays,
      })),
    [chartRun, cutoff]
  );
  const handleBack = () => navigate('/library');
  const headerBackButton = (
    <Button
      leftSection={<IconArrowLeft size={16} />}
      variant="subtle"
      size="xs"
      onClick={handleBack}
    >
      {t('library.detail.backToLibrary')}
    </Button>
  );

  if (!chart) {
    return (
      <Container className="noPaddingMobile">
        <Center>
          <Text>{t('errors.selectActiveChart')}</Text>
        </Center>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="noPaddingMobile">
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
      <Container className="noPaddingMobile">
        <Stack gap="md">
          <Button leftSection={<IconArrowLeft size={16} />} variant="subtle" onClick={handleBack}>
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
    <Container className="noPaddingMobile">
      <CreateHeader
        pageTitle={artistName}
        icon={IconMicrophone}
        leftSection={headerBackButton}
        showSettings={false}
      />

      <Stack gap="md">
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group wrap="nowrap" gap="lg">
            <Avatar
              src={effectiveImageUrl}
              alt={artistName}
              size={120}
              radius="md"
              onClick={() => setImageModalOpen(true)}
              style={{ cursor: 'pointer' }}
            />
            <Stack gap="xs" style={{ flex: 1 }}>
              <Title order={2}>{stats.name}</Title>
              <Group gap="xs">
                <Badge color="blue" variant="light">
                  {t('library.detail.artist')}
                </Badge>
              </Group>
            </Stack>
          </Group>
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Title order={3} mb="md">
            {t('library.detail.overview')}
          </Title>
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  {t('library.detail.peakPosition')}
                </Text>
                <Text size="xl" fw={700}>
                  #{stats.peak}
                </Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  {t('library.detail.totalWeeks')}
                </Text>
                <Text size="xl" fw={700}>
                  {stats.totalWeeks}
                </Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  {t('library.detail.weeksAtPeak')}
                </Text>
                <Text size="xl" fw={700}>
                  {stats.weeksAtPeak}
                </Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  {t('library.detail.totalPlays')}
                </Text>
                <Text size="xl" fw={700}>
                  {stats.totalPlays.toLocaleString()}
                </Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  {t('library.detail.firstAppearance')}
                </Text>
                <Text size="lg" fw={600}>
                  {stats.firstAppearance}
                </Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <Stack gap={4}>
                <Text size="sm" c="dimmed">
                  {t('library.detail.lastAppearance')}
                </Text>
                <Text size="lg" fw={600}>
                  {stats.lastAppearance}
                </Text>
              </Stack>
            </Grid.Col>
          </Grid>
        </Card>

        {chartRun.length > 0 && (
          <Card shadow="sm" padding="lg" radius="md" withBorder>
            <Title order={3} mb="md">
              {t('library.detail.chartRun')}
            </Title>
            <Tabs
              value={chartView}
              onChange={value =>
                setChartView((value as 'timeline' | 'line' | 'waffle') || 'timeline')
              }
              keepMounted={false}
            >
              <Tabs.List>
                <Tabs.Tab value="timeline">{t('library.detail.chartRunTabs.timeline')}</Tabs.Tab>
                <Tabs.Tab value="line">{t('library.detail.chartRunTabs.line')}</Tabs.Tab>
                <Tabs.Tab value="waffle">{t('library.detail.chartRunTabs.waffle')}</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="timeline">
                <Box mt="md">
                  <ChartRun
                    run={timelineRun}
                    chartType="artist"
                    highlightWeek={chartRunLatestWeek}
                  />
                </Box>
              </Tabs.Panel>
              <Tabs.Panel value="line">
                <Box mt="md">
                  <EntityChartRun data={chartRun} cutoff={cutoff} colorKey={entityId} />
                </Box>
              </Tabs.Panel>
              <Tabs.Panel value="waffle">
                <Box mt="md">
                  <EntityWaffleRun data={chartRun} cutoff={cutoff} />
                </Box>
              </Tabs.Panel>
            </Tabs>
          </Card>
        )}
      </Stack>

      <ImageEditModal
        opened={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        entityId={entityId}
        name={artistName}
        artistName={artistName}
        imageUrl={effectiveImageUrl || ''}
        type="artist"
        clientId={SPOTIFY_TOKEN}
        clientSecret={SPOTIFY_SECRET}
        onImageChange={url => setCustomImageUrl(url || null)}
      />
    </Container>
  );
};

export default ArtistDetailPage;
