import React from 'react';
import {
  Card,
  Stack,
  Loader,
  Center,
  Text,
  useMantineTheme,
  useComputedColorScheme,
  MultiSelect,
  SegmentedControl,
  Group,
} from '@mantine/core';
import { ResponsiveScatterPlot } from '@nivo/scatterplot';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import VisualizationFilters from '../../../components/stats/VisualizationFilters';
import { db } from '../../../db/indexedDb';
import { getYearRange, getPointsAccumulators } from '../../../utils/statsQueries';
import { getCardBackgroundByMode, type ThemeMode } from '../../../theme/modes';
import { getColorForName } from '../../../utils/colorHash';
import { useVisualizationPreferences } from '../../../hooks/useVisualizationPreferences';
import { IconChartDots } from '@tabler/icons-react';

interface ScatterPoint {
  x: string; // week
  y: number; // position or plays
}

interface ScatterSerie {
  id: string;
  data: ScatterPoint[];
  color?: string;
  entityId: string;
  artistName: string;
  name: string;
}

type DisplayMode = 'position' | 'plays';

const DEFAULT_CHART_TYPE: 'track' | 'album' | 'artist' = 'artist';

const PositionsScatterChart: React.FC = () => {
  const { t } = useTranslation();
  const theme = useMantineTheme();
  const computedColorScheme = useComputedColorScheme('dark');
  const isDark = computedColorScheme === 'dark';
  const charts = useSelector((state: any) => state.charts.charts);
  const activeChartId = useSelector((state: any) => state.charts.activeChartId);
  const chart = charts.find((c: any) => c.id === activeChartId);
  const themeMode = useSelector((state: any) => state.theme?.value || 'dark') as ThemeMode;
  const cardBg = getCardBackgroundByMode(theme, themeMode);
  const { preferences, updatePreference } = useVisualizationPreferences();

  const [year, setYear] = React.useState<string>('all');
  const [yearRange, setYearRange] = React.useState<{ minYear: number; maxYear: number } | null>(
    null
  );
  const [loading, setLoading] = React.useState<boolean>(false);
  const [chartType, setChartType] = React.useState<'track' | 'album' | 'artist'>(
    DEFAULT_CHART_TYPE
  );
  const [displayMode, setDisplayMode] = React.useState<DisplayMode>('position');
  const [data, setData] = React.useState<ScatterSerie[]>([]);
  const [availableEntities, setAvailableEntities] = React.useState<
    Array<{ value: string; label: string; artistName: string }>
  >([]);
  const [selectedEntities, setSelectedEntities] = React.useState<string[]>([]);
  const [selectedArtists, setSelectedArtists] = React.useState<string[]>([]);
  const [availableArtists, setAvailableArtists] = React.useState<
    Array<{ value: string; label: string }>
  >([]);

  const cutoff = React.useMemo(() => {
    if (!chart) return 100;
    if (chartType === 'album') return chart.album_cutoff || 100;
    if (chartType === 'artist') return chart.artist_cutoff || 100;
    return chart.music_cutoff || 100;
  }, [chart, chartType]);

  // Load year range
  React.useEffect(() => {
    if (!chart) {
      setYearRange(null);
      return;
    }

    let mounted = true;

    const loadRange = async () => {
      try {
        const range = await getYearRange(String(chart.id), chartType);
        if (mounted) setYearRange(range ?? null);
      } catch (error) {
        console.warn('[scatter] failed to compute year range', error);
      }
    };

    loadRange();

    return () => {
      mounted = false;
    };
  }, [chart, chartType]);

  // Load available entities and set default selection
  React.useEffect(() => {
    if (!chart) {
      setAvailableEntities([]);
      setSelectedEntities([]);
      return;
    }

    let mounted = true;

    const loadEntities = async () => {
      try {
        if (chartType === 'artist') {
          // For artists, get top by points
          const topEntities = await getPointsAccumulators({
            chartId: String(chart.id),
            chartType: 'artist',
            year: year === 'all' ? undefined : year,
          });

          if (!mounted) return;

          const entities = topEntities.slice(0, 100).map(item => ({
            value: item.entityId,
            label: item.name,
            artistName: item.artistName,
          }));

          setAvailableEntities(entities);

          // Default: select top 10
          const defaultSelection = entities.slice(0, 10).map(e => e.value);
          setSelectedEntities(defaultSelection);
        } else {
          // For albums/tracks, first get available artists
          const allData = await db.charts_data
            .where('[chartId+chartType]')
            .equals([String(chart.id), chartType])
            .toArray();

          if (!mounted) return;

          // Get unique artists
          const artistsMap = new Map<string, { name: string; points: number }>();

          for (const item of allData) {
            const existing = artistsMap.get(item.artistName);
            if (existing) {
              existing.points += item.points;
            } else {
              artistsMap.set(item.artistName, { name: item.artistName, points: item.points });
            }
          }

          const sortedArtists = Array.from(artistsMap.entries())
            .sort((a, b) => b[1].points - a[1].points)
            .slice(0, 100)
            .map(([id, data]) => ({
              value: id,
              label: data.name,
            }));

          setAvailableArtists(sortedArtists);

          // Default: select top 10 artists
          const defaultArtists = sortedArtists.slice(0, 10).map(a => a.value);
          setSelectedArtists(defaultArtists);
        }
      } catch (error) {
        console.error('[scatter] failed to load entities', error);
        if (mounted) {
          setAvailableEntities([]);
          setAvailableArtists([]);
          setSelectedEntities([]);
          setSelectedArtists([]);
        }
      }
    };

    loadEntities();

    return () => {
      mounted = false;
    };
  }, [chart, chartType, year]);

  // Load scatter data
  React.useEffect(() => {
    if (!chart) return;

    const selection = chartType === 'artist' ? selectedEntities : selectedArtists;
    if (selection.length === 0) {
      setData([]);
      return;
    }

    let mounted = true;

    const loadData = async () => {
      setLoading(true);
      try {
        let allData = await db.charts_data
          .where('[chartId+chartType]')
          .equals([String(chart.id), chartType])
          .toArray();

        if (year !== 'all') {
          allData = allData.filter(item => item.week.startsWith(year));
        }

        if (!mounted) return;

        let filteredData = allData;

        if (chartType === 'artist') {
          // Filter by selected artists
          filteredData = allData.filter(item => selectedEntities.includes(item.entityId));
        } else {
          // Filter by selected artists (show all albums/tracks of those artists)
          filteredData = allData.filter(item => selectedArtists.includes(item.artistName));
        }

        // Group by entity
        const seriesMap = new Map<string, ScatterPoint[]>();
        const entityMeta = new Map<string, { name: string; artistName: string }>();

        filteredData.forEach(item => {
          if (!seriesMap.has(item.entityId)) {
            seriesMap.set(item.entityId, []);
            entityMeta.set(item.entityId, {
              name: item.name,
              artistName: item.artistName,
            });
          }

          seriesMap.get(item.entityId)!.push({
            x: item.week,
            y: displayMode === 'position' ? item.rank : item.plays,
          });
        });

        if (!mounted) return;

        const series: ScatterSerie[] = Array.from(seriesMap.entries()).map(
          ([entityId, points]) => {
            const meta = entityMeta.get(entityId)!;
            const color = getColorForName(meta.artistName || meta.name);

            return {
              id: meta.name,
              data: points,
              color,
              entityId,
              artistName: meta.artistName,
              name: meta.name,
            };
          }
        );

        setData(series);
      } catch (error) {
        console.error('[scatter] failed to load data', error);
        if (mounted) setData([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [chart, chartType, year, selectedEntities, selectedArtists, displayMode]);

  if (!chart) {
    return (
      <Center py="xl">
        <Text>{t('errors.selectActiveChart')}</Text>
      </Center>
    );
  }

  return (
    <Stack gap="md">
      <VisualizationFilters
        year={year}
        onYearChange={setYear}
        yearRange={yearRange || undefined}
        type={chartType}
        onTypeChange={value => setChartType(value)}
        containerSize={preferences.containerSize}
        onContainerSizeChange={value => updatePreference('containerSize', value)}
        customFilters={
          <Stack gap="sm">
            <Group gap="sm" align="center">
              <Text size="sm" fw={500}>
                {t('stats.visualizations.scatter.modeLabel')}:
              </Text>
              <SegmentedControl
                value={displayMode}
                onChange={value => setDisplayMode(value as DisplayMode)}
                data={[
                  {
                    label: t('stats.visualizations.scatter.positionMode'),
                    value: 'position',
                  },
                  { label: t('stats.visualizations.scatter.playsMode'), value: 'plays' },
                ]}
              />
            </Group>

            {chartType === 'artist' ? (
              <MultiSelect
                label={t('stats.visualizations.scatter.selectEntitiesLabel')}
                data={availableEntities}
                value={selectedEntities}
                onChange={value => setSelectedEntities(value.slice(0, 10))}
                searchable
                clearable
                maxValues={10}
                leftSection={<IconChartDots size={16} />}
              />
            ) : (
              <MultiSelect
                label={t('stats.visualizations.scatter.selectArtistsLabel')}
                data={availableArtists}
                value={selectedArtists}
                onChange={value => setSelectedArtists(value.slice(0, 10))}
                searchable
                clearable
                maxValues={10}
                leftSection={<IconChartDots size={16} />}
              />
            )}

            <Text size="xs" c="dimmed">
              {t('stats.visualizations.scatter.defaultSelectionNote')}
            </Text>
          </Stack>
        }
      />

      <Card withBorder p="lg" style={{ background: cardBg }}>
        {loading ? (
          <Center py="xl">
            <Loader size="lg" />
          </Center>
        ) : data.length === 0 ? (
          <Center py="xl">
            <Text>{t('stats.noData')}</Text>
          </Center>
        ) : (
          <div style={{ height: 600 }}>
            <ResponsiveScatterPlot
              data={data}
              margin={{ top: 60, right: 140, bottom: 70, left: 90 }}
              xScale={{ type: 'point' }}
              yScale={{
                type: 'linear',
                min: displayMode === 'position' ? 1 : 0,
                max: displayMode === 'position' ? cutoff : 'auto',
                reverse: displayMode === 'position',
              }}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
                legend: t('stats.visualizations.scatter.axisBottomWeek'),
                legendPosition: 'middle',
                legendOffset: 60,
                tickValues: data.length > 0 && data[0]?.data.length > 20 ? 10 : undefined,
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                legend:
                  displayMode === 'position'
                    ? t('stats.visualizations.scatter.axisLeftPosition')
                    : t('stats.visualizations.scatter.axisLeftPlays'),
                legendPosition: 'middle',
                legendOffset: -60,
              }}
              colors={(serie: any) => serie.color || theme.colors.blue[6]}
              nodeSize={8}
              enableGridX={false}
              enableGridY
              legends={[
                {
                  anchor: 'bottom-right',
                  direction: 'column',
                  justify: false,
                  translateX: 130,
                  translateY: 0,
                  itemWidth: 100,
                  itemHeight: 12,
                  itemsSpacing: 5,
                  symbolSize: 8,
                  symbolShape: 'circle',
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemOpacity: 1,
                      },
                    },
                  ],
                },
              ]}
              tooltip={({ node }) => {
                const serie = node.serieId as string;
                const point = node.data as ScatterPoint;

                return (
                  <div
                    style={{
                      background: isDark ? theme.colors.dark[6] : theme.white,
                      color: isDark ? theme.white : theme.black,
                      padding: '8px 12px',
                      borderRadius: 6,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                    }}
                  >
                    <Text size="xs" fw={600}>
                      {serie}
                    </Text>
                    <Text size="xs">
                      {t('stats.visualizations.scatter.tooltipWeek', {
                        week: String(point.x).replace(/-/g, '.'),
                      })}
                    </Text>
                    <Text size="xs">
                      {displayMode === 'position'
                        ? t('stats.visualizations.scatter.tooltipPosition', {
                            position: point.y,
                          })
                        : t('stats.visualizations.scatter.tooltipPlays', { plays: point.y })}
                    </Text>
                  </div>
                );
              }}
              theme={{
                text: {
                  fill: isDark ? theme.colors.gray[2] : theme.colors.gray[8],
                },
                grid: {
                  line: {
                    stroke: isDark ? theme.colors.dark[4] : theme.colors.gray[2],
                    strokeDasharray: '4 4',
                  },
                },
              }}
            />
          </div>
        )}
      </Card>
    </Stack>
  );
};

export default PositionsScatterChart;
