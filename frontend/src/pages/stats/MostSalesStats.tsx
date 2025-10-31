// Most Sales (calculated from Last.fm top 100 + stability points)
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
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
  Tooltip,
  ActionIcon,
} from '@mantine/core';
import { IconHelpCircle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import StatsFilters from '../../components/stats/StatsFilters';
import { getYearRange, getPointsAccumulators } from '../../utils/statsQueries';
import { getUserTopTracks } from '../../services/lastfm';
import { useStatsPreferences } from '../../hooks/useStatsPreferences';
import { getCardBackgroundByMode, type ThemeMode } from '../../theme/modes';
import { useMantineTheme } from '@mantine/core';

const MostSalesStats: React.FC = () => {
  const { t } = useTranslation();
  const { type: typeParam } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Array<any>>([]);
  const [year, setYear] = useState('all');
  const [type, setType] = useState(typeParam || 'track');
  const { preferences, updatePreference } = useStatsPreferences();
  const [yearRange, setYearRange] = useState<{ minYear: number; maxYear: number } | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('sales-desc');

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
        // fetch top 100 tracks from Last.fm for the chart's configured username
        const username = chart?.lastfm_username;
        if (!username) {
          setData([]);
          setLoading(false);
          return;
        }

        const top = await getUserTopTracks(username, 100, 1, 'overall');

        // compute stability points (totalPoints) for all entities in the chart (track or album)
        const pointsAcc = await getPointsAccumulators({
          chartId: String(chart.id),
          chartType: type as any,
          year: year === 'all' ? undefined : year,
        });

        // Build a lookup by normalized name+artist
        const normalize = (s: string) => (s || '').toLowerCase().trim();
        const pointsLookup = new Map<string, any>();
        pointsAcc.forEach((p: any) => {
          const key = `${normalize(p.name)}::${normalize(p.artistName || '')}`;
          pointsLookup.set(key, p);
        });

        const weights =
          type === 'track'
            ? {
                weightPlays: chart.music_plays_weight || 0,
                weightPoints: chart.music_points_weight || 0,
              }
            : {
                weightPlays: chart.album_plays_weight || 0,
                weightPoints: chart.album_points_weight || 0,
              };

        const merged = top.items.map((it: any, idx: number) => {
          const key = `${normalize(it.name)}::${normalize(it.artist['#text'] || it.artist || '')}`;
          const matched = pointsLookup.get(key);
          const points = matched ? matched.totalPoints || 0 : 0;
          const plays = Number(it.playcount || 0);
          // Note: calculateSales expects rank and plays; here we don't have rank from Last.fm, so compute explicitly.
          const totalSales = plays * weights.weightPlays + points * weights.weightPoints;
          return {
            rank: idx + 1,
            name: it.name,
            artist: it.artist['#text'] || it.artist || '',
            plays,
            points,
            sales: totalSales,
            matchedEntityId: matched ? matched.entityId : null,
          };
        });

        setData(merged);
      } catch (err) {
        console.error('Error loading Most Sales stat', err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [chart, type, year]);

  const filteredData = React.useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase();
    return data.filter(
      item =>
        item.name.toLowerCase().includes(q) ||
        (item.artist && item.artist.toLowerCase().includes(q))
    );
  }, [data, searchQuery]);

  const sortedData = React.useMemo(() => {
    const copy = [...filteredData];
    switch (sortBy) {
      case 'sales-desc':
        return copy.sort((a, b) => b.sales - a.sales);
      case 'sales-asc':
        return copy.sort((a, b) => a.sales - b.sales);
      case 'plays-desc':
        return copy.sort((a, b) => b.plays - a.plays);
      case 'plays-asc':
        return copy.sort((a, b) => a.plays - b.plays);
      case 'points-desc':
        return copy.sort((a, b) => b.points - a.points);
      case 'points-asc':
        return copy.sort((a, b) => a.points - b.points);
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
      { value: 'sales-desc', label: t('stats.mostSales.sort.salesDesc') },
      { value: 'sales-asc', label: t('stats.mostSales.sort.salesAsc') },
      { value: 'plays-desc', label: t('stats.mostSales.sort.playsDesc') },
      { value: 'points-desc', label: t('stats.mostSales.sort.pointsDesc') },
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
        onTypeChange={v => setType(v)}
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
                  <Table.Th>{t('charts.artist')}</Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>
                    {t('stats.mostSales.columns.plays')}
                  </Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>
                    {t('stats.mostSales.columns.points')}
                  </Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>
                    <Flex align="center" justify="flex-end">
                      <Text mr="xs">{t('stats.mostSales.columns.sales')}</Text>
                      <Tooltip label={t('stats.mostSales.tooltip.top100')}>
                        <ActionIcon size="sm">
                          <IconHelpCircle size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Flex>
                  </Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedData.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Text ta="center" py="xl">
                        {t('stats.noData')}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  paginatedData.map((record: any, index) => {
                    const displayRank = (page - 1) * preferences.pageSize + index + 1;
                    return (
                      <Table.Tr key={`${record.name}-${record.artist}-${index}`}>
                        <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          {displayRank}
                        </Table.Td>
                        <Table.Td>
                          <Text fw={600} lineClamp={1}>
                            {record.name}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text lineClamp={1}>{record.artist}</Text>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>{record.plays}</Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>{record.points}</Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>
                          {Math.round(record.sales)}
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

export default MostSalesStats;
