// src/components/ChartSyncProgress.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Progress, Text, Group, Button, Card, Divider, rem, ThemeIcon } from '@mantine/core';
import { useChartDb } from '../hooks/useChartDb';
import { getWeeklyArtistChart, getWeeklyAlbumChart, getWeeklyTrackChart } from '../services/lastfm';
import { calculateStatsForEntity } from '../utils/calculateStatsForEntity';
import { getClosedChartWeeks } from '../utils/chartWeekUtils';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { useTranslation } from 'react-i18next';
import { IconRefresh } from "@tabler/icons-react";
dayjs.extend(utc);
dayjs.extend(timezone);

interface ChartSyncProgressProps {
  chart: {
    id: number;
    lastfm_username: string;
    start_date: string;
    day_of_week: number;
    timezone: string;
    artist_cutoff: number;
    album_cutoff: number;
    music_cutoff: number;
  };
}

const chartTypes = [
  { type: 'artist', getChart: getWeeklyArtistChart, cutoffKey: 'artist_cutoff' },
  { type: 'album', getChart: getWeeklyAlbumChart, cutoffKey: 'album_cutoff' },
  { type: 'track', getChart: getWeeklyTrackChart, cutoffKey: 'music_cutoff' },
];


export const ChartSyncProgress: React.FC<ChartSyncProgressProps> = ({ chart }) => {
  const { getChartDataByWeek, saveChartData } = useChartDb();
  const [weeks, setWeeks] = useState<string[]>([]);
  const [loadedWeeks, setLoadedWeeks] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  // Calcula as semanas a carregar
  useEffect(() => {
    setWeeks(getClosedChartWeeks(chart.start_date, chart.day_of_week, chart.timezone));
  }, [chart.start_date, chart.day_of_week, chart.timezone]);

  // Conta quantas semanas já estão salvas no IndexedDB para esse chart
  const countLoadedWeeks = useCallback(async () => {
    let count = 0;
    for (const week of weeks) {
      // Só precisa checar um tipo, pois todos são salvos juntos
      const data = await getChartDataByWeek(`${chart.id}`, 'artist', week);
      if (data && data.length > 0) count++;
    }
    setLoadedWeeks(count);
  }, [weeks, chart.id, getChartDataByWeek]);

  useEffect(() => {
    if (weeks.length > 0) {
      countLoadedWeeks();
    }
  }, [weeks, countLoadedWeeks]);

  // Função para carregar semanas faltantes
  const handleSync = async () => {
    setLoading(true);
    setError(null);
    try {
      for (let i = 0; i < weeks.length; i++) {
        const week = weeks[i];
        // Verifica se já existe
        const already = await getChartDataByWeek(`${chart.id}`, 'artist', week);
        if (already && already.length > 0) {
          setLoadedWeeks(i + 1);
          continue;
        }
        // Para cada tipo de chart
        for (const { type, getChart, cutoffKey } of chartTypes) {
          const from = dayjs.tz(week, chart.timezone).unix().toString();
          const to = dayjs.tz(week, chart.timezone).add(7, 'day').unix().toString();
          const items = await getChart(chart.lastfm_username, from, to);
          const cutoff = chart[cutoffKey as keyof typeof chart] as number;
          const enriched = items.slice(0, cutoff).map((item) => ({
            chartId: `${chart.id}`,
            chartType: type,
            entityId: `${type}-${item.name}-${item.artist || ''}`,
            name: item.name,
            artistName: item.artist || '',
            rank: item.rank,
            plays: item.playcount,
            week,
          }));
          await saveChartData(enriched);
          // Atualiza stats para cada entidade inserida
          for (const item of enriched) {
            await calculateStatsForEntity(
              item.chartId,
              item.chartType,
              item.entityId,
              cutoff
            );
          }
        }
        setLoadedWeeks(i + 1);
      }
    } catch (e: any) {
      setError(e.message || 'Erro ao sincronizar');
    } finally {
      setLoading(false);
    }
  };

  return (
      <Card shadow="md" p="md">
          <Group>
              <ThemeIcon variant="light" size="md">
                  <IconRefresh style={{ width: rem(20), height: rem(20) }} />
              </ThemeIcon>
              <Text fw={600} size="lg">{t('charts.sync')}</Text>
          </Group>
          <Divider variant="dashed" size="sm" my="xs"/>
          <Group justify="space-between" align="center" mb="xs">
              <Text size="md">{t('charts.syncStatus', { loadedWeeks, weeks: weeks.length })}</Text>
              <Button onClick={handleSync} loading={loading} disabled={loadedWeeks === weeks.length} size="xs">
                  {loadedWeeks === weeks.length ? t('charts.synced') : t('charts.toSync')}
              </Button>
          </Group>
          <Progress value={weeks.length === 0 ? 0 : (loadedWeeks / weeks.length) * 100} mb="xs" />
          {error && <Text c="red" size="sm">{error}</Text>}
    </Card>
  );
};
