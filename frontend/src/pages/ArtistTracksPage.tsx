import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ActionIcon,
  Avatar,
  Checkbox,
  Container,
  Title,
  Text,
  Card,
  Loader,
  Center,
  Stack,
  Button,
  Table,
  Anchor,
  Flex,
  Select,
  Group,
  Menu,
  useMantineTheme,
  useComputedColorScheme,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import {
  IconArrowLeft,
  IconMusic,
  IconSettings,
  IconCalendar,
  IconSortDescending,
} from '@tabler/icons-react';
import { decodeLastFmSlug, encodeLastFmSlug } from '../utils/urlEncoding';
import CreateHeader from '../components/createChart/CreateHeader';
import { useArtistEntities } from '../hooks/useArtistEntities';
import { useSpotifyImage } from '../hooks/useSpotifyImage';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../services/SpotifyApi';
import { ImageEditModal } from '../components/dialogs/ImageEditModal';
import { db } from '../db/indexedDb';
import { getCardBackgroundByMode, type ThemeMode } from '../theme/modes';
import storage from '../utils/storage';
import KEYS from '../constants/storageKeys';
import { StatsBox } from '../components/StatsBox';
import { Grid } from '@mantine/core';
import { CertificationIcon } from '../components/CertificationIcon';

// Helper component for entity cell with image
const EntityCell: React.FC<{
  entityId: string;
  name: string;
  artistName: string;
  link: string;
  anchorColor: string;
  onImageClick: (imageUrl: string) => void;
  showImage?: boolean;
}> = ({ entityId, name, artistName, link, anchorColor, onImageClick, showImage = true }) => {
  const { imageUrl } = useSpotifyImage({
    entityId,
    name,
    artist: artistName,
    type: 'track',
    clientId: SPOTIFY_TOKEN,
    clientSecret: SPOTIFY_SECRET,
  });

  return (
    <Flex gap="sm" wrap="nowrap" align="center">
      {showImage && (
        <Avatar
          src={imageUrl}
          alt={name}
          size={40}
          radius="sm"
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            onImageClick(imageUrl || '');
          }}
          style={{ cursor: 'pointer', flexShrink: 0 }}
        />
      )}
      <Anchor
        component={Link}
        to={link}
        fw={600}
        size="sm"
        c={anchorColor}
        style={{
          wordBreak: 'break-word',
          lineHeight: 1.4,
        }}
      >
        {name}
      </Anchor>
    </Flex>
  );
};

const ArtistTracksPage: React.FC = () => {
  const { t } = useTranslation();
  const theme = useMantineTheme();
  const colorScheme = useComputedColorScheme('dark', { getInitialValueInEffect: true });
  const themeMode = useSelector((s: any) => (s.theme?.value as ThemeMode) || 'dark');
  const anchorColor = colorScheme === 'dark' ? theme.white : theme.black;
  const { artist } = useParams<{ artist: string }>();
  const navigate = useNavigate();
  const charts = useSelector((state: any) => state.charts.charts);
  const activeChartId = useSelector((state: any) => state.charts.activeChartId);
  const chart = useMemo(
    () => charts.find((c: any) => c.id === activeChartId) || null,
    [charts, activeChartId]
  );

  const artistName = artist ? decodeLastFmSlug(artist) : '';
  const artistSlug = artistName ? encodeLastFmSlug(artistName) : '';
  const { loading, entities: rawEntities } = useArtistEntities(chart, 'track', artistName);

  // Define card background based on theme
  const cardBackground = getCardBackgroundByMode(theme, themeMode);

  // Sorting state with localStorage persistence
  const [tracksSort, setTracksSort] = useState<'weeks' | 'peak' | 'points'>(() => {
    return storage.get(KEYS.ARTIST_TRACKS_SORT, [], 'weeks') as 'weeks' | 'peak' | 'points';
  });
  const [tracksShowImage, setTracksShowImage] = useState<boolean>(() => {
    return storage.getJson<boolean>(KEYS.ARTIST_TRACKS_SHOW_IMAGE, [], true) ?? true;
  });
  const [debutYear, setDebutYear] = useState<string>(() => {
    return storage.get(KEYS.ARTIST_TRACKS_YEAR_FILTER, [], 'all') as string;
  });
  const [showSales, setShowSales] = useState<boolean>(() => {
    return storage.getJson<boolean>(KEYS.ARTIST_TRACKS_SHOW_SALES, [], false) ?? false;
  });
  const [showCert, setShowCert] = useState<boolean>(() => {
    return storage.getJson<boolean>(KEYS.ARTIST_TRACKS_SHOW_CERT, [], false) ?? false;
  });

  // Modal state
  const [entityImageModalOpen, setEntityImageModalOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<{
    id: string;
    name: string;
    imageUrl: string;
  } | null>(null);

  // Save sorting preference to localStorage
  useEffect(() => {
    storage.set(KEYS.ARTIST_TRACKS_SORT, tracksSort);
  }, [tracksSort]);

  useEffect(() => {
    storage.setJson(KEYS.ARTIST_TRACKS_SHOW_IMAGE, tracksShowImage);
  }, [tracksShowImage]);

  useEffect(() => {
    storage.set(KEYS.ARTIST_TRACKS_YEAR_FILTER, debutYear);
  }, [debutYear]);

  useEffect(() => {
    storage.setJson(KEYS.ARTIST_TRACKS_SHOW_SALES, showSales);
  }, [showSales]);

  useEffect(() => {
    storage.setJson(KEYS.ARTIST_TRACKS_SHOW_CERT, showCert);
  }, [showCert]);

  // Feature availability
  const pointsWeight = chart?.music_points_weight || 0;
  const playsWeight = chart?.music_plays_weight || 0;
  const hasSalesFormula = pointsWeight > 0 || playsWeight > 0;
  const hasCertification = (chart?.music_platinum_value ?? 0) > 0;

  // Sorting function with tiebreakers: peak (asc), timesAtPeak (desc), weeks (desc)
  const sortByPeak = (a: any, b: any) => {
    if (a.peak !== b.peak) return a.peak - b.peak;
    const aTimesAtPeak = a.timesAtPeak || 0;
    const bTimesAtPeak = b.timesAtPeak || 0;
    if (aTimesAtPeak !== bTimesAtPeak) return bTimesAtPeak - aTimesAtPeak;
    return b.weeks - a.weeks;
  };

  // Sorting function: weeks (desc)
  const sortByWeeks = (a: any, b: any) => b.weeks - a.weeks;

  // Sorting function: points (desc)
  const sortByPoints = (a: any, b: any) => b.points - a.points;

  // Get all chart data for recalculating stats by year
  const [chartData, setChartData] = useState<
    Array<{ entityId: string; week: string; rank: number; plays: number }>
  >([]);

  useEffect(() => {
    if (!chart || rawEntities.length === 0) {
      return;
    }

    const chartId = String(chart.id);
    const fetchChartData = async () => {
      try {
        const rows = await db.charts_data
          .where('[chartId+chartType]')
          .equals([chartId, 'track'])
          .toArray();

        setChartData(
          rows.map(row => ({
            entityId: row.entityId,
            week: row.week,
            rank: row.rank,
            plays: row.plays || 0,
          }))
        );
      } catch (error) {
        console.error('Failed to fetch chart data', error);
      }
    };

    fetchChartData();
  }, [chart, rawEntities.length]);

  // Get available years (years where entities appeared)
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    chartData.forEach(row => {
      const year = row.week.substring(0, 4);
      years.add(year);
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [chartData]);

  // Filter and recalculate stats by year
  const filteredEntities = useMemo(() => {
    if (debutYear === 'all') {
      return rawEntities;
    }

    // Filter chart data by year
    const yearData = chartData.filter(row => row.week.startsWith(debutYear));

    // Group by entityId and calculate stats
    const entityStats = new Map<
      string,
      {
        weeks: number;
        peak: number;
        timesAtPeak: number;
        points: number;
        totalPlays: number;
      }
    >();

    yearData.forEach(row => {
      const existing = entityStats.get(row.entityId);
      const points = Math.max(0, 101 - row.rank);

      if (!existing) {
        entityStats.set(row.entityId, {
          weeks: 1,
          peak: row.rank,
          timesAtPeak: row.rank === 1 ? 1 : 0,
          points: points,
          totalPlays: row.plays,
        });
      } else {
        existing.weeks++;
        if (row.rank < existing.peak) {
          existing.peak = row.rank;
          existing.timesAtPeak = row.rank === 1 ? 1 : 0;
        } else if (row.rank === existing.peak && row.rank === 1) {
          existing.timesAtPeak++;
        }
        existing.points += points;
        existing.totalPlays += row.plays;
      }
    });

    // Map back to entities with recalculated stats
    return rawEntities
      .map(entity => {
        const stats = entityStats.get(entity.entityId);
        if (!stats) return null;

        return {
          ...entity,
          weeks: stats.weeks,
          peak: stats.peak,
          timesAtPeak: stats.timesAtPeak,
          points: stats.points,
          totalPlays: stats.totalPlays,
        };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);
  }, [rawEntities, debutYear, chartData]);

  // Apply sorting
  const entities = useMemo(() => {
    const sorted = [...filteredEntities];
    if (tracksSort === 'peak') {
      sorted.sort(sortByPeak);
    } else if (tracksSort === 'points') {
      sorted.sort(sortByPoints);
    } else {
      sorted.sort(sortByWeeks);
    }
    return sorted;
  }, [filteredEntities, tracksSort]);

  // Calculate stats
  const stats = useMemo(() => {
    const tracksAtOne = entities.filter(e => e.peak === 1).length;
    const weeksAtOne = entities
      .filter(e => e.peak === 1)
      .reduce((sum, e) => sum + (e.timesAtPeak || 0), 0);
    const cutoff = chart?.music_cutoff || 100;
    const tracksInCutoff = entities.filter(e => e.peak <= cutoff).length;
    const totalWeeks = entities.reduce((sum, e) => sum + e.weeks, 0);

    return {
      tracksAtOne,
      weeksAtOne,
      tracksInCutoff,
      totalWeeks,
      cutoff,
    };
  }, [entities, chart]);

  const headerBackButton = (
    <Button
      leftSection={<IconArrowLeft size={16} />}
      variant="subtle"
      size="xs"
      onClick={() => navigate(`/library/music/${artistSlug}`)}
    >
      <span style={{ display: 'none' }} className="visibleFrom-sm">
        {t('library.detail.sections.backToArtist')}
      </span>
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

  return (
    <Container className="noPaddingMobile">
      <CreateHeader
        pageTitle={`${artistName} — ${t('library.detail.sections.tracksTitle')}`}
        icon={IconMusic}
        leftSection={headerBackButton}
        showSettings={false}
      />

      <Card
        shadow="sm"
        padding="sm"
        radius="md"
        withBorder
        style={{
          background: cardBackground,
        }}
        mb="md"
      >
        <Grid>
          <StatsBox
            label={t('library.detail.sections.tracksAtOne')}
            value={stats.tracksAtOne}
            span={{ base: 6, sm: 6, md: 3 }}
            shadow="none"
            background={cardBackground}
          />
          <StatsBox
            label={t('library.detail.sections.weeksAtOne')}
            value={stats.weeksAtOne}
            span={{ base: 6, sm: 6, md: 3 }}
            shadow="none"
            background={cardBackground}
          />
          <StatsBox
            label={
              stats.cutoff
                ? t('library.detail.sections.tracksInTopX', { x: stats.cutoff })
                : t('library.detail.sections.tracksInCutoff')
            }
            value={stats.tracksInCutoff}
            span={{ base: 6, sm: 6, md: 3 }}
            shadow="none"
            background={cardBackground}
          />
          <StatsBox
            label={t('library.detail.sections.totalWeeks')}
            value={stats.totalWeeks}
            span={{ base: 6, sm: 6, md: 3 }}
            shadow="none"
            background={cardBackground}
          />
        </Grid>
      </Card>

      <Card shadow="sm" padding="lg" radius="md" withBorder style={{ background: cardBackground }}>
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Title order={3}>{t('library.detail.sections.tracksTitle')}</Title>
            <Group gap="sm">
              <Select
                value={tracksSort}
                onChange={value => setTracksSort((value as 'weeks' | 'peak' | 'points') || 'weeks')}
                data={[
                  { value: 'weeks', label: t('library.detail.sections.sortWeeks') },
                  { value: 'peak', label: t('library.detail.sections.sortPeak') },
                  { value: 'points', label: t('library.detail.sections.sortPoints') },
                ]}
                size="xs"
                w={120}
                allowDeselect={false}
                leftSection={<IconSortDescending size={16} />}
              />
              {availableYears.length > 0 && (
                <Select
                  value={debutYear}
                  onChange={value => setDebutYear(value || 'all')}
                  data={[
                    { value: 'all', label: t('common.allYears') },
                    ...availableYears.map(year => ({ value: year, label: year })),
                  ]}
                  size="xs"
                  w={140}
                  allowDeselect={false}
                  placeholder={t('common.year')}
                  leftSection={<IconCalendar size={16} />}
                />
              )}
              <Menu shadow="md" width={200}>
                <Menu.Target>
                  <ActionIcon variant="light" size="lg">
                    <IconSettings size={18} />
                  </ActionIcon>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item closeMenuOnClick={false}>
                    <Checkbox
                      label={t('library.detail.sections.showImage')}
                      checked={tracksShowImage}
                      onChange={e => setTracksShowImage(e.currentTarget.checked)}
                    />
                  </Menu.Item>
                  {hasSalesFormula && (
                    <Menu.Item closeMenuOnClick={false}>
                      <Checkbox
                        label={chart?.formula_name || t('charts.sales')}
                        tt="capitalize"
                        checked={showSales}
                        onChange={e => setShowSales(e.currentTarget.checked)}
                      />
                    </Menu.Item>
                  )}
                  {hasCertification && (
                    <Menu.Item closeMenuOnClick={false}>
                      <Checkbox
                        label="Cert."
                        checked={showCert}
                        onChange={e => setShowCert(e.currentTarget.checked)}
                      />
                    </Menu.Item>
                  )}
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>
          {loading ? (
            <Center py="lg">
              <Loader size="lg" />
            </Center>
          ) : entities.length === 0 ? (
            <Text size="sm" c="dimmed">
              {t('library.detail.sections.emptyTracks')}
            </Text>
          ) : (
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 60, textAlign: 'center' }}>#</Table.Th>
                  <Table.Th>{t('library.detail.sections.columnEntity')}</Table.Th>
                  <Table.Th style={{ width: 100, textAlign: 'center' }}>
                    {t('library.detail.sections.columnPlays')}
                  </Table.Th>
                  <Table.Th style={{ width: 80, textAlign: 'center' }}>
                    {t('library.detail.sections.columnPeak')}
                  </Table.Th>
                  <Table.Th style={{ width: 100, textAlign: 'center' }}>
                    {t('library.detail.sections.columnWeeks')}
                  </Table.Th>
                  <Table.Th style={{ width: 100, textAlign: 'center' }}>
                    {t('library.detail.sections.columnPoints')}
                  </Table.Th>
                  {hasSalesFormula && showSales && (
                    <Table.Th style={{ width: 100, textAlign: 'center' }} tt="capitalize">
                      {chart?.formula_name || t('charts.sales')}
                    </Table.Th>
                  )}
                  {hasCertification && showCert && (
                    <Table.Th style={{ width: 80, textAlign: 'center' }}>Cert.</Table.Th>
                  )}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {entities.map((track, index) => (
                  <Table.Tr key={track.entityId || `${track.name}-${index}`}>
                    <Table.Td style={{ textAlign: 'center' }}>{index + 1}</Table.Td>
                    <Table.Td style={{ maxWidth: 300 }}>
                      <EntityCell
                        entityId={track.entityId}
                        name={track.name}
                        artistName={artistName}
                        link={`/library/music/${artistSlug}/_/${encodeLastFmSlug(track.name)}`}
                        anchorColor={anchorColor}
                        showImage={tracksShowImage}
                        onImageClick={imageUrl => {
                          setSelectedEntity({
                            id: track.entityId,
                            name: track.name,
                            imageUrl,
                          });
                          setEntityImageModalOpen(true);
                        }}
                      />
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'center' }}>
                      {track.totalPlays.toLocaleString()}
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'center' }}>
                      {track.peak === 1 ? (
                        <Group gap={4} justify="center" wrap="nowrap">
                          <Text size="sm" fw={600} c="mediumblue">
                            1
                          </Text>
                          {track.timesAtPeak && track.timesAtPeak > 0 && (
                            <Text size="xs" c="dimmed">
                              ({track.timesAtPeak}x)
                            </Text>
                          )}
                        </Group>
                      ) : track.peak < 999 ? (
                        <Text size="sm">{track.peak}</Text>
                      ) : (
                        <Text size="sm" c="dimmed">
                          -
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'center' }}>
                      {track.weeks.toLocaleString()}
                    </Table.Td>
                    <Table.Td style={{ textAlign: 'center' }}>
                      {track.points.toLocaleString()}
                    </Table.Td>
                    {hasSalesFormula && showSales && (
                      <Table.Td style={{ textAlign: 'center' }}>
                        {Math.floor(
                          track.points * pointsWeight + track.totalPlays * playsWeight
                        ).toLocaleString()}
                      </Table.Td>
                    )}
                    {hasCertification && showCert && (
                      <Table.Td style={{ textAlign: 'center' }}>
                        {track.entityId ? (
                          <CertificationIcon
                            chart={chart}
                            chartType="track"
                            totals={{
                              totalPoints: track.points,
                              totalPlays: track.totalPlays,
                            }}
                            entity={{
                              name: track.name,
                              artistName: artistName,
                            }}
                            entityId={track.entityId}
                            username={chart?.lastfm_username}
                          />
                        ) : null}
                      </Table.Td>
                    )}
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Stack>
      </Card>

      {selectedEntity && (
        <ImageEditModal
          opened={entityImageModalOpen}
          onClose={() => {
            setEntityImageModalOpen(false);
            setSelectedEntity(null);
          }}
          entityId={selectedEntity.id}
          name={selectedEntity.name}
          artistName={artistName}
          imageUrl={selectedEntity.imageUrl}
          type="track"
          clientId={SPOTIFY_TOKEN}
          clientSecret={SPOTIFY_SECRET}
          onImageChange={() => {
            // Force re-render if needed
          }}
        />
      )}
    </Container>
  );
};

export default ArtistTracksPage;
