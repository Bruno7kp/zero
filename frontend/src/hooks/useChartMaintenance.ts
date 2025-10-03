import { useState, useCallback } from 'react';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { clearChartLocalData } from '../store/chartsSlice';
import { db } from '../db/indexedDb';

interface ProcessingState { clearing?: boolean; rebuilding?: boolean; progress?: number; total?: number }

export function useChartMaintenance(t: any) {
  const dispatch = useDispatch<AppDispatch>();
  const charts = useSelector((s: RootState) => (s as any).charts.charts || []);
  const [processing, setProcessing] = useState<Record<string, ProcessingState>>({});

  const updateState = (chartId: string, patch: ProcessingState | null) => {
    setProcessing(prev => {
      const next = { ...prev };
      if (patch === null) delete next[chartId]; else next[chartId] = { ...(next[chartId] || {}), ...patch };
      return next;
    });
  };

  const clearChartDataWithConfirm = useCallback((chartId: number, chartName: string) => {
    modals.openConfirmModal({
      title: t('settings.clearChartData') + ': ' + chartName,
      children: t('settings.clearChartData') + '? (' + chartName + ')',
      labels: { confirm: t('settings.clearChartData'), cancel: t('forms.deleteChart.cancelButton') },
      confirmProps: { color: 'grape' },
      onConfirm: async () => {
        const idStr = String(chartId);
        updateState(idStr, { clearing: true });
        const notifId = `clear-${idStr}`;
        notifications.show({ id: notifId, message: t('settings.clearChartProgress', { chart: chartName }), loading: true, autoClose: false });
        try {
          await dispatch(clearChartLocalData(chartId) as any).unwrap();
          notifications.update({ id: notifId, message: t('notifications.cache.chartCleared', { chart: chartName }), loading: false, color: 'green', autoClose: 2500 });
        } catch (e: any) {
          notifications.update({ id: notifId, message: e?.message || 'Failed', loading: false, color: 'red', autoClose: 4000 });
        } finally {
          updateState(idStr, { clearing: false });
          setTimeout(() => updateState(idStr, null), 1500);
        }
      }
    });
  }, [dispatch, t]);

  const rebuildStatsWithConfirm = useCallback((chartId: number, chartName: string) => {
    modals.openConfirmModal({
      title: t('settings.rebuildStats') + ': ' + chartName,
      children: t('settings.rebuildStatsConfirm', { chart: chartName }),
      labels: { confirm: t('settings.rebuild'), cancel: t('forms.deleteChart.cancelButton') },
      confirmProps: { color: 'blue' },
      onConfirm: async () => {
        const idStr = String(chartId);
        updateState(idStr, { rebuilding: true, progress: 0, total: 0 });
        const notifId = `rebuild-${idStr}`;
        notifications.show({ id: notifId, message: t('settings.rebuildStatsProgress', { chart: chartName, current: 0, total: 0 }), loading: true, autoClose: false });
        try {
          await db.charts_stats.where('chartId').equals(idStr).delete();
          const types = ['artist','album','track'];
          let totalEntities = 0;
          const entitiesByType: Record<string, Record<string, any[]>> = {};
          const chartObj: any = charts.find((c: any) => String(c.id) === idStr);
          for (const type of types) {
            const rows = await db.charts_data.where(['chartId','chartType']).equals([idStr, type]).toArray();
            const byEntity: Record<string, any[]> = {};
            for (const r of rows) (byEntity[r.entityId] ||= []).push(r);
            entitiesByType[type] = byEntity;
            totalEntities += Object.keys(byEntity).length;
          }
          updateState(idStr, { rebuilding: true, total: totalEntities, progress: 0 });
          let processed = 0;
          // Process entity by entity to show progress
            for (const type of types) {
              const byEntity = entitiesByType[type];
              const cutoff = type === 'artist' ? (chartObj?.artist_cutoff || 100) : type === 'album' ? (chartObj?.album_cutoff || 100) : (chartObj?.music_cutoff || 100);
              for (const entityId of Object.keys(byEntity)) {
                const ordered = byEntity[entityId].sort((a,b)=>a.week.localeCompare(b.week));
                for (const row of ordered) {
                  const mod = await import('../utils/incrementalFullStats');
                  await mod.applyWeekToFullStats(row, { cutoff });
                }
                processed++;
                updateState(idStr, { rebuilding: true, progress: processed, total: totalEntities });
                if (processed % 5 === 0 || processed === totalEntities) {
                  notifications.update({ id: notifId, message: t('settings.rebuildStatsProgress', { chart: chartName, current: processed, total: totalEntities }), loading: true, autoClose: false });
                  await new Promise(r => setTimeout(r, 0)); // yield
                }
              }
            }
          notifications.update({ id: notifId, message: t('settings.rebuildStatsDone', { chart: chartName }), loading: false, color: 'green', autoClose: 2500 });
        } catch (e: any) {
          notifications.update({ id: notifId, message: t('settings.rebuildStatsFailed') + ' ' + (e?.message || ''), loading: false, color: 'red', autoClose: 5000 });
        } finally {
          updateState(String(chartId), { rebuilding: false });
          setTimeout(() => updateState(String(chartId), null), 2000);
        }
      }
    });
  }, [charts, t]);

  const isProcessing = useCallback((chartId: number | string) => !!processing[String(chartId)] && (processing[String(chartId)].clearing || processing[String(chartId)].rebuilding), [processing]);

  return { clearChartDataWithConfirm, rebuildStatsWithConfirm, processing, isProcessing };
}
