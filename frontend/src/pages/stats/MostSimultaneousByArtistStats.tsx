// Artists with most simultaneous tracks in the same week
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import dayjs from 'dayjs';
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
import { useSpotifyImage } from '../../hooks/useSpotifyImage';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../../services/SpotifyApi';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import StatsFilters from '../../components/stats/StatsFilters';
import {
  getArtistsWithMostSimultaneousItems,
  getYearRange,
  getAllWeeks,
} from '../../utils/statsQueries';
import { useStatsPreferences } from '../../hooks/useStatsPreferences';
import { getCardBackgroundByMode, type ThemeMode } from '../../theme/modes';
import { useMantineTheme } from '@mantine/core';

const MostSimultaneousByArtistStats: React.FC = () => {
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
  const [sortBy, setSortBy] = useState('simultaneous-desc');
  const [topN, setTopN] = useState<number | undefined>(undefined);

  const charts = useSelector((state: any) => state.charts.charts);
  const activeChartId = useSelector((state: any) => state.charts.activeChartId);
  const chart = charts.find((c: any) => c.id === activeChartId);
  const theme = useMantineTheme();
  const themeMode = useSelector((state: any) => state.theme?.value || 'dark') as ThemeMode;

  const primaryTextSize =
    preferences.fontSize === 'xs' ? 'sm' : preferences.fontSize === 'md' ? 'lg' : 'md';

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
        const effectiveTopN = typeof topN === 'number' ? topN : undefined;
        const results = await getArtistsWithMostSimultaneousItems({
          chartId: String(chart.id),
          chartType: type as 'track' | 'album',
          year,
          topN: effectiveTopN,
        });
        const weeks = await getAllWeeks(String(chart.id), type);
        const resultsWithWeekNumber = results.map(item => ({
          ...item,
          sampleWeekNumber: item.sampleWeek ? weeks.indexOf(item.sampleWeek) + 1 : null,
        }));
        setData(resultsWithWeekNumber);
      } catch (err) {
        console.error('Error loading most simultaneous by artist', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [chart, type, year, topN]);

  const handleTypeChange = (newType: string) => {
    setType(newType);
    navigate(`/stats/most_simultaneous_by_artist/${newType}`);
  };

  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(item => item.artistName.toLowerCase().includes(q));
  }, [data, searchQuery]);

  const sortedData = React.useMemo(() => {
    const copy = [...filteredData];
    switch (sortBy) {
      case 'simultaneous-desc':
        return copy.sort((a, b) => b.maxSimultaneous - a.maxSimultaneous);
      case 'simultaneous-asc':
        return copy.sort((a, b) => a.maxSimultaneous - b.maxSimultaneous);
      case 'weeks-desc':
        return copy.sort((a, b) => b.totalWeeks - a.totalWeeks);
      case 'weeks-asc':
        return copy.sort((a, b) => a.totalWeeks - b.totalWeeks);
      case 'name-asc':
        return copy.sort((a, b) => a.artistName.localeCompare(b.artistName));
      case 'name-desc':
        return copy.sort((a, b) => b.artistName.localeCompare(a.artistName));
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
      {
        value: 'simultaneous-desc',
        label: t('stats.mostSimultaneousByArtist.sort.simultaneousDesc'),
      },
      {
        value: 'simultaneous-asc',
        label: t('stats.mostSimultaneousByArtist.sort.simultaneousAsc'),
      },
      { value: 'weeks-desc', label: t('stats.mostSimultaneousByArtist.sort.weeksDesc') },
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

  // chart cutoff helper (mirrors TimesAtTopByArtist implementation)
  const getCutoff = (chartType: string) => {
    if (!chart) return 100;
    const cutoffMap: any = {
      album: chart.album_cutoff || 100,
      track: chart.music_cutoff || 100,
    };
    return cutoffMap[chartType] || 100;
  };

  const cutoff = getCutoff(type);

  // Image cell using hook must be a component (hooks can't be called conditionally)
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

  return (
    <Stack gap="md">
      <StatsFilters
        year={year}
        onYearChange={setYear}
        type={type}
        onTypeChange={handleTypeChange}
        showImages={preferences.showImages}
        onToggleImages={v => updatePreference('showImages', v)}
        // this stat is artist-scoped, do not show artist in the segmented control
        hideArtistType={true}
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
        customFilters={
          <Select
            value={String(topN ?? cutoff)}
            onChange={value => {
              if (value) setTopN(Number(value));
            }}
            data={Array.from({ length: cutoff }, (_, i) => ({
              value: String(i + 1),
              label: `Top ${i + 1}`,
            }))}
            style={{ minWidth: 140 }}
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
                  <Table.Th>{t('charts.artist')}</Table.Th>
                  <Table.Th style={{ width: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>
                    {type === 'album'
                      ? t('stats.mostSimultaneousByArtist.columns.simultaneousAlbums')
                      : t('stats.mostSimultaneousByArtist.columns.simultaneousTracks')}
                  </Table.Th>
                  {preferences.showWeekColumn && (
                    <Table.Th style={{ width: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {t('common.week')}
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
                        1 + // artist
                        1 + // simultaneous count
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
                    const weekStart = record.sampleWeek ? dayjs(record.sampleWeek) : null;
                    const weekEnd = weekStart ? weekStart.add(6, 'day') : null;
                    const dateRange =
                      weekStart && weekStart.isValid() && weekEnd && weekEnd.isValid()
                        ? `${weekStart.format('DD/MM/YYYY')} - ${weekEnd.format('DD/MM/YYYY')}`
                        : undefined;
                    return (
                      <Table.Tr key={record.artistName + index}>
                        <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <Text size={primaryTextSize}>{displayRank}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Flex gap="sm" align="center">
                            {preferences.showImages && <ImageCell artistName={record.artistName} />}
                            <Box style={{ flex: 1, minWidth: 0 }}>
                              <Text fw={600} lineClamp={1} size={primaryTextSize}>
                                {record.artistName}
                              </Text>
                            </Box>
                          </Flex>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <Text size={primaryTextSize}>{record.maxSimultaneous}</Text>
                        </Table.Td>
                        {preferences.showWeekColumn && (
                          <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            {record.sampleWeek && dateRange ? (
                              <Tooltip label={dateRange} withArrow>
                                <Text size={primaryTextSize}>{record.sampleWeekNumber ?? '-'}</Text>
                              </Tooltip>
                            ) : (
                              <Text size={primaryTextSize}>-</Text>
                            )}
                          </Table.Td>
                        )}
                        {preferences.showWeekColumn && (
                          <Table.Td style={{ width: 1, whiteSpace: 'nowrap' }}>
                            {record.sampleWeek ? (
                              <Button
                                size="xs"
                                variant="light"
                                px={6}
                                component={Link}
                                to={`/charts/week/${record.sampleWeek}/${type}`}
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

export default MostSimultaneousByArtistStats;
