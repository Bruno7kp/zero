import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Modal, Button, Group, Text, Loader, Alert } from '@mantine/core';
import { IconAlertTriangle, IconDownload, IconDeviceFloppy } from '@tabler/icons-react';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { db, type ChartData } from '../db/indexedDb';
import { getWeeklyArtistChart, getWeeklyAlbumChart, getWeeklyTrackChart } from '../services/lastfm';
import { getClosedChartWeeks } from '../utils/chartWeekUtils';
import { useDispatch } from 'react-redux';
import { fetchChartData, fetchStatsMapIncremental } from '../store/charts';
import { invalidateStatsForChart, bumpStats } from '../store/chartsSlice';
import { applyWeekToFullStats } from '../utils/incrementalFullStats';
import { useTranslation } from 'react-i18next';
// DnD sensors handled inside EditTable
import { arrayMove } from '@dnd-kit/sortable';
import EditHeader from './chartEdit/EditHeader';
import EditTable from './chartEdit/EditTable';
import type { EditRow } from './chartEdit/SortableRow';

dayjs.extend(utc);
dayjs.extend(timezone);

// EditRow type moved to chartEdit/SortableRow

type Props = {
  opened: boolean;
  onClose: () => void;
  chart: any;
  week: string | undefined;
  type: 'artist' | 'album' | 'track' | string;
};

export const ChartWeekEditModal: React.FC<Props> = ({ opened, onClose, chart, week, type }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  // sensors moved inside EditTable
  const [rows, setRows] = useState<EditRow[]>([]);
  const [originalRows, setOriginalRows] = useState<EditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cutoff = useMemo(() => {
    if (type === 'artist') return chart?.artist_cutoff ?? 100;
    if (type === 'album') return chart?.album_cutoff ?? 100;
    return chart?.music_cutoff ?? 100;
  }, [chart, type]);

  const chartIdStr = String(chart?.id ?? '');
  const chartType = String(type);
  const tz = chart?.timezone || 'UTC';

  const computeRanks = useCallback(
    (items: Omit<EditRow, 'rank' | 'inside'>[]) => {
      // Assign ranks by plays desc, then current order inside equal-plays groups
      const grouped = new Map<number, Omit<EditRow, 'rank' | 'inside'>[]>();
      for (const it of items) grouped.set(it.plays, [...(grouped.get(it.plays) || []), it]);
      const playsVals = Array.from(grouped.keys()).sort((a, b) => b - a);
      const out: EditRow[] = [];
      let r = 1;
      for (const pv of playsVals) {
        const grp = grouped.get(pv)!;
        for (const it of grp) {
          out.push({ ...it, rank: r, inside: r <= cutoff });
          r++;
        }
      }
      return out;
    },
    [cutoff]
  );

  const loadFromDb = useCallback(async () => {
    if (!week || !chartIdStr) return;
    setLoading(true);
    setError(null);
    try {
      const data = await db.charts_data
        .where(['chartId', 'chartType', 'week'])
        .equals([chartIdStr, chartType, week])
        .toArray();
      data.sort((a, b) => a.rank - b.rank);
      const base = data.map<EditRow>(d => ({
        entityId: d.entityId,
        name: d.name,
        artistName: d.artistName,
        plays: d.plays,
        rank: d.rank,
        inside: d.rank <= cutoff,
      }));
      setRows(base);
      setOriginalRows(base);
    } catch (e: any) {
      setError(e?.message || 'Erro ao carregar dados do IndexedDB');
    } finally {
      setLoading(false);
    }
  }, [chartIdStr, chartType, week, cutoff]);

  const fetchFromLastfm = useCallback(async () => {
    if (!week || !chart?.lastfm_username) return;
    setLoading(true);
    setError(null);
    try {
      const from = dayjs.tz(week, tz).unix().toString();
      const to = dayjs.tz(week, tz).add(7, 'day').unix().toString();
      // Busca além do cutoff para capturar empates fora do limite
      const limit = cutoff + 50;
      let items: Array<{ rank: number; name: string; artist?: string; playcount: number }> = [];
      if (type === 'artist')
        items = await getWeeklyArtistChart(chart.lastfm_username, from, to, limit);
      else if (type === 'album')
        items = await getWeeklyAlbumChart(chart.lastfm_username, from, to, limit);
      else items = await getWeeklyTrackChart(chart.lastfm_username, from, to, limit);
      // Map to working rows; build entityId with same convention used when saving
      const mapped = items.map(it => ({
        entityId: `${type}-${it.name}-${it.artist || ''}`,
        name: it.name,
        artistName: it.artist || '',
        plays: it.playcount,
      }));
      // Primeiro calcula ranks completos
      const computedFull = computeRanks(mapped);
      const lastInsidePlays = computedFull.find(r => r.rank === cutoff)?.plays;
      let working = computedFull;
      if (typeof lastInsidePlays === 'number') {
        // Mantém apenas itens com plays >= plays do último dentro (inclui todos empates)
        const keepBase = mapped.filter(m => m.plays >= lastInsidePlays);
        working = computeRanks(keepBase);
      }
      // Update only the working rows; keep originalRows pointing to DB baseline
      // so that differences vs. IndexedDB enable the Save button correctly
      setRows(working);
    } catch (e: any) {
      setError(e?.message || 'Falha ao buscar dados no Last.fm');
    } finally {
      setLoading(false);
    }
  }, [chart?.lastfm_username, cutoff, tz, type, week, computeRanks]);

  useEffect(() => {
    if (opened) {
      // Default load current DB state; user can refresh from source
      loadFromDb();
    } else {
      setRows([]);
      setOriginalRows([]);
      setError(null);
      setLoading(false);
    }
  }, [opened, loadFromDb]);

  const groupedByPlays = useMemo(() => {
    const map = new Map<number, EditRow[]>();
    for (const r of rows) map.set(r.plays, [...(map.get(r.plays) || []), r]);
    // Ensure order by current rank
    for (const list of map.values()) list.sort((a, b) => a.rank - b.rank);
    const keys = Array.from(map.keys()).sort((a, b) => b - a);
    return keys.map(k => ({ plays: k, items: map.get(k)! }));
  }, [rows]);

  // Arrow move function removed (we use drag handle)

  const hasChanges = useMemo(() => {
    if (rows.length !== originalRows.length) return true;
    const byId = new Map(originalRows.map(r => [r.entityId, r] as const));
    for (const r of rows) {
      const o = byId.get(r.entityId);
      if (!o) return true;
      if (o.rank !== r.rank) return true;
      if (o.plays !== r.plays) return true; // covers refresh from source
    }
    return false;
  }, [rows, originalRows]);

  const saveChanges = useCallback(async () => {
    if (!week) return;
    setLoading(true);
    setError(null);
    try {
      // Persist only top cutoff items for this type/week
      const top = rows
        .slice()
        .sort((a, b) => a.rank - b.rank)
        .filter(r => r.rank <= cutoff);
      // Build ChartData records
      const enriched: ChartData[] = top.map(r => ({
        chartId: chartIdStr,
        chartType,
        entityId: r.entityId,
        name: r.name,
        artistName: r.artistName,
        rank: r.rank,
        plays: r.plays,
        week,
      }));
      // Replace week data atomically
      await db.transaction('rw', db.charts_data, async () => {
        await db.charts_data
          .where(['chartId', 'chartType', 'week'])
          .equals([chartIdStr, chartType, week])
          .delete();
        await db.charts_data.bulkPut(enriched);
      });
      // Rebuild stats for affected entities (any entity whose rank changed or any moved in/out of cutoff)
      const changedIds = new Set<string>();
      const prevById = new Map(originalRows.map(r => [r.entityId, r] as const));
      for (const r of rows) {
        const prev = prevById.get(r.entityId);
        if (!prev || prev.rank !== r.rank) changedIds.add(r.entityId);
      }
      // Include entities that were in original cutoff but are no longer in current top cutoff (removed)
      const originalTopIds = new Set(
        originalRows.filter(r => r.rank <= cutoff).map(r => r.entityId)
      );
      const currentTopIds = new Set(top.map(r => r.entityId));
      for (const id of originalTopIds) {
        if (!currentTopIds.has(id)) changedIds.add(id);
      }
      const cutoffVal = cutoff;
      // Rebuild FULL run for affected entities: wipe existing stats and re-apply all weeks in order
      for (const id of changedIds) {
        try {
          await db.charts_stats.delete([chartIdStr, chartType, id]);
        } catch (e) {
          // Non-fatal: if there is no existing stats row, we'll recreate it below
          console.warn('charts_stats delete failed (will rebuild anyway)', {
            chartIdStr,
            chartType,
            id,
            error: e,
          });
        }
        const allRows = await db.charts_data
          .where(['chartId', 'chartType', 'entityId'])
          .equals([chartIdStr, chartType, id])
          .sortBy('week');
        for (const row of allRows) {
          await applyWeekToFullStats(row, { cutoff: cutoffVal });
        }
      }
      // Invalidate stats cache from this week onward and refetch minimal snapshot for current view
      dispatch(invalidateStatsForChart({ chartId: chartIdStr, chartType, fromWeek: week }));
      await dispatch(fetchChartData({ chartId: chartIdStr, chartType, week }) as any);
      const refreshed = await db.charts_data
        .where(['chartId', 'chartType', 'week'])
        .equals([chartIdStr, chartType, week])
        .toArray();
      // Trigger incremental stats recompute to update minimal stats and refresh runCache
      await dispatch(
        fetchStatsMapIncremental({
          chartId: chartIdStr,
          chartType,
          data: refreshed as any,
          week,
        }) as any
      );
      dispatch(bumpStats());
      // Optional: if there are many removals, also refresh a snapshot for the week to update minimal stats immediately
      // (fetchChartData above already refreshed state.charts.data for this week)

      // Also recompute deltas for the NEXT week, if exists
      const allWeeks = getClosedChartWeeks(chart.start_date, chart.day_of_week, chart.timezone);
      const currentIdx = allWeeks.findIndex(w => w === week);
      if (currentIdx !== -1 && currentIdx + 1 < allWeeks.length) {
        const nextWeek = allWeeks[currentIdx + 1];
        // For each row in next week, recompute deltas vs current (this) week
        const nextRows = await db.charts_data
          .where(['chartId', 'chartType', 'week'])
          .equals([chartIdStr, chartType, nextWeek])
          .toArray();
        if (nextRows.length) {
          const currentRows = top; // top of current week as saved
          const byEntityCurrent = new Map(currentRows.map(r => [r.entityId, r] as const));
          const updates: Array<{ id?: number; entityId: string; deltaRank: any; deltaPlays: any }> =
            [];
          for (const nr of nextRows) {
            const prev = byEntityCurrent.get(nr.entityId);
            let deltaRank: any = 'RE';
            let deltaPlays: any = 'RE';
            if (prev) {
              deltaRank = prev.rank && nr.rank ? prev.rank - nr.rank : '-';
              deltaPlays =
                typeof nr.plays === 'number' && typeof prev.plays === 'number'
                  ? nr.plays - prev.plays
                  : '-';
            }
            updates.push({ id: nr.id, entityId: nr.entityId, deltaRank, deltaPlays });
          }
          // Persist delta changes in DB for next week rows
          await db.transaction('rw', db.charts_data, async () => {
            for (const u of updates) {
              if (u.id != null) {
                await db.charts_data.update(u.id, {
                  deltaRank: u.deltaRank,
                  deltaPlays: u.deltaPlays,
                });
              }
            }
          });
        }
      }

      onClose();
    } catch (e: any) {
      setError(e?.message || 'Falha ao salvar alterações');
    } finally {
      setLoading(false);
    }
  }, [rows, week, chartIdStr, chartType, cutoff, originalRows, dispatch, chart, onClose]);

  // SortableRow moved to separate component

  function onDragEnd(event: any) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const id2plays = new Map(rows.map(r => [r.entityId, r.plays] as const));
    const p1 = id2plays.get(active.id as string);
    const p2 = id2plays.get(over.id as string);
    if (p1 == null || p2 == null || p1 !== p2) return; // only within same plays
    setRows(prev => {
      const list = prev.filter(r => r.plays === p1).sort((a, b) => a.rank - b.rank);
      const others = prev
        .filter(r => r.plays !== p1)
        .map(o => ({
          entityId: o.entityId,
          name: o.name,
          artistName: o.artistName,
          plays: o.plays,
        }));
      const from = list.findIndex(r => r.entityId === active.id);
      const to = list.findIndex(r => r.entityId === over.id);
      if (from === -1 || to === -1) return prev;
      const reordered = arrayMove(list, from, to);
      const mergedBase = [
        ...others,
        ...reordered.map(o => ({
          entityId: o.entityId,
          name: o.name,
          artistName: o.artistName,
          plays: o.plays,
        })),
      ];
      return computeRanks(mergedBase);
    });
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconDownload size={16} />
          <Text fw={600} size="sm">
            {t('chartEdit.title', 'Editar semana do chart')}
          </Text>
        </Group>
      }
      size="90%"
      centered
    >
      <EditHeader
        type={type}
        week={week}
        cutoff={cutoff}
        loading={loading}
        canRefresh={!!chart?.lastfm_username && !!week}
        t={t as any}
        onRefresh={fetchFromLastfm}
      />
      <div style={{ height: 4 }} />
      {error && (
        <Alert
          color="red"
          icon={<IconAlertTriangle size={14} />}
          mb="xs"
          radius="sm"
          variant="light"
        >
          <Text size="sm">{error}</Text>
        </Alert>
      )}
      <EditTable
        groupedByPlays={groupedByPlays as any}
        cutoff={cutoff}
        loading={loading}
        labels={{
          pos: t('chartEdit.pos', 'Pos'),
          nameArtist: t('chartEdit.nameArtist', 'Nome / Artista'),
          plays: t('chartEdit.plays', 'Plays'),
          adjust: t('chartEdit.adjust', 'Ajustar'),
        }}
        onDragEnd={onDragEnd}
      />
      <Group justify="space-between" mt={8} gap="xs">
        <Text size="xs" c="dimmed">
          {t(
            'chartEdit.hint',
            'Só é possível ajustar posições entre itens com a mesma quantidade de plays. Você pode trocar dentro/fora do cutoff se os plays forem idênticos.'
          )}
        </Text>
        <Group gap="xs">
          {loading && <Loader size="sm" />}
          <Button variant="default" size="xs" onClick={loadFromDb} disabled={loading}>
            {t('common.revert', 'Reverter alterações')}
          </Button>
          <Button
            size="xs"
            leftSection={<IconDeviceFloppy size={14} />}
            onClick={saveChanges}
            disabled={loading || !hasChanges}
          >
            {t('common.save', 'Salvar')}
          </Button>
        </Group>
      </Group>
    </Modal>
  );
};

export default ChartWeekEditModal;
