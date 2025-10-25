// Artists with most items at specific rank stats
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
import { getArtistsWithMostAtRank, getYearRange } from '../../utils/statsQueries';
import { SpotifyImageWithModal } from '../../components/SpotifyImageWithModal';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../../services/SpotifyApi';

const PAGE_SIZE = 25;

const TimesAtTopByArtistStats: React.FC = () => {
  const { t } = useTranslation();
  const { rank: rankParam, type: typeParam } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Array<{
    artistName: string;
    itemsCount: number;
    totalWeeks: number;
    items: Array<{ entityId: string; name: string; count: number }>;
  }>>([]);
  const [year, setYear] = useState('all');
  const [type, setType] = useState<'album' | 'track'>((typeParam as 'album' | 'track') || 'track');
  const [sortBy, setSortBy] = useState<'items' | 'weeks'>('items');
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
        const results = await getArtistsWithMostAtRank({
          chartId: String(chart.id),
          chartType: type,
          rank,
          year: year === 'all' ? undefined : year
        });
        setData(results);
      } catch (error) {
        console.error('Error loading times at top by artist stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [chart, type, rank, year]);

  const handleTypeChange = (newType: string) => {
    if (newType === 'album' || newType === 'track') {
      setType(newType);
      navigate(`/stats/times_at_top_by_artist/${rank}/${newType}`);
    }
  };

  const sortedData = React.useMemo(() => {
    const sorted = [...data];
    if (sortBy === 'items') {
      sorted.sort((a, b) => b.itemsCount - a.itemsCount || b.totalWeeks - a.totalWeeks);
    } else {
      sorted.sort((a, b) => b.totalWeeks - a.totalWeeks || b.itemsCount - a.itemsCount);
    }
    return sorted;
  }, [data, sortBy]);

  const paginatedData = React.useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sortedData.slice(start, start + PAGE_SIZE);
  }, [sortedData, page]);

  if (!chart) {
    return (
      <Center py="xl">
        <Text>{t('errors.selectActiveChart')}</Text>
      </Center>
    );
  }

  const titleKey = type === 'album' ? 'titleAlbum' : 'titleTrack';

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>{t(`stats.timesAtTopByArtist.${titleKey}`, { n: rank })}</Title>
        <Text c="dimmed">{t('stats.timesAtTopByArtist.description', { n: rank })}</Text>
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
            label={t('stats.filters.sortBy')}
            value={sortBy}
            onChange={(value) => value && setSortBy(value as 'items' | 'weeks')}
            data={[
              { value: 'items', label: t('stats.timesAtTopByArtist.sortByItems') },
              { value: 'weeks', label: t('stats.timesAtTopByArtist.sortByWeeks') }
            ]}
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
          records={paginatedData.map((item, index) => ({ ...item, displayRank: (page - 1) * PAGE_SIZE + index + 1 }))}
          columns={[
            {
              accessor: 'displayRank',
              title: t('stats.timesAtTopByArtist.columns.rank'),
              width: 60,
              textAlign: 'center'
            },
            {
              accessor: 'image',
              title: t('stats.timesAtTopByArtist.columns.image'),
              width: 60,
              render: (record) => {
                // Get the first item's entity ID for the artist image
                const firstItem = record.items[0];
                return (
                  <SpotifyImageWithModal
                    entityId={firstItem?.entityId || ''}
                    name={record.artistName}
                    artistName={record.artistName}
                    type="artist"
                    size={40}
                    clientId={SPOTIFY_TOKEN}
                    clientSecret={SPOTIFY_SECRET}
                    forceUpdate={0}
                    lastImageUrl={null}
                    onImageUpdate={() => {}}
                  />
                );
              }
            },
            {
              accessor: 'artistName',
              title: t('stats.timesAtTopByArtist.columns.artist'),
              render: (record) => (
                <Text size="sm" fw={500}>{record.artistName}</Text>
              )
            },
            {
              accessor: 'itemsCount',
              title: t('stats.timesAtTopByArtist.columns.itemsAtN', { n: rank }),
              width: 150,
              textAlign: 'center'
            },
            {
              accessor: 'totalWeeks',
              title: t('stats.timesAtTopByArtist.columns.totalWeeks', { n: rank }),
              width: 150,
              textAlign: 'center'
            }
          ]}
          minHeight={200}
          noRecordsText={t('stats.noData')}
          totalRecords={sortedData.length}
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

export default TimesAtTopByArtistStats;

