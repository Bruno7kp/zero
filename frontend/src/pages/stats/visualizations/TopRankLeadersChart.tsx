import React from 'react';
import {
  Card,
  Stack,
  Loader,
  Center,
  Text,
  Select,
  NumberInput,
  Flex,
  useMantineTheme,
  useComputedColorScheme,
  Image,
  Group,
} from '@mantine/core';
import { ResponsiveBar } from '@nivo/bar';
import type { BarDatum } from '@nivo/bar';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import StatsFilters from '../../../components/stats/StatsFilters';
import { useStatsPreferences } from '../../../hooks/useStatsPreferences';
import { getTimesAtRank, getYearRange } from '../../../utils/statsQueries';
import { getCardBackgroundByMode, type ThemeMode } from '../../../theme/modes';
import { fetchSpotifyImagesBatch } from '../../../utils/spotifyImageLoader';
import { getColorForName } from '../../../utils/colorHash';

interface RankLeaderDatum extends BarDatum {
  entity: string;
  artistName: string;
  count: number;
  entityId: string;
  imageUrl: string;
  barColor: string;
}

const LIMIT_OPTIONS = [5, 10, 15, 20];

const TopRankLeadersChart: React.FC = () => {
  const { t } = useTranslation();
  const theme = useMantineTheme();
  const computedColorScheme = useComputedColorScheme('dark');
  const isDark = computedColorScheme === 'dark';
  const { preferences, updatePreference } = useStatsPreferences();

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
  const [rank, setRank] = React.useState<number>(1);
  const [limit, setLimit] = React.useState<number>(10);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [data, setData] = React.useState<RankLeaderDatum[]>([]);

  const cutoff = React.useMemo(() => {
    if (!chart) return 100;
    if (type === 'album') return chart.album_cutoff || 100;
    if (type === 'artist') return chart.artist_cutoff || 100;
    return chart.music_cutoff || 100;
  }, [chart, type]);

  React.useEffect(() => {
    if (!chart) return;

    let mounted = true;

    const loadRange = async () => {
      try {
        const range = await getYearRange(String(chart.id), type);
        if (mounted) setYearRange(range);
      } catch (error) {
        console.warn('[visualizations] failed to compute year range', error);
      }
    };

    loadRange();

    return () => {
      mounted = false;
    };
  }, [chart, type]);

  React.useEffect(() => {
    if (!chart) return;

    let mounted = true;

    const loadData = async () => {
      setLoading(true);
      try {
        const results = await getTimesAtRank({
          chartId: String(chart.id),
          chartType: type,
          rank,
          year: year === 'all' ? undefined : year,
        });

        if (!mounted) return;
        const primarySlice = results.slice(0, 40);
        const images = await fetchSpotifyImagesBatch(
          primarySlice.map(item => ({
            entityId: item.entityId,
            name: item.name,
            artistName: item.artistName,
            type,
          }))
        );

        const normalized: RankLeaderDatum[] = results.map(item => ({
          entity: item.name,
          artistName: item.artistName ?? '',
          count: item.count,
          entityId: item.entityId,
          imageUrl: images[item.entityId] ?? '',
          barColor: getColorForName(item.artistName || item.name || item.entityId),
        }));
        setData(normalized);
      } catch (error) {
        console.error('[visualizations] failed to load rank leaders', error);
        if (mounted) setData([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [chart, type, rank, year]);

  const limitedData = React.useMemo(
    () => data.slice(0, limit).map(item => ({ ...item })),
    [data, limit]
  );

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
        type={type}
        onTypeChange={value => {
          if (value === 'album' || value === 'track' || value === 'artist') {
            setType(value);
          }
        }}
        showImages={preferences.showImages}
        onToggleImages={value => updatePreference('showImages', value)}
        containerSize={preferences.containerSize}
        onContainerSizeChange={value => updatePreference('containerSize', value)}
        fontSize={preferences.fontSize}
        onFontSizeChange={value => updatePreference('fontSize', value)}
        yearRange={yearRange || undefined}
        showSalesToggle={false}
        showPeakOnlyToggle={false}
        showImageToggle={false}
        showArtistColumnToggle={false}
        showWeekColumnToggle={false}
        showPositionColumnToggle={false}
        showFontSizeToggle
        showContainerSizeToggle
        customFilters={
          <Flex gap="sm" wrap="wrap">
            <NumberInput
              label={t('stats.visualizations.rankLeaders.rankLabel')}
              value={rank}
              min={1}
              max={cutoff}
              onChange={value => {
                if (typeof value === 'number' && !Number.isNaN(value)) {
                  setRank(Math.min(Math.max(value, 1), cutoff));
                }
              }}
              size="sm"
              w={120}
            />
            <Select
              label={t('stats.visualizations.rankLeaders.limitLabel')}
              data={LIMIT_OPTIONS.map(option => ({
                label: t('stats.visualizations.rankLeaders.limitOption', { count: option }),
                value: String(option),
              }))}
              value={String(limit)}
              onChange={value => {
                if (value) setLimit(Number(value));
              }}
              size="sm"
              w={160}
            />
          </Flex>
        }
      />

      <Card withBorder p="lg" style={{ background: cardBg }}>
        {loading ? (
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
              keys={['count']}
              indexBy="entity"
              margin={{ top: 20, right: 20, bottom: 20, left: 180 }}
              layout="horizontal"
              padding={0.3}
              colors={({ data: datum }) =>
                (datum as RankLeaderDatum).barColor || theme.colors.blue[6]
              }
              enableGridX
              enableGridY={false}
              axisBottom={{
                tickSize: 0,
                tickPadding: 12,
                legend: t('stats.visualizations.rankLeaders.axisBottom'),
                legendOffset: 40,
                legendPosition: 'middle',
              }}
              axisLeft={{
                tickSize: 0,
                tickPadding: 6,
              }}
              enableLabel
              labelTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
              tooltip={({ indexValue, value, color }) => {
                const datum = limitedData.find(item => item.entity === indexValue);

                return (
                  <div
                    style={{
                      background: cardBg,
                      color: isDark ? theme.white : theme.black,
                      padding: '8px 12px',
                      borderRadius: 6,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
                      minWidth: 180,
                    }}
                  >
                    <Group gap="sm" wrap="nowrap" align="flex-start">
                      {datum?.imageUrl ? (
                        <Image
                          src={datum.imageUrl}
                          alt={String(indexValue)}
                          width={36}
                          height={36}
                          radius="sm"
                          style={{ flexShrink: 0 }}
                        />
                      ) : null}
                      <div style={{ flex: 1 }}>
                        <strong style={{ color: datum?.barColor || color }}>
                          {String(indexValue)}
                        </strong>
                        {datum?.artistName && datum.artistName !== datum.entity && (
                          <div>{datum.artistName}</div>
                        )}
                        <div>
                          {t('stats.visualizations.rankLeaders.tooltipWeeks', {
                            count: Number(value),
                          })}
                        </div>
                      </div>
                    </Group>
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

export default TopRankLeadersChart;
