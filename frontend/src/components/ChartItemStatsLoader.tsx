import React from 'react';
import { Text } from '@mantine/core';
import { ChartItemStats } from './ChartItemStats';
import { calculateStatsForEntity } from '../utils/calculateStatsForEntity';
import { db } from '../db/indexedDb';

export function ChartItemStatsLoader({ chartId, chartType, entityId, week }: { chartId: string, chartType: string, entityId: string, week?: string }) {
  const [geralStats, setGeralStats] = React.useState<any | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    setLoading(true);
    calculateStatsForEntity(chartId, chartType, entityId, 100)
      .then(async () => {
        // Agora busca do IndexedDB
        const stats = await db.charts_stats.get([chartId, chartType, entityId]);
        if (mounted) setGeralStats(stats);
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [chartId, chartType, entityId]);

  if (loading || !geralStats) return <Text size="sm">Carregando stats gerais...</Text>;
  return <ChartItemStats stats={geralStats} highlightWeek={week} />;
}
