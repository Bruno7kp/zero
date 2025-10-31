// Times in Top N stats - shows who stayed in top N most weeks
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Stack,
  Loader,
  Center,
  Card,
  Avatar,
  Text,
  Select,
  Table,
  ScrollArea,
  Pagination,
  Box,
  Flex
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { IconArrowBarUp } from '@tabler/icons-react';
import StatsFilters from '../../components/stats/StatsFilters';
import { getTimesInTopN, getYearRange } from '../../utils/statsQueries';
import { useSpotifyImage } from '../../hooks/useSpotifyImage';
import { useStatsPreferences } from '../../hooks/useStatsPreferences';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../../services/SpotifyApi';
import { getCardBackgroundByMode, type ThemeMode } from '../../theme/modes';
import { useMantineTheme } from '@mantine/core';

// Component to render image cell with hooks
const ImageCell: React.FC<{ record: any; type: string }> = ({ record, type }) => {
  const { imageUrl } = useSpotifyImage({
    entityId: record.entityId,
    name: record.name,
    artist: record.artistName,
    type: type as 'artist' | 'album' | 'track',
    clientId: SPOTIFY_TOKEN,
    clientSecret: SPOTIFY_SECRET
  });

  return (
    <Avatar
      src={imageUrl}
      alt={record.name}
      size={40}
      radius="md"
    />
  );
};

const TimesAtTopStats: React.FC = () => {
  const { t } = useTranslation();
  const { topN: topNParam, type: typeParam } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Array<{
    entityId: string;
    name: string;
    artistName: string;
    count: number;
  }>>([]);
  const [year, setYear] = useState('all');
  const [type, setType] = useState(typeParam || 'artist');
  const [topN, setTopN] = useState(Number(topNParam) || 10);
  const { preferences, updatePreference } = useStatsPreferences();
  const [yearRange, setYearRange] = useState<{ minYear: number; maxYear: number } | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('times-desc');

  const charts = useSelector((state: any) => state.charts.charts);
  const activeChartId = useSelector((state: any) => state.charts.activeChartId);
  const chart = charts.find((c: any) => c.id === activeChartId);
  const theme = useMantineTheme();
  const themeMode = useSelector((state: any) => state.theme?.value || 'dark') as ThemeMode;

  // Get chart cutoff for type
  const getCutoff = (chartType: string) => {
    if (!chart) return 100;
    const cutoffMap: any = {
      artist: chart.artist_cutoff || 100,
      album: chart.album_cutoff || 100,
      track: chart.music_cutoff || 100
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
        const results = await getTimesInTopN({
          chartId: String(chart.id),
          chartType: type,
          topN,
          year: year === 'all' ? undefined : year
        });
        setData(results);
      } catch (error) {
        console.error('Error loading times at top stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [chart, type, topN, year]);

  const handleTypeChange = (newType: string) => {
    setType(newType);
    navigate(`/stats/times_at_top/${topN}/${newType}`);
  };

  const handleTopNChange = (value: number) => {
    setTopN(value);
    navigate(`/stats/times_at_top/${value}/${type}`);
  };

  // Filter data by search query
  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    return data.filter(item =>
      item.name.toLowerCase().includes(query) ||
      (item.artistName && item.artistName.toLowerCase().includes(query))
    );
  }, [data, searchQuery]);

  // Sort data
  const sortedData = React.useMemo(() => {
    const sorted = [...filteredData];

    switch (sortBy) {
      case 'times-desc':
        return sorted.sort((a, b) => b.count - a.count);
      case 'times-asc':
        return sorted.sort((a, b) => a.count - b.count);
      case 'position-desc':
        return sorted; // Already sorted by position implicitly
      case 'position-asc':
        return sorted.reverse();
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'artist-asc':
        return sorted.sort((a, b) => (a.artistName || '').localeCompare(b.artistName || ''));
      case 'artist-desc':
        return sorted.sort((a, b) => (b.artistName || '').localeCompare(a.artistName || ''));
      default:
        return sorted;
    }
  }, [filteredData, sortBy]);

  // Paginate data
  const paginatedData = React.useMemo(() => {
    const start = (page - 1) * preferences.pageSize;
    return sortedData.slice(start, start + preferences.pageSize);
  }, [sortedData, page, preferences.pageSize]);

  // Reset page when filters change
  React.useEffect(() => {
    setPage(1);
  }, [searchQuery, sortBy, preferences.pageSize]);

  // Sort options
  const sortOptions = React.useMemo(() => {
    return [
      { value: 'times-desc', label: t('stats.timesAtTop.sort.timesDesc') },
      { value: 'times-asc', label: t('stats.timesAtTop.sort.timesAsc') },
      //{ value: 'position-desc', label: t('stats.timesAtTop.sort.positionDesc') },
      //{ value: 'position-asc', label: t('stats.timesAtTop.sort.positionAsc') },
      { value: 'name-asc', label: t('stats.timesAtTop.sort.nameAsc') },
      { value: 'name-desc', label: t('stats.timesAtTop.sort.nameDesc') },
      ...(type !== 'artist' && preferences.showArtistColumn ? [
        { value: 'artist-asc', label: t('stats.timesAtTop.sort.artistAsc') },
        { value: 'artist-desc', label: t('stats.timesAtTop.sort.artistDesc') },
      ] : []),
    ];
  }, [t, type, preferences.showArtistColumn]);

  if (!chart) {
    return (
      <Center py="xl">
        <Text>{t('errors.selectActiveChart')}</Text>
      </Center>
    );
  }

  const cutoff = getCutoff(type);

  return (
    <Stack gap="md">
      <StatsFilters
        year={year}
        onYearChange={setYear}
        type={type}
        onTypeChange={handleTypeChange}
        showImages={preferences.showImages}
        onToggleImages={(value) => updatePreference('showImages', value)}
        showArtistColumn={preferences.showArtistColumn}
        onToggleArtistColumn={(value) => updatePreference('showArtistColumn', value)}
  fontSize={preferences.fontSize}
  onFontSizeChange={(value) => updatePreference('fontSize', value)}
        yearRange={yearRange || undefined}
        showSalesToggle={false}
        pageSize={preferences.pageSize}
        onPageSizeChange={(value) => updatePreference('pageSize', value)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortOptions={sortOptions}
        customFilters={
          <Select
            value={String(topN)}
            onChange={(value) => {
              if (value) {
                handleTopNChange(Number(value));
              }
            }}
            data={Array.from({ length: cutoff }, (_, i) => ({
              value: String(i + 1),
              label: `Top ${i + 1}`
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
                    <Table.Th style={{ width: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>#</Table.Th>
                    <Table.Th>{t('stats.timesAtTop.columns.title')}</Table.Th>
                    {preferences.showArtistColumn && type !== 'artist' && <Table.Th>{t('charts.artist')}</Table.Th>}
                    <Table.Th style={{ width: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>{t('stats.timesAtTop.columns.times', { n: topN })}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedData.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={
                        1 + // rank
                        1 + // title
                        (preferences.showArtistColumn && type !== 'artist' ? 1 : 0) +
                        1 // times
                      }>
                      <Text ta="center" py="xl">{t('stats.noData')}</Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  paginatedData.map((record: any, index) => {
                    const displayRank = (page - 1) * preferences.pageSize + index + 1;

                    return (
                      <Table.Tr key={record.entityId}>
                        <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                <Text size={preferences.fontSize === 'xs' ? 'sm' : preferences.fontSize === 'md' ? 'lg' : 'md'}>{displayRank}</Text>
                        </Table.Td>
                        <Table.Td style={{ verticalAlign: 'middle' }}>
                          <Flex gap="sm" wrap="nowrap" align="center">
                            {preferences.showImages && <ImageCell record={record} type={type} />}
                            <Box style={{ flex: 1, minWidth: 0 }}>
                              <Text fw={600} lineClamp={1} className="entity-name" size={preferences.fontSize === 'xs' ? 'sm' : preferences.fontSize === 'md' ? 'lg' : 'md'}>{record.name}</Text>
                              {type !== 'artist' && record.artistName && !preferences.showArtistColumn && (
                                <Text c="dimmed" size={preferences.fontSize === 'xs' ? 'xs' : preferences.fontSize === 'md' ? 'md' : 'sm'} lineClamp={1}>{record.artistName}</Text>
                              )}
                            </Box>
                          </Flex>
                        </Table.Td>
                        {preferences.showArtistColumn && type !== 'artist' && (
                          <Table.Td>
                              <Text size={preferences.fontSize === 'xs' ? 'sm' : preferences.fontSize === 'md' ? 'lg' : 'md'}>{record.artistName}</Text>
                          </Table.Td>
                        )}
                        <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <Text size={preferences.fontSize === 'xs' ? 'sm' : preferences.fontSize === 'md' ? 'lg' : 'md'}>{record.count}</Text>
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

export default TimesAtTopStats;

