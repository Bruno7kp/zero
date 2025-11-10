import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Avatar,
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
  useMantineTheme,
  useComputedColorScheme,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { IconArrowLeft, IconMusic } from '@tabler/icons-react';
import { decodeLastFmSlug, encodeLastFmSlug } from '../utils/urlEncoding';
import CreateHeader from '../components/createChart/CreateHeader';
import { useArtistEntities } from '../hooks/useArtistEntities';
import { useSpotifyImage } from '../hooks/useSpotifyImage';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../services/SpotifyApi';
import { ImageEditModal } from '../components/dialogs/ImageEditModal';
import { getCardBackgroundByMode, type ThemeMode } from '../theme/modes';
import storage from '../utils/storage';
import KEYS from '../constants/storageKeys';
import { StatsBox } from '../components/StatsBox';
import { Grid } from '@mantine/core';

// Helper component for entity cell with image
const EntityCell: React.FC<{
  entityId: string;
  name: string;
  artistName: string;
  link: string;
  anchorColor: string;
  onImageClick: (imageUrl: string) => void;
}> = ({ entityId, name, artistName, link, anchorColor, onImageClick }) => {
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

  // Sorting state with localStorage persistence
  const [tracksSort, setTracksSort] = useState<'weeks' | 'peak'>(() => {
    return storage.get(KEYS.ARTIST_TRACKS_SORT, [], 'weeks') as 'weeks' | 'peak';
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

  // Apply sorting
  const entities = useMemo(() => {
    const sorted = [...rawEntities];
    if (tracksSort === 'peak') {
      sorted.sort(sortByPeak);
    } else {
      sorted.sort(sortByWeeks);
    }
    return sorted;
  }, [rawEntities, tracksSort]);

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
      {t('library.detail.sections.backToArtist')}
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
        padding="lg"
        radius="md"
        withBorder
        style={{
          background: getCardBackgroundByMode(theme, themeMode),
          paddingTop: 0,
          paddingBottom: 0,
        }}
        mb="md"
      >
        <Grid>
          <StatsBox
            label={t('library.detail.sections.tracksAtOne')}
            value={stats.tracksAtOne}
            span={{ base: 6, sm: 6, md: 3 }}
            shadow="none"
            background={getCardBackgroundByMode(theme, themeMode)}
          />
          <StatsBox
            label={t('library.detail.sections.weeksAtOne')}
            value={stats.weeksAtOne}
            span={{ base: 6, sm: 6, md: 3 }}
            shadow="none"
            background={getCardBackgroundByMode(theme, themeMode)}
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
            background={getCardBackgroundByMode(theme, themeMode)}
          />
          <StatsBox
            label={t('library.detail.sections.totalWeeks')}
            value={stats.totalWeeks}
            span={{ base: 6, sm: 6, md: 3 }}
            shadow="none"
            background={getCardBackgroundByMode(theme, themeMode)}
          />
        </Grid>
      </Card>

      <Card
        shadow="sm"
        padding="lg"
        radius="md"
        withBorder
        style={{ background: getCardBackgroundByMode(theme, themeMode) }}
      >
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Title order={3}>{t('library.detail.sections.tracksTitle')}</Title>
            <Select
              value={tracksSort}
              onChange={value => setTracksSort((value as 'weeks' | 'peak') || 'weeks')}
              data={[
                { value: 'weeks', label: t('library.detail.sections.sortWeeks') },
                { value: 'peak', label: t('library.detail.sections.sortPeak') },
              ]}
              size="xs"
              w={120}
              allowDeselect={false}
            />
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
