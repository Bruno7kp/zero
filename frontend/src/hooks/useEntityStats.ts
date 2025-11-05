// Hook for fetching entity statistics from IndexedDB
import { useState, useEffect } from 'react';
import { db } from '../db/indexedDb';
import type { ChartStats } from '../db/indexedDb';

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
  chartRun: Array<{ week: string; position: number; plays: number }>;
  stats?: ChartStats;
}

export function useEntityStats(
  chartId: string | undefined,
  chartType: string,
  entityId: string | undefined
) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<EntityStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!chartId || !entityId) {
      setLoading(false);
      return;
    }

    async function fetchStats() {
      try {
        setLoading(true);
        setError(null);

        // Get chart data for this entity
        const chartData = await db.charts_data
          .where('[chartId+chartType+entityId]')
          .equals([chartId, chartType, entityId])
          .toArray();

        if (chartData.length === 0) {
          setError('Entity not found');
          setStats(null);
          setLoading(false);
          return;
        }

        // Get stats if available
        const entityStats = await db.charts_stats.get([chartId, chartType, entityId]);

        // Calculate basic stats from chart data
        const sortedData = chartData.sort((a, b) => a.week.localeCompare(b.week));
        const peak = Math.min(...chartData.map(d => d.rank));
        const weeksAtPeak = chartData.filter(d => d.rank === peak).length;
        const totalPlays = chartData.reduce((sum, d) => sum + (d.plays || 0), 0);

        // Calculate total points (stability points)
        const totalPoints = chartData.reduce((sum, d) => {
          const points = Math.max(0, 101 - d.rank);
          return sum + points;
        }, 0);

        // Build chart run
        const chartRun = sortedData.map(d => ({
          week: d.week,
          position: d.rank,
          plays: d.plays || 0,
        }));

        const entityInfo: EntityStats = {
          entityId,
          name: chartData[0].name,
          artistName: chartData[0].artistName,
          peak,
          totalWeeks: chartData.length,
          weeksAtPeak,
          firstAppearance: sortedData[0].week,
          lastAppearance: sortedData[sortedData.length - 1].week,
          totalPlays,
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
  }, [chartId, chartType, entityId]);

  return { loading, stats, error };
}
