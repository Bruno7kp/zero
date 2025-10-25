// Most Plays in a Week stats
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Stack, 
  Text,
  Loader, 
  Center,
  Select,
  Card,
  Avatar,
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
import { IconChevronRight, IconHash } from '@tabler/icons-react';
import dayjs from 'dayjs';
import StatsFilters from '../../components/stats/StatsFilters';
import { getHighestPlays, getYearRange, calculateSales } from '../../utils/statsQueries';
import type { ChartData } from '../../db/indexedDb';
import { db } from '../../db/indexedDb';
import { useSpotifyImage } from '../../hooks/useSpotifyImage';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../../services/SpotifyApi';
import { getCardBackgroundByMode, type ThemeMode } from '../../theme/modes';
import { useMantineTheme } from '@mantine/core';

const PAGE_SIZE = 25;

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

const PlaysStats: React.FC = () => {
  const { t } = useTranslation();
  const { position: positionParam, type: typeParam } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ChartData[]>([]);
  const [year, setYear] = useState('all');
  const [type, setType] = useState(typeParam || 'artist');
  const [position, setPosition] = useState(positionParam || 'all');
  const [showSales, setShowSales] = useState(false);
  const [yearRange, setYearRange] = useState<{ minYear: number; maxYear: number } | null>(null);
  const [page, setPage] = useState(1);

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
  const getWeights = (chartType: string) => {
    if (!chart) return { weightPlays: 1, weightPoints: 0 };
    
    if (chartType === 'track') {
      return {
        weightPlays: chart.musicPlaysWeight || 1,
        weightPoints: chart.musicPointsWeight || 0
      };
    } else if (chartType === 'album') {
      return {
        weightPlays: chart.albumPlaysWeight || 1,
        weightPoints: chart.albumPointsWeight || 0
      };
    }
    return { weightPlays: 1, weightPoints: 0 };
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
        const filters: any = {
          chartId: String(chart.id),
          chartType: type,
          year: year === 'all' ? undefined : year
        };

        if (position !== 'all') {
          filters.position = Number(position);
          filters.positionOperator = 'eq';
        }

        const results = await getHighestPlays(filters);
        
        // Get all weeks for calculating week numbers
        const allWeeks = await db.charts_data
          .where('[chartId+chartType]')
          .equals([String(chart.id), type])
          .toArray();
        const uniqueWeeks = [...new Set(allWeeks.map((w: ChartData) => w.week))].sort();
        
        // Add weekNumber to each result (1 = oldest week, N = newest week)
        const resultsWithWeekNumber = results.map(item => ({
          ...item,
          weekNumber: uniqueWeeks.indexOf(item.week) + 1
        }));
        
        setData(resultsWithWeekNumber);
      } catch (error) {
        console.error('Error loading plays stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [chart, type, position, year]);

  const handleTypeChange = (newType: string) => {
    setType(newType);
    navigate(`/stats/plays/${position}/${newType}`);
  };

  const handlePositionChange = (value: string | null) => {
    if (value) {
      setPosition(value);
      navigate(`/stats/plays/${value}/${type}`);
    }
  };

  const paginatedData = React.useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return data.slice(start, start + PAGE_SIZE);
  }, [data, page]);

  if (!chart) {
    return (
      <Center py="xl">
        <Text>{t('errors.selectActiveChart')}</Text>
      </Center>
    );
  }

  const cutoff = getCutoff(type);
  
  // Generate position options from 1 to cutoff
  const positionOptions = [
    { value: 'all', label: t('stats.filters.all') },
    ...Array.from({ length: cutoff }, (_, i) => ({
      value: String(i + 1),
      label: String(i + 1)
    }))
  ];

  return (
    <Stack gap="md">
      <StatsFilters
        year={year}
        onYearChange={setYear}
        type={type}
        onTypeChange={handleTypeChange}
        showSales={showSales}
        onToggleSales={setShowSales}
        yearRange={yearRange || undefined}
        customFilters={
          <Select
            value={position}
            onChange={handlePositionChange}
            data={positionOptions}
            style={{ minWidth: 150 }}
            leftSection={<IconHash size={16} />}
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
                  <Table.Th style={{ width: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>#</Table.Th>
                  <Table.Th style={{ width: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>{t('charts.weekNumber')}</Table.Th>
                  <Table.Th style={{ width: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>{t('stats.plays.columns.position')}</Table.Th>
                  <Table.Th>{t('stats.plays.columns.title')}</Table.Th>
                  <Table.Th style={{ width: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>{t('stats.plays.columns.plays')}</Table.Th>
                  {showSales && <Table.Th style={{ width: 1, textAlign: 'center', whiteSpace: 'nowrap' }}>{t('stats.plays.columns.sales')}</Table.Th>}
                  <Table.Th style={{ width: 1 }}></Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {paginatedData.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={showSales ? 7 : 6}>
                      <Text ta="center" py="xl">{t('stats.noData')}</Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  paginatedData.map((record: any, index) => {
                    const displayRank = (page - 1) * PAGE_SIZE + index + 1;
                    const startDate = dayjs(record.week);
                    const endDate = startDate.add(6, 'day');
                    const dateRange = `${startDate.format('DD/MM/YYYY')} - ${endDate.format('DD/MM/YYYY')}`;
                    const weights = getWeights(type);
                    const sales = showSales ? calculateSales(record.plays, record.rank, weights.weightPlays, weights.weightPoints) : 0;

                    return (
                      <Table.Tr key={`${record.week}-${record.entityId}`}>
                        <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <Text size="sm">{displayRank}</Text>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <Tooltip label={dateRange} withArrow>
                            <Text fw={800} size="lg">{record.weekNumber}</Text>
                          </Tooltip>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <Text size="sm">{record.rank}</Text>
                        </Table.Td>
                        <Table.Td style={{ verticalAlign: 'middle' }}>
                          <Flex gap="sm" wrap="nowrap" align="center">
                            <ImageCell record={record} type={type} />
                            <Box style={{ flex: 1, minWidth: 0 }}>
                              <Text fw={600} size="sm" lineClamp={1} className="entity-name">{record.name}</Text>
                              {type !== 'artist' && record.artistName && (
                                <Text c="dimmed" size="xs" lineClamp={1}>{record.artistName}</Text>
                              )}
                            </Box>
                          </Flex>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <Text size="sm">{record.plays.toLocaleString()}</Text>
                        </Table.Td>
                        {showSales && (
                          <Table.Td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                            <Text size="sm">{Math.round(sales).toLocaleString()}</Text>
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
          {data.length > PAGE_SIZE && (
            <Box mt="md" style={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination 
                total={Math.ceil(data.length / PAGE_SIZE)} 
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

export default PlaysStats;

