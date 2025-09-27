// src/pages/SettingsPage.tsx (clean minimal debug version)
import { useEffect } from 'react';
import {
  Center,
  Loader,
  Text,
  Container,
  Title,
  Flex,
  Group,
  Badge,
  Tooltip,
  Button,
  Divider,
  rem
} from '@mantine/core';
import { IconSettings, IconCloudOff, IconCloudCheck, IconRefresh } from '@tabler/icons-react';
import { IconCheck, IconX } from '@tabler/icons-react';
import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import { fetchCharts, setActiveChartId, deleteChart, clearChartLocalData } from '../store/chartsSlice';
import { syncCharts } from '../store/syncSlice';
import { useTranslation } from 'react-i18next';
import { useOfflineStatus } from '../hooks/useOfflineStatus';
import ActiveChartCard from '../components/ActiveChartCard';
import ChartsListCard from '../components/ChartsListCard';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
// import { db } from '../db/indexedDb'; // no longer needed for global clear

function SettingsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { t, i18n } = useTranslation();
  const charts = useSelector((s: any) => s.charts.charts);
  const isLoading = useSelector((s: any) => s.charts.loading);
  const activeChartId = useSelector((s: any) => s.charts.activeChartId);
  const isAuthenticated = useSelector((s: any) => s.auth.user !== null);
  const reduxLanguage = useSelector((s: any) => s.i18n.language);
  const syncState = useSelector((s: any) => s.sync);
  const { isOnline } = useOfflineStatus();

  // Fetch charts when authenticated
  useEffect(() => {
    if (isAuthenticated) dispatch(fetchCharts());
  }, [isAuthenticated, dispatch]);

  // Ensure i18n sync with redux
  useEffect(() => {
    if (i18n.language !== reduxLanguage) i18n.changeLanguage(reduxLanguage);
  }, [reduxLanguage, i18n]);

  // Auto-sync charts every 15 minutes when online
  useEffect(() => {
    if (!isOnline) return;
    const last = syncState.lastFullChartsSync ? new Date(syncState.lastFullChartsSync).getTime() : 0;
    const now = Date.now();
    if (!syncState.syncing && now - last > 15 * 60 * 1000) {
      dispatch(syncCharts());
    }
  }, [isOnline, syncState.lastFullChartsSync, syncState.syncing, dispatch]);

  // Pick first chart as active if none selected
  useEffect(() => {
    if (charts.length > 0 && activeChartId == null) {
      dispatch(setActiveChartId(charts[0].id));
    }
  }, [charts, activeChartId, dispatch]);

  const handleSetActiveChartId = (id: number | null) => dispatch(setActiveChartId(id));
  const handleSync = () => dispatch(syncCharts());

  // Global cache clear removed; per-chart clearing implemented via event listener below

  const openDeleteModal = (chartId: number, chartName: string) => {
    if (!isOnline) {
      notifications.show({ message: t('errors.offlineAction'), color: 'yellow', icon: <IconX /> });
      return;
    }
    modals.openConfirmModal({
      title: t('forms.deleteChart.title', { name: chartName }),
      children: <Text size="sm">{t('forms.deleteChart.message', { name: chartName })}</Text>,
      labels: { confirm: t('forms.deleteChart.deleteButton'), cancel: t('forms.deleteChart.cancelButton') },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await dispatch(deleteChart(chartId) as any).unwrap();
          notifications.show({ message: t('notifications.charts.delete.success', { chart: chartName }), color: 'green', icon: <IconCheck /> });
        } catch {
          notifications.show({ message: t('notifications.charts.delete.error', { chart: chartName }), color: 'red', icon: <IconX /> });
        }
      }
    });
  };

  // Listener para ação de limpar dados locais de um chart
  useEffect(() => {
    const handler = (e: any) => {
      const { chartId, chartName } = e.detail || {};
      if (!chartId) return;
      modals.openConfirmModal({
        title: t('settings.clearChartData') + ': ' + chartName,
  children: <Text size="sm">{t('settings.clearChartData')}? ({chartName})</Text>,
        labels: { confirm: t('settings.clearChartData'), cancel: t('forms.deleteChart.cancelButton') },
        confirmProps: { color: 'grape' },
        onConfirm: async () => {
          try {
            await dispatch(clearChartLocalData(chartId) as any).unwrap();
            notifications.show({ message: t('notifications.cache.chartCleared', { chart: chartName }), color: 'green', icon: <IconCheck /> });
          } catch (err) {
            notifications.show({ message: (err as Error)?.message || 'Failed', color: 'red', icon: <IconX /> });
          }
        }
      });
    };
    document.addEventListener('zero:clearChartData', handler as any);
    return () => document.removeEventListener('zero:clearChartData', handler as any);
  }, [dispatch, t]);

  const chartsCount = syncState.chartsCount || charts.length || 0;

  if (isLoading) {
    return (
      <Center style={{ height: '60vh' }}>
        <Loader />
      </Center>
    );
  }

  return (
    <Container>
      <Flex direction="column" p="xs" gap="sm">
        <Flex justify="center" align="center" gap="sm">
          <Title order={2} style={{ display: 'flex', alignItems: 'center', gap: rem(8) }}>
            <IconSettings style={{ width: rem(20), height: rem(20) }} />
            {t('settings.title')}
          </Title>
        </Flex>
        <Divider variant="solid" size="sm" my="md" />
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Badge color={isOnline ? 'green' : 'red'} variant="light" leftSection={isOnline ? <IconCloudCheck size={14} /> : <IconCloudOff size={14} />}>{isOnline ? t('settings.online') : t('settings.offline')}</Badge>
            {syncState.lastFullChartsSync && (
              <Tooltip label={syncState.lastFullChartsSync}>
                <Badge variant="outline" color="blue">{t('settings.lastSync')}: {new Date(syncState.lastFullChartsSync).toLocaleString()}</Badge>
              </Tooltip>
            )}
            <Badge variant="outline" color="grape">{t('settings.chartsCount')}: {chartsCount}</Badge>
          </Group>
          <Group gap="xs">
            <Tooltip label={isOnline ? t('settings.syncNow') : t('settings.needOnline')}>
              <Button leftSection={<IconRefresh size={16} />} size="xs" onClick={handleSync} disabled={!isOnline || syncState.syncing} loading={syncState.syncing}>{t('settings.sync')}</Button>
            </Tooltip>
          </Group>
        </Group>
        
        <ActiveChartCard
          charts={charts}
          activeChartId={activeChartId}
          setActiveChartId={handleSetActiveChartId}
          t={t}
          chartOptions={charts.map((chart: any) => ({ value: String(chart.id), label: chart.name }))}
        />
        {charts.length > 0 && (
          <ChartsListCard charts={charts} t={t} openDeleteModal={openDeleteModal} isOnline={isOnline} />
        )}
      </Flex>
    </Container>
  );
}

export default SettingsPage;
