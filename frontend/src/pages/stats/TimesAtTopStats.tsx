// Times in Top N stats - shows who stayed in top N most weeks
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Stack, 
  Title, 
  Text, 
  Loader, 
  Center,
  Select
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { DataTable } from 'mantine-datatable';
import StatsFilters from '../../components/stats/StatsFilters';
import { getTimesInTopN, getYearRange } from '../../utils/statsQueries';
import { SpotifyImageWithModal } from '../../components/SpotifyImageWithModal';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../../services/SpotifyApi';

const PAGE_SIZE = 25;

const TimesAtTopStats: React.FC = () => {
  const { t } = useTranslation();
  const { topN: topNParam, type: typeParam } = useParams();
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
  const [topN, setTopN] = useState(Number(topNParam) || 10);
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
        const results = await getTimesInTopN({
          chartId: String(chart.id),
          chartType: type,
          topN,
          year: year === 'all' ? undefined : year
        });
        setData(results);
      } catch (error) {
        console.error('Error loading times at top stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [chart, type, topN, year]);

  const handleTypeChange = (newType: string) => {
    setType(newType);
    navigate(`/stats/times_at_top/${topN}/${newType}`);
  };

  const handleTopNChange = (value: string | null) => {
    if (value) {
      const newTopN = Number(value);
      setTopN(newTopN);
      navigate(`/stats/times_at_top/${newTopN}/${type}`);
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
  const topNOptions = [
    { value: '1', label: t('stats.filters.topN', { n: 1 }) },
    { value: '5', label: t('stats.filters.topN', { n: 5 }) },
    { value: '10', label: t('stats.filters.topN', { n: 10 }) },
    { value: '20', label: t('stats.filters.topN', { n: 20 }) },
    { value: String(cutoff), label: t('stats.filters.cutoff', { n: cutoff }) }
  ];

  const titleKey = type === 'artist' ? 'titleArtist' : type === 'album' ? 'titleAlbum' : 'titleTrack';

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>{t(`stats.timesAtTop.${titleKey}`, { n: topN })}</Title>
        <Text c="dimmed">{t('stats.timesAtTop.description', { n: topN })}</Text>
      </div>

      <StatsFilters
        year={year}
        onYearChange={setYear}
        type={type}
        onTypeChange={handleTypeChange}
        yearRange={yearRange || undefined}
        showSalesToggle={false}
        customFilters={
          <Select
            label={t('stats.filters.position')}
            value={String(topN)}
            onChange={handleTopNChange}
            data={topNOptions}
            style={{ minWidth: 150 }}
          />
        }
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
              title: t('stats.timesAtTop.columns.rank'),
              width: 60,
              textAlign: 'center'
            },
            {
              accessor: 'count',
              title: t('stats.timesAtTop.columns.times', { n: topN }),
              width: 120,
              textAlign: 'center'
            },
            {
              accessor: 'image',
              title: t('stats.timesAtTop.columns.image'),
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
              title: t('stats.timesAtTop.columns.title'),
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

export default TimesAtTopStats;

