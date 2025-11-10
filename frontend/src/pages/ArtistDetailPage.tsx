import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Anchor,
  Avatar,
  Box,
  Button,
  Card,
  Center,
  Container,
  Grid,
  Group,
  Loader,
  Stack,
  Tabs,
  Table,
  Text,
  Title,
  useMantineTheme,
  useComputedColorScheme,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { IconArrowLeft, IconMicrophone } from '@tabler/icons-react';
import { decodeLastFmSlug, encodeLastFmSlug } from '../utils/urlEncoding';
import { useEntityStats } from '../hooks/useEntityStats';
import { useSpotifyImage } from '../hooks/useSpotifyImage';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../services/SpotifyApi';
import CreateHeader from '../components/createChart/CreateHeader';
import EntityChartRun from '../components/library/EntityChartRun';
import EntityWaffleRun from '../components/library/EntityWaffleRun';
import { ChartRun } from '../components/ChartRun';
import { ImageEditModal } from '../components/dialogs/ImageEditModal';
import { useArtistEntities } from '../hooks/useArtistEntities';
import { StatsBox } from '../components/StatsBox';

type RootState = {
  charts: {
    charts: any[];
    activeChartId: number | null;
  };
};

export const ArtistDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useMantineTheme();
  const colorScheme = useComputedColorScheme('dark', { getInitialValueInEffect: true });
  const anchorColor = colorScheme === 'dark' ? theme.white : theme.black;
  const { artist } = useParams<{ artist: string }>();
  const navigate = useNavigate();
  const charts = useSelector((state: RootState) => state.charts.charts);
  const activeChartId = useSelector((state: RootState) => state.charts.activeChartId);

  const chart = useMemo(
    () => charts.find((c: any) => c.id === activeChartId) || null,
    [charts, activeChartId]
  );

  const artistName = artist ? decodeLastFmSlug(artist) : '';
  const entityId = `artist-${artistName}-`;

  const { loading, stats, error } = useEntityStats(chart, 'artist', entityId);
  const cutoff = chart?.artist_cutoff || chart?.music_cutoff || 100;

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);

  const { imageUrl } = useSpotifyImage({
    entityId,
    name: artistName,
    artist: artistName,
    type: 'artist',
    clientId: SPOTIFY_TOKEN,
    clientSecret: SPOTIFY_SECRET,
  });

  const effectiveImageUrl = customImageUrl ?? imageUrl ?? undefined;
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

  const artistDisplayName = stats?.name || artistName;
  const artistSlug = artistDisplayName ? encodeLastFmSlug(artistDisplayName) : '';

  const { loading: albumsLoading, entities: topAlbums } = useArtistEntities(
    chart,
    'album',
    artistDisplayName,
    { limit: 10 }
  );
  const { loading: tracksLoading, entities: topTracks } = useArtistEntities(
    chart,
    'track',
    artistDisplayName,
    { limit: 10 }
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
            <Text>{error || t('errors.entityNotFound')}</Text>
          </Center>
        </Stack>
      </Container>
    );
  }

  const fallbackTotals = (() => {
    const summary = { top5: 0, top10: 0, withinCutoff: 0 };
    chartRun.forEach(entry => {
      if (typeof entry.position !== 'number') return;
      const pos = entry.position;
      if (pos <= 5) summary.top5 += 1;
      if (pos <= 10) summary.top10 += 1;
      if (cutoff != null) {
        if (pos <= cutoff) summary.withinCutoff += 1;
      } else {
        summary.withinCutoff += 1;
      }
    });
    return summary;
  })();

  const chartTotals =
    ((stats.stats as Record<string, any> | undefined)?.totals as
      | Record<string, number>
      | undefined) ?? {};
  const totals = {
    top5: chartTotals.top5 ?? fallbackTotals.top5,
    top10: chartTotals.top10 ?? fallbackTotals.top10,
    withinCutoff: chartTotals.withinCutoff ?? fallbackTotals.withinCutoff,
  };
  const top1Weeks = stats.peak === 1 ? stats.weeksAtPeak ?? 0 : 0;

  return (
    <Container className="noPaddingMobile">
      <CreateHeader
        pageTitle={t('library.detail.artist')}
        icon={IconMicrophone}
        leftSection={headerBackButton}
        showSettings={false}
      />

      <Stack gap="md">
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="lg">
            <Group wrap="nowrap" gap="lg">
              <Avatar
                src={effectiveImageUrl}
                alt={artistName}
                size={170}
                radius="md"
                onClick={() => setImageModalOpen(true)}
                style={{ cursor: 'pointer' }}
              />
              <Stack gap="xs" style={{ flex: 1 }}>
                <Title order={1}>{stats.name}</Title>
              </Stack>
            </Group>

            <Grid>
              <StatsBox
                label={t('library.detail.peakPosition')}
                value={stats.peak ?? '—'}
                span={{ base: 6, sm: 6, md: 3 }}
                valueClassName={stats.peak === 1 ? 'peak' : undefined}
                shadow="none"
              />
              <StatsBox
                label={t('library.detail.totalWeeks')}
                value={stats.totalWeeks ?? 0}
                span={{ base: 6, sm: 6, md: 3 }}
                shadow="none"
              />
              <StatsBox
                label={t('library.detail.totalPlays')}
                value={stats.totalPlays ?? 0}
                span={{ base: 6, sm: 6, md: 3 }}
                shadow="none"
              />
              <StatsBox
                label={t('charts.stats.points')}
                value={stats.totalPoints ?? 0}
                span={{ base: 6, sm: 6, md: 3 }}
                shadow="none"
              />
            </Grid>
          </Stack>
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
                  <ChartRun run={timelineRun} chartType="artist" />
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

        {chartRun.length > 0 && (
          <Card padding={0} radius="md" bg="transparent">
            <Grid>
              <StatsBox
                label={t('charts.stats.top1')}
                value={top1Weeks}
                span={{ base: 12, sm: 6, md: 3 }}
                shadow="none"
              />
              <StatsBox
                label={t('charts.stats.top5')}
                value={totals.top5 ?? 0}
                span={{ base: 12, sm: 6, md: 3 }}
                shadow="none"
              />
              <StatsBox
                label={t('charts.stats.top10')}
                value={totals.top10 ?? 0}
                span={{ base: 12, sm: 6, md: 3 }}
                shadow="none"
              />
              <StatsBox
                label={cutoff ? t('charts.stats.topX', { x: cutoff }) : t('charts.stats.topCutoff')}
                value={totals.withinCutoff ?? 0}
                span={{ base: 12, sm: 6, md: 3 }}
                shadow="none"
              />
            </Grid>
          </Card>
        )}

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between" align="center" mb="md">
            <Title order={3}>{t('library.detail.sections.albumsTitle')}</Title>
            {artistSlug && (
              <Button
                component={Link}
                to={`/library/music/${artistSlug}/+albums`}
                variant="light"
                size="xs"
                disabled={!topAlbums.length}
              >
                {t('library.detail.sections.viewAllAlbums')}
              </Button>
            )}
          </Group>
          {albumsLoading ? (
            <Center py="lg">
              <Loader size="sm" />
            </Center>
          ) : topAlbums.length === 0 ? (
            <Text size="sm" c="dimmed">
              {t('library.detail.sections.emptyAlbums')}
            </Text>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ textAlign: 'center' }}>#</Table.Th>
                  <Table.Th>{t('library.detail.sections.columnEntity')}</Table.Th>
                  <Table.Th style={{ textAlign: 'center' }}>
                    {t('library.detail.sections.columnPoints')}
                  </Table.Th>
                  <Table.Th style={{ textAlign: 'center' }}>
                    {t('library.detail.sections.columnWeeks')}
                  </Table.Th>
                  <Table.Th style={{ textAlign: 'center' }}>
                    {t('library.detail.sections.columnPeak')}
                  </Table.Th>
                  <Table.Th style={{ textAlign: 'center' }}>
                    {t('library.detail.sections.columnPlays')}
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {topAlbums.map((album: any, index: number) => (
                  <Table.Tr key={album.entityId || `${album.name}-${index}`}>
                    <Table.Td style={{ textAlign: 'center' }}>{index + 1}</Table.Td>
                    <Table.Td>
                      <Anchor
                        component={Link}
                        to={`/library/music/${artistSlug}/${encodeLastFmSlug(album.name)}`}
                        fw={600}
                        size="sm"
                        c={anchorColor}
                      >
                        {album.name}
                      </Anchor>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'center' }}>
                      {album.points.toLocaleString()}
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'center' }}>
                      {album.weeks.toLocaleString()}
                    </Table.Td>
                    <Table.Td
                      style={{ textAlign: 'center' }}
                      className={album.peak === 1 ? 'peak' : undefined}
                    >
                      {album.peak}
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'center' }}>
                      {album.totalPlays.toLocaleString()}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between" align="center" mb="md">
            <Title order={3}>{t('library.detail.sections.tracksTitle')}</Title>
            {artistSlug && (
              <Button
                component={Link}
                to={`/library/music/${artistSlug}/+tracks`}
                variant="light"
                size="xs"
                disabled={!topTracks.length}
              >
                {t('library.detail.sections.viewAllTracks')}
              </Button>
            )}
          </Group>
          {tracksLoading ? (
            <Center py="lg">
              <Loader size="sm" />
            </Center>
          ) : topTracks.length === 0 ? (
            <Text size="sm" c="dimmed">
              {t('library.detail.sections.emptyTracks')}
            </Text>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ textAlign: 'center' }}>#</Table.Th>
                  <Table.Th>{t('library.detail.sections.columnEntity')}</Table.Th>
                  <Table.Th style={{ textAlign: 'center' }}>
                    {t('library.detail.sections.columnPoints')}
                  </Table.Th>
                  <Table.Th style={{ textAlign: 'center' }}>
                    {t('library.detail.sections.columnWeeks')}
                  </Table.Th>
                  <Table.Th style={{ textAlign: 'center' }}>
                    {t('library.detail.sections.columnPeak')}
                  </Table.Th>
                  <Table.Th style={{ textAlign: 'center' }}>
                    {t('library.detail.sections.columnPlays')}
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {topTracks.map((track: any, index: number) => (
                  <Table.Tr key={track.entityId || `${track.name}-${index}`}>
                    <Table.Td style={{ textAlign: 'center' }}>{index + 1}</Table.Td>
                    <Table.Td>
                      <Anchor
                        component={Link}
                        to={`/library/music/${artistSlug}/_/${encodeLastFmSlug(track.name)}`}
                        fw={600}
                        size="sm"
                        c={anchorColor}
                      >
                        {track.name}
                      </Anchor>
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'center' }}>
                      {track.points.toLocaleString()}
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'center' }}>
                      {track.weeks.toLocaleString()}
                    </Table.Td>
                    <Table.Td
                      style={{ textAlign: 'center' }}
                      className={track.peak === 1 ? 'peak' : undefined}
                    >
                      {track.peak}
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'center' }}>
                      {track.totalPlays.toLocaleString()}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Card>
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
