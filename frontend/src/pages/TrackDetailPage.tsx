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
  Tabs,
  Box,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { IconArrowLeft, IconMusic } from '@tabler/icons-react';
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
import { CertificationBadge } from '../components/CertificationBadge';
import { getCardBackgroundByMode, type ThemeMode } from '../theme/modes';
import { useMantineTheme } from '@mantine/core';
import { TrackAchievements } from '../components/library/TrackAchievements';

export const TrackDetailPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useMantineTheme();
  const themeMode = useSelector((s: any) => (s.theme?.value as ThemeMode) || 'dark');
  const { artist, track } = useParams<{ artist: string; track: string }>();
  const navigate = useNavigate();
  const charts = useSelector((state: any) => state.charts.charts);
  const activeChartId = useSelector((state: any) => state.charts.activeChartId);
  const chart = useMemo(
    () => charts.find((c: any) => c.id === activeChartId) || null,
    [charts, activeChartId]
  );

  // Decode the names from URL
  const artistName = artist ? decodeLastFmSlug(artist) : '';
  const trackName = track ? decodeLastFmSlug(track) : '';
  const entityId = `track-${trackName}-${artistName}`;

  // Fetch stats
  const { loading, stats, error } = useEntityStats(chart, 'track', entityId);
  const cutoff = chart?.music_cutoff || chart?.track_cutoff || 100;

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);

  // Fetch Spotify image (track images come from album art)
  const { imageUrl } = useSpotifyImage({
    entityId,
    name: trackName,
    artist: artistName,
    type: 'track',
    clientId: SPOTIFY_TOKEN,
    clientSecret: SPOTIFY_SECRET,
  });
  const effectiveImageUrl = customImageUrl ?? imageUrl ?? undefined;

  // Define if card background should use custom color based on theme
  const useCustomCardBackground = themeMode !== 'dark';
  const cardBackground = useCustomCardBackground
    ? getCardBackgroundByMode(theme, themeMode)
    : undefined;

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
  const certificationTotals = {
    totalPoints: stats.totalPoints ?? 0,
    totalPlays: stats.totalPlays ?? 0,
  };

  return (
    <Container className="noPaddingMobile">
      <CreateHeader
        pageTitle={t('library.detail.track')}
        icon={IconMusic}
        leftSection={headerBackButton}
        showSettings={false}
      />

      <Stack gap="md">
        <Card
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
          style={{ background: cardBackground }}
        >
          <Stack gap="lg">
            <Group wrap="nowrap" align="stretch" gap="lg">
              <Avatar
                src={effectiveImageUrl}
                alt={trackName}
                size={170}
                radius="md"
                onClick={() => setImageModalOpen(true)}
                style={{
                  cursor: 'pointer',
                  flexShrink: 0,
                  alignSelf: 'flex-start',
                }}
              />

              <Stack
                gap="md"
                justify="space-around"
                style={{
                  flex: 1,
                }}
              >
                <Stack gap={4}>
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
                </Stack>

                {chart && (
                  <CertificationBadge
                    chart={chart}
                    chartType="track"
                    totals={certificationTotals}
                    entity={{
                      name: stats.name,
                      artistName: stats.artistName,
                    }}
                    username={chart?.lastfm_username}
                    dayOfWeek={chart?.day_of_week}
                    variant="icon"
                  />
                )}
              </Stack>
            </Group>
          </Stack>
        </Card>

        <Card
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
          style={{ background: cardBackground }}
        >
          <Grid>
            <StatsBox
              label={t('library.detail.peakPosition')}
              value={stats.peak != null ? stats.peak : '—'}
              span={{ base: 6, sm: 6, md: 3 }}
              valueClassName={stats.peak === 1 ? 'peak' : undefined}
              shadow="none"
              background={cardBackground}
            />
            <StatsBox
              label={t('library.detail.totalWeeks')}
              value={stats.totalWeeks ?? 0}
              span={{ base: 6, sm: 6, md: 3 }}
              shadow="none"
              background={cardBackground}
            />
            <StatsBox
              label={t('library.detail.totalPlays')}
              value={stats.totalPlays ?? 0}
              span={{ base: 6, sm: 6, md: 3 }}
              shadow="none"
              background={cardBackground}
            />
            <StatsBox
              label={t('charts.stats.points')}
              value={stats.totalPoints ?? 0}
              span={{ base: 6, sm: 6, md: 3 }}
              shadow="none"
              background={cardBackground}
            />
          </Grid>
        </Card>

        {chartRun.length > 0 && (
          <Card
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            style={{ background: cardBackground }}
          >
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
                  <ChartRun run={timelineRun} chartType="track" />
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
          <Card
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            style={{ background: cardBackground }}
          >
            <Grid>
              <StatsBox
                label={t('charts.stats.top1')}
                value={top1Weeks}
                span={{ base: 12, sm: 6, md: 3 }}
                shadow="none"
                background={cardBackground}
              />
              <StatsBox
                label={t('charts.stats.top5')}
                value={totals.top5 ?? 0}
                span={{ base: 12, sm: 6, md: 3 }}
                shadow="none"
                background={cardBackground}
              />
              <StatsBox
                label={t('charts.stats.top10')}
                value={totals.top10 ?? 0}
                span={{ base: 12, sm: 6, md: 3 }}
                shadow="none"
                background={cardBackground}
              />
              <StatsBox
                label={cutoff ? t('charts.stats.topX', { x: cutoff }) : t('charts.stats.topCutoff')}
                value={totals.withinCutoff ?? 0}
                span={{ base: 12, sm: 6, md: 3 }}
                shadow="none"
                background={cardBackground}
              />
            </Grid>
          </Card>
        )}

        {chartRun.length > 0 && (
          <TrackAchievements
            stats={{
              totalWeeks: stats.totalWeeks,
              peak: stats.peak,
              totalPoints: stats.totalPoints,
              totalPlays: stats.totalPlays,
            }}
            chartRun={chartRun}
            background={cardBackground}
          />
        )}
      </Stack>

      <ImageEditModal
        opened={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        entityId={entityId}
        name={trackName}
        artistName={artistName}
        imageUrl={effectiveImageUrl || ''}
        type="track"
        clientId={SPOTIFY_TOKEN}
        clientSecret={SPOTIFY_SECRET}
        onImageChange={url => setCustomImageUrl(url || null)}
      />
    </Container>
  );
};

export default TrackDetailPage;
