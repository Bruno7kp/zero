import React from 'react';
import { Text } from '@mantine/core';
import { ChartItemStats } from './ChartItemStats';
import { calculateStatsForEntity } from '../utils/calculateStatsForEntity';
import { db } from '../db/indexedDb';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { useTranslation } from 'react-i18next';

export function ChartItemStatsLoader({ chartId, chartType, entityId, week }: { chartId: string, chartType: string, entityId: string, week?: string }) {
  const [geralStats, setGeralStats] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [entityMeta, setEntityMeta] = React.useState<{ name: string; artistName: string }>({ name: '', artistName: '' });
  const { t } = useTranslation();
  const charts = useSelector((s: RootState) => s.charts.charts);
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
    calculateStatsForEntity(chartId, chartType, entityId, cutoff)
      .then(async () => {
        const stats = await db.charts_stats.get([chartId, chartType, entityId]);
        const one = await db.charts_data.where(['chartId','chartType','entityId']).equals([chartId, chartType, entityId]).first();
        if (mounted) {
          setGeralStats(stats);
          setEntityMeta({ name: one?.name || '', artistName: one?.artistName || '' });
        }
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [chartId, chartType, entityId, cutoff]);

  if (loading || !geralStats) return <Text size="sm">{t('charts.stats.loading')}</Text>;
  return <ChartItemStats stats={geralStats} highlightWeek={week} chartId={chartId} chartType={chartType} entityName={entityMeta.name} entityArtistName={entityMeta.artistName} />;
}
