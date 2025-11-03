// Artists with most items at specific rank stats
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Stack,
  Text,
  Loader,
  Center,
  Select,
  Card,
  Avatar,
  Table,
  ScrollArea,
  Pagination,
  Box,
  Flex,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { IconArrowBarUp } from '@tabler/icons-react';
import StatsFilters from '../../components/stats/StatsFilters';
import { getArtistsWithMostAtRank, getYearRange } from '../../utils/statsQueries';
import { useSpotifyImage } from '../../hooks/useSpotifyImage';
import { useStatsPreferences } from '../../hooks/useStatsPreferences';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../../services/SpotifyApi';
import { getCardBackgroundByMode, type ThemeMode } from '../../theme/modes';
import { useMantineTheme } from '@mantine/core';

// Component to render image cell with hooks
const ImageCell: React.FC<{ artistName: string }> = ({ artistName }) => {
  const { imageUrl } = useSpotifyImage({
    entityId: `artist-${artistName}-`,
    name: artistName,
    artist: artistName,
    type: 'artist',
    clientId: SPOTIFY_TOKEN,
    clientSecret: SPOTIFY_SECRET,
  });

  return <Avatar src={imageUrl} alt={artistName} size={40} radius="md" />;
};

const TimesAtTopByArtistStats: React.FC = () => {
  const { t } = useTranslation();
  const { rank: rankParam, type: typeParam } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<
    Array<{
      artistName: string;
      itemsCount: number;
      totalWeeks: number;
      items: Array<{ entityId: string; name: string; count: number }>;
    }>
  >([]);
  const [type, setType] = useState<'album' | 'track'>((typeParam as 'album' | 'track') || 'track');
  const [rank, setRank] = useState(Number(rankParam) || 1);
  const [sortBy, setSortBy] = useState<'items' | 'weeks'>('items');
  const { preferences, updatePreference } = useStatsPreferences();
  const year = preferences.selectedYear;
  const setYear = (newYear: string) => updatePreference('selectedYear', newYear);
  const [yearRange, setYearRange] = useState<{ minYear: number; maxYear: number } | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const charts = useSelector((state: any) => state.charts.charts);
  const activeChartId = useSelector((state: any) => state.charts.activeChartId);
  const chart = charts.find((c: any) => c.id === activeChartId);
  const theme = useMantineTheme();
  const themeMode = useSelector((state: any) => state.theme?.value || 'dark') as ThemeMode;

  // Get chart cutoff for type
  const getCutoff = (chartType: string) => {
    if (!chart) return 100;
    const cutoffMap: any = {
      album: chart.album_cutoff || 100,
      track: chart.music_cutoff || 100,
    };
    return cutoffMap[chartType] || 100;
  };

  useEffect(() => {
    if (!chart) return;

    const loadYearRange = async () => {
      const range = await getYearRange(String(chart.id), type);
      setYearRange(range);
    };

    loadYearRange();
  }, [chart, type]);

  useEffect(() => {
    if (!chart) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const results = await getArtistsWithMostAtRank({
          chartId: String(chart.id),
          chartType: type,
          rank,
          year: year === 'all' ? undefined : year,
        });
        setData(results);
      } catch (error) {
        console.error('Error loading times at top by artist stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [chart, type, rank, year]);

  const handleTypeChange = (newType: string) => {
    if (newType === 'album' || newType === 'track') {
      setType(newType);
      navigate(`/stats/times_at_top_by_artist/${rank}/${newType}`);
    }
  };

  const handleRankChange = (value: number) => {
    setRank(value);
    navigate(`/stats/times_at_top_by_artist/${value}/${type}`);
  };

  // Filter data by search query
  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    return data.filter(item => item.artistName.toLowerCase().includes(query));
  }, [data, searchQuery]);

  // Sort data
  const sortedData = React.useMemo(() => {
    const sorted = [...filteredData];
    if (sortBy === 'items') {
      sorted.sort((a, b) => b.itemsCount - a.itemsCount || b.totalWeeks - a.totalWeeks);
    } else {
      sorted.sort((a, b) => b.totalWeeks - a.totalWeeks || b.itemsCount - a.itemsCount);
    }
    return sorted;
  }, [filteredData, sortBy]);

  // Paginate data
  const paginatedData = React.useMemo(() => {
    const start = (page - 1) * preferences.pageSize;
    return sortedData.slice(start, start + preferences.pageSize);
  }, [sortedData, page, preferences.pageSize]);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [searchQuery, sortBy, preferences.pageSize, year]);

  // Sort options
  const sortOptions = React.useMemo(() => {
    return [
      { value: 'items', label: t('stats.timesAtTopByArtist.sort.itemsDesc') },
      { value: 'weeks', label: t('stats.timesAtTopByArtist.sort.weeksDesc') },
    ];
  }, [t]);

  if (!chart) {
    return (
      <Center py="xl">
        <Text>{t('errors.selectActiveChart')}</Text>
      </Center>
    );
  }

  const cutoff = getCutoff(type);
  const typeLabel = type === 'album' ? t('stats.filters.albums') : t('stats.filters.tracks');

  return (
    <Stack gap="md">
      <StatsFilters
        year={year}
        onYearChange={setYear}
        type={type}
        onTypeChange={handleTypeChange}
        showImages={preferences.showImages}
        onToggleImages={value => updatePreference('showImages', value)}
        containerSize={preferences.containerSize}
        onContainerSizeChange={value => updatePreference('containerSize', value)}
        fontSize={preferences.fontSize}
        onFontSizeChange={value => updatePreference('fontSize', value)}
        yearRange={yearRange || undefined}
        showSalesToggle={false}
        hideArtistType={true}
        pageSize={preferences.pageSize}
        onPageSizeChange={value => updatePreference('pageSize', value)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={value => setSortBy(value as 'items' | 'weeks')}
        sortOptions={sortOptions}
        customFilters={
          <Select
            value={String(rank)}
            onChange={value => {
              if (value) {
                handleRankChange(Number(value));
              }
            }}
            data={Array.from({ length: cutoff }, (_, i) => ({
              value: String(i + 1),
              label: `Top ${i + 1}`,
            }))}
            style={{ minWidth: 120 }}
            leftSection={<IconArrowBarUp size={16} />}
            searchable
          />
        }
      />

      {loading ? (
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      ) : (
        <Card withBorder style={{ background: getCardBackgroundByMode(theme, themeMode) }}>
          <ScrollArea>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    #
                  </Table.Th>
                  <Table.Th>{t('stats.timesAtTopByArtist.columns.artist')}</Table.Th>
                  <Table.Th style={{ width: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {typeLabel} {t('stats.timesAtTopByArtist.inTopN', { n: rank })}
                  </Table.Th>
                  <Table.Th style={{ width: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {t('stats.timesAtTopByArtist.columns.totalWeeksShort')}
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedData.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={4}>
                      <Text ta="center" py="xl">
                        {t('stats.noData')}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  paginatedData.map((record, index) => {
                    const displayRank = (page - 1) * preferences.pageSize + index + 1;

                    return (
                      <Table.Tr key={record.artistName}>
                        <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <Text
                            size={
                              preferences.fontSize === 'xs'
                                ? 'sm'
                                : preferences.fontSize === 'md'
                                ? 'lg'
                                : 'md'
                            }
                          >
                            {displayRank}
                          </Text>
                        </Table.Td>
                        <Table.Td style={{ verticalAlign: 'middle' }}>
                          <Flex gap="sm" wrap="nowrap" align="center">
                            {preferences.showImages && <ImageCell artistName={record.artistName} />}
                            <Box style={{ flex: 1, minWidth: 0 }}>
                              <Text
                                fw={600}
                                lineClamp={1}
                                className="entity-name"
                                size={
                                  preferences.fontSize === 'xs'
                                    ? 'sm'
                                    : preferences.fontSize === 'md'
                                    ? 'lg'
                                    : 'md'
                                }
                              >
                                {record.artistName}
                              </Text>
                            </Box>
                          </Flex>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <Text
                            size={
                              preferences.fontSize === 'xs'
                                ? 'sm'
                                : preferences.fontSize === 'md'
                                ? 'lg'
                                : 'md'
                            }
                          >
                            {record.itemsCount}
                          </Text>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <Text
                            size={
                              preferences.fontSize === 'xs'
                                ? 'sm'
                                : preferences.fontSize === 'md'
                                ? 'lg'
                                : 'md'
                            }
                          >
                            {record.totalWeeks}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })
                )}
              </Table.Tbody>
            </Table>
          </ScrollArea>
          {sortedData.length > preferences.pageSize && (
            <Box mt="md" style={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination
                total={Math.ceil(sortedData.length / preferences.pageSize)}
                value={page}
                onChange={setPage}
                size="sm"
              />
            </Box>
          )}
        </Card>
      )}
    </Stack>
  );
};

export default TimesAtTopByArtistStats;
