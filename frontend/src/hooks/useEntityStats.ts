// Hook for fetching entity statistics from IndexedDB
import { useState, useEffect } from 'react';
import { db } from '../db/indexedDb';
import type { ChartStats } from '../db/indexedDb';
import { getUserPlaycountCached } from '../utils/certification';

export interface EntityStats {
  entityId: string;
  name: string;
  artistName: string;
  peak: number;
  totalWeeks: number;
  weeksAtPeak: number;
  firstAppearance: string;
  lastAppearance: string;
  totalPlays: number;
  totalPoints: number;
  chartRun: Array<{ week: string; position: number | null; plays: number }>;
  stats?: ChartStats;
}

type SupportedEntityChart = 'artist' | 'album' | 'track' | string;

interface ChartLike {
  id?: string | number;
  lastfm_username?: string | null;
  offline?: boolean | null;
  day_of_week?: number | null;
  [key: string]: any;
}

export function useEntityStats(
  chart: ChartLike | null | undefined,
  chartType: SupportedEntityChart,
  entityId: string | undefined
) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<EntityStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Dexie stores compound keys as strings, normalise inputs to avoid mismatches
  const normalizedChartId = chart?.id != null ? String(chart.id) : undefined;
  const normalizedEntityId = entityId != null ? String(entityId) : undefined;
  const username = chart?.lastfm_username || undefined;
  const offline = Boolean(chart?.offline);
  const nextWeekDay =
    typeof chart?.day_of_week === 'number' ? chart?.day_of_week ?? undefined : undefined;

  useEffect(() => {
    if (!normalizedChartId || !normalizedEntityId) {
      setLoading(false);
      setStats(null);
      setError(null);
      return;
    }
    const chartKey = normalizedChartId;
    const entityKey = normalizedEntityId;

    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);

        // Get chart data for this entity
        const chartData = await db.charts_data
          .where('[chartId+chartType+entityId]')
          .equals([chartKey, chartType, entityKey])
          .toArray();

        if (chartData.length === 0) {
          setError('Entity not found');
          setStats(null);
          setLoading(false);
          return;
        }

        // Get stats if available
        const entityStats = await db.charts_stats.get([chartKey, chartType, entityKey]);

        // Calculate basic stats from chart data
        const sortedData = chartData.sort((a, b) => a.week.localeCompare(b.week));
        const dataByWeek = new Map(sortedData.map(entry => [entry.week, entry]));
        let allWeeks: string[] = [];
        try {
          const weeksRows = await db.chart_weeks.where('chartId').equals(chartKey).toArray();
          if (weeksRows.length) allWeeks = weeksRows.map(row => row.week);
        } catch {
          /* ignore missing chart_weeks */
        }
        if (!allWeeks.length) {
          allWeeks = Array.from(new Set(sortedData.map(row => row.week)));
        }
        allWeeks.sort((a, b) => a.localeCompare(b));
        const firstPresenceWeek = sortedData[0]?.week;
        const lastPresenceWeek = sortedData[sortedData.length - 1]?.week;
        let normalizedWeeks = firstPresenceWeek
          ? allWeeks.filter(week => week >= firstPresenceWeek)
          : allWeeks;
        if (lastPresenceWeek) {
          normalizedWeeks = normalizedWeeks.filter(week => week <= lastPresenceWeek);
        }
        const peak = Math.min(...chartData.map(d => d.rank));
        const weeksAtPeak = chartData.filter(d => d.rank === peak).length;
        const totalPlaysFromChart = chartData.reduce((sum, d) => sum + (d.plays || 0), 0);

        // Calculate total points (stability points)
        const totalPoints = chartData.reduce((sum, d) => {
          const points = Math.max(0, 101 - d.rank);
          return sum + points;
        }, 0);

        let mergedTotalPlays = totalPlaysFromChart;
        const entityName = chartData[0]?.name || '';
        const entityArtistName = chartData[0]?.artistName || entityName;
        const normalizedType =
          chartType === 'artist' || chartType === 'album' || chartType === 'track'
            ? (chartType as 'artist' | 'album' | 'track')
            : null;

        if (normalizedType && username && !offline && entityName) {
          try {
            const playcount = await getUserPlaycountCached({
              username,
              artistName: normalizedType === 'artist' ? entityName : entityArtistName,
              entityName,
              chartType: normalizedType,
              offline,
              nextWeekDay,
            });
            if (Number.isFinite(playcount) && playcount > mergedTotalPlays) {
              mergedTotalPlays = playcount;
            }
          } catch (playcountError) {
            console.warn('Failed to refresh playcount for entity stats', playcountError);
          }
        }

        // Build chart run
        const chartRun = normalizedWeeks.map(week => {
          const row = dataByWeek.get(week);
          if (row) {
            return {
              week,
              position: row.rank,
              plays: row.plays || 0,
            };
          }
          return { week, position: null, plays: 0 };
        });

        const entityInfo: EntityStats = {
          entityId: entityKey,
          name: chartData[0].name,
          artistName: chartData[0].artistName,
          peak,
          totalWeeks: chartData.length,
          weeksAtPeak,
          firstAppearance: sortedData[0].week,
          lastAppearance: sortedData[sortedData.length - 1].week,
          totalPlays: mergedTotalPlays,
          totalPoints,
          chartRun,
          stats: entityStats,
        };

        setStats(entityInfo);
      } catch (err) {
        console.error('Error fetching entity stats:', err);
        setError('Failed to load entity stats');
        setStats(null);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [normalizedChartId, chartType, normalizedEntityId, username, offline, nextWeekDay]);

  return { loading, stats, error };
}
