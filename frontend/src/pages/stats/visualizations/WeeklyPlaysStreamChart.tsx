import React from 'react';
import {
  Card,
  Stack,
  Loader,
  Center,
  Text,
  useMantineTheme,
  useComputedColorScheme,
} from '@mantine/core';
import { ResponsiveStream } from '@nivo/stream';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import VisualizationFilters from '../../../components/stats/VisualizationFilters';
import { db } from '../../../db/indexedDb';
import { getYearRange } from '../../../utils/statsQueries';
import { getCardBackgroundByMode, type ThemeMode } from '../../../theme/modes';
import { getColorForName } from '../../../utils/colorHash';
import { useVisualizationPreferences } from '../../../hooks/useVisualizationPreferences';

interface StreamDatum {
  [key: string]: number | string;
}

const WeeklyPlaysStreamChart: React.FC = () => {
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
  const [data, setData] = React.useState<StreamDatum[]>([]);
  const [keys, setKeys] = React.useState<string[]>([]);
  const [colors, setColors] = React.useState<{ [key: string]: string }>({});

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
        console.warn('[stream] failed to compute year range', error);
      }
    };

    loadRange();

    return () => {
      mounted = false;
    };
  }, [chart, chartType]);

  // Load stream data
  React.useEffect(() => {
    if (!chart) {
      setData([]);
      setKeys([]);
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

        // Find entities that reached top 5 at least once
        const top5Entities = new Set<string>();
        const entityNames = new Map<string, string>();

        allData.forEach(item => {
          if (item.rank <= 5) {
            top5Entities.add(item.entityId);
            entityNames.set(
              item.entityId,
              `${item.name}${item.artistName ? ` • ${item.artistName}` : ''}`
            );
          }
        });

        // Filter data to only include top 5 entities
        const filteredData = allData.filter(item => top5Entities.has(item.entityId));

        // Get all weeks
        const weeksSet = new Set<string>();
        filteredData.forEach(item => weeksSet.add(item.week));
        const sortedWeeks = Array.from(weeksSet).sort();

        if (sortedWeeks.length === 0 || top5Entities.size === 0) {
          if (mounted) {
            setData([]);
            setKeys([]);
            setColors({});
            setLoading(false);
          }
          return;
        }

        // Build stream data
        const streamData: StreamDatum[] = sortedWeeks.map(week => {
          const datum: StreamDatum = { week };

          filteredData
            .filter(item => item.week === week)
            .forEach(item => {
              const entityName = entityNames.get(item.entityId) || item.entityId;
              datum[entityName] = item.plays;
            });

          return datum;
        });

        // Build keys (entity names)
        const entityKeys = Array.from(top5Entities)
          .map(entityId => entityNames.get(entityId) || entityId)
          .sort();

        // Build color map
        const colorMap: { [key: string]: string } = {};
        entityKeys.forEach(key => {
          colorMap[key] = getColorForName(key);
        });

        if (!mounted) return;

        setData(streamData);
        setKeys(entityKeys);
        setColors(colorMap);
      } catch (error) {
        console.error('[stream] failed to load data', error);
        if (mounted) {
          setData([]);
          setKeys([]);
          setColors({});
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [chart, chartType, year]);

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
          <Text size="xs" c="dimmed">
            {t('stats.visualizations.stream.description')}
          </Text>
        }
      />

      <Card withBorder p="lg" style={{ background: cardBg }}>
        {loading ? (
          <Center py="xl">
            <Loader size="lg" />
          </Center>
        ) : data.length === 0 || keys.length === 0 ? (
          <Center py="xl">
            <Text>{t('stats.noData')}</Text>
          </Center>
        ) : (
          <div style={{ height: 600 }}>
            <ResponsiveStream
              data={data}
              keys={keys}
              margin={{ top: 50, right: 200, bottom: 70, left: 60 }}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -45,
                legend: t('stats.visualizations.stream.axisBottom'),
                legendOffset: 60,
                legendPosition: 'middle',
                tickValues: data.length > 20 ? 10 : undefined,
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                legend: t('stats.visualizations.stream.axisLeft'),
                legendOffset: -40,
                legendPosition: 'middle',
              }}
              colors={(layer: any) => colors[layer.id] || theme.colors.blue[6]}
              offsetType="silhouette"
              curve="cardinal"
              borderWidth={0}
              enableGridX={false}
              enableGridY
              legends={[
                {
                  anchor: 'bottom-right',
                  direction: 'column',
                  translateX: 180,
                  itemWidth: 80,
                  itemHeight: 20,
                  itemTextColor: isDark ? theme.colors.gray[2] : theme.colors.gray[8],
                  symbolSize: 12,
                  symbolShape: 'circle',
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemTextColor: isDark ? theme.white : theme.black,
                      },
                    },
                  ],
                },
              ]}
              tooltip={({ layer }) => (
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
                    {layer.id}
                  </Text>
                  <Text size="xs">
                    {t('stats.visualizations.scatter.tooltipPlays', { plays: layer.value })}
                  </Text>
                </div>
              )}
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

export default WeeklyPlaysStreamChart;
