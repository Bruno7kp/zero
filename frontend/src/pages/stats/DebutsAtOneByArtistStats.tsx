// Artists with most debuts at #1 stats
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Stack, 
  Text, 
  Loader, 
  Center,
  Card,
  Avatar,
  Table,
  ScrollArea,
  Pagination,
  Flex,
  Select,
  Box
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { IconArrowBarUp } from '@tabler/icons-react';
import StatsFilters from '../../components/stats/StatsFilters';
import { getArtistsWithMostDebutsAtOne, getYearRange } from '../../utils/statsQueries';
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
    clientSecret: SPOTIFY_SECRET
  });
  
  return (
    <Avatar 
      src={imageUrl} 
      alt={artistName}
      size={40}
      radius="md"
    />
  );
};

const DebutsAtOneByArtistStats: React.FC = () => {
  const { t } = useTranslation();
  const { type: typeParam } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Array<{
    artistName: string;
    itemsCount: number;
  }>>([]);
  const [year, setYear] = useState('all');
  const [type, setType] = useState<'album' | 'track'>((typeParam as 'album' | 'track') || 'track');
  const [rank, setRank] = useState(1);
  const [sortBy, setSortBy] = useState<'items'>('items');
  const { preferences, updatePreference } = useStatsPreferences();
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
        const results = await getArtistsWithMostDebutsAtOne({
          chartId: String(chart.id),
          chartType: type,
          rank,
          year: year === 'all' ? undefined : year
        });
        setData(results);
      } catch (error) {
        console.error('Error loading debuts at one by artist stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [chart, type, rank, year]);

  const handleTypeChange = (newType: string) => {
    if (newType === 'album' || newType === 'track') {
      setType(newType);
      navigate(`/stats/debuts_at_one_by_artist/${newType}`);
    }
  };

  const handleRankChange = (value: number) => {
    setRank(value);
  };

  // Filter data by search query
  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) return data;
    
    const query = searchQuery.toLowerCase();
    return data.filter(item => 
      item.artistName.toLowerCase().includes(query)
    );
  }, [data, searchQuery]);

  // Sort data (already sorted by items count)
  const sortedData = React.useMemo(() => {
    return [...filteredData];
  }, [filteredData]);

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
      { value: 'items', label: t('stats.debutsAtOneByArtist.sort.itemsDesc') },
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
        onToggleImages={(value) => updatePreference('showImages', value)}
        tableSize={preferences.tableSize}
        onTableSizeChange={(value) => updatePreference('tableSize', value)}
        yearRange={yearRange || undefined}
        showSalesToggle={false}
        hideArtistType={true}
        pageSize={preferences.pageSize}
        onPageSizeChange={(value) => updatePreference('pageSize', value)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={(value) => setSortBy(value as 'items')}
        sortOptions={sortOptions}
        customFilters={
          <Select
            value={String(rank)}
            onChange={(value) => {
              if (value) {
                handleRankChange(Number(value));
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
      ) : sortedData.length === 0 ? (
        <Center py="xl">
          <Text>{t('stats.debutsAtOneByArtist.noData')}</Text>
        </Center>
      ) : (
        <Card withBorder style={{ background: getCardBackgroundByMode(theme, themeMode) }}>
          <ScrollArea>
              <Table highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ width: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>#</Table.Th>
                    <Table.Th>{t('stats.debutsAtOneByArtist.columns.artist')}</Table.Th>
                    <Table.Th style={{ width: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>{t('stats.debutsAtOneByArtist.columns.debuts', { type: typeLabel })}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedData.map((record, index) => {
                    const displayRank = (page - 1) * preferences.pageSize + index + 1;
                    
                    return (
                      <Table.Tr key={record.artistName}>
                        <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <Text size={preferences.tableSize === 'xs' ? 'sm' : preferences.tableSize === 'md' ? 'lg' : 'md'}>{displayRank}</Text>
                        </Table.Td>
                        <Table.Td style={{ verticalAlign: 'middle' }}>
                          <Flex gap="sm" wrap="nowrap" align="center">
                            {preferences.showImages && <ImageCell artistName={record.artistName} />}
                            <Box style={{ flex: 1, minWidth: 0 }}>
                              <Text fw={600} lineClamp={1} className="entity-name" size={preferences.tableSize === 'xs' ? 'sm' : preferences.tableSize === 'md' ? 'lg' : 'md'}>
                                {record.artistName}
                              </Text>
                            </Box>
                          </Flex>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <Text size={preferences.tableSize === 'xs' ? 'sm' : preferences.tableSize === 'md' ? 'lg' : 'md'}>
                            {record.itemsCount}
                          </Text>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
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

export default DebutsAtOneByArtistStats;
