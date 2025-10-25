// Perfect All Kill stats - shows weeks where artists achieved PAK
import React, { useState, useEffect } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { IconChevronRight } from '@tabler/icons-react';
import dayjs from 'dayjs';
import StatsFilters from '../../components/stats/StatsFilters';
import { getPerfectAllKills, getYearRange } from '../../utils/statsQueries';
import { useSpotifyImage } from '../../hooks/useSpotifyImage';
import { db } from '../../db/indexedDb';
import type { ChartData } from '../../db/indexedDb';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../../services/SpotifyApi';
import { getCardBackgroundByMode, type ThemeMode } from '../../theme/modes';
import { useMantineTheme } from '@mantine/core';

const PAGE_SIZE = 25;

// Component to render image cell with hooks
const ImageCell: React.FC<{ entityId: string; name: string }> = ({ entityId, name }) => {
  const { imageUrl } = useSpotifyImage({
    entityId,
    name,
    artist: name,
    type: 'artist',
    clientId: SPOTIFY_TOKEN,
    clientSecret: SPOTIFY_SECRET
  });
  
  return (
    <Avatar 
      src={imageUrl} 
      alt={name}
      size={40}
      radius="md"
    />
  );
};

const PerfectAllKillStats: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Array<{
    week: string;
    artistName: string;
    albumName: string;
    trackName: string;
    artistEntityId: string;
    albumEntityId: string;
    trackEntityId: string;
  }>>([]);
  const [year, setYear] = useState('all');
  const [yearRange, setYearRange] = useState<{ minYear: number; maxYear: number } | null>(null);
  const [page, setPage] = useState(1);

  const charts = useSelector((state: any) => state.charts.charts);
  const activeChartId = useSelector((state: any) => state.charts.activeChartId);
  const chart = charts.find((c: any) => c.id === activeChartId);
  const theme = useMantineTheme();
  const themeMode = useSelector((state: any) => state.theme?.value || 'dark') as ThemeMode;

  useEffect(() => {
    if (!chart) return;

    const loadYearRange = async () => {
      const range = await getYearRange(String(chart.id), 'artist');
      setYearRange(range);
    };

    loadYearRange();
  }, [chart]);

  useEffect(() => {
    if (!chart) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const results = await getPerfectAllKills(
          String(chart.id),
          year === 'all' ? undefined : year
        );
        // Sort by week descending (most recent first)
        results.sort((a, b) => b.week.localeCompare(a.week));
        
        // Get all weeks for calculating week numbers
        const allWeeks = await db.charts_data
          .where('chartId')
          .equals(String(chart.id))
          .toArray();
        const uniqueWeeks = [...new Set(allWeeks.map((w: ChartData) => w.week))].sort();
        
        // Add weekNumber to each result (1 = oldest week, N = newest week)
        const resultsWithWeekNumber = results.map(item => ({
          ...item,
          weekNumber: uniqueWeeks.indexOf(item.week) + 1
        }));
        
        setData(resultsWithWeekNumber);
      } catch (error) {
        console.error('Error loading PAK stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [chart, year]);

  // Add occurrence counter for each row (how many times this artist achieved PAK)
  const dataWithOccurrence = React.useMemo(() => {
    const occurrenceTracker = new Map<string, number>();
    // Reverse the data to count from oldest to newest
    const reversedData = [...data].reverse();
    const result = reversedData.map(item => {
      const key = item.artistName;
      const currentOccurrence = (occurrenceTracker.get(key) || 0) + 1;
      occurrenceTracker.set(key, currentOccurrence);
      return { ...item, occurrence: currentOccurrence };
    });
    // Reverse back to show newest first
    return result.reverse();
  }, [data]);

  const paginatedData = React.useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return dataWithOccurrence.slice(start, start + PAGE_SIZE);
  }, [dataWithOccurrence, page]);

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
        yearRange={yearRange || undefined}
        showTypeFilter={false}
        showSalesToggle={false}
      />

      {loading ? (
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      ) : data.length === 0 ? (
        <Center py="xl">
          <Text c="dimmed">{t('stats.pak.noData')}</Text>
        </Center>
      ) : (
        <Card withBorder style={{ background: getCardBackgroundByMode(theme, themeMode) }}>
          <ScrollArea>
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th style={{ width: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>{t('charts.weekNumber')}</Table.Th>
                  <Table.Th style={{ width: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>X</Table.Th>
                  <Table.Th>{t('stats.pak.columns.artist')}</Table.Th>
                  <Table.Th>{t('stats.pak.columns.album')}</Table.Th>
                  <Table.Th>{t('stats.pak.columns.track')}</Table.Th>
                  <Table.Th style={{ width: 1 }}></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedData.map((record: any) => {
                  const startDate = dayjs(record.week);
                  const endDate = startDate.add(6, 'day');
                  const dateRange = `${startDate.format('DD/MM/YYYY')} - ${endDate.format('DD/MM/YYYY')}`;

                  return (
                    <Table.Tr key={`${record.week}-${record.artistEntityId}`}>
                      <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <Tooltip label={dateRange} withArrow>
                          <Text fw={800} size="lg">{record.weekNumber}</Text>
                        </Tooltip>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <Text size="sm">{record.occurrence}</Text>
                      </Table.Td>
                      <Table.Td style={{ verticalAlign: 'middle' }}>
                        <Flex gap="sm" wrap="nowrap" align="center">
                          <ImageCell entityId={record.artistEntityId} name={record.artistName} />
                          <Box style={{ flex: 1, minWidth: 0 }}>
                            <Text fw={600} size="sm" lineClamp={1} className="entity-name">{record.artistName}</Text>
                          </Box>
                        </Flex>
                      </Table.Td>
                      <Table.Td style={{ verticalAlign: 'middle' }}>
                        <Text size="sm" lineClamp={1}>{record.albumName}</Text>
                      </Table.Td>
                      <Table.Td style={{ verticalAlign: 'middle' }}>
                        <Text size="sm" lineClamp={1}>{record.trackName}</Text>
                      </Table.Td>
                      <Table.Td style={{ width: 1, whiteSpace: 'nowrap' }}>
                        <Button
                          size="xs"
                          variant="light"
                          px={6}
                          onClick={() => navigate(`/charts/week/${record.week}/artist`)}
                        >
                          <IconChevronRight size={16} />
                        </Button>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </ScrollArea>
          {dataWithOccurrence.length > PAGE_SIZE && (
            <Box mt="md" style={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination 
                total={Math.ceil(dataWithOccurrence.length / PAGE_SIZE)} 
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

export default PerfectAllKillStats;

