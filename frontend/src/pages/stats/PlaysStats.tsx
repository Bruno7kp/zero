// Most Plays in a Week stats
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Stack, 
  Title, 
  Text, 
  Loader, 
  Center,
  Select,
  Group,
  ActionIcon,
  Anchor,
  Card,
  Avatar
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { DataTable } from 'mantine-datatable';
import { IconExternalLink } from '@tabler/icons-react';
import StatsFilters from '../../components/stats/StatsFilters';
import { getHighestPlays, getYearRange, calculateSales } from '../../utils/statsQueries';
import type { ChartData } from '../../db/indexedDb';
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
        setData(results);
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
  const positionOptions = [
    { value: 'all', label: t('stats.filters.all') },
    { value: '1', label: '#1' },
    { value: '5', label: t('stats.filters.topN', { n: 5 }) },
    { value: '10', label: t('stats.filters.topN', { n: 10 }) },
    { value: String(cutoff), label: t('stats.filters.cutoff', { n: cutoff }) }
  ];

  const titleKey = type === 'artist' ? 'titleArtist' : type === 'album' ? 'titleAlbum' : 'titleTrack';

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>{t(`stats.plays.${titleKey}`)}</Title>
        <Text c="dimmed">{t('stats.plays.description')}</Text>
      </div>

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
            label={t('stats.filters.position')}
            value={position}
            onChange={handlePositionChange}
            data={positionOptions}
            style={{ minWidth: 150 }}
          />
        }
      />

      {loading ? (
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      ) : (
        <Card p="md" style={{ background: getCardBackgroundByMode(theme, themeMode) }}>
          <DataTable
            className="datatable-transparent"
            records={paginatedData.map((item, index) => ({ ...item, displayRank: (page - 1) * PAGE_SIZE + index + 1 }))}
          columns={[
            {
              accessor: 'displayRank',
              title: t('stats.plays.columns.rank'),
              width: 60,
              textAlign: 'center'
            },
            {
              accessor: 'week',
              title: t('stats.plays.columns.week'),
              width: 100
            },
            {
              accessor: 'rank',
              title: t('stats.plays.columns.position'),
              width: 80,
              textAlign: 'center',
              render: (record) => `#${record.rank}`
            },
            {
              accessor: 'image',
              title: t('stats.plays.columns.image'),
              width: 60,
              render: (record) => (
                <ImageCell record={record} type={type} />
              )
            },
            {
              accessor: 'name',
              title: t('stats.plays.columns.title'),
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
              title: t('stats.plays.columns.plays'),
              width: 120,
              render: (record) => record.plays.toLocaleString()
            },
            ...(showSales ? [{
              accessor: 'sales',
              title: t('stats.plays.columns.sales'),
              width: 120,
              render: (record: ChartData) => {
                const weights = getWeights(type);
                const sales = calculateSales(record.plays, record.rank, weights.weightPlays, weights.weightPoints);
                return Math.round(sales).toLocaleString();
              }
            }] : []),
            {
              accessor: 'actions',
              title: t('stats.plays.columns.viewChart'),
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
          totalRecords={data.length}
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

export default PlaysStats;

