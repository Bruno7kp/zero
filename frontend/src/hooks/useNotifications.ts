import { useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addNotification, type Notification } from '../store/notificationsSlice';
import { getClosedChartWeeks } from '../utils/chartWeekUtils';
import { db } from '../db/indexedDb';
import dayjs from 'dayjs';
import type { RootState } from '../store';

/**
 * Hook to check for outdated charts and generate notifications
 */
export function useNotifications() {
  const dispatch = useDispatch();
  const charts = useSelector((s: RootState) => (s as any).charts.charts);
  const notifications = useSelector((s: RootState) => (s as any).notifications.notifications);

  const checkOutdatedChart = useCallback(
    async (chart: any) => {
      if (!chart) return;

      const chartId = String(chart.id);
      const weeks = getClosedChartWeeks(chart.start_date, chart.day_of_week, chart.timezone);

      if (weeks.length === 0) return;

      // Get the last week that should be synced
      const lastWeek = weeks[weeks.length - 1];
      const lastWeekDate = dayjs(lastWeek);
      const now = dayjs();
      const daysSinceLastWeek = now.diff(lastWeekDate, 'day');

      // If the last week is more than 7 days old (a week has passed), check if it's synced
      if (daysSinceLastWeek >= 7) {
        // Check if this week is marked as complete in the database
        const weekStatus = await db.chart_weeks.get([chartId, lastWeek]);

        if (!weekStatus || weekStatus.status !== 'complete') {
          // Chart is outdated - create notification
          const notificationId = `chart_outdated_${chartId}_${lastWeek}`;

          // Check if notification already exists
          const existingNotification = notifications.find(
            (n: Notification) => n.id === notificationId
          );

          if (!existingNotification) {
            const notification: Notification = {
              id: notificationId,
              type: 'chart_outdated',
              title: 'notification.chartOutdated',
              message: 'notification.chartOutdatedMessage',
              chartId: chart.id,
              chartName: chart.name,
              createdAt: Date.now(),
              read: false,
            };

            dispatch(addNotification(notification));
          }
        }
      }
    },
    [dispatch, notifications]
  );

  const checkAllCharts = useCallback(async () => {
    if (!charts || charts.length === 0) return;

    for (const chart of charts) {
      await checkOutdatedChart(chart);
    }
  }, [charts, checkOutdatedChart]);

  // Check for outdated charts periodically (every 15 minutes)
  useEffect(() => {
    checkAllCharts();

    const interval = setInterval(() => {
      checkAllCharts();
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(interval);
  }, [checkAllCharts]);

  return {
    notifications,
    unreadCount: notifications.filter((n: Notification) => !n.read).length,
  };
}
