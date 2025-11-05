import React from 'react';
import {
  Card,
  Stack,
  Loader,
  Center,
  Text,
  useMantineTheme,
  useComputedColorScheme,
  RangeSlider,
  Group,
  ActionIcon,
} from '@mantine/core';
import { ResponsiveBar } from '@nivo/bar';
import type { BarDatum } from '@nivo/bar';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import VisualizationFilters from '../../../components/stats/VisualizationFilters';
import { useVisualizationPreferences } from '../../../hooks/useVisualizationPreferences';
import { getPointsAccumulators, getAllWeeks, getYearRange } from '../../../utils/statsQueries';
import { getCardBackgroundByMode, type ThemeMode } from '../../../theme/modes';
import { fetchSpotifyImagesBatch } from '../../../utils/spotifyImageLoader';
import { getColorForName } from '../../../utils/colorHash';
import { IconPlayerPlayFilled, IconPlayerPauseFilled } from '@tabler/icons-react';

const MAX_LABEL_LENGTH = 28;

interface PointsLeaderDatum extends BarDatum {
  entity: string;
  artistName: string;
  totalPoints: number;
  weeksOnChart: number;
  entityId: string;
  imageUrl: string;
  barColor: string;
}

const TopPointsLeadersChart: React.FC = () => {
  const { t } = useTranslation();
  const theme = useMantineTheme();
  const computedColorScheme = useComputedColorScheme('dark');
  const isDark = computedColorScheme === 'dark';
  const { preferences, updatePreference } = useVisualizationPreferences();

  const charts = useSelector((state: any) => state.charts.charts);
  const activeChartId = useSelector((state: any) => state.charts.activeChartId);
  const chart = charts.find((c: any) => c.id === activeChartId);
  const themeMode = useSelector((state: any) => state.theme?.value || 'dark') as ThemeMode;
  const cardBg = getCardBackgroundByMode(theme, themeMode);

  const [year, setYear] = React.useState<string>('all');
  const [yearRange, setYearRange] = React.useState<{ minYear: number; maxYear: number } | null>(
    null
  );
  const [type, setType] = React.useState<'track' | 'album' | 'artist'>('track');
  const [loading, setLoading] = React.useState<boolean>(false);
  const [data, setData] = React.useState<PointsLeaderDatum[]>([]);
  const [allWeeks, setAllWeeks] = React.useState<string[]>([]);
  const [filteredWeeks, setFilteredWeeks] = React.useState<string[]>([]);
  const [weekRange, setWeekRange] = React.useState<[number, number]>([0, 0]);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = React.useState(false);
  const playIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const isPlayingRef = React.useRef(false);
  const previousYearRef = React.useRef<string>('all');

  const truncateLabel = React.useCallback((value: string) => {
    if (value.length <= MAX_LABEL_LENGTH) return value;
    return `${value.slice(0, Math.max(MAX_LABEL_LENGTH - 3, 1))}...`;
  }, []);

  const clearPlayInterval = React.useCallback(() => {
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    if (!chart) {
      setAllWeeks([]);
      setYearRange(null);
      return;
    }

    let mounted = true;

    const loadMetadata = async () => {
      try {
        const [weeks, range] = await Promise.all([
          getAllWeeks(String(chart.id), type),
          getYearRange(String(chart.id), type),
        ]);

        if (!mounted) return;
        const weeksList = Array.isArray(weeks) ? weeks : [];
        setAllWeeks(weeksList);
        setYearRange(range ?? null);
      } catch (error) {
        console.warn('[visualizations] failed to load metadata for points leaders', error);
        if (mounted) {
          setAllWeeks([]);
          setYearRange(null);
        }
      }
    };

    loadMetadata();

    return () => {
      mounted = false;
    };
  }, [chart, type]);

  React.useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  React.useEffect(() => {
    setHasLoadedOnce(false);
  }, [chart?.id, type]);

  React.useEffect(() => {
    if (!allWeeks.length) {
      setFilteredWeeks([]);
      return;
    }

    const weeks =
      year === 'all' ? allWeeks : allWeeks.filter(week => week.startsWith(String(year)));

    setFilteredWeeks(prev => {
      if (prev.length === weeks.length && prev.every((item, index) => item === weeks[index])) {
        return prev;
      }
      return weeks;
    });
  }, [allWeeks, year]);

  React.useEffect(() => {
    if (!filteredWeeks.length) {
      setWeekRange([0, 0]);
      if (isPlayingRef.current) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        clearPlayInterval();
      }
      return;
    }

    setWeekRange(current => {
      const maxIndex = Math.max(filteredWeeks.length - 1, 0);

      if (current[0] === 0 && current[1] === 0 && maxIndex > 0) {
        return [0, maxIndex];
      }

      const normalizedStart = Math.min(Math.max(Math.round(current[0]), 0), maxIndex);
      const normalizedEnd = Math.min(Math.max(Math.round(current[1]), normalizedStart), maxIndex);

      if (normalizedStart === current[0] && normalizedEnd === current[1]) {
        return current;
      }

      return [normalizedStart, normalizedEnd];
    });
  }, [filteredWeeks, clearPlayInterval]);

  React.useEffect(() => {
    if (!filteredWeeks.length) {
      previousYearRef.current = year;
      return;
    }

    if (previousYearRef.current !== year) {
      previousYearRef.current = year;
      const maxIndex = Math.max(filteredWeeks.length - 1, 0);
      setWeekRange([0, maxIndex]);
      if (isPlayingRef.current) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        clearPlayInterval();
      }
    }
  }, [year, filteredWeeks, clearPlayInterval]);

  React.useEffect(() => {
    if (!chart) {
      setData([]);
      return;
    }

    if (!filteredWeeks.length) {
      setData([]);
      return;
    }

    let mounted = true;

    const loadData = async () => {
      setLoading(true);
      try {
        const maxIndex = filteredWeeks.length - 1;
        const startIndex = Math.min(Math.max(weekRange[0], 0), maxIndex);
        const endIndex = Math.min(Math.max(weekRange[1], 0), maxIndex);
        const fromIndex = Math.min(startIndex, endIndex);
        const toIndex = Math.max(startIndex, endIndex);

        const weekStart = filteredWeeks[fromIndex];
        const weekEnd = filteredWeeks[toIndex];

        const results = await getPointsAccumulators({
          chartId: String(chart.id),
          chartType: type,
          year: year === 'all' ? undefined : year,
          weekStart,
          weekEnd,
        });

        if (!mounted) return;

        const normalized: PointsLeaderDatum[] = results.map(item => ({
          entity: item.name,
          artistName: item.artistName ?? '',
          totalPoints: item.totalPoints,
          weeksOnChart: item.weeksOnChart,
          entityId: item.entityId,
          imageUrl: '',
          barColor: getColorForName(item.artistName || item.name || item.entityId),
        }));

        setData(prev => {
          const imageMap = new Map(prev.map(entry => [entry.entityId, entry.imageUrl]));
          return normalized.map(entry => ({
            ...entry,
            imageUrl: imageMap.get(entry.entityId) ?? entry.imageUrl,
          }));
        });

        setHasLoadedOnce(true);

        const primarySlice = normalized.slice(0, 100);
        if (primarySlice.length) {
          fetchSpotifyImagesBatch(
            primarySlice.map(item => ({
              entityId: item.entityId,
              name: item.entity,
              artistName: item.artistName,
              type,
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
              console.warn('[visualizations] failed to load points leaders images', imageError);
            });
        }
      } catch (error) {
        console.error('[visualizations] failed to load points leaders', error);
        if (mounted) {
          setData([]);
          setHasLoadedOnce(true);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [chart, type, filteredWeeks, weekRange, year]);

  React.useEffect(() => {
    if (!isPlaying || filteredWeeks.length <= 1) {
      clearPlayInterval();
      return;
    }

    clearPlayInterval();

    playIntervalRef.current = setInterval(() => {
      let reachedEnd = false;
      setWeekRange(prev => {
        const maxIndex = filteredWeeks.length - 1;
        if (maxIndex <= 0) {
          return [0, 0];
        }

        const startIndex = Math.min(Math.max(Math.round(prev[0]), 0), maxIndex);
        const endIndex = Math.min(Math.max(Math.round(prev[1]), 0), maxIndex);

        if (endIndex >= maxIndex) {
          reachedEnd = true;
          return [startIndex, maxIndex];
        }

        const nextEnd = Math.min(endIndex + 1, maxIndex);
        return [startIndex, nextEnd];
      });

      if (reachedEnd) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        clearPlayInterval();
      }
    }, 700);

    return clearPlayInterval;
  }, [isPlaying, filteredWeeks, clearPlayInterval]);

  React.useEffect(() => {
    return () => {
      clearPlayInterval();
    };
  }, [clearPlayInterval]);

  const limitedData = React.useMemo(
    () =>
      data
        .slice(0, 50)
        .map(item => ({ ...item }))
        .reverse(),
    [data]
  );

  const handleSliderChange = React.useCallback(
    (value: [number, number]) => {
      if (isPlaying) {
        setIsPlaying(false);
        clearPlayInterval();
      }

      setWeekRange([Math.round(value[0]), Math.round(value[1])]);
    },
    [isPlaying, clearPlayInterval]
  );

  const handleTogglePlay = React.useCallback(() => {
    if (filteredWeeks.length <= 1) return;

    if (isPlaying) {
      setIsPlaying(false);
      clearPlayInterval();
      return;
    }

    setWeekRange(prev => {
      const maxIndex = filteredWeeks.length - 1;
      const startIndex = Math.min(Math.max(Math.round(prev[0]), 0), maxIndex);
      const endIndex = Math.min(Math.max(Math.round(prev[1]), 0), maxIndex);

      if (endIndex >= maxIndex) {
        return [startIndex, startIndex];
      }

      return [startIndex, endIndex];
    });

    setIsPlaying(true);
  }, [filteredWeeks.length, isPlaying, clearPlayInterval]);

  const sliderMarks = React.useMemo(() => {
    if (filteredWeeks.length <= 1) return undefined;
    return [
      { value: 0, label: filteredWeeks[0] },
      {
        value: filteredWeeks.length - 1,
        label: filteredWeeks[filteredWeeks.length - 1],
      },
    ];
  }, [filteredWeeks]);

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
        type={type}
        onTypeChange={setType}
        containerSize={preferences.containerSize}
        onContainerSizeChange={value => updatePreference('containerSize', value)}
        yearRange={yearRange || undefined}
        customFilters={
          filteredWeeks.length > 0 ? (
            <Group gap="sm" align="center" wrap="nowrap">
              <ActionIcon
                variant="default"
                size="lg"
                onClick={handleTogglePlay}
                aria-label={isPlaying ? 'Pause autoplay' : 'Play autoplay'}
                disabled={filteredWeeks.length <= 1}
              >
                {isPlaying ? (
                  <IconPlayerPauseFilled size={18} />
                ) : (
                  <IconPlayerPlayFilled size={18} />
                )}
              </ActionIcon>
              <div style={{ flex: 1, paddingTop: 8, paddingBottom: 4 }}>
                <RangeSlider
                  label={value => filteredWeeks[Math.round(value)] || ''}
                  min={0}
                  max={Math.max(filteredWeeks.length - 1, 0)}
                  value={weekRange}
                  onChange={handleSliderChange}
                  size="sm"
                  marks={sliderMarks}
                  step={1}
                  disabled={filteredWeeks.length <= 1}
                />
              </div>
            </Group>
          ) : null
        }
      />

      <Card withBorder p="lg" style={{ background: cardBg }}>
        {loading && !hasLoadedOnce ? (
          <Center py="xl">
            <Loader size="lg" />
          </Center>
        ) : limitedData.length === 0 ? (
          <Center py="xl">
            <Text>{t('stats.noData')}</Text>
          </Center>
        ) : (
          <div style={{ height: Math.max(320, limitedData.length * 32) }}>
            <ResponsiveBar
              data={limitedData}
              keys={['totalPoints']}
              indexBy="entity"
              margin={{ top: 20, right: 60, bottom: 20, left: 180 }}
              layout="horizontal"
              padding={0.3}
              colors={({ data: datum }) =>
                (datum as PointsLeaderDatum).barColor || theme.colors.blue[6]
              }
              enableGridX
              enableGridY={false}
              axisBottom={{
                tickSize: 0,
                tickPadding: 12,
                legend: t('stats.visualizations.pointsLeaders.axisBottom'),
                legendOffset: 40,
                legendPosition: 'middle',
                tickValues: 5,
              }}
              axisLeft={{
                tickSize: 0,
                tickPadding: 10,
                tickValues: limitedData.length > 20 ? 10 : undefined,
                renderTick: ({ textAnchor, textBaseline, value, x, y }) => (
                  <g transform={`translate(${x},${y})`}>
                    <text
                      alignmentBaseline={textBaseline as any}
                      textAnchor={textAnchor as any}
                      dx={-8}
                      style={{
                        fill: isDark ? theme.white : theme.black,
                        fontSize: 12,
                      }}
                    >
                      {truncateLabel(String(value))}
                    </text>
                  </g>
                ),
              }}
              enableLabel={false}
              borderRadius={6}
              layers={[
                'grid',
                'axes',
                'bars',
                ({ bars }) => {
                  return bars.map(bar => {
                    const datum = limitedData.find(item => item.entity === bar.data.indexValue);
                    if (!datum?.imageUrl) return null;

                    return (
                      <image
                        key={`${bar.key}-image`}
                        href={datum.imageUrl}
                        x={bar.x + bar.width + 5}
                        y={bar.y + bar.height / 2 - 16}
                        width={32}
                        height={32}
                        style={{ borderRadius: 4 }}
                      />
                    );
                  });
                },
                'legends',
              ]}
              tooltip={({ indexValue, value }) => {
                const datum = limitedData.find(item => item.entity === indexValue);

                return (
                  <div
                    style={{
                      background: cardBg,
                      color: isDark ? theme.white : theme.black,
                      padding: '8px 12px',
                      borderRadius: 6,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                      minWidth: 200,
                    }}
                  >
                    <div>
                      <strong>{String(indexValue)}</strong>
                    </div>
                    {datum?.artistName && datum.artistName !== datum.entity && (
                      <div>{datum.artistName}</div>
                    )}
                    <div>
                      {t('stats.visualizations.pointsLeaders.tooltipPoints', {
                        count: Number(value),
                      })}
                    </div>
                    <div>
                      {t('stats.visualizations.pointsLeaders.tooltipWeeks', {
                        count: datum?.weeksOnChart ?? 0,
                      })}
                    </div>
                  </div>
                );
              }}
              animate
              motionConfig="stiff"
            />
          </div>
        )}
      </Card>
    </Stack>
  );
};

export default TopPointsLeadersChart;
