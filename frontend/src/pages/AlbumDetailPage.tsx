import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
import { IconArrowLeft, IconDisc } from '@tabler/icons-react';
import { decodeLastFmSlug, encodeLastFmSlug } from '../utils/urlEncoding';
import { useEntityStats } from '../hooks/useEntityStats';
import { useSpotifyImage } from '../hooks/useSpotifyImage';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../services/SpotifyApi';
import CreateHeader from '../components/createChart/CreateHeader';
import EntityChartRun from '../components/library/EntityChartRun';
import EntityWaffleRun from '../components/library/EntityWaffleRun';
import { ChartRun } from '../components/ChartRun';
import { ImageEditModal } from '../components/dialogs/ImageEditModal';
import { StatsBox } from '../components/StatsBox';

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
  const entityId = `album-${albumName}-${artistName}`;

  // Fetch stats
  const { loading, stats, error } = useEntityStats(chart, 'album', entityId);
  const cutoff = chart?.album_cutoff || chart?.music_cutoff || 100;

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);

  // Fetch Spotify image
  const { imageUrl } = useSpotifyImage({
    entityId,
    name: albumName,
    artist: artistName,
    type: 'album',
    clientId: SPOTIFY_TOKEN,
    clientSecret: SPOTIFY_SECRET,
  });
  const effectiveImageUrl = customImageUrl ?? imageUrl ?? undefined;

  // Prepare chart data for visualization
  const chartRun = useMemo(() => stats?.chartRun ?? [], [stats]);
  const [chartView, setChartView] = useState<'timeline' | 'line' | 'waffle'>('timeline');

  const timelineRun = useMemo(
    () =>
      chartRun
        .filter(item => typeof item.position === 'number')
        .map(item => ({
          week: item.week,
          position: item.position as number,
          plays: item.plays,
        })),
    [chartRun]
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
        pageTitle={albumName}
        icon={IconDisc}
        leftSection={headerBackButton}
        showSettings={false}
      />

      <Stack gap="md">
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group wrap="nowrap" gap="lg">
            <Avatar
              src={effectiveImageUrl}
              alt={albumName}
              size={250}
              radius="md"
              onClick={() => setImageModalOpen(true)}
              style={{ cursor: 'pointer' }}
            />
            <Stack gap="xs" style={{ flex: 1 }}>
              <Title order={1}>{stats.name}</Title>
              {stats.artistName && (
                <Text
                  size="lg"
                  c="dimmed"
                  component={Link}
                  to={`/library/music/${encodeLastFmSlug(stats.artistName)}`}
                  style={{ textDecoration: 'none' }}
                >
                  {stats.artistName}
                </Text>
              )}
              <Group gap="xs">
                <Badge color="green" variant="light">
                  {t('library.detail.album')}
                </Badge>
              </Group>
            </Stack>
          </Group>
        </Card>

        <Card shadow="sm" padding={0} radius="md" bg={'transparent'}>
          <Grid>
            <StatsBox
              label={t('library.detail.peakPosition')}
              value={stats.peak != null ? stats.peak : '—'}
              span={{ base: 12, sm: 6, md: 3 }}
              color="blue"
              format="plain"
              valueClassName={stats.peak === 1 ? 'peak' : undefined}
            />
            <StatsBox
              label={t('library.detail.totalWeeks')}
              value={stats.totalWeeks ?? 0}
              span={{ base: 12, sm: 6, md: 3 }}
            />
            <StatsBox
              label={t('library.detail.weeksAtPeak')}
              value={stats.weeksAtPeak ?? 0}
              span={{ base: 12, sm: 6, md: 3 }}
            />
            <StatsBox
              label={t('library.detail.totalPlays')}
              value={stats.totalPlays ?? 0}
              span={{ base: 12, sm: 6, md: 3 }}
            />
            <StatsBox
              label={t('library.detail.firstAppearance')}
              value={stats.firstAppearance || '—'}
              span={{ base: 12, sm: 6, md: 3 }}
              format="plain"
            />
            <StatsBox
              label={t('library.detail.lastAppearance')}
              value={stats.lastAppearance || '—'}
              span={{ base: 12, sm: 6, md: 3 }}
              format="plain"
            />
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
                  <ChartRun run={timelineRun} chartType="album" />
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
        name={albumName}
        artistName={artistName}
        imageUrl={effectiveImageUrl || ''}
        type="album"
        clientId={SPOTIFY_TOKEN}
        clientSecret={SPOTIFY_SECRET}
        onImageChange={url => setCustomImageUrl(url || null)}
      />
    </Container>
  );
};

export default AlbumDetailPage;
