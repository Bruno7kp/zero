// Points Accumulators stats
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  Box,
  Flex,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import StatsFilters from '../../components/stats/StatsFilters';
import { getPointsAccumulators, getYearRange } from '../../utils/statsQueries';
import { useSpotifyImage } from '../../hooks/useSpotifyImage';
import { useStatsPreferences } from '../../hooks/useStatsPreferences';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../../services/SpotifyApi';
import { getCardBackgroundByMode, type ThemeMode } from '../../theme/modes';
import { useMantineTheme } from '@mantine/core';
import { encodeLastFmSlug } from '../../utils/urlEncoding';

// Component to render image cell with hooks
const ImageCell: React.FC<{ entityId: string; name: string; artistName: string; type: string }> = ({
  entityId,
  name,
  artistName,
  type,
}) => {
  const { imageUrl } = useSpotifyImage({
    entityId,
    name,
    artist: artistName,
    type: type as 'artist' | 'album' | 'track',
    clientId: SPOTIFY_TOKEN,
    clientSecret: SPOTIFY_SECRET,
  });

  return <Avatar src={imageUrl} alt={name} size={40} radius="md" />;
};

const PointsStats: React.FC = () => {
  const { t } = useTranslation();
  const { type: typeParam } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<
    Array<{
      entityId: string;
      name: string;
      artistName: string;
      totalPoints: number;
      weeksOnChart: number;
    }>
  >([]);
  const [type, setType] = useState(typeParam || 'artist');
  const { preferences, updatePreference } = useStatsPreferences();
  const year = preferences.selectedYear;
  const setYear = (newYear: string) => updatePreference('selectedYear', newYear);
  const [yearRange, setYearRange] = useState<{ minYear: number; maxYear: number } | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('points-desc');

  const charts = useSelector((state: any) => state.charts.charts);
  const activeChartId = useSelector((state: any) => state.charts.activeChartId);
  const chart = charts.find((c: any) => c.id === activeChartId);
  const theme = useMantineTheme();
  const themeMode = useSelector((state: any) => state.theme?.value || 'dark') as ThemeMode;

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
        const results = await getPointsAccumulators({
          chartId: String(chart.id),
          chartType: type,
          year: year === 'all' ? undefined : year,
        });
        setData(results);
      } catch (error) {
        console.error('Error loading points stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [chart, type, year]);

  const handleTypeChange = (newType: string) => {
    setType(newType);
    navigate(`/stats/points/${newType}`);
  };

  // Filter data by search query
  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase();
    return data.filter(
      item =>
        item.name.toLowerCase().includes(query) ||
        (item.artistName && item.artistName.toLowerCase().includes(query))
    );
  }, [data, searchQuery]);

  // Sort data
  const sortedData = React.useMemo(() => {
    const sorted = [...filteredData];

    switch (sortBy) {
      case 'points-desc':
        return sorted.sort((a, b) => b.totalPoints - a.totalPoints);
      case 'points-asc':
        return sorted.sort((a, b) => a.totalPoints - b.totalPoints);
      case 'weeks-desc':
        return sorted.sort((a, b) => b.weeksOnChart - a.weeksOnChart);
      case 'weeks-asc':
        return sorted.sort((a, b) => a.weeksOnChart - b.weeksOnChart);
      case 'position-desc':
        return sorted; // Already sorted by points
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
  }, [searchQuery, sortBy, preferences.pageSize, year]);

  // Sort options
  const sortOptions = React.useMemo(() => {
    return [
      { value: 'points-desc', label: t('stats.points.sort.pointsDesc') },
      { value: 'points-asc', label: t('stats.points.sort.pointsAsc') },
      { value: 'weeks-desc', label: t('stats.points.sort.weeksDesc') },
      { value: 'weeks-asc', label: t('stats.points.sort.weeksAsc') },
      //{ value: 'position-desc', label: t('stats.points.sort.positionDesc') },
      //{ value: 'position-asc', label: t('stats.points.sort.positionAsc') },
      // { value: 'name-asc', label: t('stats.points.sort.nameAsc') },
      // { value: 'name-desc', label: t('stats.points.sort.nameDesc') },
      ...(type !== 'artist' && preferences.showArtistColumn
        ? [
            { value: 'artist-asc', label: t('stats.points.sort.artistAsc') },
            { value: 'artist-desc', label: t('stats.points.sort.artistDesc') },
          ]
        : []),
    ];
  }, [t, type, preferences.showArtistColumn]);

  if (!chart) {
    return (
      <Center py="xl">
        <Text>{t('errors.selectActiveChart')}</Text>
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <StatsFilters
        year={year}
        onYearChange={setYear}
        type={type}
        onTypeChange={handleTypeChange}
        showImages={preferences.showImages}
        onToggleImages={value => updatePreference('showImages', value)}
        showArtistColumn={preferences.showArtistColumn}
        onToggleArtistColumn={value => updatePreference('showArtistColumn', value)}
        containerSize={preferences.containerSize}
        onContainerSizeChange={value => updatePreference('containerSize', value)}
        fontSize={preferences.fontSize}
        onFontSizeChange={value => updatePreference('fontSize', value)}
        yearRange={yearRange || undefined}
        showSalesToggle={false}
        pageSize={preferences.pageSize}
        onPageSizeChange={value => updatePreference('pageSize', value)}
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
                  <Table.Th style={{ width: 60, textAlign: 'center' }}>#</Table.Th>
                  <Table.Th style={{ width: 'auto' }}>{t('stats.points.columns.title')}</Table.Th>
                  {preferences.showArtistColumn && type !== 'artist' && (
                    <Table.Th>{t('charts.artist')}</Table.Th>
                  )}
                  <Table.Th style={{ width: 150, textAlign: 'center' }}>
                    {t('stats.points.columns.weeksOnChart')}
                  </Table.Th>
                  <Table.Th style={{ width: 150, textAlign: 'center' }}>
                    {t('stats.points.columns.totalPoints')}
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedData.length === 0 ? (
                  <Table.Tr>
                    <Table.Td
                      colSpan={
                        1 + // rank
                        1 + // title
                        (preferences.showArtistColumn && type !== 'artist' ? 1 : 0) +
                        1 + // weeks
                        1 // points
                      }
                    >
                      <Text ta="center" py="xl">
                        {t('stats.noData')}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  paginatedData.map((record, index) => {
                    const displayRank = (page - 1) * preferences.pageSize + index + 1;

                    return (
                      <Table.Tr key={record.entityId}>
                        <Table.Td style={{ textAlign: 'center' }}>
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
                            {preferences.showImages && (
                              <ImageCell
                                entityId={record.entityId}
                                name={record.name}
                                artistName={record.artistName}
                                type={type}
                              />
                            )}
                            <Box style={{ flex: 1, minWidth: 0 }}>
                              <Text
                                fw={600}
                                lineClamp={1}
                                size={
                                  preferences.fontSize === 'xs'
                                    ? 'sm'
                                    : preferences.fontSize === 'md'
                                    ? 'lg'
                                    : 'md'
                                }
                                component={Link}
                                to={
                                  type === 'artist'
                                    ? `/library/music/${encodeLastFmSlug(record.name)}`
                                    : type === 'album'
                                    ? `/library/music/${encodeLastFmSlug(
                                        record.artistName
                                      )}/${encodeLastFmSlug(record.name)}`
                                    : `/library/music/${encodeLastFmSlug(
                                        record.artistName
                                      )}/_/${encodeLastFmSlug(record.name)}`
                                }
                                className="mantine-Link-root"
                              >
                                {record.name}
                              </Text>
                              {type !== 'artist' &&
                                record.artistName &&
                                !preferences.showArtistColumn && (
                                  <Text
                                    c="dimmed"
                                    size={
                                      preferences.fontSize === 'xs'
                                        ? 'xs'
                                        : preferences.fontSize === 'md'
                                        ? 'md'
                                        : 'sm'
                                    }
                                    lineClamp={1}
                                    component={Link}
                                    to={`/library/music/${encodeLastFmSlug(record.artistName)}`}
                                    className="mantine-Link-root"
                                  >
                                    {record.artistName}
                                  </Text>
                                )}
                            </Box>
                          </Flex>
                        </Table.Td>
                        {preferences.showArtistColumn && type !== 'artist' && (
                          <Table.Td>
                            <Text
                              size={
                                preferences.fontSize === 'xs'
                                  ? 'sm'
                                  : preferences.fontSize === 'md'
                                  ? 'lg'
                                  : 'md'
                              }
                              component={Link}
                              to={`/library/music/${encodeLastFmSlug(record.artistName)}`}
                              className="mantine-Link-root"
                            >
                              {record.artistName}
                            </Text>
                          </Table.Td>
                        )}
                        <Table.Td style={{ textAlign: 'center' }}>
                          <Text
                            size={
                              preferences.fontSize === 'xs'
                                ? 'sm'
                                : preferences.fontSize === 'md'
                                ? 'lg'
                                : 'md'
                            }
                          >
                            {record.weeksOnChart}
                          </Text>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'center' }}>
                          <Text
                            size={
                              preferences.fontSize === 'xs'
                                ? 'sm'
                                : preferences.fontSize === 'md'
                                ? 'lg'
                                : 'md'
                            }
                          >
                            {record.totalPoints.toLocaleString()}
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

export default PointsStats;
