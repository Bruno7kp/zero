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
} from '@mantine/core';
import { ResponsiveBump } from '@nivo/bump';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import VisualizationFilters from '../../../components/stats/VisualizationFilters';
import { db } from '../../../db/indexedDb';
import { getYearRange } from '../../../utils/statsQueries';
import { getCardBackgroundByMode, type ThemeMode } from '../../../theme/modes';
import { getColorForName } from '../../../utils/colorHash';
import { useVisualizationPreferences } from '../../../hooks/useVisualizationPreferences';
import { IconTrendingUp } from '@tabler/icons-react';

interface BumpPoint {
  x: string;
  y: number;
}

interface BumpSerie {
  id: string;
  data: BumpPoint[];
  color?: string;
}

const ChartRunBumpChart: React.FC = () => {
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
  const [chartType, setChartType] = React.useState<'track' | 'album' | 'artist'>('track');
  const [data, setData] = React.useState<BumpSerie[]>([]);
  const [availableEntities, setAvailableEntities] = React.useState<
    Array<{ value: string; label: string }>
  >([]);
  const [selectedEntities, setSelectedEntities] = React.useState<string[]>([]);

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
        console.warn('[bump] failed to compute year range', error);
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
        // Get all weeks to find the last week
        const allData = await db.charts_data
          .where('[chartId+chartType]')
          .equals([String(chart.id), chartType])
          .toArray();

        const uniqueWeeks = new Set<string>();
        allData.forEach(item => uniqueWeeks.add(item.week));
        const weeks = Array.from(uniqueWeeks).sort();

        let filteredWeeks = weeks;
        if (year !== 'all') {
          filteredWeeks = weeks.filter(w => w.startsWith(year));
        }

        if (filteredWeeks.length === 0) {
          if (mounted) {
            setAvailableEntities([]);
            setSelectedEntities([]);
          }
          return;
        }

        const lastWeek = filteredWeeks[filteredWeeks.length - 1];

        // Get top 10 from last week
        const lastWeekData = await db.charts_data
          .where('[chartId+chartType+week]')
          .equals([String(chart.id), chartType, lastWeek])
          .sortBy('rank');

        if (!mounted) return;

        const top10 = lastWeekData.slice(0, 10);

        const entities = top10.map(item => ({
          value: item.entityId,
          label: `${item.name}${item.artistName ? ` • ${item.artistName}` : ''}`,
        }));

        setAvailableEntities(entities);
        setSelectedEntities(entities.map(e => e.value));
      } catch (error) {
        console.error('[bump] failed to load entities', error);
        if (mounted) {
          setAvailableEntities([]);
          setSelectedEntities([]);
        }
      }
    };

    loadEntities();

    return () => {
      mounted = false;
    };
  }, [chart, chartType, year]);

  // Load bump data
  React.useEffect(() => {
    if (!chart || selectedEntities.length === 0) {
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

        // Filter by selected entities
        const filteredData = allData.filter(item => selectedEntities.includes(item.entityId));

        // Get all weeks
        const weeksSet = new Set<string>();
        filteredData.forEach(item => weeksSet.add(item.week));
        const sortedWeeks = Array.from(weeksSet).sort();

        // Group by entity
        const seriesMap = new Map<string, Map<string, number>>();
        const entityNames = new Map<string, string>();

        filteredData.forEach(item => {
          if (!seriesMap.has(item.entityId)) {
            seriesMap.set(item.entityId, new Map());
            entityNames.set(
              item.entityId,
              `${item.name}${item.artistName ? ` • ${item.artistName}` : ''}`
            );
          }

          seriesMap.get(item.entityId)!.set(item.week, item.rank);
        });

        if (!mounted) return;

        // Build series data
        const series: BumpSerie[] = Array.from(seriesMap.entries()).map(([entityId, weekMap]) => {
          const entityName = entityNames.get(entityId) || entityId;
          const color = getColorForName(entityName);

          const data: BumpPoint[] = sortedWeeks.map(week => ({
            x: week,
            y: weekMap.get(week) || cutoff + 1, // Use cutoff+1 for missing weeks
          }));

          return {
            id: entityName,
            data,
            color,
          };
        });

        setData(series);
      } catch (error) {
        console.error('[bump] failed to load data', error);
        if (mounted) setData([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [chart, chartType, year, selectedEntities, cutoff]);

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
            <MultiSelect
              label={t('stats.visualizations.bump.selectEntitiesLabel')}
              data={availableEntities}
              value={selectedEntities}
              onChange={value => setSelectedEntities(value.slice(0, 10))}
              searchable
              clearable
              maxValues={10}
              leftSection={<IconTrendingUp size={16} />}
            />

            <Text size="xs" c="dimmed">
              {t('stats.visualizations.bump.defaultSelectionNote')}
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
            <ResponsiveBump
              data={data}
              margin={{ top: 40, right: 200, bottom: 70, left: 60 }}
              colors={(serie: any) => serie.color || theme.colors.blue[6]}
              lineWidth={3}
              activeLineWidth={6}
              inactiveLineWidth={3}
              inactiveOpacity={0.15}
              pointSize={10}
              activePointSize={16}
              inactivePointSize={0}
              pointColor={{ theme: 'background' }}
              pointBorderWidth={3}
              activePointBorderWidth={3}
              pointBorderColor={{ from: 'serie.color' }}
              axisTop={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
                legend: t('stats.visualizations.bump.axisBottom'),
                legendPosition: 'middle',
                legendOffset: 60,
                tickValues: data[0]?.data.length > 20 ? 10 : undefined,
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                legend: t('stats.visualizations.bump.axisLeft'),
                legendPosition: 'middle',
                legendOffset: -40,
              }}
              enableGridX={false}
              enableGridY
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

export default ChartRunBumpChart;
