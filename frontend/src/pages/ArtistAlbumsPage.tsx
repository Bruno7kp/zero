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
import { IconArrowLeft, IconDisc } from '@tabler/icons-react';
import { decodeLastFmSlug, encodeLastFmSlug } from '../utils/urlEncoding';
import CreateHeader from '../components/createChart/CreateHeader';
import { useArtistEntities } from '../hooks/useArtistEntities';

const ArtistAlbumsPage: React.FC = () => {
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
  const { loading, entities } = useArtistEntities(chart, 'album', artistName);

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
        pageTitle={`${artistName} — ${t('library.detail.sections.albumsTitle')}`}
        icon={IconDisc}
        leftSection={headerBackButton}
        showSettings={false}
      />

      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Title order={3}>{t('library.detail.sections.albumsTitle')}</Title>
          {loading ? (
            <Center py="lg">
              <Loader size="lg" />
            </Center>
          ) : entities.length === 0 ? (
            <Text size="sm" c="dimmed">
              {t('library.detail.sections.emptyAlbums')}
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
                {entities.map((album, index) => (
                  <Table.Tr key={album.entityId || `${album.name}-${index}`}>
                    <Table.Td>{index + 1}</Table.Td>
                    <Table.Td>
                      <Anchor
                        component={Link}
                        to={`/library/music/${artistSlug}/${encodeLastFmSlug(album.name)}`}
                        fw={600}
                        size="sm"
                        c="white"
                      >
                        {album.name}
                      </Anchor>
                    </Table.Td>
                    <Table.Td>{album.points.toLocaleString()}</Table.Td>
                    <Table.Td>{album.weeks.toLocaleString()}</Table.Td>
                    <Table.Td>#{album.peak}</Table.Td>
                    <Table.Td>{album.totalPlays.toLocaleString()}</Table.Td>
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

export default ArtistAlbumsPage;
