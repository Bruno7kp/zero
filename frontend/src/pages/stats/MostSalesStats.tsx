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
  Avatar,
} from '@mantine/core';
import { IconHelpCircle } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useSpotifyImage } from '../../hooks/useSpotifyImage';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../../services/SpotifyApi';
import StatsFilters from '../../components/stats/StatsFilters';
import { getYearRange, getPointsAccumulators } from '../../utils/statsQueries';
import {
  getUserTopTracks,
  getUserTopAlbums,
  getUserTopArtists,
  getWeeklyTrackChart,
  getWeeklyAlbumChart,
  getWeeklyArtistChart,
} from '../../services/lastfm';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);
import { useStatsPreferences } from '../../hooks/useStatsPreferences';
import { getCardBackgroundByMode, type ThemeMode } from '../../theme/modes';
import { useMantineTheme } from '@mantine/core';

const MostSalesStats: React.FC = () => {
  const { t } = useTranslation();
  const { type: typeParam } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Array<any>>([]);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [year, setYear] = useState('all');
  const [type, setType] = useState(typeParam || 'track');
  const { preferences, updatePreference } = useStatsPreferences();
  const navigate = useNavigate();
  const [yearRange, setYearRange] = useState<{ minYear: number; maxYear: number } | null>(null);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('sales-desc');

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

  useEffect(() => {
    if (!chart) return;
    const loadData = async () => {
      setLoading(true);
      try {
        // fetch top 100 tracks from Last.fm for the chart's configured username
        const username = chart?.lastfm_username;
        if (!username) {
          setData([]);
          setLoadingError(t('stats.mostSales.errors.noUsername'));
          setLoading(false);
          return;
        }

        // Choose the appropriate Last.fm endpoint based on the selected type.
        // If a year filter is active, use the range-based wrapper to request the user's top items within that year.
        let top: any;
        if (year !== 'all') {
          // Use the weekly chart endpoints constrained by from/to for the selected year.
          // IMPORTANT: use the timezone configured on the active chart (same behaviour as the live chart)
          // The agent must take into account `chart.timezone` for these computations so that
          // the from/to unix timestamps align with the chart's configured day boundaries.
          const tz = chart?.timezone || 'UTC';
          const from = String(dayjs.tz(`${year}-01-01`, tz).startOf('day').unix());
          const to = String(dayjs.tz(`${year}-12-31`, tz).endOf('day').unix());
          top =
            type === 'track'
              ? await getWeeklyTrackChart(username, from, to, 100)
              : type === 'album'
              ? await getWeeklyAlbumChart(username, from, to, 100)
              : await getWeeklyArtistChart(username, from, to, 100);
          // The weekly* helpers return an array of items; normalize to the {items,total} shape
          top = { items: top, total: Array.isArray(top) ? top.length : 0 };
        } else {
          top =
            type === 'track'
              ? await getUserTopTracks(username, 100, 1, 'overall')
              : type === 'album'
              ? await getUserTopAlbums(username, 100, 1, 'overall')
              : await getUserTopArtists(username, 100, 1, 'overall');
        }

        if (!top || !Array.isArray(top.items) || top.items.length === 0) {
          // no data returned from Last.fm — surface helpful message
          setData([]);
          setLoadingError(t('stats.mostSales.errors.noTop100'));
          setLoading(false);
          return;
        }

        // compute stability points (totalPoints) for all entities in the chart (track or album)
        const pointsAcc = await getPointsAccumulators({
          chartId: String(chart.id),
          chartType: type as any,
          year: year === 'all' ? undefined : year,
        });

        // Build a lookup by normalized name+artist
        const safeStr = (v: any): string => {
          if (!v && v !== 0) return '';
          if (typeof v === 'string') return v;
          if (typeof v === 'number') return String(v);
          if (typeof v === 'object') {
            // common Last.fm shapes: { '#text': 'Artist' } or { name: 'Artist' }
            if (v['#text']) return String(v['#text']);
            if (v.name) return String(v.name);
            if (v['name']) return String(v['name']);
            if (v.artist) return safeStr(v.artist);
            return '';
          }
          return '';
        };
        const normalize = (s: any) => (safeStr(s) || '').toLowerCase().trim();
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
          // Normalize different shapes returned by Last.fm endpoints
          let itemName = '';
          let artistField: any = '';
          let plays = 0;

          if (type === 'track') {
            itemName = it.name || '';
            // track.artist can be a string or an object { '#text': 'Artist' }
            artistField =
              it.artist &&
              (typeof it.artist === 'string'
                ? it.artist
                : it.artist['#text'] || it.artist.name || it.artist);
            plays = Number(it.playcount || it.playcount || 0);
          } else if (type === 'album') {
            // album items have name, artist (object with #text) and playcount
            itemName = it.name || (it.album && it.album.name) || '';
            artistField =
              it.artist &&
              (typeof it.artist === 'string'
                ? it.artist
                : it.artist['#text'] || it.artist.name || it.artist);
            plays = Number(it.playcount || it.playcount || 0);
          } else {
            // artist
            itemName = it.name || '';
            // artists don't have a separate artist field
            artistField = '';
            plays = Number(it.playcount || it.playcount || 0);
          }

          const key = `${normalize(itemName)}::${normalize(artistField || '')}`;
          const matched = pointsLookup.get(key);
          const points = matched ? matched.totalPoints || 0 : 0;
          // Note: calculateSales expects rank and plays; here we don't have rank from Last.fm, so compute explicitly.
          const totalSales = plays * weights.weightPlays + points * weights.weightPoints;
          return {
            rank: idx + 1,
            name: safeStr(itemName),
            artist: safeStr(artistField || ''),
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
        setLoadingError(t('stats.mostSales.errors.fetchFailed'));
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [chart, type, year, t]);

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

  const artistColumnVisible = preferences.showArtistColumn && type !== 'artist';
  const numFmt = new Intl.NumberFormat('pt-BR');

  const ImageCell: React.FC<{ record: any; type: string }> = ({ record, type }) => {
    // Use matchedEntityId when available; otherwise fall back to a synthetic key so the
    // spotifyImagesDb cache and search are keyed consistently (like other stats pages do).
    const syntheticId = `mostsales:${type}:${record.name}:${record.artist}`;
    const entityKey = record.matchedEntityId || syntheticId;
    const { imageUrl } = useSpotifyImage({
      entityId: entityKey,
      name: record.name,
      artist: record.artist,
      type: (type as 'artist' | 'album' | 'track') || 'track',
      clientId: SPOTIFY_TOKEN,
      clientSecret: SPOTIFY_SECRET,
    });

    return <Avatar src={imageUrl ?? undefined} alt={record.name} size={40} radius="md" />;
  };

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
        onTypeChange={v => {
          setType(v);
          navigate(`/stats/most_sales/${v}`);
        }}
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
      ) : loadingError ? (
        <Center py="xl">
          <Text color="dimmed">{loadingError}</Text>
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
                  {artistColumnVisible && <Table.Th>{t('charts.artist')}</Table.Th>}
                  <Table.Th style={{ textAlign: 'right' }}>
                    {t('stats.mostSales.columns.plays')}
                  </Table.Th>
                  <Table.Th style={{ textAlign: 'right' }}>
                    {t('stats.mostSales.columns.points')}
                  </Table.Th>
                  <Table.Th style={{ textAlign: 'right', textTransform: 'capitalize' }}>
                    <Flex align="center" justify="flex-end">
                      {chart?.formula_name || t('stats.mostSales.columns.sales')}
                      <Tooltip label={t('stats.mostSales.tooltip.top100')}>
                        <ActionIcon size="sm" variant="light" ml="xs">
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
                    <Table.Td colSpan={1 + 1 + (artistColumnVisible ? 1 : 0) + 3}>
                      <Text ta="center" py="xl" size={primaryTextSize}>
                        {t('stats.noData')}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  paginatedData.map((record: any, index) => {
                    const displayRank = (page - 1) * preferences.pageSize + index + 1;
                    const rowKey = record.matchedEntityId || `${record.name}-${index}`;
                    return (
                      <Table.Tr key={rowKey}>
                        <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <Text size={primaryTextSize}>{displayRank}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Flex gap="sm" align="center">
                            {preferences.showImages && <ImageCell record={record} type={type} />}
                            <Box style={{ flex: 1, minWidth: 0 }}>
                              <Text fw={600} lineClamp={1} size={primaryTextSize}>
                                {record.name}
                              </Text>
                              {!artistColumnVisible && type !== 'artist' && record.artist && (
                                <Text c="dimmed" size={secondaryTextSize} lineClamp={1}>
                                  {record.artist}
                                </Text>
                              )}
                            </Box>
                          </Flex>
                        </Table.Td>
                        {artistColumnVisible && (
                          <Table.Td>
                            <Text lineClamp={1} size={primaryTextSize}>
                              {record.artist}
                            </Text>
                          </Table.Td>
                        )}
                        <Table.Td style={{ textAlign: 'right' }}>
                          <Text size={primaryTextSize}>
                            {numFmt.format(Math.round(record.plays))}
                          </Text>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>
                          <Text size={primaryTextSize}>
                            {numFmt.format(Math.round(record.points))}
                          </Text>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'right' }}>
                          <Text size={primaryTextSize}>
                            {numFmt.format(Math.round(record.sales))}
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

export default MostSalesStats;
