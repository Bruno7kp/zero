// All #Ns stat page - shows weeks where items reached a specific rank
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Stack,
  Loader,
  Center,
  Card,
  Avatar,
  Text,
  Table,
  ScrollArea,
  Pagination,
  Box,
  Button,
  Tooltip,
  Flex
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { IconChevronRight } from '@tabler/icons-react';
import dayjs from 'dayjs';
import StatsFilters from '../../components/stats/StatsFilters';
import { getItemsAtRank, getYearRange, calculateSales } from '../../utils/statsQueries';
import type { ChartData } from '../../db/indexedDb';
import { db } from '../../db/indexedDb';
import { useSpotifyImage } from '../../hooks/useSpotifyImage';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../../services/SpotifyApi';
import { getCardBackgroundByMode, type ThemeMode } from '../../theme/modes';
import { useMantineTheme } from '@mantine/core';
import { useStatsPreferences } from '../../hooks/useStatsPreferences';

// Component to render image cell with hooks
const ImageCell: React.FC<{ record: ChartData; type: string }> = ({ record, type }) => {
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

const RankStats: React.FC = () => {
  const { t } = useTranslation();
  const { rank: rankParam, type: typeParam } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ChartData[]>([]);
  const [year, setYear] = useState('all');
  const [type, setType] = useState(typeParam || 'artist');
  const [rank, setRank] = useState(Number(rankParam) || 1);
  const [yearRange, setYearRange] = useState<{ minYear: number; maxYear: number } | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('week-desc');

  // Use stats preferences hook
  const { preferences, updatePreference } = useStatsPreferences();

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

  // Get weight values for sales calculation
  const getWeights = React.useCallback((chartType: string) => {
    if (!chart) return { weightPlays: 1, weightPoints: 0 };

    if (chartType === 'track') {
      return {
        weightPlays: chart.music_plays_weight || 1,
        weightPoints: chart.music_points_weight || 0
      };
    } else if (chartType === 'album') {
      return {
        weightPlays: chart.album_plays_weight || 1,
        weightPoints: chart.album_points_weight || 0
      };
    }
    return { weightPlays: 1, weightPoints: 0 };
  }, [chart]);

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
        const results = await getItemsAtRank({
          chartId: String(chart.id),
          chartType: type,
          rank,
          year: year === 'all' ? undefined : year
        });

        // If peakOnly is enabled, filter items that had peak at this rank
        let filteredResults = results;
        if (preferences.peakOnly) {
          // Get all data for each entity to check their peak
          const allData = await db.charts_data
            .where('[chartId+chartType]')
            .equals([String(chart.id), type])
            .toArray();

          // Calculate peak for each entity
          const peakByEntity = new Map<string, number>();
          allData.forEach(item => {
            const currentPeak = peakByEntity.get(item.entityId);
            if (!currentPeak || item.rank < currentPeak) {
              peakByEntity.set(item.entityId, item.rank);
            }
          });

          // Filter only items where peak equals the selected rank
          filteredResults = results.filter(item => peakByEntity.get(item.entityId) === rank);
        }

        // Sort by week descending (most recent first)
        filteredResults.sort((a, b) => b.week.localeCompare(a.week));

        // Get all weeks for calculating week numbers
        const allWeeks = await db.charts_data
          .where('[chartId+chartType]')
          .equals([String(chart.id), type])
          .toArray();
        const uniqueWeeks = [...new Set(allWeeks.map(w => w.week))].sort();

        // Add weekNumber to each result (1 = oldest week, N = newest week)
        const resultsWithWeekNumber = filteredResults.map(item => ({
          ...item,
          weekNumber: uniqueWeeks.indexOf(item.week) + 1
        }));

        setData(resultsWithWeekNumber);
      } catch (error) {
        console.error('Error loading rank stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [chart, type, rank, year, preferences.peakOnly]);

  const handleTypeChange = (newType: string) => {
    setType(newType);
    navigate(`/stats/rank/${rank}/${newType}`);
  };

  const handlePositionChange = (newRank: number) => {
    setRank(newRank);
    navigate(`/stats/rank/${newRank}/${type}`);
  };

  // Add occurrence counter for each row
  const dataWithOccurrence = React.useMemo(() => {
    const occurrenceTracker = new Map<string, number>();
    // Reverse the data to count from oldest to newest
    const reversedData = [...data].reverse();
    const result = reversedData.map(item => {
      const key = `${item.entityId}`;
      const currentOccurrence = (occurrenceTracker.get(key) || 0) + 1;
      occurrenceTracker.set(key, currentOccurrence);
      return { ...item, occurrence: currentOccurrence };
    });
    // Reverse back to show newest first
    return result.reverse();
  }, [data]);

  // Filter by search query
  const filteredData = React.useMemo(() => {
    if (!searchQuery) return dataWithOccurrence;

    const lowerQuery = searchQuery.toLowerCase();
    return dataWithOccurrence.filter(item => {
      const nameMatch = item.name.toLowerCase().includes(lowerQuery);
      const artistMatch = item.artistName && item.artistName.toLowerCase().includes(lowerQuery);
      return nameMatch || artistMatch;
    });
  }, [dataWithOccurrence, searchQuery]);

  // Sort data
  const sortedData = React.useMemo(() => {
    const sorted = [...filteredData];
    const weights = getWeights(type);

    switch (sortBy) {
      case 'week-desc':
        return sorted.sort((a, b) => b.week.localeCompare(a.week));
      case 'week-asc':
        return sorted.sort((a, b) => a.week.localeCompare(b.week));
      case 'name-asc':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return sorted.sort((a, b) => b.name.localeCompare(a.name));
      case 'artist-asc':
        return sorted.sort((a, b) => (a.artistName || '').localeCompare(b.artistName || ''));
      case 'artist-desc':
        return sorted.sort((a, b) => (b.artistName || '').localeCompare(a.artistName || ''));
      case 'plays-desc':
        return sorted.sort((a, b) => b.plays - a.plays);
      case 'plays-asc':
        return sorted.sort((a, b) => a.plays - b.plays);
      case 'times-desc':
        return sorted.sort((a, b) => b.occurrence - a.occurrence);
      case 'times-asc':
        return sorted.sort((a, b) => a.occurrence - b.occurrence);
      case 'sales-desc':
        return sorted.sort((a, b) => {
          const salesA = calculateSales(a.plays, a.rank, weights.weightPlays, weights.weightPoints);
          const salesB = calculateSales(b.plays, b.rank, weights.weightPlays, weights.weightPoints);
          return salesB - salesA;
        });
      case 'sales-asc':
        return sorted.sort((a, b) => {
          const salesA = calculateSales(a.plays, a.rank, weights.weightPlays, weights.weightPoints);
          const salesB = calculateSales(b.plays, b.rank, weights.weightPlays, weights.weightPoints);
          return salesA - salesB;
        });
      default:
        return sorted;
    }
  }, [filteredData, sortBy, type, getWeights]);

  // Paginate data
  const paginatedData = React.useMemo(() => {
    const start = (page - 1) * preferences.pageSize;
    return sortedData.slice(start, start + preferences.pageSize);
  }, [sortedData, page, preferences.pageSize]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, sortBy, preferences.pageSize]);

  // Sort options
  const sortOptions = React.useMemo(() => [
    { value: 'week-desc', label: t('stats.rank.sort.weekDesc') },
    { value: 'week-asc', label: t('stats.rank.sort.weekAsc') },
    { value: 'name-asc', label: t('stats.rank.sort.nameAsc') },
    { value: 'name-desc', label: t('stats.rank.sort.nameDesc') },
    ...(type !== 'artist' && preferences.showArtistColumn ? [
      { value: 'artist-asc', label: t('stats.rank.sort.artistAsc') },
      { value: 'artist-desc', label: t('stats.rank.sort.artistDesc') },
    ] : []),
    { value: 'times-desc', label: t('stats.rank.sort.timesDesc') },
    { value: 'times-asc', label: t('stats.rank.sort.timesAsc') },
    { value: 'plays-desc', label: t('stats.rank.sort.playsDesc') },
    { value: 'plays-asc', label: t('stats.rank.sort.playsAsc') },
    ...(preferences.showSales ? [
      { value: 'sales-desc', label: t('stats.rank.sort.salesDesc') },
      { value: 'sales-asc', label: t('stats.rank.sort.salesAsc') },
    ] : [])
  ], [t, type, preferences.showArtistColumn, preferences.showSales]);

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
        position={rank}
        onPositionChange={handlePositionChange}
        showSales={preferences.showSales}
        onToggleSales={(value) => updatePreference('showSales', value)}
        peakOnly={preferences.peakOnly}
        onTogglePeakOnly={(value) => updatePreference('peakOnly', value)}
        showImages={preferences.showImages}
        onToggleImages={(value) => updatePreference('showImages', value)}
        showArtistColumn={preferences.showArtistColumn}
        onToggleArtistColumn={(value) => updatePreference('showArtistColumn', value)}
  fontSize={preferences.fontSize}
  onFontSizeChange={(value) => updatePreference('fontSize', value)}
        yearRange={yearRange || undefined}
        showPositionFilter={true}
        showPeakOnlyToggle={true}
        cutoff={cutoff}
        pageSize={preferences.pageSize}
        onPageSizeChange={(value) => updatePreference('pageSize', value)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        sortBy={sortBy}
        onSortChange={setSortBy}
        sortOptions={sortOptions}
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
                  <Table.Th style={{ width: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>{t('charts.weekNumber')}</Table.Th>
                  <Table.Th>{t('stats.rank.columns.title')}</Table.Th>
                  {preferences.showArtistColumn && type !== 'artist' && <Table.Th>{t('charts.artist')}</Table.Th>}
                  <Table.Th style={{ width: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>{t('stats.rank.columns.times', { n: rank })}</Table.Th>
                  <Table.Th style={{ width: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>{t('stats.rank.columns.plays')}</Table.Th>
                  {preferences.showSales && <Table.Th style={{ width: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>{t('stats.rank.columns.sales')}</Table.Th>}
                  <Table.Th style={{ width: 1 }}></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedData.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={
                      1 + // week
                      1 + // title
                      (preferences.showArtistColumn && type !== 'artist' ? 1 : 0) +
                      1 + // times
                      1 + // plays
                      (preferences.showSales ? 1 : 0) +
                      1 // button
                    }>
                      <Text ta="center" py="xl">{t('stats.noData')}</Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  paginatedData.map((record: any) => {
                    const startDate = dayjs(record.week);
                    const endDate = startDate.add(6, 'day');
                    const dateRange = `${startDate.format('DD/MM/YYYY')} - ${endDate.format('DD/MM/YYYY')}`;
                    const weights = getWeights(type);
                    const sales = preferences.showSales ? calculateSales(record.plays, record.rank, weights.weightPlays, weights.weightPoints) : 0;

                    return (
                      <Table.Tr key={`${record.week}-${record.entityId}`}>
                        <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <Tooltip label={dateRange} withArrow>
                            <Text size={preferences.fontSize === 'xs' ? 'sm' : preferences.fontSize === 'md' ? 'lg' : 'md'}>{record.weekNumber}</Text>
                          </Tooltip>
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
                          <Text size={preferences.fontSize === 'xs' ? 'sm' : preferences.fontSize === 'md' ? 'lg' : 'md'}>{record.occurrence}</Text>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <Text size={preferences.fontSize === 'xs' ? 'sm' : preferences.fontSize === 'md' ? 'lg' : 'md'}>{record.plays.toLocaleString()}</Text>
                        </Table.Td>
                        {preferences.showSales && (
                          <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <Text size={preferences.fontSize === 'xs' ? 'sm' : preferences.fontSize === 'md' ? 'lg' : 'md'}>{Math.round(sales).toLocaleString()}</Text>
                          </Table.Td>
                        )}
                        <Table.Td style={{ width: 1, whiteSpace: 'nowrap' }}>
                          <Button
                            size="xs"
                            variant="light"
                            px={6}
                            onClick={() => navigate(`/charts/week/${record.week}/${type}`)}
                          >
                            <IconChevronRight size={16} />
                          </Button>
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

export default RankStats;
