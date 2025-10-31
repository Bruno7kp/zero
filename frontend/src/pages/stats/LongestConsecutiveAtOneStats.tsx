// Most consecutive weeks at #1
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
  Flex,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import StatsFilters from '../../components/stats/StatsFilters';
import { getLongestConsecutiveAtOne, getYearRange } from '../../utils/statsQueries';
import { useSpotifyImage } from '../../hooks/useSpotifyImage';
import { useStatsPreferences } from '../../hooks/useStatsPreferences';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../../services/SpotifyApi';
import { getCardBackgroundByMode, type ThemeMode } from '../../theme/modes';
import { useMantineTheme } from '@mantine/core';

const ImageCell: React.FC<{ record: any; type: string }> = ({ record, type }) => {
  const { imageUrl } = useSpotifyImage({
    entityId: record.entityId,
    name: record.name,
    artist: record.artistName,
    type: type as 'artist' | 'album' | 'track',
    clientId: SPOTIFY_TOKEN,
    clientSecret: SPOTIFY_SECRET,
  });

  return <Avatar src={imageUrl} alt={record.name} size={40} radius="md" />;
};

const LongestConsecutiveAtOneStats: React.FC = () => {
  const { t } = useTranslation();
  const { type: typeParam } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Array<any>>([]);
  const [year, setYear] = useState('all');
  const [type, setType] = useState(typeParam || 'track');
  const { preferences, updatePreference } = useStatsPreferences();
  const [yearRange, setYearRange] = useState<{ minYear: number; maxYear: number } | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('longest-desc');

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
        const results = await getLongestConsecutiveAtOne({
          chartId: String(chart.id),
          chartType: type,
          year,
        });
        setData(results);
      } catch (err) {
        console.error('Error loading longest consecutive at #1 stats', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [chart, type, year]);

  const handleTypeChange = (newType: string) => {
    setType(newType);
    navigate(`/stats/longest_consecutive_at_one/${newType}`);
  };

  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(
      item =>
        item.name.toLowerCase().includes(q) ||
        (item.artistName && item.artistName.toLowerCase().includes(q))
    );
  }, [data, searchQuery]);

  const sortedData = React.useMemo(() => {
    const copy = [...filteredData];
    switch (sortBy) {
      case 'longest-desc':
        return copy.sort((a, b) => b.longest - a.longest);
      case 'longest-asc':
        return copy.sort((a, b) => a.longest - b.longest);
      case 'name-asc':
        return copy.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return copy.sort((a, b) => b.name.localeCompare(a.name));
      case 'artist-asc':
        return copy.sort((a, b) => (a.artistName || '').localeCompare(b.artistName || ''));
      case 'artist-desc':
        return copy.sort((a, b) => (b.artistName || '').localeCompare(a.artistName || ''));
      default:
        return copy;
    }
  }, [filteredData, sortBy]);

  const paginatedData = React.useMemo(() => {
    const start = (page - 1) * preferences.pageSize;
    return sortedData.slice(start, start + preferences.pageSize);
  }, [sortedData, page, preferences.pageSize]);

  React.useEffect(() => setPage(1), [searchQuery, sortBy, preferences.pageSize]);

  const sortOptions = React.useMemo(
    () => [
      { value: 'longest-desc', label: t('stats.timesAtRank.sort.timesDesc') },
      { value: 'longest-asc', label: t('stats.timesAtRank.sort.timesAsc') },
      { value: 'name-asc', label: t('stats.timesAtTop.sort.nameAsc') },
      { value: 'name-desc', label: t('stats.timesAtTop.sort.nameDesc') },
      { value: 'artist-asc', label: t('stats.timesAtTop.sort.artistAsc') },
      { value: 'artist-desc', label: t('stats.timesAtTop.sort.artistDesc') },
    ],
    [t]
  );

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
        onToggleImages={v => updatePreference('showImages', v)}
        showArtistColumn={preferences.showArtistColumn}
        onToggleArtistColumn={v => updatePreference('showArtistColumn', v)}
        containerSize={preferences.containerSize}
        onContainerSizeChange={v => updatePreference('containerSize', v)}
        fontSize={preferences.fontSize}
        onFontSizeChange={v => updatePreference('fontSize', v)}
        yearRange={yearRange || undefined}
        showSalesToggle={false}
        pageSize={preferences.pageSize}
        onPageSizeChange={v => updatePreference('pageSize', v)}
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
                  <Table.Th style={{ width: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    #
                  </Table.Th>
                  <Table.Th>{t('stats.timesAtRank.columns.title')}</Table.Th>
                  {preferences.showArtistColumn && type !== 'artist' && (
                    <Table.Th>{t('charts.artist')}</Table.Th>
                  )}
                  <Table.Th style={{ width: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {t('stats.longestConsecutiveAtOne.columns.longest')}
                  </Table.Th>
                  <Table.Th style={{ width: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {t('stats.longestConsecutiveAtOne.columns.startWeek')}
                  </Table.Th>
                  <Table.Th style={{ width: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {t('stats.longestConsecutiveAtOne.columns.endWeek')}
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedData.length === 0 ? (
                  <Table.Tr>
                    <Table.Td
                      colSpan={
                        1 + 1 + (preferences.showArtistColumn && type !== 'artist' ? 1 : 0) + 3
                      }
                    >
                      <Text ta="center" py="xl">
                        {t('stats.noData')}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  paginatedData.map((record: any, index) => {
                    const displayRank = (page - 1) * preferences.pageSize + index + 1;
                    return (
                      <Table.Tr key={record.entityId}>
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
                            {preferences.showImages && <ImageCell record={record} type={type} />}
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
                            >
                              {record.artistName}
                            </Text>
                          </Table.Td>
                        )}
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
                            {record.longest}
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
                            {record.startWeek || '-'}
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
                            {record.endWeek || '-'}
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

export default LongestConsecutiveAtOneStats;
