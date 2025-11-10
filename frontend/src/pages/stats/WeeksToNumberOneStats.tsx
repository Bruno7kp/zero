// Most weeks until reaching #1
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Stack,
  Loader,
  Center,
  Card,
  Text,
  Table,
  ScrollArea,
  Pagination,
  Box,
  Flex,
  Avatar,
  Tooltip,
  Button,
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { IconChevronRight } from '@tabler/icons-react';
import { useSpotifyImage } from '../../hooks/useSpotifyImage';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../../services/SpotifyApi';
import StatsFilters from '../../components/stats/StatsFilters';
import { getWeeksToFirstNumberOne, getYearRange, getAllWeeks } from '../../utils/statsQueries';
import { useStatsPreferences } from '../../hooks/useStatsPreferences';
import { getCardBackgroundByMode, type ThemeMode } from '../../theme/modes';
import { useMantineTheme } from '@mantine/core';
import { encodeLastFmSlug } from '../../utils/urlEncoding';

const WeeksToNumberOneStats: React.FC = () => {
  const { t } = useTranslation();
  const { type: typeParam } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Array<any>>([]);
  const { preferences, updatePreference } = useStatsPreferences();
  // Use persistent year from preferences
  const year = preferences.selectedYear;
  const setYear = (newYear: string) => updatePreference('selectedYear', newYear);
  const [type, setType] = useState(typeParam || 'track');
  const [yearRange, setYearRange] = useState<{ minYear: number; maxYear: number } | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('weeks-desc');

  const charts = useSelector((state: any) => state.charts.charts);
  const activeChartId = useSelector((state: any) => state.charts.activeChartId);
  const chart = charts.find((c: any) => c.id === activeChartId);
  const theme = useMantineTheme();
  const themeMode = useSelector((state: any) => state.theme?.value || 'dark') as ThemeMode;

  const primaryTextSize =
    preferences.fontSize === 'xs' ? 'sm' : preferences.fontSize === 'md' ? 'lg' : 'md';
  const secondaryTextSize =
    preferences.fontSize === 'xs' ? 'xs' : preferences.fontSize === 'md' ? 'md' : 'sm';

  // Image cell component (hooks must be called in component scope)
  const ImageCell: React.FC<{ entityId: string; name: string; artist?: string }> = ({
    entityId,
    name,
    artist,
  }) => {
    const { imageUrl } = useSpotifyImage({
      entityId,
      name,
      artist: artist || name,
      type: 'track' as any,
      clientId: SPOTIFY_TOKEN,
      clientSecret: SPOTIFY_SECRET,
    });

    return <Avatar src={imageUrl} alt={name} size={40} radius="md" />;
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
        const results = await getWeeksToFirstNumberOne({
          chartId: String(chart.id),
          chartType: type,
          year: year === 'all' ? undefined : year,
        });
        const weeks = await getAllWeeks(String(chart.id), type);
        const resultsWithWeekNumber = results.map(item => ({
          ...item,
          weekReachedOneNumber: item.weekReachedOne ? weeks.indexOf(item.weekReachedOne) + 1 : null,
        }));
        setData(resultsWithWeekNumber);
      } catch (err) {
        console.error('Error loading weeks to #1 stats', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [chart, type, year]);

  const handleTypeChange = (newType: string) => {
    setType(newType);
    navigate(`/stats/weeks_to_number_one/${newType}`);
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
      case 'weeks-desc':
        return copy.sort((a, b) => b.weeksToFirstNumberOne - a.weeksToFirstNumberOne);
      case 'weeks-asc':
        return copy.sort((a, b) => a.weeksToFirstNumberOne - b.weeksToFirstNumberOne);
      case 'name-asc':
        return copy.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return copy.sort((a, b) => b.name.localeCompare(a.name));
      case 'artist-asc':
        return copy.sort((a, b) => (a.artistName || '').localeCompare(b.artistName || ''));
      case 'artist-desc':
        return copy.sort((a, b) => (b.artistName || '').localeCompare(a.artistName || ''));
      case 'weekReachedOne-desc':
        return copy.sort((a, b) => {
          const A = dayjs(a.weekReachedOne);
          const B = dayjs(b.weekReachedOne);
          if (!A.isValid() && !B.isValid()) return 0;
          if (!A.isValid()) return 1;
          if (!B.isValid()) return -1;
          return B.valueOf() - A.valueOf();
        });
      case 'weekReachedOne-asc':
        return copy.sort((a, b) => {
          const A = dayjs(a.weekReachedOne);
          const B = dayjs(b.weekReachedOne);
          if (!A.isValid() && !B.isValid()) return 0;
          if (!A.isValid()) return 1;
          if (!B.isValid()) return -1;
          return A.valueOf() - B.valueOf();
        });
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
      { value: 'weeks-desc', label: t('stats.weeksToNumberOne.sort.weeksDesc') },
      { value: 'weeks-asc', label: t('stats.weeksToNumberOne.sort.weeksAsc') },
      { value: 'weekReachedOne-desc', label: t('stats.weeksToNumberOne.sort.weekReachedOneDesc') },
      { value: 'weekReachedOne-asc', label: t('stats.weeksToNumberOne.sort.weekReachedOneAsc') },
      // { value: 'name-asc', label: t('stats.timesAtTop.sort.nameAsc') },
      // { value: 'name-desc', label: t('stats.timesAtTop.sort.nameDesc') },
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
                    {t('stats.weeksToNumberOne.columns.weeksToOne')}
                  </Table.Th>
                  {preferences.showWeekColumn && (
                    <Table.Th style={{ width: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {t('stats.weeksToNumberOne.columns.weekReachedOne')}
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
                    const weekStart = record.weekReachedOne ? dayjs(record.weekReachedOne) : null;
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
                        <Table.Td>
                          <Flex gap="sm" align="center">
                            {preferences.showImages && (
                              <ImageCell
                                entityId={record.entityId}
                                name={record.name}
                                artist={record.artistName}
                              />
                            )}
                            <Box style={{ flex: 1, minWidth: 0 }}>
                              <Text
                                fw={600}
                                lineClamp={1}
                                size={primaryTextSize}
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
                                    size={secondaryTextSize}
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
                              size={primaryTextSize}
                              component={Link}
                              to={`/library/music/${encodeLastFmSlug(record.artistName)}`}
                              className="mantine-Link-root"
                            >
                              {record.artistName}
                            </Text>
                          </Table.Td>
                        )}
                        <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <Text size={primaryTextSize}>{record.weeksToFirstNumberOne}</Text>
                        </Table.Td>
                        {preferences.showWeekColumn && (
                          <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            {record.weekReachedOne && dateRange ? (
                              <Tooltip label={dateRange} withArrow>
                                <Text size={primaryTextSize}>
                                  {record.weekReachedOneNumber ?? '-'}
                                </Text>
                              </Tooltip>
                            ) : (
                              <Text size={primaryTextSize}>-</Text>
                            )}
                          </Table.Td>
                        )}
                        {preferences.showWeekColumn && (
                          <Table.Td style={{ width: 1, whiteSpace: 'nowrap' }}>
                            {record.weekReachedOne ? (
                              <Button
                                size="xs"
                                variant="light"
                                px={6}
                                component={Link}
                                to={`/charts/week/${record.weekReachedOne}/${type}`}
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

export default WeeksToNumberOneStats;
