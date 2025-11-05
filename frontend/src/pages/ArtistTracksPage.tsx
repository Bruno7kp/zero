import React, { useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
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
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { IconArrowLeft, IconMusic } from '@tabler/icons-react';
import { decodeLastFmSlug, encodeLastFmSlug } from '../utils/urlEncoding';
import CreateHeader from '../components/createChart/CreateHeader';
import { useArtistEntities } from '../hooks/useArtistEntities';

const ArtistTracksPage: React.FC = () => {
  const { t } = useTranslation();
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
  const { loading, entities } = useArtistEntities(chart, 'track', artistName);

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

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Title order={3}>{t('library.detail.sections.tracksTitle')}</Title>
          {loading ? (
            <Center py="lg">
              <Loader size="lg" />
            </Center>
          ) : entities.length === 0 ? (
            <Text size="sm" c="dimmed">
              {t('library.detail.sections.emptyTracks')}
            </Text>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>#</Table.Th>
                  <Table.Th>{t('library.detail.sections.columnEntity')}</Table.Th>
                  <Table.Th>{t('library.detail.sections.columnPoints')}</Table.Th>
                  <Table.Th>{t('library.detail.sections.columnWeeks')}</Table.Th>
                  <Table.Th>{t('library.detail.sections.columnPeak')}</Table.Th>
                  <Table.Th>{t('library.detail.sections.columnPlays')}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {entities.map((track, index) => (
                  <Table.Tr key={track.entityId || `${track.name}-${index}`}>
                    <Table.Td>{index + 1}</Table.Td>
                    <Table.Td>
                      <Anchor
                        component={Link}
                        to={`/library/music/${artistSlug}/_/${encodeLastFmSlug(track.name)}`}
                        fw={600}
                        size="sm"
                        c="white"
                      >
                        {track.name}
                      </Anchor>
                    </Table.Td>
                    <Table.Td>{track.points.toLocaleString()}</Table.Td>
                    <Table.Td>{track.weeks.toLocaleString()}</Table.Td>
                    <Table.Td>#{track.peak}</Table.Td>
                    <Table.Td>{track.totalPlays.toLocaleString()}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Stack>
      </Card>
    </Container>
  );
};

export default ArtistTracksPage;
