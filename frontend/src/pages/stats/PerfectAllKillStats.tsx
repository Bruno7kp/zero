// Perfect All Kill stats - shows weeks where artists achieved PAK
import React, { useState, useEffect } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { DataTable } from 'mantine-datatable';
import { IconExternalLink } from '@tabler/icons-react';
import StatsFilters from '../../components/stats/StatsFilters';
import { getPerfectAllKills, getYearRange } from '../../utils/statsQueries';
import { useSpotifyImage } from '../../hooks/useSpotifyImage';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../../services/SpotifyApi';

const PAGE_SIZE = 25;

// Component to render image cell with hooks
const ImageCell: React.FC<{ entityId: string; name: string }> = ({ entityId, name }) => {
  const { imageUrl } = useSpotifyImage({
    entityId,
    name,
    artistName: name,
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
        setData(results);
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
    return data.map(item => {
      const key = item.artistName;
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
        <Card p="md" withBorder>
          <DataTable
            records={paginatedData}
            columns={[
              {
                accessor: 'week',
                title: t('stats.pak.columns.week'),
                width: 100
              },
              {
                accessor: 'occurrence',
                title: t('stats.pak.columns.times'),
                width: 120,
                textAlign: 'center',
                render: (record: any) => `${record.occurrence}ª`
              },
              {
                accessor: 'image',
                title: t('stats.pak.columns.image'),
                width: 60,
                render: (record) => <ImageCell entityId={record.artistEntityId} name={record.artistName} />
              },
              {
                accessor: 'artistName',
                title: t('stats.pak.columns.artist'),
                render: (record) => (
                  <Text size="sm" fw={500}>{record.artistName}</Text>
                )
              },
              {
                accessor: 'albumName',
                title: t('stats.pak.columns.album'),
                render: (record) => (
                  <Text size="sm">{record.albumName}</Text>
                )
              },
              {
                accessor: 'trackName',
                title: t('stats.pak.columns.track'),
                render: (record) => (
                  <Text size="sm">{record.trackName}</Text>
                )
              },
              {
                accessor: 'actions',
                title: t('stats.pak.columns.viewChart'),
                width: 100,
                textAlign: 'center',
                render: (record) => (
                  <Group gap="xs" justify="center">
                    <Anchor
                      component="a"
                      href={`/charts/week/${record.week}/artist`}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/charts/week/${record.week}/artist`);
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
            noRecordsText={t('stats.pak.noData')}
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

export default PerfectAllKillStats;

