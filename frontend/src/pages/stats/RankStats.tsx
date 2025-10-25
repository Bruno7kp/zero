// All #Ns stat page - shows weeks where items reached a specific rank
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Stack, 
  Loader, 
  Center,
  Group,
  ActionIcon,
  Anchor,
  Card,
  Avatar,
  Text
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { DataTable } from 'mantine-datatable';
import { IconExternalLink } from '@tabler/icons-react';
import StatsFilters from '../../components/stats/StatsFilters';
import { getItemsAtRank, getYearRange, calculateSales } from '../../utils/statsQueries';
import type { ChartData } from '../../db/indexedDb';
import { useSpotifyImage } from '../../hooks/useSpotifyImage';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../../services/SpotifyApi';

const PAGE_SIZE = 25;

// Component to render image cell with hooks
const ImageCell: React.FC<{ record: ChartData; type: string }> = ({ record, type }) => {
  const { imageUrl } = useSpotifyImage({
    entityId: record.entityId,
    name: record.name,
    artistName: record.artistName,
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
  const [showSales, setShowSales] = useState(false);
  const [yearRange, setYearRange] = useState<{ minYear: number; maxYear: number } | null>(null);
  const [page, setPage] = useState(1);

  const charts = useSelector((state: any) => state.charts.charts);
  const activeChartId = useSelector((state: any) => state.charts.activeChartId);
  const chart = charts.find((c: any) => c.id === activeChartId);

  // Get chart cutoff for type
  const getCutoff = (chartType: string) => {
    if (!chart) return 100;
    const cutoffMap: any = {
      artist: chart.artistCutoff || 100,
      album: chart.albumCutoff || 100,
      track: chart.musicCutoff || 100
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
        const results = await getItemsAtRank({
          chartId: String(chart.id),
          chartType: type,
          rank,
          year: year === 'all' ? undefined : year
        });
        // Sort by week descending (most recent first)
        results.sort((a, b) => b.week.localeCompare(a.week));
        setData(results);
      } catch (error) {
        console.error('Error loading rank stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [chart, type, rank, year]);

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
    return data.map(item => {
      const key = `${item.entityId}`;
      const currentOccurrence = (occurrenceTracker.get(key) || 0) + 1;
      occurrenceTracker.set(key, currentOccurrence);
      return { ...item, occurrence: currentOccurrence };
    });
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
        showSales={showSales}
        onToggleSales={setShowSales}
        yearRange={yearRange || undefined}
        showPositionFilter={true}
        cutoff={cutoff}
      />

      {loading ? (
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      ) : (
        <Card p="md" withBorder>
          <DataTable
            records={paginatedData}
            columns={[
              {
                accessor: 'week',
                title: t('stats.rank.columns.week'),
                width: 100
              },
              {
                accessor: 'occurrence',
                title: t('stats.rank.columns.times', { n: rank }),
                width: 100,
                textAlign: 'center',
                render: (record: any) => `${record.occurrence}ª`
              },
              {
                accessor: 'image',
                title: t('stats.rank.columns.image'),
                width: 60,
                render: (record) => <ImageCell record={record} type={type} />
              },
              {
                accessor: 'name',
                title: t('stats.rank.columns.title'),
                render: (record) => (
                  <div>
                    <Text size="sm" fw={500}>{record.name}</Text>
                    {type !== 'artist' && (
                      <Text size="xs" c="dimmed">{record.artistName}</Text>
                    )}
                  </div>
                )
              },
              {
                accessor: 'plays',
                title: t('stats.rank.columns.plays'),
                width: 120,
                render: (record) => record.plays.toLocaleString()
              },
              ...(showSales ? [{
                accessor: 'sales',
                title: t('stats.rank.columns.sales'),
                width: 120,
                render: (record: any) => {
                  const weights = getWeights(type);
                  const sales = calculateSales(record.plays, record.rank, weights.weightPlays, weights.weightPoints);
                  return Math.round(sales).toLocaleString();
                }
              }] : []),
              {
                accessor: 'actions',
                title: t('stats.rank.columns.viewChart'),
                width: 100,
                textAlign: 'center',
                render: (record) => (
                  <Group gap="xs" justify="center">
                    <Anchor
                      component="a"
                      href={`/charts/week/${record.week}/${type}`}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/charts/week/${record.week}/${type}`);
                      }}
                    >
                      <ActionIcon variant="subtle" size="sm">
                        <IconExternalLink size={16} />
                      </ActionIcon>
                    </Anchor>
                  </Group>
                )
              }
            ]}
            minHeight={200}
            noRecordsText={t('stats.noData')}
            totalRecords={dataWithOccurrence.length}
            recordsPerPage={PAGE_SIZE}
            page={page}
            onPageChange={setPage}
            paginationText={({ from, to, totalRecords }) =>
              `${from}-${to} of ${totalRecords}`
            }
          />
        </Card>
      )}
    </Stack>
  );
};

export default RankStats;
