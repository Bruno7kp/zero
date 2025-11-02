import React from 'react';
import {
  Card,
  Stack,
  Loader,
  Center,
  Text,
  useMantineTheme,
  useComputedColorScheme,
  Box,
} from '@mantine/core';
import { ResponsiveBar } from '@nivo/bar';
import type { BarTooltipProps } from '@nivo/bar';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import VisualizationFilters from '../../../components/stats/VisualizationFilters';
import { db } from '../../../db/indexedDb';
import { getYearRange } from '../../../utils/statsQueries';
import { getCardBackgroundByMode, type ThemeMode } from '../../../theme/modes';
import { fetchSpotifyImagesBatch } from '../../../utils/spotifyImageLoader';
import { getColorForName } from '../../../utils/colorHash';
import { useVisualizationPreferences } from '../../../hooks/useVisualizationPreferences';

interface NumberOneBarDatum {
  week: string;
  plays: number;
  name: string;
  artistName: string;
  entityId: string;
  imageUrl?: string;
  barColor?: string;
}

const BAR_WIDTH = 48;
const MIN_CHART_WIDTH = 720;
const DEFAULT_CHART_TYPE: 'track' | 'album' | 'artist' = 'track';

const NumberOneTimelineChart: React.FC = () => {
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
  const [data, setData] = React.useState<NumberOneBarDatum[]>([]);
  const [defaultYearApplied, setDefaultYearApplied] = React.useState<boolean>(false);
  const [chartType, setChartType] = React.useState<'track' | 'album' | 'artist'>(
    DEFAULT_CHART_TYPE
  );
  const chartRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!chart) {
      setData([]);
      setYearRange(null);
      return;
    }

    setYear('all');
    setYearRange(null);
    setDefaultYearApplied(false);
  }, [chart]);

  React.useEffect(() => {
    if (!chart) return;

    let mounted = true;

    const loadRange = async () => {
      try {
        const range = await getYearRange(String(chart.id), chartType);
        if (mounted) setYearRange(range ?? null);
      } catch (error) {
        console.warn('[visualizations] failed to compute number-one year range', error);
      }
    };

    loadRange();

    return () => {
      mounted = false;
    };
  }, [chart, chartType]);

  React.useEffect(() => {
    if (!chart || !yearRange || defaultYearApplied) return;

    const withinRange =
      typeof yearRange.minYear === 'number' && typeof yearRange.maxYear === 'number';

    if (!withinRange) {
      setDefaultYearApplied(true);
      return;
    }

    const currentYear = new Date().getFullYear();
    const nextYear =
      currentYear >= yearRange.minYear && currentYear <= yearRange.maxYear
        ? String(currentYear)
        : String(yearRange.maxYear);

    setYear(nextYear);
    setDefaultYearApplied(true);
  }, [chart, yearRange, defaultYearApplied]);

  React.useEffect(() => {
    if (!chart) return;

    let mounted = true;

    const loadData = async () => {
      setLoading(true);
      try {
        const collection = db.charts_data
          .where('[chartId+chartType]')
          .equals([String(chart.id), chartType])
          .and(item => item.rank === 1);

        let entries = await collection.sortBy('week');

        if (year !== 'all') {
          entries = entries.filter(entry => entry.week.startsWith(year));
        }

        if (!mounted) return;

        const normalized: NumberOneBarDatum[] = entries.map(item => ({
          week: item.week,
          plays: item.plays,
          name: item.name,
          artistName: item.artistName,
          entityId: item.entityId,
          imageUrl: '',
        }));

        setData(prev => {
          const imageMap = new Map(prev.map(entry => [entry.entityId, entry.imageUrl]));
          return normalized.map(entry => ({
            ...entry,
            imageUrl: imageMap.get(entry.entityId) ?? entry.imageUrl ?? '',
          }));
        });

        if (mounted) setLoading(false);

        if (!entries.length) {
          return;
        }

        fetchSpotifyImagesBatch(
          entries.map(item => ({
            entityId: item.entityId,
            name: item.name,
            artistName: item.artistName,
            type: chartType,
          }))
        )
          .then(images => {
            if (!mounted) return;
            setData(prev =>
              prev.map(entry => ({
                ...entry,
                imageUrl: images[entry.entityId] ?? entry.imageUrl,
              }))
            );
          })
          .catch(imageError => {
            console.warn('[visualizations] failed to load number-one timeline images', imageError);
          });
      } catch (error) {
        console.error('[visualizations] failed to load number-one timeline', error);
        if (mounted) {
          setData([]);
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [chart, year, chartType]);

  const coloredData = React.useMemo(() => {
    if (!data.length) return [];
    return data.map(item => ({
      ...item,
      barColor: getColorForName(item.artistName || item.name || item.entityId),
    }));
  }, [data]);

  React.useEffect(() => {
    if (chartRef.current && coloredData.length > 0) {
      chartRef.current.scrollLeft = chartRef.current.scrollWidth - chartRef.current.clientWidth;
    }
  }, [coloredData]);

  const tickValues = React.useMemo(() => {
    if (coloredData.length <= 12) return undefined;
    return coloredData
      .filter((_, i) => i % Math.ceil(coloredData.length / 12) === 0)
      .map(d => d.week);
  }, [coloredData]);

  const chartWidth = React.useMemo(() => {
    if (!coloredData.length) return MIN_CHART_WIDTH;
    return Math.max(coloredData.length * BAR_WIDTH, MIN_CHART_WIDTH);
  }, [coloredData.length]);

  const imageLayer = React.useCallback((props: any) => {
    const { bars } = props;
    return (
      <g>
        {bars.map((bar: any) => {
          const datum = bar.data.data as NumberOneBarDatum;
          const imageSize = Math.min(40, bar.width - 4);
          if (!datum.imageUrl || imageSize <= 16) return null;
          return (
            <image
              key={bar.key}
              href={datum.imageUrl}
              x={bar.x + bar.width / 2 - imageSize / 2}
              y={bar.y - imageSize - 12}
              width={imageSize}
              height={imageSize}
              preserveAspectRatio="xMidYMid slice"
              style={{ pointerEvents: 'none' }}
            />
          );
        })}
      </g>
    );
  }, []);

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
      />

      <Card withBorder p="lg" style={{ background: cardBg }}>
        {loading ? (
          <Center py="xl">
            <Loader size="lg" />
          </Center>
        ) : coloredData.length === 0 ? (
          <Center py="xl">
            <Text>{t('stats.noData')}</Text>
          </Center>
        ) : (
          <Box style={{ overflowX: 'auto' }}>
            <Box
              ref={chartRef}
              mb="sm"
              style={{ height: 500, minWidth: MIN_CHART_WIDTH, width: chartWidth }}
            >
              <ResponsiveBar
                data={coloredData}
                keys={['plays']}
                indexBy="week"
                margin={{ top: 60, right: 30, bottom: 60, left: 50 }}
                padding={0.25}
                colors={({ data: datum }) =>
                  (datum as NumberOneBarDatum).barColor ?? theme.colors.blue[6]
                }
                axisBottom={{
                  tickSize: 0,
                  tickPadding: 10,
                  tickRotation: 0,
                  tickValues,
                  format: value => `${String(value).slice(5, 7)}/${String(value).slice(0, 4)}`,
                }}
                axisLeft={{
                  tickSize: 0,
                  tickPadding: 10,
                }}
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                enableGridY
                enableLabel={false}
                borderRadius={6}
                layers={['grid', 'axes', 'bars', imageLayer, 'legends']}
                tooltip={({ data: datum, indexValue, formattedValue }: BarTooltipProps<any>) => {
                  const extended = datum as NumberOneBarDatum;

                  return (
                    <div
                      style={{
                        background: isDark ? theme.colors.dark[6] : theme.white,
                        color: isDark ? theme.white : theme.black,
                        padding: '8px 12px',
                        borderRadius: 6,
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                        minWidth: 200,
                      }}
                    >
                      <Text size="xs" fw={600}>
                        {String(indexValue).replace(/-/g, '.')}
                      </Text>
                      <Text size="xs">
                        {t('stats.visualizations.timeline.tooltipPlays', {
                          value: formattedValue,
                        })}
                      </Text>
                      {extended.name && (
                        <Text size="xs">
                          {extended.name}
                          {extended.artistName ? ` • ${extended.artistName}` : ''}
                        </Text>
                      )}
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
                animate
                motionConfig="gentle"
              />
            </Box>
          </Box>
        )}
      </Card>
    </Stack>
  );
};

export default NumberOneTimelineChart;
