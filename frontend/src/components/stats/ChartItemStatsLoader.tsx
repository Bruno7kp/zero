import React from 'react';
import { Text } from '@mantine/core';
import { ChartItemStats } from './ChartItemStats';
// Incremental full stats (peak/sequences/aggregate) updater
import { rebuildFullStats, applyWeekToFullStats } from '../../utils/incrementalFullStats';
import { db } from '../../db/indexedDb';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { useTranslation } from 'react-i18next';

export function ChartItemStatsLoader({ chartId, chartType, entityId, week }: { chartId: string, chartType: string, entityId: string, week?: string }) {
  const [geralStats, setGeralStats] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [entityMeta, setEntityMeta] = React.useState<{ name: string; artistName: string }>({ name: '', artistName: '' });
  const { t } = useTranslation();
  const charts = useSelector((s: RootState) => s.charts.charts);
  // When stats revalidation/incremental requests run, re-run this loader
  const statsRequestId = useSelector((s: RootState) => s.charts.statsRequestId);
  const statsBump = useSelector((s: RootState) => s.charts.statsBump);
  const chart = charts.find((c: any) => String(c.id) === String(chartId));
  const cutoff = React.useMemo(() => {
    if (!chart) return 100; // fallback
    if (chartType === 'artist') return chart.artist_cutoff || 100;
    if (chartType === 'album') return chart.album_cutoff || 100;
    if (chartType === 'track') return chart.music_cutoff || 100;
    return 100;
  }, [chart, chartType]);

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    // Recalcula sempre que cutoff mudar para manter sequences corretas.
    (async () => {
      // Verifica se já existem stats incrementais
      let stats: any = await db.charts_stats.get([chartId, chartType, entityId]);
      const needsVersionUpgrade = stats && stats._running && stats._running.version !== 3;
      const missingChartRun = stats && !Array.isArray(stats.chartRun);
      if (!stats || stats?._needsRebuild || needsVersionUpgrade || missingChartRun) {
        await rebuildFullStats(chartId, chartType, entityId, cutoff);
        stats = await db.charts_stats.get([chartId, chartType, entityId]);
      } else {
        const lastWeek = stats?._running?.lastWeek;
        if (lastWeek) {
          const newer = await db.charts_data
            .where(['chartId','chartType','entityId'])
            .equals([chartId, chartType, entityId])
            .filter(r => r.week > lastWeek)
            .sortBy('week');
          for (const row of newer) {
            await applyWeekToFullStats(row, { cutoff });
          }
          if (newer.length) stats = await db.charts_stats.get([chartId, chartType, entityId]);
        }
      }
      const one = await db.charts_data.where(['chartId','chartType','entityId']).equals([chartId, chartType, entityId]).first();
      if (mounted) {
        setGeralStats(stats);
        setEntityMeta({ name: one?.name || '', artistName: one?.artistName || '' });
      }
    })()
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  // Also rerun whenever a new stats incremental request is triggered (after edits/save)
  }, [chartId, chartType, entityId, cutoff, statsRequestId, statsBump]);

  if (loading || !geralStats) return <Text size="sm">{t('charts.stats.loading')}</Text>;
  return <ChartItemStats stats={geralStats} highlightWeek={week} chartId={chartId} chartType={chartType} entityName={entityMeta.name} entityArtistName={entityMeta.artistName} />;
}
