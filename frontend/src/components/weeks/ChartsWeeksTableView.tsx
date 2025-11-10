import React, { useMemo, useState } from 'react';
import {
  Table,
  ScrollArea,
  Button,
  Group,
  Text,
  Box,
  Pagination,
  Avatar,
  Tooltip,
  Card,
  Flex,
  useMantineTheme,
} from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { ChartData } from '../../db/indexedDb';
import dayjs from 'dayjs';
import { useSpotifyImage } from '../../hooks/useSpotifyImage';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../../services/SpotifyApi';
import { AllKillBadge } from '../AllKillBadge';
import { getCardBackgroundByMode, type ThemeMode } from '../../theme/modes';
import { ImageEditModal } from '../dialogs/ImageEditModal';
import { encodeLastFmSlug } from '../../utils/urlEncoding';

interface WeekTop1Data {
  week: string;
  weekNumber: number;
  artistTop1: ChartData | null;
  albumTop1: ChartData | null;
  trackTop1: ChartData | null;
}

interface ChartsWeeksTableViewProps {
  weeksData: WeekTop1Data[];
  chartId: number;
  itemsPerPage?: number;
  typeFilter?: string[];
  themeMode?: ThemeMode;
}

const EntityCell: React.FC<{
  item: ChartData | null;
  type: 'artist' | 'album' | 'track';
  onOpenModal: (row: ChartData, imageUrl?: string) => void;
  forceUpdate?: number;
}> = ({ item, type, onOpenModal, forceUpdate = 0 }) => {
  const { imageUrl } = useSpotifyImage({
    entityId: (item?.entityId || '') + (forceUpdate ? `_${forceUpdate}` : ''),
    name: item?.name || '',
    artist: type === 'album' || type === 'track' ? item?.artistName : undefined,
    type,
    clientId: SPOTIFY_TOKEN,
    clientSecret: SPOTIFY_SECRET,
  });

  if (!item) return <Text c="dimmed">-</Text>;

  const artistSlug = encodeLastFmSlug(item.artistName || item.name);
  const nameSlug = encodeLastFmSlug(item.name);
  let detailLink = '';
  if (type === 'artist') {
    detailLink = `/library/music/${artistSlug}`;
  } else if (type === 'album') {
    detailLink = `/library/music/${artistSlug}/${nameSlug}`;
  } else if (type === 'track') {
    detailLink = `/library/music/${artistSlug}/_/${nameSlug}`;
  }

  return (
    <Group gap="sm" wrap="nowrap" align="center">
      <Avatar
        src={imageUrl || undefined}
        size={40}
        radius="sm"
        style={{ cursor: item ? 'pointer' : 'default' }}
        onClick={e => {
          e.stopPropagation();
          if (item) onOpenModal(item, imageUrl || undefined);
        }}
        onMouseDown={e => e.stopPropagation()}
      />
      <Flex direction="column" style={{ flex: 1, minWidth: 0 }}>
        <Text
          component={Link}
          to={detailLink}
          fw={600}
          size="sm"
          lineClamp={1}
          className="mantine-Link-root"
          style={{ cursor: 'pointer', color: 'inherit' }}
        >
          {item.name}
        </Text>
        {type !== 'artist' && item.artistName && (
          <Text
            component={Link}
            to={`/library/music/${artistSlug}`}
            c="dimmed"
            size="xs"
            lineClamp={1}
            className="mantine-Link-root"
            style={{ cursor: 'pointer', color: 'inherit' }}
          >
            {item.artistName}
          </Text>
        )}
      </Flex>
    </Group>
  );
};

export const ChartsWeeksTableView: React.FC<ChartsWeeksTableViewProps> = ({
  weeksData,
  itemsPerPage = 25,
  typeFilter = ['artist', 'album', 'track'],
  themeMode = 'dark',
}) => {
  const { t } = useTranslation();

  const [page, setPage] = useState(1);
  const theme = useMantineTheme();
  const [imageModalRow, setImageModalRow] = useState<ChartData | null>(null);
  const [imageModalUrl, setImageModalUrl] = useState<string>('');
  const [imageForceUpdate, setImageForceUpdate] = useState<{ [entityId: string]: number }>({});

  const firstSelectedType: 'artist' | 'album' | 'track' = (typeFilter[0] as any) || 'artist';

  const totalPages = Math.ceil(weeksData.length / itemsPerPage);
  const pageData = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return weeksData.slice(start, start + itemsPerPage);
  }, [weeksData, page, itemsPerPage]);

  return (
    <>
      <Card withBorder style={{ background: getCardBackgroundByMode(theme, themeMode) }}>
        <ScrollArea>
          <Table highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: 120, whiteSpace: 'nowrap', textAlign: 'center' }}>
                  {t('charts.weekNumber')}
                </Table.Th>
                {typeFilter.includes('artist') && (
                  <Table.Th style={{ width: 'auto' }}>{t('charts.artistTop1')}</Table.Th>
                )}
                {typeFilter.includes('album') && (
                  <Table.Th style={{ width: 'auto' }}>{t('charts.albumTop1')}</Table.Th>
                )}
                {typeFilter.includes('track') && (
                  <Table.Th style={{ width: 'auto' }}>{t('charts.trackTop1')}</Table.Th>
                )}
                <Table.Th style={{ width: 1 }}></Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {pageData.map(weekData => {
                const startDate = dayjs(weekData.week);
                const endDate = startDate.add(6, 'day');
                const dateRange = `${startDate.format('DD/MM/YYYY')} - ${endDate.format(
                  'DD/MM/YYYY'
                )}`;

                const hasAllKill = !!(
                  weekData.artistTop1 &&
                  weekData.albumTop1 &&
                  weekData.trackTop1 &&
                  weekData.artistTop1.name === weekData.albumTop1.artistName &&
                  weekData.artistTop1.name === weekData.trackTop1.artistName
                );

                return (
                  <Table.Tr key={weekData.week}>
                    <Table.Td style={{ textAlign: 'center' }}>
                      <Flex direction="column" align="center">
                        <Tooltip label={dateRange} withArrow>
                          <Text fw={800} size="lg">
                            {weekData.weekNumber}
                          </Text>
                        </Tooltip>
                        {hasAllKill && (
                          <Box mt={4}>
                            <AllKillBadge />
                          </Box>
                        )}
                      </Flex>
                    </Table.Td>
                    {typeFilter.includes('artist') && (
                      <Table.Td style={{ verticalAlign: 'middle' }}>
                        <EntityCell
                          item={weekData.artistTop1}
                          type="artist"
                          onOpenModal={(row, url) => {
                            setImageModalRow(row);
                            setImageModalUrl(url || '');
                          }}
                          forceUpdate={imageForceUpdate[weekData.artistTop1?.entityId || ''] || 0}
                        />
                      </Table.Td>
                    )}
                    {typeFilter.includes('album') && (
                      <Table.Td style={{ verticalAlign: 'middle' }}>
                        <EntityCell
                          item={weekData.albumTop1}
                          type="album"
                          onOpenModal={(row, url) => {
                            setImageModalRow(row);
                            setImageModalUrl(url || '');
                          }}
                          forceUpdate={imageForceUpdate[weekData.albumTop1?.entityId || ''] || 0}
                        />
                      </Table.Td>
                    )}
                    {typeFilter.includes('track') && (
                      <Table.Td style={{ verticalAlign: 'middle' }}>
                        <EntityCell
                          item={weekData.trackTop1}
                          type="track"
                          onOpenModal={(row, url) => {
                            setImageModalRow(row);
                            setImageModalUrl(url || '');
                          }}
                          forceUpdate={imageForceUpdate[weekData.trackTop1?.entityId || ''] || 0}
                        />
                      </Table.Td>
                    )}
                    <Table.Td style={{ width: 1, whiteSpace: 'nowrap' }}>
                      <Button
                        size="xs"
                        variant="light"
                        px={6}
                        component={Link}
                        to={`/charts/week/${weekData.week}/${firstSelectedType}`}
                      >
                        <IconChevronRight size={16} />
                      </Button>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </ScrollArea>
        {totalPages > 1 && (
          <Box mt="md" style={{ display: 'flex', justifyContent: 'center' }}>
            <Pagination total={totalPages} value={page} onChange={setPage} size="sm" />
          </Box>
        )}
      </Card>
      <ImageEditModal
        opened={!!imageModalRow}
        onClose={() => setImageModalRow(null)}
        entityId={imageModalRow?.entityId || ''}
        name={imageModalRow?.name || ''}
        artistName={imageModalRow?.artistName || ''}
        imageUrl={imageModalUrl}
        type={(imageModalRow?.chartType as any) || 'artist'}
        clientId={SPOTIFY_TOKEN}
        clientSecret={SPOTIFY_SECRET}
        onImageChange={(url: string) => {
          setImageForceUpdate(f => ({ ...f, [imageModalRow!.entityId]: Date.now() }));
          setImageModalUrl(url);
        }}
      />
    </>
  );
};
