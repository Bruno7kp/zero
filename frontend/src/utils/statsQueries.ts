// Utilities for querying statistics from IndexedDB
import { db } from '../db/indexedDb';
import type { ChartData } from '../db/indexedDb';

export interface StatsFilters {
  chartId: string;
  chartType: string;
  year?: string;
  position?: number;
  positionOperator?: 'eq' | 'lte';
}

/**
 * Get all weeks for a given chart type from IndexedDB
 */
export async function getAllWeeks(chartId: string, chartType: string): Promise<string[]> {
  const uniqueWeeks = new Set<string>();
  const data = await db.charts_data
    .where('[chartId+chartType]')
    .equals([chartId, chartType])
    .toArray();
  
  data.forEach(item => uniqueWeeks.add(item.week));
  return Array.from(uniqueWeeks).sort();
}

/**
 * Get year range for a chart
 */
export async function getYearRange(chartId: string, chartType: string): Promise<{ minYear: number; maxYear: number }> {
  const weeks = await getAllWeeks(chartId, chartType);
  if (weeks.length === 0) {
    const currentYear = new Date().getFullYear();
    return { minYear: currentYear, maxYear: currentYear };
  }
  
  const years = weeks.map(w => parseInt(w.split('-')[0]));
  return {
    minYear: Math.min(...years),
    maxYear: Math.max(...years)
  };
}

/**
 * Get all items that reached a specific rank
 */
export async function getItemsAtRank(filters: StatsFilters & { rank: number }): Promise<ChartData[]> {
  const query = db.charts_data
    .where('[chartId+chartType]')
    .equals([filters.chartId, filters.chartType]);
  
  let data = await query.toArray();
  
  // Filter by rank
  data = data.filter(item => item.rank === filters.rank);
  
  // Filter by year if specified
  if (filters.year && filters.year !== 'all') {
    data = data.filter(item => item.week.startsWith(filters.year!));
  }
  
  return data;
}

/**
 * Get times each entity appeared at a specific rank
 */
export async function getTimesAtRank(filters: StatsFilters & { rank: number }): Promise<Array<{
  entityId: string;
  name: string;
  artistName: string;
  count: number;
}>> {
  const items = await getItemsAtRank(filters);
  
  const grouped = new Map<string, { name: string; artistName: string; count: number }>();
  
  items.forEach(item => {
    const existing = grouped.get(item.entityId);
    if (existing) {
      existing.count++;
    } else {
      grouped.set(item.entityId, {
        name: item.name,
        artistName: item.artistName,
        count: 1
      });
    }
  });
  
  return Array.from(grouped.entries()).map(([entityId, data]) => ({
    entityId,
    ...data
  })).sort((a, b) => b.count - a.count);
}

/**
 * Get times each entity appeared in top N positions
 */
export async function getTimesInTopN(filters: StatsFilters & { topN: number }): Promise<Array<{
  entityId: string;
  name: string;
  artistName: string;
  count: number;
}>> {
  const query = db.charts_data
    .where('[chartId+chartType]')
    .equals([filters.chartId, filters.chartType]);
  
  let data = await query.toArray();
  
  // Filter by position <= topN
  data = data.filter(item => item.rank <= filters.topN);
  
  // Filter by year if specified
  if (filters.year && filters.year !== 'all') {
    data = data.filter(item => item.week.startsWith(filters.year!));
  }
  
  const grouped = new Map<string, { name: string; artistName: string; count: number }>();
  
  data.forEach(item => {
    const existing = grouped.get(item.entityId);
    if (existing) {
      existing.count++;
    } else {
      grouped.set(item.entityId, {
        name: item.name,
        artistName: item.artistName,
        count: 1
      });
    }
  });
  
  return Array.from(grouped.entries()).map(([entityId, data]) => ({
    entityId,
    ...data
  })).sort((a, b) => b.count - a.count);
}

/**
 * Get items with highest plays in a single week
 */
export async function getHighestPlays(filters: StatsFilters): Promise<ChartData[]> {
  const query = db.charts_data
    .where('[chartId+chartType]')
    .equals([filters.chartId, filters.chartType]);
  
  let data = await query.toArray();
  
  // Filter by position if specified
  if (filters.position && filters.positionOperator === 'eq') {
    data = data.filter(item => item.rank === filters.position);
  } else if (filters.position && filters.positionOperator === 'lte') {
    data = data.filter(item => item.rank <= filters.position!);
  }
  
  // Filter by year if specified
  if (filters.year && filters.year !== 'all') {
    data = data.filter(item => item.week.startsWith(filters.year!));
  }
  
  // Sort by plays descending
  return data.sort((a, b) => b.plays - a.plays);
}

/**
 * Get best debuts (first appearance on chart)
 */
export async function getBestDebuts(filters: StatsFilters): Promise<ChartData[]> {
  const query = db.charts_data
    .where('[chartId+chartType]')
    .equals([filters.chartId, filters.chartType]);
  
  const allData = await query.toArray();
  
  // Group by entity to find first appearance overall
  const firstAppearances = new Map<string, ChartData>();
  
  // Sort by week to process chronologically
  allData.sort((a, b) => a.week.localeCompare(b.week));
  
  allData.forEach(item => {
    if (!firstAppearances.has(item.entityId)) {
      firstAppearances.set(item.entityId, item);
    }
  });
  
  let debuts = Array.from(firstAppearances.values());
  
  // Filter by year if specified - only keep items that actually debuted in that year
  if (filters.year && filters.year !== 'all') {
    debuts = debuts.filter(item => item.week.startsWith(filters.year!));
  }
  
  // Filter by position if specified
  if (filters.position && filters.positionOperator === 'eq') {
    debuts = debuts.filter(item => item.rank === filters.position);
  } else if (filters.position && filters.positionOperator === 'lte') {
    debuts = debuts.filter(item => item.rank <= filters.position!);
  }
  
  // Sort by plays descending (not rank)
  return debuts.sort((a, b) => b.plays - a.plays);
}

/**
 * Get total points for each entity
 */
export async function getPointsAccumulators(filters: StatsFilters): Promise<Array<{
  entityId: string;
  name: string;
  artistName: string;
  totalPoints: number;
  weeksOnChart: number;
}>> {
  const query = db.charts_data
    .where('[chartId+chartType]')
    .equals([filters.chartId, filters.chartType]);
  
  let data = await query.toArray();
  
  // Filter by year if specified
  if (filters.year && filters.year !== 'all') {
    data = data.filter(item => item.week.startsWith(filters.year!));
  }
  
  const grouped = new Map<string, {
    name: string;
    artistName: string;
    totalPoints: number;
    weeksOnChart: number;
  }>();
  
  data.forEach(item => {
    // Points calculation: 101 - rank (so #1 = 100 points, #2 = 99 points, etc.)
    // For positions beyond 100, we still give 1 point minimum
    const points = Math.max(1, 101 - item.rank);
    
    const existing = grouped.get(item.entityId);
    if (existing) {
      existing.totalPoints += points;
      existing.weeksOnChart++;
    } else {
      grouped.set(item.entityId, {
        name: item.name,
        artistName: item.artistName,
        totalPoints: points,
        weeksOnChart: 1
      });
    }
  });
  
  return Array.from(grouped.entries()).map(([entityId, data]) => ({
    entityId,
    ...data
  })).sort((a, b) => b.totalPoints - a.totalPoints);
}

/**
 * Get Perfect All Kill records (artist simultaneously #1 in all three categories)
 */
export async function getPerfectAllKills(chartId: string, year?: string): Promise<Array<{
  week: string;
  artistName: string;
  albumName: string;
  trackName: string;
  artistEntityId: string;
  albumEntityId: string;
  trackEntityId: string;
}>> {
  const weeks = await getAllWeeks(chartId, 'artist');
  const filteredWeeks = year && year !== 'all' 
    ? weeks.filter(w => w.startsWith(year))
    : weeks;
  
  const allKills: Array<{
    week: string;
    artistName: string;
    albumName: string;
    trackName: string;
    artistEntityId: string;
    albumEntityId: string;
    trackEntityId: string;
  }> = [];
  
  for (const week of filteredWeeks) {
    // Get #1 for each type
    const artistTop1 = await db.charts_data
      .where('[chartId+chartType+week]')
      .equals([chartId, 'artist', week])
      .and(item => item.rank === 1)
      .first();
    
    const albumTop1 = await db.charts_data
      .where('[chartId+chartType+week]')
      .equals([chartId, 'album', week])
      .and(item => item.rank === 1)
      .first();
    
    const trackTop1 = await db.charts_data
      .where('[chartId+chartType+week]')
      .equals([chartId, 'track', week])
      .and(item => item.rank === 1)
      .first();
    
    if (artistTop1 && albumTop1 && trackTop1) {
      // Check if the artist is the same for all three
      if (artistTop1.name === albumTop1.artistName && 
          artistTop1.name === trackTop1.artistName) {
        allKills.push({
          week,
          artistName: artistTop1.name,
          albumName: albumTop1.name,
          trackName: trackTop1.name,
          artistEntityId: artistTop1.entityId,
          albumEntityId: albumTop1.entityId,
          trackEntityId: trackTop1.entityId
        });
      }
    }
  }
  
  return allKills;
}

/**
 * Get artists with most items at specific rank
 */
export async function getArtistsWithMostAtRank(filters: {
  chartId: string;
  chartType: 'album' | 'track';
  rank: number;
  year?: string;
}): Promise<Array<{
  artistName: string;
  itemsCount: number;
  totalWeeks: number;
  items: Array<{ entityId: string; name: string; count: number }>;
}>> {
  // Get all items in top N (rank <= filters.rank)
  const query = db.charts_data
    .where('[chartId+chartType]')
    .equals([filters.chartId, filters.chartType]);
  
  const allItems = await query.toArray();
  
  // Filter by rank (<=) and year
  const items = allItems.filter(item => {
    if (item.rank > filters.rank) return false;
    if (filters.year && !item.week.startsWith(filters.year)) return false;
    return true;
  });
  
  // Group by artist
  const byArtist = new Map<string, {
    items: Map<string, { name: string; count: number }>;
    totalWeeks: number;
  }>();
  
  items.forEach(item => {
    const artist = item.artistName;
    if (!byArtist.has(artist)) {
      byArtist.set(artist, {
        items: new Map(),
        totalWeeks: 0
      });
    }
    
    const artistData = byArtist.get(artist)!;
    artistData.totalWeeks++;
    
    const existing = artistData.items.get(item.entityId);
    if (existing) {
      existing.count++;
    } else {
      artistData.items.set(item.entityId, {
        name: item.name,
        count: 1
      });
    }
  });
  
  return Array.from(byArtist.entries()).map(([artistName, data]) => ({
    artistName,
    itemsCount: data.items.size,
    totalWeeks: data.totalWeeks,
    items: Array.from(data.items.entries()).map(([entityId, itemData]) => ({
      entityId,
      ...itemData
    }))
  })).sort((a, b) => b.itemsCount - a.itemsCount || b.totalWeeks - a.totalWeeks);
}

/**
 * Calculate sales using formula: (plays * weightPlays) + (points * weightPoints)
 */
export function calculateSales(
  plays: number,
  rank: number,
  weightPlays: number,
  weightPoints: number
): number {
  const points = Math.max(1, 101 - rank);
  return (plays * weightPlays) + (points * weightPoints);
}
