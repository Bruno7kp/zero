// Perfect All Kill stats - artists who reached #1 in all three categories simultaneously
import React, { useState, useEffect } from 'react';
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
import { useNavigate } from 'react-router-dom';
import { DataTable } from 'mantine-datatable';
import { IconExternalLink } from '@tabler/icons-react';
import StatsFilters from '../../components/stats/StatsFilters';
import { getPerfectAllKills, getYearRange } from '../../utils/statsQueries';
import { SpotifyImageWithModal } from '../../components/SpotifyImageWithModal';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../../services/SpotifyApi';

const PAGE_SIZE = 25;

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
        setData(results);
      } catch (error) {
        console.error('Error loading PAK stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [chart, year]);

  // Group by artist to count how many times they achieved PAK
  const groupedData = React.useMemo(() => {
    const grouped = new Map<string, {
      artistName: string;
      artistEntityId: string;
      count: number;
      weeks: typeof data;
    }>();

    data.forEach(item => {
      const existing = grouped.get(item.artistName);
      if (existing) {
        existing.count++;
        existing.weeks.push(item);
      } else {
        grouped.set(item.artistName, {
          artistName: item.artistName,
          artistEntityId: item.artistEntityId,
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

  return (
    <Stack gap="md">
      <div>
        <Title order={2}>{t('stats.pak.title')}</Title>
        <Text c="dimmed">{t('stats.pak.description')}</Text>
      </div>

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
        <DataTable
          records={paginatedData}
          columns={[
            {
              accessor: 'week',
              title: t('stats.pak.columns.week'),
              width: 100,
              render: (record) => record.weeks[0]?.week || '-'
            },
            {
              accessor: 'count',
              title: t('stats.pak.columns.times'),
              width: 120,
              textAlign: 'center'
            },
            {
              accessor: 'image',
              title: t('stats.pak.columns.image'),
              width: 60,
              render: (record) => (
                <SpotifyImageWithModal
                  entityId={record.artistEntityId}
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
              )
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
              render: (record) => {
                const albums = [...new Set(record.weeks.map(w => w.albumName))];
                return (
                  <div>
                    {albums.map((album, i) => (
                      <Text key={i} size="sm">{album}</Text>
                    ))}
                  </div>
                );
              }
            },
            {
              accessor: 'trackName',
              title: t('stats.pak.columns.track'),
              render: (record) => {
                const tracks = [...new Set(record.weeks.map(w => w.trackName))];
                return (
                  <div>
                    {tracks.map((track, i) => (
                      <Text key={i} size="sm">{track}</Text>
                    ))}
                  </div>
                );
              }
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
                    href={`/charts/week/${record.weeks[0]?.week}/artist`}
                    onClick={(e) => {
                      e.preventDefault();
                      navigate(`/charts/week/${record.weeks[0]?.week}/artist`);
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

export default PerfectAllKillStats;

