import { useEffect, useState } from 'react';
import { db } from '../db/indexedDb';
import type { ChartData } from '../db/indexedDb';

/**
 * Hook to fetch items that were in the previous week but dropped out in the current week
 */
export function useDroppedItems(
  chartId: string | undefined,
  chartType: string,
  currentWeek: string | undefined,
  currentData: ChartData[],
  enabled: boolean
): ChartData[] {
  const [droppedItems, setDroppedItems] = useState<ChartData[]>([]);

  useEffect(() => {
    let cancelled = false;

    const fetchDroppedItems = async () => {
      if (!enabled || !chartId || !currentWeek || !currentData.length) {
        if (!cancelled) setDroppedItems([]);
        return;
      }

      try {
        // Get all weeks for this chart before current week
        const allWeeks = await db.charts_data
          .where('[chartId+chartType+week]')
          .between(
            [chartId, chartType, '0000'],
            [chartId, chartType, currentWeek]
          )
          .toArray();

        if (cancelled) return;

        // Group by week to find the most recent week before current
        const weekMap = new Map<string, ChartData[]>();
        for (const item of allWeeks) {
          if (item.week < currentWeek) {
            if (!weekMap.has(item.week)) {
              weekMap.set(item.week, []);
            }
            weekMap.get(item.week)!.push(item);
          }
        }

        // Get the most recent week
        const weeks = Array.from(weekMap.keys()).sort();
        const previousWeek = weeks[weeks.length - 1];

        if (!previousWeek) {
          if (!cancelled) setDroppedItems([]);
          return;
        }

        // Get items from previous week
        const previousWeekData = weekMap.get(previousWeek) || [];
        
        // Get entity IDs from current week
        const currentEntityIds = new Set(currentData.map(item => item.entityId));

        // Find items that were in previous week but not in current week
        const dropped = previousWeekData.filter(
          item => !currentEntityIds.has(item.entityId)
        );

        // Sort by rank from previous week (best rank first)
        const sortedDropped = dropped.sort((a, b) => {
          const rankA = typeof a.rank === 'number' ? a.rank : 999;
          const rankB = typeof b.rank === 'number' ? b.rank : 999;
          return rankA - rankB;
        });

        if (!cancelled) setDroppedItems(sortedDropped);
      } catch (error) {
        console.error('Error fetching dropped items:', error);
        if (!cancelled) setDroppedItems([]);
      }
    };

    fetchDroppedItems();

    return () => {
      cancelled = true;
    };
  }, [chartId, chartType, currentWeek, currentData, enabled]);

  return droppedItems;
}
