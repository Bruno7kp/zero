// All #Ns stat page - shows items that reached a specific rank
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Stack, 
  Title, 
  Text, 
  Loader, 
  Center,
  Group,
  ActionIcon,
  Anchor
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { DataTable } from 'mantine-datatable';
import { IconExternalLink } from '@tabler/icons-react';
import StatsFilters from '../../components/stats/StatsFilters';
import { getItemsAtRank, getYearRange, calculateSales } from '../../utils/statsQueries';
import type { ChartData } from '../../db/indexedDb';
import { SpotifyImageWithModal } from '../../components/SpotifyImageWithModal';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../../services/SpotifyApi';

const PAGE_SIZE = 25;

const RankStats: React.FC = () => {
  const { t } = useTranslation();
  const { rank: rankParam, type: typeParam } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ChartData[]>([]);
  const [year, setYear] = useState('all');
  const [type, setType] = useState(typeParam || 'artist');
  const [showSales, setShowSales] = useState(false);
  const [yearRange, setYearRange] = useState<{ minYear: number; maxYear: number } | null>(null);
  const [page, setPage] = useState(1);

  const charts = useSelector((state: any) => state.charts.charts);
  const activeChartId = useSelector((state: any) => state.charts.activeChartId);
  const chart = charts.find((c: any) => c.id === activeChartId);

  const rank = Number(rankParam) || 1;

  // Get chart cutoff for type
  const _getCutoff = (_chartType: string) => {
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

  // Count times each entity appeared
  const groupedData = React.useMemo(() => {
    const grouped = new Map<string, {
      entityId: string;
      name: string;
      artistName: string;
      count: number;
      weeks: ChartData[];
    }>();

    data.forEach(item => {
      const existing = grouped.get(item.entityId);
      if (existing) {
        existing.count++;
        existing.weeks.push(item);
      } else {
        grouped.set(item.entityId, {
          entityId: item.entityId,
          name: item.name,
          artistName: item.artistName,
          count: 1,
          weeks: [item]
        });
      }
    });

    return Array.from(grouped.values()).sort((a, b) => b.count - a.count);
  }, [data]);

  const paginatedData = React.useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return groupedData.slice(start, start + PAGE_SIZE);
  }, [groupedData, page]);

  if (!chart) {
    return (
      <Center py="xl">
        <Text>{t('errors.selectActiveChart')}</Text>
      </Center>
    );
  }

  const titleKey = type === 'artist' ? 'titleArtist' : type === 'album' ? 'titleAlbum' : 'titleTrack';

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>{t(`stats.rank.${titleKey}`, { n: rank })}</Title>
        <Text c="dimmed">{t('stats.rank.description', { n: rank })}</Text>
      </div>

      <StatsFilters
        year={year}
        onYearChange={setYear}
        type={type}
        onTypeChange={handleTypeChange}
        showSales={showSales}
        onToggleSales={setShowSales}
        yearRange={yearRange || undefined}
      />

      {loading ? (
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      ) : (
        <DataTable
          records={paginatedData}
          columns={[
            {
              accessor: 'week',
              title: t('stats.rank.columns.week'),
              render: (record) => record.weeks[0]?.week || '-'
            },
            {
              accessor: 'count',
              title: t('stats.rank.columns.times', { n: rank }),
              width: 120,
              textAlign: 'center'
            },
            {
              accessor: 'image',
              title: t('stats.rank.columns.image'),
              width: 60,
              render: (record) => (
                <SpotifyImageWithModal
                  entityId={record.entityId}
                  name={record.name}
                  artistName={record.artistName}
                  type={type as 'artist' | 'album' | 'track'}
                  size={40}
                  clientId={SPOTIFY_TOKEN}
                  clientSecret={SPOTIFY_SECRET}
                  forceUpdate={0}
                  lastImageUrl={null}
                  onImageUpdate={() => {}}
                />
              )
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
              render: (record) => {
                const total = record.weeks.reduce((sum, w) => sum + w.plays, 0);
                return total.toLocaleString();
              }
            },
            ...(showSales ? [{
              accessor: 'sales',
              title: t('stats.rank.columns.sales'),
              width: 120,
              render: (record: any) => {
                const weights = getWeights(type);
                const total = record.weeks.reduce((sum: number, w: ChartData) => {
                  return sum + calculateSales(w.plays, w.rank, weights.weightPlays, weights.weightPoints);
                }, 0);
                return Math.round(total).toLocaleString();
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
                    href={`/charts/week/${record.weeks[0]?.week}/${type}`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/charts/week/${record.weeks[0]?.week}/${type}`);
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
          totalRecords={groupedData.length}
          recordsPerPage={PAGE_SIZE}
          page={page}
          onPageChange={setPage}
          paginationText={({ from, to, totalRecords }) =>
            `${from}-${to} of ${totalRecords}`
          }
        />
      )}
    </Stack>
  );
};

export default RankStats;
