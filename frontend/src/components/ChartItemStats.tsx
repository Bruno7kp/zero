import React from 'react';
import { Paper, Grid, Text, Card, Divider, Group, ThemeIcon, rem } from '@mantine/core';
import { CertificationBadge } from './CertificationBadge';
import { getUserPlaycountCached } from '../utils/certification';
import { useOfflineStatus } from '../hooks/useOfflineStatus';
import { ChartRun } from './ChartRun';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { IconCalendarCheck, IconCalendarWeek, IconChartBar, IconTimeline } from '@tabler/icons-react';

export interface ChartItemStatsProps {
    stats: any;
    highlightWeek?: string;
    chartId: string;
    chartType: string; // artist | album | track
    entityName?: string;
    entityArtistName?: string;
    full?: boolean;
}

export const ChartItemStats: React.FC<ChartItemStatsProps> = ({ stats, highlightWeek, chartId, chartType, entityName, entityArtistName, full = false }) => {
    const { t } = useTranslation();
    const charts = useSelector((s: RootState) => s.charts.charts);
    const chart = charts.find((c: any) => String(c.id) === String(chartId));
    // Defensive: handle both old and new stats shape
    const totals = stats.totals || {};
    const sequences = stats.sequences || {};
    const peak = stats.peak || {};
    // Try to get chartRun from stats.chartRun or stats.run or stats.chart_run
    const chartRun = stats.chartRun || stats.run || stats.chart_run || [];
    let cutoff: number | undefined;
    if (chart) {
        if (chartType === 'artist') cutoff = chart.artist_cutoff;
        else if (chartType === 'album') cutoff = chart.album_cutoff;
        else if (chartType === 'track') cutoff = chart.music_cutoff;
    }
    return (
        <Paper p="md" radius={0}>
            <Grid justify="center" mb="md">
                <Grid.Col span={{ base: 12 }}>
                    <Group justify="center" gap={10} mb="md">
                        <ThemeIcon variant="light" size="md">
                            <IconTimeline style={{ width: rem(20), height: rem(20) }} />
                        </ThemeIcon>
                        <Text fw={800} mb={2} size="xs" ta="center" tt="uppercase">{t('charts.stats.run')}</Text>
                    </Group>
                    <ChartRun run={chartRun} highlightWeek={highlightWeek} chartType={chartType} />
                </Grid.Col>
            </Grid>
            <Grid justify="center" mb="md">
                <Grid.Col span={{ base: 12 }}>
                    <Group justify="center" gap={10}>
                        <ThemeIcon variant="light" size="md">
                            <IconChartBar style={{ width: rem(20), height: rem(20) }} />
                        </ThemeIcon>
                        <Text fw={800} mb={2} size="xs" ta="center" tt="uppercase">{t('charts.stats.title')}</Text>
                    </Group>
                </Grid.Col>
                {['artist','album','track'].includes(chartType) && (
                    <LastfmPlaysBox
                        chart={chart}
                        chartType={chartType as 'artist'|'album'|'track'}
                        entityName={chartType === 'artist' ? '' : (entityName || stats.name || stats.entityName || '')}
                        artistName={chartType === 'artist' ? (entityName || stats.name || stats.entityName || '') : (entityArtistName || stats.artistName || stats.artist || '')}
                    />
                )}
                <StatBox label={t('charts.stats.points')} value={totals.totalPoints ?? '-'} />
                {['album', 'track'].includes(chartType) && (() => {
                    const gold = chartType === 'track' ? (chart?.music_gold_value || 0) : (chart?.album_gold_value || 0);
                    const platinum = chartType === 'track' ? (chart?.music_platinum_value || 0) : (chart?.album_platinum_value || 0);
                    const diamond = chartType === 'track' ? (chart?.music_diamond_value || 0) : (chart?.album_diamond_value || 0);
                    if (gold === 0 && platinum === 0 && diamond === 0) return null;
                    return (
                        <Grid.Col span={{ base: 12, sm: 4 }}>
                            <CertificationBadge
                                chart={chart}
                                chartType={chartType as any}
                                totals={totals}
                                entity={{ name: entityName || stats.name || stats.entityName || '', artistName: entityArtistName || stats.artistName || stats.artist || '' }}
                                username={chart?.lastfm_username}
                                dayOfWeek={chart?.day_of_week}
                            />
                        </Grid.Col>
                    );
                })()}
            </Grid>
            <Grid mb="md" justify="center">
                <Grid.Col span={{ base: 12 }}>
                    <Group justify="center" gap={10}>
                        <ThemeIcon variant="light" size="md">
                            <IconCalendarWeek style={{ width: rem(20), height: rem(20) }} />
                        </ThemeIcon>
                        <Text fw={800} mb={2} size="xs" ta="center" tt="uppercase">{t('charts.stats.weeksOnChart')}</Text>
                    </Group>
                </Grid.Col>
                <StatBox label={t('charts.stats.top1')} value={peak.position && parseInt(peak.position) === 1 ? peak.weeksAtPeak : 0} />
                <StatBox label={t('charts.stats.top5')} value={totals.top5 ?? 0} />
                <StatBox label={t('charts.stats.top10')} value={totals.top10 ?? 0} />
                <StatBox label={cutoff ? t('charts.stats.topX', { x: cutoff }) : t('charts.stats.topCutoff')} value={totals.withinCutoff ?? 0} />
            </Grid>
            {full && (
                <Grid justify="center">
                    <Grid.Col span={{ base: 12 }}>
                        <Group justify="center" gap={10}>
                            <ThemeIcon variant="light" size="md">
                                <IconCalendarCheck style={{ width: rem(20), height: rem(20) }} />
                            </ThemeIcon>
                            <Text fw={800} mb={2} size="xs" ta="center" tt="uppercase">{t('charts.stats.sequences')}</Text>
                        </Group>
                    </Grid.Col>
                    <StatBox label={t('charts.stats.top1')} value={sequences.rank1 ?? 0} />
                    <StatBox label={t('charts.stats.top5')} value={sequences.top5 ?? 0} />
                    <StatBox label={t('charts.stats.top10')} value={sequences.top10 ?? 0} />
                    <StatBox label={cutoff ? t('charts.stats.topX', { x: cutoff }) : t('charts.stats.topCutoff')} value={sequences.withinCutoff ?? 0} />
                </Grid>
            )}
        </Paper>
    );
};

interface StatBoxProps {
    label: string;
    value: number;
    sub?: string;
    color?: string; // optional accent color for value (defaults to blue)
}

const StatBox: React.FC<StatBoxProps> = ({ label, value, sub, color }) => (
    <Grid.Col span={{ base: 4, sm: 2 }}>
        <Card p="sm" withBorder style={{ textAlign: 'center' }}>
            <Text fw={700} tt="uppercase" size="xs" ta="center">{label}</Text>
            <Divider my="xs" variant="dashed" size="sm" />
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 4 }}>
                <Text fw={700} size="xl" c={color || 'blue'} style={{ lineHeight: 1 }}>{value}</Text>
                {sub && <Text size="xs" c="dimmed" style={{ lineHeight: 1 }}>{sub}</Text>}
            </div>
        </Card>
    </Grid.Col>
);

// Lazy Last.fm plays box: fetches user playcount on expand/modal only, de-duplicated and cached
function LastfmPlaysBox({ chart, chartType, artistName, entityName }: { chart: any; chartType: 'artist'|'album'|'track'; artistName: string; entityName: string }) {
    const { isOnline } = useOfflineStatus();
    const [plays, setPlays] = React.useState<number | null>(null);
    const { t } = useTranslation();

    React.useEffect(() => {
        const username = chart?.lastfm_username as string | undefined;
        let canceled = false;
        // Fetch immediately; StrictMode will call effect twice (mount->cleanup->mount), but this is safe
        getUserPlaycountCached({
            username,
            artistName,
            entityName,
            chartType,
            offline: !isOnline,
            nextWeekDay: chart?.day_of_week,
        })
            .then(v => { if (!canceled) setPlays(v); })
            .catch(() => { if (!canceled) setPlays(0); });
        return () => { canceled = true; };
    }, [chart?.lastfm_username, chart?.day_of_week, artistName, entityName, chartType, isOnline]);

    return (
        <StatBox
            label={t('charts.stats.plays', { defaultValue: 'Plays' })}
            value={plays == null ? ('…' as any) : plays}
            sub={plays == null ? undefined : undefined}
            color={undefined}
        />
    );
}
