import React from 'react';
import { Card, Group, Text, ThemeIcon, Stack, Tooltip, Progress, ActionIcon, Loader } from '@mantine/core';
import { IconRefresh } from '@tabler/icons-react';
import MetalVinylDisc from './MetalVinylDisc';
import { useTranslation } from 'react-i18next';
import { computeCertification, type CertificationResult } from '../utils/certification';
import { formatNumber } from '../utils/format';
import { useOfflineStatus } from '../hooks/useOfflineStatus';

interface Props {
    chart: any;
    chartType: 'album' | 'track';
    totals: { totalPoints?: number; totalPlays?: number };
    entity: { name: string; artistName: string };
    username?: string;
    dayOfWeek?: number; // next calculation day (chart.day_of_week?)
}

export const CertificationBadge: React.FC<Props> = ({ chart, chartType, totals, entity, username }) => {
    const { t } = useTranslation();
    const { isOnline: online } = useOfflineStatus();
    const [result, setResult] = React.useState<CertificationResult | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [forceReloadToken, setForceReloadToken] = React.useState(0);
    const lastForceTokenRef = React.useRef(0);
    const playsWeight = chartType === 'track' ? (chart.music_plays_weight || 0) : (chart.album_plays_weight || 0);

    // Memoize only the primitive values that actually affect the computation to avoid effect loops
    const computeDeps = React.useMemo(() => ({
        chartType,
        username: username || '',
        online,
        dayOfWeek: chart?.day_of_week ?? null,
        pointsWeight: chartType === 'track' ? (chart.music_points_weight || 0) : (chart.album_points_weight || 0),
        playsWeight: chartType === 'track' ? (chart.music_plays_weight || 0) : (chart.album_plays_weight || 0),
        gold: chartType === 'track' ? (chart.music_gold_value || 0) : (chart.album_gold_value || 0),
        platinum: chartType === 'track' ? (chart.music_platinum_value || 0) : (chart.album_platinum_value || 0),
        diamond: chartType === 'track' ? (chart.music_diamond_value || 0) : (chart.album_diamond_value || 0),
        totalPoints: totals?.totalPoints || 0,
        totalPlays: totals?.totalPlays || 0,
        entityName: entity?.name || '',
        artistName: entity?.artistName || '',
    }), [
        chartType,
        username,
        online,
        chart?.day_of_week,
        chart?.music_points_weight,
        chart?.album_points_weight,
        chart?.music_plays_weight,
        chart?.album_plays_weight,
        chart?.music_gold_value,
        chart?.album_gold_value,
        chart?.music_platinum_value,
        chart?.album_platinum_value,
        chart?.music_diamond_value,
        chart?.album_diamond_value,
        totals?.totalPoints,
        totals?.totalPlays,
        entity?.name,
        entity?.artistName,
    ]);

    React.useEffect(() => {
        let mounted = true;
        const isForce = forceReloadToken !== lastForceTokenRef.current;
        lastForceTokenRef.current = forceReloadToken;
        setLoading(true);
        computeCertification({
            chart,
            chartType,
            totals,
            entity,
            username,
            offline: !online,
            nextWeekDay: chart.day_of_week,
            force: isForce,
        }).then(r => { if (mounted) setResult(r); }).finally(() => { if (mounted) setLoading(false); });
        return () => { mounted = false; };
    }, [computeDeps, forceReloadToken]);

    const colorMap: Record<string, string> = {
        none: 'gray.4',
        gold: 'yellow',
        platinum: 'gray.4',
        diamond: 'blue'
    };

    if (!result) {
        if (!online && playsWeight > 0) {
            return (
                <Card p="sm" withBorder>
                    <Text size="xs" c="red" ta="center">{t('charts.stats.needOnlineForCert')}</Text>
                </Card>
            );
        }
        if (playsWeight > 0 && !username) {
            return (
                <Card p="sm" withBorder>
                    <Text size="xs" c="red" ta="center">Last.fm username ausente no chart</Text>
                </Card>
            );
        }
        return <Card p="sm" withBorder><Text size="xs" ta="center">{loading ? t('charts.stats.loading') : t('charts.stats.noData')}</Text></Card>;
    }

    const { level, multiplier, remainingToNext, nextTarget, totalFormula, nextType, nextLevel, nextMultiple } = result;
    // Hide component entirely if all thresholds configured as 0 (no certification logic set)
    const gold = chartType === 'track' ? (chart.music_gold_value || 0) : (chart.album_gold_value || 0);
    const platinum = chartType === 'track' ? (chart.music_platinum_value || 0) : (chart.album_platinum_value || 0);
    const diamond = chartType === 'track' ? (chart.music_diamond_value || 0) : (chart.album_diamond_value || 0);
    if (gold === 0 && platinum === 0 && diamond === 0) return null;
    const color = colorMap[level];
    const formulaName = chart.formula_name || 'Sales';

    const nextPct = nextTarget ? Math.min(100, (totalFormula / nextTarget) * 100) : 100;

    return (
        <Card p="sm" style={{ backgroundColor: 'transparent' }} shadow="none">
            <Group wrap="nowrap" align="center" gap="sm">
                <ThemeIcon size={52} radius="xl" variant="transparent">
                    {/* Always show a vinyl disc; use neutral black when there's no certification */}
                    <MetalVinylDisc level={(level as any) || 'none'} size={50} />
                </ThemeIcon>
                <Stack gap={2} style={{ flex: 1 }}>
                    <Text fw={700} size="sm" tt="uppercase">
                        {level !== 'none' ? `${multiplier > 1 ? multiplier + 'x ' : ''}${t('values.' + level)}` : t('charts.stats.noCert')}
                    </Text>
                    <Text size="xs">{t('charts.stats.currentValue', { value: formatNumber(Math.floor(totalFormula)), unit: formulaName })}</Text>
                    {remainingToNext !== null && nextTarget !== null && (
                        <Tooltip label={
                            nextType === 'same' && nextMultiple && nextLevel
                                ? t('charts.stats.nextAt', { value: `${nextMultiple}x ${t('values.' + nextLevel)}` })
                                : nextLevel
                                    ? t('charts.stats.nextAt', { value: t('values.' + nextLevel) })
                                    : t('charts.stats.nextAt', { value: formatNumber(Math.floor(nextTarget)) })
                        }>
                            <div>
                                <Progress value={nextPct} size="xs" color={color} radius="xl" />
                                <Text size="10px" mt={3}>
                                    {nextType === 'same' && nextMultiple && nextLevel
                                        ? t('charts.stats.remainingToSame', { value: formatNumber(Math.max(0, Math.ceil(remainingToNext))), multiple: nextMultiple, level: t('values.' + nextLevel) })
                                        : nextLevel
                                            ? t('charts.stats.remainingToHigher', { value: formatNumber(Math.max(0, Math.ceil(remainingToNext))), level: t('values.' + nextLevel) })
                                            : t('charts.stats.remaining', { value: formatNumber(Math.max(0, Math.ceil(remainingToNext))) })}
                                </Text>
                            </div>
                        </Tooltip>
                    )}
                </Stack>
                <Tooltip label={t('charts.stats.reload')}>
                    <ActionIcon
                        variant="subtle"
                        size="sm"
                        onClick={() => setForceReloadToken(v => v + 1)}
                        aria-label="reload"
                        disabled={!online || loading}
                    >
                        {loading ? <Loader size="xs" /> : <IconRefresh size={14} />}
                    </ActionIcon>
                </Tooltip>
            </Group>
        </Card>
    );
};
