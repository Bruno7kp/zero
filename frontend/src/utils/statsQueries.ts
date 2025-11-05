// Utilities for querying statistics from IndexedDB
import { db } from '../db/indexedDb';
import type { ChartData } from '../db/indexedDb';
import dayjs from 'dayjs';

export interface StatsFilters {
  chartId: string;
  chartType: string;
  year?: string;
  position?: number;
  positionOperator?: 'eq' | 'lte';
  weekStart?: string;
  weekEnd?: string;
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
export async function getYearRange(
  chartId: string,
  chartType: string
): Promise<{ minYear: number; maxYear: number }> {
  const weeks = await getAllWeeks(chartId, chartType);
  if (weeks.length === 0) {
    const currentYear = new Date().getFullYear();
    return { minYear: currentYear, maxYear: currentYear };
  }

  const years = weeks.map(w => parseInt(w.split('-')[0]));
  return {
    minYear: Math.min(...years),
    maxYear: Math.max(...years),
  };
}

/**
 * Get all items that reached a specific rank
 */
export async function getItemsAtRank(
  filters: StatsFilters & { rank: number }
): Promise<ChartData[]> {
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
export async function getTimesAtRank(filters: StatsFilters & { rank: number }): Promise<
  Array<{
    entityId: string;
    name: string;
    artistName: string;
    count: number;
  }>
> {
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
        count: 1,
      });
    }
  });

  return Array.from(grouped.entries())
    .map(([entityId, data]) => ({
      entityId,
      ...data,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Get times each entity appeared in top N positions
 */
export async function getTimesInTopN(
  filters: StatsFilters & { topN: number; weekStart?: string; weekEnd?: string }
): Promise<
  Array<{
    entityId: string;
    name: string;
    artistName: string;
    count: number;
  }>
> {
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

  // Filter by week range if specified
  if (filters.weekStart) {
    data = data.filter(item => item.week >= filters.weekStart!);
  }
  if (filters.weekEnd) {
    data = data.filter(item => item.week <= filters.weekEnd!);
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
        count: 1,
      });
    }
  });

  return Array.from(grouped.entries())
    .map(([entityId, data]) => ({
      entityId,
      ...data,
    }))
    .sort((a, b) => b.count - a.count);
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
export async function getPointsAccumulators(filters: StatsFilters): Promise<
  Array<{
    entityId: string;
    name: string;
    artistName: string;
    totalPoints: number;
    weeksOnChart: number;
  }>
> {
  const query = db.charts_data
    .where('[chartId+chartType]')
    .equals([filters.chartId, filters.chartType]);

  let data = await query.toArray();

  // Filter by year if specified
  if (filters.year && filters.year !== 'all') {
    data = data.filter(item => item.week.startsWith(filters.year!));
  }

  // Filter by week range if specified
  if (filters.weekStart) {
    data = data.filter(item => item.week >= filters.weekStart!);
  }
  if (filters.weekEnd) {
    data = data.filter(item => item.week <= filters.weekEnd!);
  }

  const grouped = new Map<
    string,
    {
      name: string;
      artistName: string;
      totalPoints: number;
      weeksOnChart: number;
    }
  >();

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
        weeksOnChart: 1,
      });
    }
  });

  return Array.from(grouped.entries())
    .map(([entityId, data]) => ({
      entityId,
      ...data,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);
}

/**
 * Get Perfect All Kill records (artist simultaneously #1 in all three categories)
 */
export async function getPerfectAllKills(
  chartId: string,
  year?: string
): Promise<
  Array<{
    week: string;
    artistName: string;
    albumName: string;
    trackName: string;
    artistEntityId: string;
    albumEntityId: string;
    trackEntityId: string;
  }>
> {
  const weeks = await getAllWeeks(chartId, 'artist');
  const filteredWeeks = year && year !== 'all' ? weeks.filter(w => w.startsWith(year)) : weeks;

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
      if (artistTop1.name === albumTop1.artistName && artistTop1.name === trackTop1.artistName) {
        allKills.push({
          week,
          artistName: artistTop1.name,
          albumName: albumTop1.name,
          trackName: trackTop1.name,
          artistEntityId: artistTop1.entityId,
          albumEntityId: albumTop1.entityId,
          trackEntityId: trackTop1.entityId,
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
}): Promise<
  Array<{
    artistName: string;
    itemsCount: number;
    totalWeeks: number;
    items: Array<{ entityId: string; name: string; count: number }>;
  }>
> {
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
  const byArtist = new Map<
    string,
    {
      items: Map<string, { name: string; count: number }>;
      totalWeeks: number;
    }
  >();

  items.forEach(item => {
    const artist = item.artistName;
    if (!byArtist.has(artist)) {
      byArtist.set(artist, {
        items: new Map(),
        totalWeeks: 0,
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
        count: 1,
      });
    }
  });

  return Array.from(byArtist.entries())
    .map(([artistName, data]) => ({
      artistName,
      itemsCount: data.items.size,
      totalWeeks: data.totalWeeks,
      items: Array.from(data.items.entries()).map(([entityId, itemData]) => ({
        entityId,
        ...itemData,
      })),
    }))
    .sort((a, b) => b.itemsCount - a.itemsCount || b.totalWeeks - a.totalWeeks);
}

/**
 * Calculate sales using formula: (plays * weightPlays) + (stabilityPoints * weightPoints)
 * stabilityPoints = 101 - rank (matches calculateWeekFormulaValue from certification.ts)
 */
export function calculateSales(
  plays: number,
  rank: number,
  weightPlays: number,
  weightPoints: number
): number {
  const stabilityPoints = Math.max(0, 101 - rank);
  return plays * weightPlays + stabilityPoints * weightPoints;
}

/**
 * Get artists with most debuts at top N positions
 */
export async function getArtistsWithMostDebutsAtOne(filters: {
  chartId: string;
  chartType: 'album' | 'track';
  rank: number;
  year?: string;
}): Promise<
  Array<{
    artistName: string;
    itemsCount: number;
  }>
> {
  // Get all items at or above the specified rank (rank <= filters.rank)
  const query = db.charts_data
    .where('[chartId+chartType]')
    .equals([filters.chartId, filters.chartType]);

  const allItems = await query.toArray();

  // Filter by rank (<=) and year
  const itemsInTopN = allItems.filter(item => {
    if (item.rank > filters.rank) return false;
    if (filters.year && !item.week.startsWith(filters.year)) return false;
    return true;
  });

  // Get all items to identify debuts (first appearance)
  const allItemsByEntity = new Map<string, string[]>();
  allItems.forEach(item => {
    if (!allItemsByEntity.has(item.entityId)) {
      allItemsByEntity.set(item.entityId, []);
    }
    allItemsByEntity.get(item.entityId)!.push(item.week);
  });

  // Sort weeks to find first appearance
  allItemsByEntity.forEach(weeks => {
    weeks.sort();
  });

  // Filter items in top N that are debuts
  const debutsInTopN = itemsInTopN.filter(item => {
    const weeks = allItemsByEntity.get(item.entityId);
    if (!weeks || weeks.length === 0) return false;
    // First week is the debut
    return weeks[0] === item.week;
  });

  // Group by artist
  const byArtist = new Map<string, number>();

  debutsInTopN.forEach(item => {
    const artist = item.artistName;
    byArtist.set(artist, (byArtist.get(artist) || 0) + 1);
  });

  return Array.from(byArtist.entries())
    .map(([artistName, itemsCount]) => ({
      artistName,
      itemsCount,
    }))
    .sort((a, b) => b.itemsCount - a.itemsCount);
}

/**
 * Get longest consecutive sequences at #1 for each entity
 */
export async function getLongestConsecutiveAtOne(filters: StatsFilters & { rank?: number }) {
  const query = db.charts_data
    .where('[chartId+chartType]')
    .equals([filters.chartId, filters.chartType]);

  let data = await query.toArray();

  // Filter by year if specified
  if (filters.year && filters.year !== 'all') {
    data = data.filter(item => item.week.startsWith(filters.year!));
  }

  // Determine which rows count for the sequence:
  // - If filters.position is provided, support positionOperator (eq | lte).
  //   For this page we commonly use positionOperator === 'lte' to mean "top N".
  // - Otherwise, fall back to filters.rank (or default to 1).
  let rankRows: ChartData[] = [];
  if (typeof (filters as any).position === 'number') {
    const pos = (filters as any).position as number;
    const op = (filters as any).positionOperator || 'lte';
    if (op === 'lte') {
      rankRows = data.filter(item => item.rank <= pos);
    } else {
      rankRows = data.filter(item => item.rank === pos);
    }
  } else {
    const rankToCheck = filters.rank ?? 1;
    rankRows = data.filter(item => item.rank === rankToCheck);
  }

  // Group by entityId
  const byEntity = new Map<string, { name: string; artistName: string; weeks: string[] }>();
  rankRows.forEach(item => {
    if (!byEntity.has(item.entityId))
      byEntity.set(item.entityId, { name: item.name, artistName: item.artistName, weeks: [] });
    byEntity.get(item.entityId)!.weeks.push(item.week);
  });

  const results: Array<{
    entityId: string;
    name: string;
    artistName: string;
    longest: number;
    startWeek?: string | null;
    endWeek?: string | null;
  }> = [];

  for (const [entityId, info] of byEntity.entries()) {
    const weeks = info.weeks.sort();
    let longest = 0;
    let current = 0;
    let prevDate: number | null = null;
    let currentStart: string | null = null;
    let bestStart: string | null = null;
    let bestEnd: string | null = null;

    for (const w of weeks) {
      const d = new Date(w).getTime();
      if (prevDate == null) {
        // start new sequence
        current = 1;
        currentStart = w;
      } else {
        // consecutive week if exactly 7 days apart
        if (d - prevDate === 7 * 86400000) {
          current++;
        } else {
          // sequence broken, reset
          current = 1;
          currentStart = w;
        }
      }
      if (current > longest) {
        longest = current;
        bestStart = currentStart;
        bestEnd = w;
      }
      prevDate = d;
    }

    results.push({
      entityId,
      name: info.name,
      artistName: info.artistName,
      longest,
      startWeek: bestStart,
      endWeek: bestEnd,
    });
  }

  return results.sort((a, b) => b.longest - a.longest);
}

/**
 * For each entity that eventually reached #1, compute how many weeks passed from its
 * first appearance on the chart to the first week it reached rank 1.
 * Returns entries sorted by weeksToFirstNumberOne (desc).
 */
export async function getWeeksToFirstNumberOne(filters: StatsFilters): Promise<
  Array<{
    entityId: string;
    name: string;
    artistName?: string | null;
    firstWeek: string;
    weekReachedOne: string;
    weeksToFirstNumberOne: number;
  }>
> {
  const query = db.charts_data
    .where('[chartId+chartType]')
    .equals([filters.chartId, filters.chartType]);

  const data = await query.toArray();
  const targetYear = filters.year && filters.year !== 'all' ? filters.year : null;

  // Group all weeks per entity (chronological)
  const byEntity = new Map<
    string,
    { name: string; artistName?: string | null; weeks: Array<{ week: string; rank: number }> }
  >();

  data.forEach(item => {
    if (!byEntity.has(item.entityId)) {
      byEntity.set(item.entityId, { name: item.name, artistName: item.artistName, weeks: [] });
    }
    byEntity.get(item.entityId)!.weeks.push({ week: item.week, rank: item.rank });
  });

  const results: Array<{
    entityId: string;
    name: string;
    artistName?: string | null;
    firstWeek: string;
    weekReachedOne: string;
    weeksToFirstNumberOne: number;
  }> = [];

  for (const [entityId, info] of byEntity.entries()) {
    // sort weeks
    const weeksSorted = info.weeks.sort((a, b) => a.week.localeCompare(b.week));
    if (weeksSorted.length === 0) continue;

    const firstWeek = weeksSorted[0].week;
    const indexOne = weeksSorted.findIndex(w => w.rank === 1);
    if (indexOne === -1) continue; // never reached #1

    const weekReachedOne = weeksSorted[indexOne].week;
    if (targetYear && !weekReachedOne.startsWith(targetYear)) continue;

    // Calculate weeks based on date difference, not chart presence
    // Each week represents 7 days, so we count how many 7-day periods passed
    const firstWeekDate = dayjs(firstWeek);
    const weekReachedOneDate = dayjs(weekReachedOne);
    const weeksToFirstNumberOne = Math.max(
      0,
      Math.floor(weekReachedOneDate.diff(firstWeekDate, 'week'))
    );

    results.push({
      entityId,
      name: info.name,
      artistName: info.artistName,
      firstWeek,
      weekReachedOne,
      weeksToFirstNumberOne,
    });
  }

  return results.sort(
    (a, b) => b.weeksToFirstNumberOne - a.weeksToFirstNumberOne || a.name.localeCompare(b.name)
  );
}

/**
 * Get artists with the highest number of distinct items appearing simultaneously in the same week.
 * For each artist, compute the maximum number of distinct entityIds present in any single week.
 */
export async function getArtistsWithMostSimultaneousItems(filters: {
  chartId: string;
  chartType: 'album' | 'track';
  year?: string;
  topN?: number; // optional: consider only ranks <= topN
}): Promise<
  Array<{
    artistName: string;
    maxSimultaneous: number;
    totalWeeks: number; // number of weeks artist had at least one item
    sampleEntityId?: string | null;
    sampleWeek?: string | null;
  }>
> {
  const query = db.charts_data
    .where('[chartId+chartType]')
    .equals([filters.chartId, filters.chartType]);

  let data = await query.toArray();

  // Filter by year if specified
  if (filters.year && filters.year !== 'all') {
    data = data.filter(item => item.week.startsWith(filters.year!));
  }

  // If topN is provided, only consider rows with rank <= topN
  if (typeof filters.topN === 'number') {
    data = data.filter(item => item.rank <= filters.topN!);
  }

  // Map week -> artist -> set(entityId)
  const weekArtistMap = new Map<string, Map<string, Set<string>>>();

  data.forEach(item => {
    if (!weekArtistMap.has(item.week)) weekArtistMap.set(item.week, new Map());
    const artistMap = weekArtistMap.get(item.week)!;
    const artist = item.artistName || 'Unknown';
    if (!artistMap.has(artist)) artistMap.set(artist, new Set());
    artistMap.get(artist)!.add(item.entityId);
  });

  // Aggregate per artist
  const byArtist = new Map<
    string,
    {
      maxSimultaneous: number;
      totalWeeks: number;
      sampleEntityId?: string | null;
      sampleWeek?: string | null;
    }
  >();

  for (const [week, artistMap] of weekArtistMap.entries()) {
    for (const [artistName, setOfEntities] of artistMap.entries()) {
      const count = setOfEntities.size;
      const sample = setOfEntities.values().next();
      const sampleId = sample.done ? null : sample.value;

      if (!byArtist.has(artistName)) {
        byArtist.set(artistName, {
          maxSimultaneous: count,
          totalWeeks: 1,
          sampleEntityId: sampleId,
          sampleWeek: sampleId ? week : null,
        });
      } else {
        const existing = byArtist.get(artistName)!;
        if (count > existing.maxSimultaneous) {
          existing.maxSimultaneous = count;
          existing.sampleEntityId = sampleId;
          existing.sampleWeek = sampleId ? week : null;
        }
        existing.totalWeeks += 1;
        if (!existing.sampleEntityId && sampleId) existing.sampleEntityId = sampleId;
      }
    }
  }

  return Array.from(byArtist.entries())
    .map(([artistName, d]) => ({ artistName, ...d }))
    .sort((a, b) => b.maxSimultaneous - a.maxSimultaneous || b.totalWeeks - a.totalWeeks);
}
