// Most consecutive weeks at #1
import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  Select,
  Tooltip,
  Button,
} from '@mantine/core';
import { IconArrowBarUp, IconChevronRight } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import StatsFilters from '../../components/stats/StatsFilters';
import { getLongestConsecutiveAtOne, getYearRange, getAllWeeks } from '../../utils/statsQueries';
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
  // Default to Top 1 (behaviour consistent with other stats)
  const [position, setPosition] = useState<number>(1);
  const [sortBy, setSortBy] = useState('longest-desc');

  const charts = useSelector((state: any) => state.charts.charts);
  const activeChartId = useSelector((state: any) => state.charts.activeChartId);
  const chart = charts.find((c: any) => c.id === activeChartId);
  const theme = useMantineTheme();
  const themeMode = useSelector((state: any) => state.theme?.value || 'dark') as ThemeMode;

  const primaryTextSize =
    preferences.fontSize === 'xs' ? 'sm' : preferences.fontSize === 'md' ? 'lg' : 'md';
  const secondaryTextSize =
    preferences.fontSize === 'xs' ? 'xs' : preferences.fontSize === 'md' ? 'md' : 'sm';

  useEffect(() => {
    if (!chart) return;
    const loadYearRange = async () => {
      const range = await getYearRange(String(chart.id), type);
      setYearRange(range);
    };
    loadYearRange();
  }, [chart, type]);

  const getCutoff = (chartType: string) => {
    if (!chart) return 100;
    const cutoffMap: Record<string, number> = {
      artist: chart.artist_cutoff || 100,
      album: chart.album_cutoff || 100,
      track: chart.music_cutoff || 100,
    };
    return cutoffMap[chartType] || 100;
  };

  useEffect(() => {
    if (!chart) return;
    const loadData = async () => {
      setLoading(true);
      try {
        const results = await getLongestConsecutiveAtOne({
          chartId: String(chart.id),
          chartType: type,
          year,
          position: typeof position === 'number' ? position : undefined,
          positionOperator: typeof position === 'number' ? 'lte' : undefined,
        } as any);

        const weeks = await getAllWeeks(String(chart.id), type);
        const resultsWithWeekNumber = results.map(item => ({
          ...item,
          endWeekNumber: item.endWeek ? weeks.indexOf(item.endWeek) + 1 : null,
        }));

        setData(resultsWithWeekNumber);
      } catch (err) {
        console.error('Error loading longest consecutive at #1 stats', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [chart, type, year, position]);

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

  React.useEffect(() => setPage(1), [searchQuery, sortBy, preferences.pageSize]);

  const sortOptions = React.useMemo(
    () => [
      { value: 'longest-desc', label: t('stats.timesAtRank.sort.timesDesc') },
      { value: 'longest-asc', label: t('stats.timesAtRank.sort.timesAsc') },
      { value: 'name-asc', label: t('stats.timesAtTop.sort.nameAsc') },
      { value: 'name-desc', label: t('stats.timesAtTop.sort.nameDesc') },
      { value: 'artist-asc', label: t('stats.timesAtTop.sort.artistAsc') },
      { value: 'artist-desc', label: t('stats.timesAtTop.sort.artistDesc') },
      { value: 'endWeek-desc', label: t('stats.longestConsecutiveAtOne.sort.endWeekDesc') },
      { value: 'endWeek-asc', label: t('stats.longestConsecutiveAtOne.sort.endWeekAsc') },
    ],
    [t]
  );

  const sortedData = React.useMemo(() => {
    const copy = [...filteredData];
    switch (sortBy) {
      case 'longest-desc':
        return copy.sort((a, b) => b.longest - a.longest);
      case 'longest-asc':
        return copy.sort((a, b) => a.longest - b.longest);
      case 'endWeek-desc':
        return copy.sort((a, b) => (b.endWeek || '').localeCompare(a.endWeek || ''));
      case 'endWeek-asc':
        return copy.sort((a, b) => (a.endWeek || '').localeCompare(b.endWeek || ''));
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
        showPositionFilter={false}
        cutoff={getCutoff(type)}
        customFilters={
          <Select
            value={String(position)}
            onChange={value => {
              if (value) setPosition(Number(value));
            }}
            data={Array.from({ length: getCutoff(type) }, (_, i) => ({
              value: String(i + 1),
              label: `Top ${i + 1}`,
            }))}
            style={{ minWidth: 140 }}
            leftSection={<IconArrowBarUp size={16} />}
            searchable
          />
        }
        showImages={preferences.showImages}
        onToggleImages={v => updatePreference('showImages', v)}
        showArtistColumn={preferences.showArtistColumn}
        onToggleArtistColumn={v => updatePreference('showArtistColumn', v)}
        showWeekColumn={preferences.showWeekColumn}
        onToggleWeekColumn={v => updatePreference('showWeekColumn', v)}
        showPositionColumn={preferences.showPositionColumn}
        onTogglePositionColumn={v => updatePreference('showPositionColumn', v)}
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
                  {preferences.showWeekColumn && (
                    <Table.Th style={{ width: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {t('stats.longestConsecutiveAtOne.columns.endWeek')}
                    </Table.Th>
                  )}
                  {preferences.showWeekColumn && <Table.Th style={{ width: 1 }}></Table.Th>}
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedData.length === 0 ? (
                  <Table.Tr>
                    <Table.Td
                      colSpan={
                        1 + // # column
                        1 + // title
                        (preferences.showArtistColumn && type !== 'artist' ? 1 : 0) +
                        1 +
                        (preferences.showWeekColumn ? 1 : 0) +
                        (preferences.showWeekColumn ? 1 : 0)
                      }
                    >
                      <Text ta="center" py="xl" size={primaryTextSize}>
                        {t('stats.noData')}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  paginatedData.map((record: any, index) => {
                    const displayRank = (page - 1) * preferences.pageSize + index + 1;
                    const weekStart = record.endWeek ? dayjs(record.endWeek) : null;
                    const weekEnd = weekStart ? weekStart.add(6, 'day') : null;
                    const dateRange =
                      weekStart && weekStart.isValid() && weekEnd && weekEnd.isValid()
                        ? `${weekStart.format('DD/MM/YYYY')} - ${weekEnd.format('DD/MM/YYYY')}`
                        : undefined;

                    return (
                      <Table.Tr key={record.entityId}>
                        <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <Text size={primaryTextSize}>{displayRank}</Text>
                        </Table.Td>
                        <Table.Td style={{ verticalAlign: 'middle' }}>
                          <Flex gap="sm" wrap="nowrap" align="center">
                            {preferences.showImages && <ImageCell record={record} type={type} />}
                            <Box style={{ flex: 1, minWidth: 0 }}>
                              <Text
                                fw={600}
                                lineClamp={1}
                                className="entity-name"
                                size={primaryTextSize}
                              >
                                {record.name}
                              </Text>
                              {type !== 'artist' &&
                                record.artistName &&
                                !preferences.showArtistColumn && (
                                  <Text c="dimmed" size={secondaryTextSize} lineClamp={1}>
                                    {record.artistName}
                                  </Text>
                                )}
                            </Box>
                          </Flex>
                        </Table.Td>
                        {preferences.showArtistColumn && type !== 'artist' && (
                          <Table.Td>
                            <Text size={primaryTextSize}>{record.artistName}</Text>
                          </Table.Td>
                        )}
                        <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <Text size={primaryTextSize}>{record.longest}</Text>
                        </Table.Td>
                        {preferences.showWeekColumn && (
                          <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            {record.endWeek && dateRange ? (
                              <Tooltip label={dateRange} withArrow>
                                <Text size={primaryTextSize}>{record.endWeekNumber ?? '-'}</Text>
                              </Tooltip>
                            ) : (
                              <Text size={primaryTextSize}>-</Text>
                            )}
                          </Table.Td>
                        )}
                        {preferences.showWeekColumn && (
                          <Table.Td style={{ width: 1, whiteSpace: 'nowrap' }}>
                            {record.endWeek ? (
                              <Button
                                size="xs"
                                variant="light"
                                px={6}
                                component={Link}
                                to={`/charts/week/${record.endWeek}/${type}`}
                              >
                                <IconChevronRight size={16} />
                              </Button>
                            ) : null}
                          </Table.Td>
                        )}
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
