// Times at Rank #N stats - shows who maintained a specific position for most weeks
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Stack, 
  Loader, 
  Center,
  Card,
  Avatar,
  Text
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { DataTable } from 'mantine-datatable';
import StatsFilters from '../../components/stats/StatsFilters';
import { getTimesAtRank, getYearRange } from '../../utils/statsQueries';
import { useSpotifyImage } from '../../hooks/useSpotifyImage';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../../services/SpotifyApi';
import { getCardBackgroundByMode, type ThemeMode } from '../../theme/modes';
import { useMantineTheme } from '@mantine/core';

const PAGE_SIZE = 25;

// Component to render image cell with hooks
const ImageCell: React.FC<{ record: any; type: string }> = ({ record, type }) => {
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

const TimesAtRankStats: React.FC = () => {
  const { t } = useTranslation();
  const { rank: rankParam, type: typeParam } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Array<{
    entityId: string;
    name: string;
    artistName: string;
    count: number;
  }>>([]);
  const [year, setYear] = useState('all');
  const [type, setType] = useState(typeParam || 'artist');
  const [rank, setRank] = useState(Number(rankParam) || 1);
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
        const results = await getTimesAtRank({
          chartId: String(chart.id),
          chartType: type,
          rank,
          year: year === 'all' ? undefined : year
        });
        setData(results);
      } catch (error) {
        console.error('Error loading times at rank stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [chart, type, rank, year]);

  const handleTypeChange = (newType: string) => {
    setType(newType);
    navigate(`/stats/times_at_rank/${rank}/${newType}`);
  };

  const handlePositionChange = (newRank: number) => {
    setRank(newRank);
    navigate(`/stats/times_at_rank/${newRank}/${type}`);
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

  return (
    <Stack gap="md">
      <StatsFilters
        year={year}
        onYearChange={setYear}
        type={type}
        onTypeChange={handleTypeChange}
        position={rank}
        onPositionChange={handlePositionChange}
        yearRange={yearRange || undefined}
        showSalesToggle={false}
        showPositionFilter={true}
        cutoff={cutoff}
      />

      {loading ? (
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      ) : (
        <Card p="md" style={{ background: getCardBackgroundByMode(theme, themeMode) }}>
          <DataTable
            className="datatable-transparent"
            records={paginatedData.map((item, index) => ({ ...item, rank: (page - 1) * PAGE_SIZE + index + 1 }))}
            columns={[
              {
                accessor: 'rank',
                title: t('stats.timesAtRank.columns.rank'),
                width: 60,
                textAlign: 'center'
              },
              {
                accessor: 'count',
                title: t('stats.timesAtRank.columns.times', { n: rank }),
                width: 120,
                textAlign: 'center'
              },
              {
                accessor: 'image',
                title: t('stats.timesAtRank.columns.image'),
                width: 60,
                render: (record) => <ImageCell record={record} type={type} />
              },
              {
                accessor: 'name',
                title: t('stats.timesAtRank.columns.title'),
                render: (record) => (
                  <div>
                    <Text size="sm" fw={500}>{record.name}</Text>
                    {type !== 'artist' && (
                      <Text size="xs" c="dimmed">{record.artistName}</Text>
                    )}
                  </div>
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

export default TimesAtRankStats;

