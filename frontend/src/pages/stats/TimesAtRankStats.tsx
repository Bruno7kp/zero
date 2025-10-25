// Times at Rank #N stats - shows who maintained a specific position for most weeks
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Stack, 
  Title, 
  Text, 
  Loader, 
  Center
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { DataTable } from 'mantine-datatable';
import StatsFilters from '../../components/stats/StatsFilters';
import { getTimesAtRank, getYearRange } from '../../utils/statsQueries';
import { SpotifyImageWithModal } from '../../components/SpotifyImageWithModal';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../../services/SpotifyApi';

const PAGE_SIZE = 25;

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
  const [yearRange, setYearRange] = useState<{ minYear: number; maxYear: number } | null>(null);
  const [page, setPage] = useState(1);

  const charts = useSelector((state: any) => state.charts.charts);
  const activeChartId = useSelector((state: any) => state.charts.activeChartId);
  const chart = charts.find((c: any) => c.id === activeChartId);

  const rank = Number(rankParam) || 1;

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

  const titleKey = type === 'artist' ? 'titleArtist' : type === 'album' ? 'titleAlbum' : 'titleTrack';

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>{t(`stats.timesAtRank.${titleKey}`, { n: rank })}</Title>
        <Text c="dimmed">{t('stats.timesAtRank.description', { n: rank })}</Text>
      </div>

      <StatsFilters
        year={year}
        onYearChange={setYear}
        type={type}
        onTypeChange={handleTypeChange}
        yearRange={yearRange || undefined}
        showSalesToggle={false}
      />

      {loading ? (
        <Center py="xl">
          <Loader size="lg" />
        </Center>
      ) : (
        <DataTable
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
      )}
    </Stack>
  );
};

export default TimesAtRankStats;

