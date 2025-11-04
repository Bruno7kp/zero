// src/components/chartPage/ChartSyncProgress.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  Text,
  Group,
  Button,
  Card,
  Divider,
  rem,
  ThemeIcon,
  Alert,
  Tooltip,
  Badge,
  useMantineTheme,
} from '@mantine/core';
import { useChartDb } from '../../hooks/useChartDb';
import {
  getWeeklyArtistChart,
  getWeeklyAlbumChart,
  getWeeklyTrackChart,
} from '../../services/lastfm';
import { applyBatchWeeks } from '../../utils/incrementalFullStats';
import { getClosedChartWeeks } from '../../utils/chartWeekUtils';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { useTranslation } from 'react-i18next';
import { IconRefresh, IconAlertCircle } from '@tabler/icons-react';
import { useOfflineStatus } from '../../hooks/useOfflineStatus';
import { useSelector } from 'react-redux';
import { getCardBackgroundByMode, type ThemeMode } from '../../theme/modes';
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
  onSyncComplete?: () => void;
}

const chartTypes = [
  { type: 'artist', getChart: getWeeklyArtistChart, cutoffKey: 'artist_cutoff' },
  { type: 'album', getChart: getWeeklyAlbumChart, cutoffKey: 'album_cutoff' },
  { type: 'track', getChart: getWeeklyTrackChart, cutoffKey: 'music_cutoff' },
];

export const ChartSyncProgress: React.FC<ChartSyncProgressProps> = ({ chart, onSyncComplete }) => {
  const {
    getChartDataByWeek,
    saveChartData,
    deleteChartDataByWeek,
    markWeekComplete,
    isWeekMarkedComplete,
    markWeekPartial,
  } = useChartDb();
  const [weeks, setWeeks] = useState<string[]>([]);
  const [loadedWeeks, setLoadedWeeks] = useState<number>(0); // complete weeks
  const [partialWeeks, setPartialWeeks] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const { isOnline } = useOfflineStatus();
  const theme = useMantineTheme();
  const themeMode = useSelector((s: any) => (s.theme?.value as ThemeMode) || 'dark');

  // Calcula as semanas a carregar
  useEffect(() => {
    setWeeks(getClosedChartWeeks(chart.start_date, chart.day_of_week, chart.timezone));
  }, [chart.start_date, chart.day_of_week, chart.timezone]);

  // Conta quantas semanas já estão salvas no IndexedDB para esse chart
  // Verifica se semana está completa usando tabela de marcação; fallback legado: todos os tipos possuem algum registro
  const isWeekComplete = useCallback(
    async (week: string) => {
      if (await isWeekMarkedComplete(`${chart.id}`, week)) return true;
      // Fallback legado: se os 3 tipos têm dados, marca como completo
      for (const { type } of chartTypes) {
        const data = await getChartDataByWeek(`${chart.id}`, type, week);
        if (!data || data.length === 0) return false;
      }
      await markWeekComplete(`${chart.id}`, week);
      return true;
    },
    [chart.id, getChartDataByWeek, isWeekMarkedComplete, markWeekComplete]
  );

  const scanWeekStatuses = useCallback(async () => {
    let complete = 0;
    let partial = 0;
    for (const week of weeks) {
      // quick check by status table
      const markedComplete = await isWeekMarkedComplete(`${chart.id}`, week);
      if (markedComplete) {
        complete++;
        continue;
      }
      // check presence of data for any type
      let typesWithData = 0;
      for (const { type } of chartTypes) {
        const data = await getChartDataByWeek(`${chart.id}`, type, week);
        if (data && data.length > 0) typesWithData++;
      }
      if (typesWithData === 0) continue; // untouched
      if (typesWithData === chartTypes.length) {
        // legacy fully saved but not marked
        await markWeekComplete(`${chart.id}`, week);
        complete++;
      } else {
        await markWeekPartial(`${chart.id}`, week);
        partial++;
      }
    }
    setLoadedWeeks(complete);
    setPartialWeeks(partial);
  }, [
    weeks,
    chart.id,
    getChartDataByWeek,
    isWeekMarkedComplete,
    markWeekComplete,
    markWeekPartial,
  ]);

  useEffect(() => {
    if (weeks.length > 0) {
      scanWeekStatuses();
    }
  }, [weeks, scanWeekStatuses]);

  // Função para carregar semanas faltantes
  const handleSync = async () => {
    if (!isOnline) return; // proteção extra
    setLoading(true);
    setError(null);
    try {
      // Começa a partir do estado atual (se já tinha semanas carregadas previamente)
      // Recalcula início para evitar divergência (caso loadedWeeks esteja inflado por versões antigas)
      await scanWeekStatuses();
      let successCount = 0; // vamos controlar manualmente nesta execução
      const alreadyCompleteCache: Record<string, boolean> = {};
      for (const week of weeks) {
        const complete = await isWeekComplete(week);
        alreadyCompleteCache[week] = complete;
        if (complete) successCount++;
      }
      setLoadedWeeks(successCount);
      for (let i = 0; i < weeks.length; i++) {
        const week = weeks[i];
        if (alreadyCompleteCache[week]) {
          continue; // já completa
        }

        // Marca como parcial antes de iniciar fetch (para mostrar progresso granular)
        await markWeekPartial(`${chart.id}`, week);
        setPartialWeeks(p => p + 1);

        // Se existe parcialmente (algum tipo salvo e outro não), apaga para refazer atômico
        for (const { type } of chartTypes) {
          const existing = await getChartDataByWeek(`${chart.id}`, type, week);
          if (existing && existing.length > 0) {
            await deleteChartDataByWeek(`${chart.id}`, type, week);
          }
        }

        // Busca os três tipos primeiro (sem salvar) para garantir atomicidade
        const pendingResults: Array<{ type: string; cutoff: number; enriched: any[] }> = [];
        let failed = false;
        for (const { type, getChart, cutoffKey } of chartTypes) {
          try {
            const from = dayjs.tz(week, chart.timezone).unix().toString();
            const to = dayjs.tz(week, chart.timezone).add(7, 'day').unix().toString();
            const cutoff = chart[cutoffKey as keyof typeof chart] as number;
            const limit = cutoff + 10;
            const items = await getChart(chart.lastfm_username, from, to, limit);
            const enriched = items.slice(0, cutoff).map(item => ({
              chartId: `${chart.id}`,
              chartType: type,
              entityId: `${type}-${item.name}-${item.artist || ''}`,
              name: item.name,
              artistName: item.artist || '',
              rank: item.rank,
              plays: item.playcount,
              week,
            }));
            pendingResults.push({ type, cutoff, enriched });
          } catch (err: any) {
            failed = true;
            // Classifica o erro para tradução adequada
            const key = 'errors.lastfm.weekFetchFailed';
            let specific: string | undefined;
            const msg: string = err?.message || '';
            if (
              msg.includes('[LASTFM][CODE:29]') ||
              msg.includes('rate') ||
              msg.toLowerCase().includes('limit')
            ) {
              specific = t('errors.lastfm.rateLimit');
            } else if (msg.includes('[LASTFM][CODE:6]')) {
              specific = t('errors.lastfm.userNotFound');
            } else if (msg.includes('[LASTFM][HTTP:429]')) {
              specific = t('errors.lastfm.rateLimit');
            } else if (
              msg.toLowerCase().includes('network') ||
              msg.toLowerCase().includes('fetch')
            ) {
              specific = t('errors.lastfm.network');
            } else {
              specific = t('errors.lastfm.unknown');
            }
            setError(`${t(key, { week })} ${specific ? '— ' + specific : ''}`);
            break;
          }
        }

        if (failed) {
          // Para o loop para que o usuário possa retentar a partir desta semana
          break;
        }

        // Todas as três requisições deram certo: salvar e calcular stats
        // Salva dados e aplica stats incrementais em lote por tipo
        for (const result of pendingResults) {
          await saveChartData(result.enriched);
          await applyBatchWeeks(result.enriched, result.cutoff);
        }
        await markWeekComplete(`${chart.id}`, week);
        setPartialWeeks(p => (p > 0 ? p - 1 : 0));
        successCount++;
        setLoadedWeeks(successCount);
      }

      // Se não houve erro e todas as semanas foram carregadas, dispara callback
      if (!error) {
        const finalCount = await (async () => {
          let c = 0;
          for (const w of weeks) {
            if (await isWeekComplete(w)) c++;
          }
          return c;
        })();
        setLoadedWeeks(finalCount);
        if (finalCount === weeks.length) onSyncComplete?.();
      }
    } catch (e: any) {
      setError(e.message || 'Erro ao sincronizar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card shadow="md" p="md" style={{ background: getCardBackgroundByMode(theme, themeMode) }}>
      <Group justify="space-between" align="center">
        <Group>
          <ThemeIcon variant="light" size="md">
            <IconRefresh style={{ width: rem(20), height: rem(20) }} />
          </ThemeIcon>
          <Text fw={600} size="lg">
            {t('charts.sync')}
          </Text>
        </Group>
      </Group>
      <Divider variant="dashed" size="sm" my="xs" />
      <Group justify="space-between" align="center" mb="xs">
        <Group gap="xs">
          <Text size="md">{t('charts.syncStatus', { loadedWeeks, weeks: weeks.length })}</Text>
          {weeks.length > 0 && loadedWeeks < weeks.length && (
            <Tooltip label={t('charts.toSync')}>
              <Badge variant="light" color="grape" size="sm">
                {loadedWeeks}/{weeks.length}
              </Badge>
            </Tooltip>
          )}
        </Group>
        <Button
          onClick={handleSync}
          loading={loading}
          disabled={!isOnline || loadedWeeks === weeks.length}
          size="xs"
          variant={!isOnline ? 'outline' : 'filled'}
        >
          {loadedWeeks === weeks.length ? t('charts.synced') : t('charts.toSync')}
        </Button>
      </Group>
      {/* Segmented progress bar manually composed */}
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: rem(14),
          borderRadius: 6,
          overflow: 'hidden',
          marginBottom: rem(6),
          background: 'var(--mantine-color-dark-3)',
        }}
      >
        {weeks.length > 0 && (
          <>
            {loadedWeeks > 0 && (
              <div
                style={{
                  width: `${(loadedWeeks / weeks.length) * 100}%`,
                  background: 'var(--mantine-color-green-6)',
                  transition: 'width 200ms',
                }}
              />
            )}
            {partialWeeks > 0 && (
              <div
                style={{
                  width: `${(partialWeeks / weeks.length) * 100}%`,
                  background: 'var(--mantine-color-yellow-6)',
                  transition: 'width 200ms',
                }}
              />
            )}
            {weeks.length - loadedWeeks - partialWeeks > 0 && (
              <div
                style={{
                  width: `${((weeks.length - loadedWeeks - partialWeeks) / weeks.length) * 100}%`,
                  background: 'var(--mantine-color-gray-5)',
                  transition: 'width 200ms',
                }}
              />
            )}
          </>
        )}
      </div>
      {(partialWeeks > 0 || loadedWeeks > 0) && (
        <Group gap="xs" mb="xs">
          <Badge variant="light" color="green" size="xs">
            {t('charts.complete')}: {loadedWeeks}
          </Badge>
          <Badge variant="light" color="yellow" size="xs">
            {t('charts.partial')}: {partialWeeks}
          </Badge>
          <Badge variant="light" color="gray" size="xs">
            {t('charts.toSync')}: {Math.max(0, weeks.length - loadedWeeks - partialWeeks)}
          </Badge>
        </Group>
      )}
      {weeks.length > 0 && loadedWeeks < weeks.length && (
        <Card withBorder padding="sm" mt="xs">
          <Group align="flex-start" gap="sm">
            <ThemeIcon size="sm" radius="xl" variant="light" color="orange">
              <IconAlertCircle size={14} />
            </ThemeIcon>
            <div>
              <Text size="sm" fw={600}>
                {t('charts.outdatedWarning')}
              </Text>
              <Text size="xs" c="dimmed">
                {t('charts.outdatedWarningMessage', { missingWeeks: weeks.length - loadedWeeks })}
              </Text>
            </div>
          </Group>
        </Card>
      )}
      {!isOnline && (
        <Alert title={t('errors.warning')} color="yellow" variant="light" mt="xs" radius="sm">
          {t('settings.needOnline')} - {t('errors.offlineAction')}
        </Alert>
      )}
      {error && (
        <Text c="red" size="sm">
          {error}
        </Text>
      )}
    </Card>
  );
};
