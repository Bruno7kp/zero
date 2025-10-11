import dayjs from 'dayjs';
import { db } from '../db/indexedDb';
import { getTrackInfo, getAlbumInfo, getArtistInfo } from '../services/lastfm';

// Memory layer to avoid hitting IndexedDB repeatedly within same session
const memCache: Record<string, { value: number; expires: number }> = {};
// In-flight requests de-duplication to avoid concurrent duplicate fetches
const inflight: Record<string, Promise<number>> = {};

export interface CertificationResult {
  totalFormula: number; // weighted total
  level: 'none' | 'gold' | 'platinum' | 'diamond';
  multiplier: number; // e.g. 2 for 2x platinum
  nextTarget: number | null; // absolute value needed for next cert (formula units)
  remainingToNext: number | null; // how much still needed
  playcountUsed: number; // last.fm playcount used (0 if not fetched)
  nextType?: 'same' | 'higher'; // whether the chosen target is next multiple of current or higher tier
  nextLevel?: 'gold' | 'platinum' | 'diamond' | null; // target level for higher tier, or current level for same
  nextMultiple?: number | null; // if nextType === 'same', the multiple (e.g., 4 for 4x platinum)
}

interface FetchPlaycountArgs {
  username: string;
  artist: string;
  album?: string;
  track?: string;
  enabled: boolean; // false when plays weight 0 or offline
  cacheUntil: string; // ISO date when cache should expire
}

async function getCached(key: string): Promise<number | null> {
  const now = Date.now();
  const mem = memCache[key];
  if (mem && mem.expires > now) return mem.value;
  const dbEntry = await db.playcount_cache.get(key);
  if (dbEntry && dbEntry.expires > now) {
    memCache[key] = { value: dbEntry.value, expires: dbEntry.expires };
    return dbEntry.value;
  }
  return null;
}

async function setCached(key: string, value: number, expires: number) {
  memCache[key] = { value, expires };
  try { await db.playcount_cache.put({ key, value, expires }); } catch {/* ignore */}
}

async function fetchPlaycount({ username, artist, album, track, enabled, cacheUntil }: FetchPlaycountArgs): Promise<number> {
  if (!enabled) return 0;
  const key = `pc:${username}:${artist}:${album || ''}:${track || ''}`;
  const cached = await getCached(key);
  if (cached !== null) return cached;

  try {
    let data: any = null;
    if (track) data = await getTrackInfo(username, artist, track);
    else if (album) data = await getAlbumInfo(username, artist, album);
    else data = await getArtistInfo(username, artist);
    if (!data) return 0;
    let pc = 0;
    const userPcRaw = track || album ? data?.userplaycount : data?.stats?.userplaycount;
    if (track && userPcRaw !== undefined) pc = parseInt(userPcRaw, 10) || 0;
    if (album && userPcRaw !== undefined) pc = parseInt(userPcRaw, 10) || 0;
    if (!track && !album && userPcRaw !== undefined) pc = parseInt(userPcRaw, 10) || 0;
    // Só cacheia se a API retornou userplaycount (evita travar em 0 quando faltou username param ou dado ausente)
    if (userPcRaw !== undefined) {
      const exp = dayjs(cacheUntil).toDate().getTime();
      await setCached(key, pc, exp);
    }
    return pc;
  } catch {
    return 0; // fail silently
  }
}

export interface ComputeCertificationParams {
  chart: any; // chart config (weights and thresholds)
  chartType: 'album' | 'track';
  totals: { totalPoints?: number; totalPlays?: number };
  entity: { name: string; artistName: string };
  username?: string; // last.fm username stored in chart
  offline?: boolean;
  nextWeekDay?: number; // target day-of-week from chart config
}

export async function computeCertification(params: ComputeCertificationParams & { force?: boolean }): Promise<CertificationResult> {
  const { chart, chartType, totals, entity, username, offline, nextWeekDay, force } = params;
  const pointsWeight = chartType === 'track' ? (chart.music_points_weight || 0) : (chart.album_points_weight || 0);
  const playsWeight = chartType === 'track' ? (chart.music_plays_weight || 0) : (chart.album_plays_weight || 0);
  const gold = chartType === 'track' ? (chart.music_gold_value || 0) : (chart.album_gold_value || 0);
  const platinum = chartType === 'track' ? (chart.music_platinum_value || 0) : (chart.album_platinum_value || 0);
  const diamond = chartType === 'track' ? (chart.music_diamond_value || 0) : (chart.album_diamond_value || 0);

  const stabilityPoints = totals.totalPoints || 0;
  let userPlaycount = 0;

  // Determine cache expiry (next configured day_of_week or +7 days fallback)
  let cacheUntil = dayjs().add(7, 'day');
  if (typeof nextWeekDay === 'number') {
    let d = dayjs();
    while (d.day() !== nextWeekDay) {
      d = d.add(1, 'day');
    }
    cacheUntil = d.endOf('day');
  }

  if (playsWeight > 0 && !offline && username) {
    if (force) {
      // Invalida cache para esta chave
      const key = `pc:${username}:${entity.artistName}:${chartType === 'album' ? entity.name : ''}:${chartType === 'track' ? entity.name : ''}`;
      try { await db.playcount_cache.delete(key); } catch {/* ignore */}
      delete memCache[key];
    }
    userPlaycount = await fetchPlaycount({
      username,
      artist: entity.artistName,
      album: chartType === 'album' ? entity.name : undefined,
      track: chartType === 'track' ? entity.name : undefined,
      enabled: true,
      cacheUntil: cacheUntil.toISOString(),
    });
  }

  const totalFormula = stabilityPoints * pointsWeight + userPlaycount * playsWeight;

  let level: CertificationResult['level'] = 'none';
  let multiplier = 0;
  let nextTarget: number | null = null;
  let remainingToNext: number | null = null;
  let nextType: CertificationResult['nextType'] = undefined;
  let nextLevel: CertificationResult['nextLevel'] = null;
  let nextMultiple: number | null = null;

  const thresholds = [
    { type: 'gold' as const, value: gold },
    { type: 'platinum' as const, value: platinum },
    { type: 'diamond' as const, value: diamond },
  ].filter(t => t.value > 0).sort((a, b) => a.value - b.value);

  if (thresholds.length) {
    // Highest threshold not exceeding totalFormula sets level
    const achieved = thresholds.filter(t => totalFormula >= t.value);
    if (achieved.length) {
      const current = achieved[achieved.length - 1];
      level = current.type;
      multiplier = Math.floor(totalFormula / current.value);
      const nextHigher = thresholds.find(t => t.value > current.value);
      const nextMultipleTarget = (multiplier + 1) * current.value;
      const remainingToNextMultiple = nextMultipleTarget - totalFormula;
      if (nextHigher) {
        const remainingToHigher = nextHigher.value - totalFormula;
        // Choose whichever target is closer: next multiple of current vs next higher tier
        if (remainingToHigher <= remainingToNextMultiple) {
          nextTarget = nextHigher.value;
          remainingToNext = Math.max(0, remainingToHigher);
          nextType = 'higher';
          nextLevel = nextHigher.type;
          nextMultiple = null;
        } else {
          nextTarget = nextMultipleTarget;
          remainingToNext = remainingToNextMultiple;
          nextType = 'same';
          nextLevel = current.type;
          nextMultiple = multiplier + 1;
        }
      } else {
        // Only multiples exist (already at top tier)
        nextTarget = nextMultipleTarget;
        remainingToNext = remainingToNextMultiple;
        nextType = 'same';
        nextLevel = current.type;
        nextMultiple = multiplier + 1;
      }
    } else {
      // Not yet gold; next is first threshold
      nextTarget = thresholds[0].value;
      remainingToNext = thresholds[0].value - totalFormula;
      nextType = 'higher';
      nextLevel = thresholds[0].type;
    }
  }

  return { totalFormula, level, multiplier, nextTarget, remainingToNext, playcountUsed: userPlaycount, nextType, nextLevel, nextMultiple };
}

/**
 * Calculate formula value for a chart entity in the current week
 * Formula: (plays * playsWeight) + (stabilityPoints * pointsWeight)
 */
export type FormulaChartType = 'album' | 'track' | 'artist' | string;

function resolveFormulaChartType(chartType: FormulaChartType): 'album' | 'track' {
  return chartType === 'track' ? 'track' : 'album';
}

export function calculateWeekFormulaValue(params: {
  chart: any;
  chartType: FormulaChartType;
  rank: number | null | undefined;
  plays: number | null | undefined;
}): number {
  const { chart, chartType, rank, plays } = params;
  if (!chart) return 0;
  const effectiveType = resolveFormulaChartType(chartType);
  const pointsWeight = effectiveType === 'track' ? Number(chart.music_points_weight || 0) : Number(chart.album_points_weight || 0);
  const playsWeight = effectiveType === 'track' ? Number(chart.music_plays_weight || 0) : Number(chart.album_plays_weight || 0);
  const rankNumber = typeof rank === 'number' ? rank : null;
  const stabilityPoints = rankNumber != null && rankNumber > 0 ? Math.max(0, 101 - rankNumber) : 0;
  const safePlays = typeof plays === 'number' ? plays : 0;
  return stabilityPoints * pointsWeight + safePlays * playsWeight;
}

export interface WeeklyFormulaMetrics {
  currentValue: number | null;
  previousValue: number | null;
  delta: number | string | null;
}

export function computeWeeklyFormulaMetrics(params: {
  chart: any;
  chartType: FormulaChartType;
  rank: number | null | undefined;
  plays: number | null | undefined;
  deltaRank: any;
  deltaPlays: any;
}): WeeklyFormulaMetrics {
  const { chart, chartType, rank, plays, deltaRank, deltaPlays } = params;
  if (!chart) {
    return { currentValue: null, previousValue: null, delta: null };
  }
  const effectiveType = resolveFormulaChartType(chartType);
  const currentRaw = calculateWeekFormulaValue({ chart, chartType: effectiveType, rank, plays });
  const currentValue = Number.isFinite(currentRaw) ? Math.round(currentRaw) : null;

  if (deltaPlays === 'NEW' || deltaPlays === 'RE') {
    return { currentValue, previousValue: null, delta: deltaPlays };
  }

  let previousValue: number | null = null;
  let delta: number | string | null = null;

  if (typeof deltaPlays === 'number') {
    const numericRank = typeof rank === 'number' ? rank : null;
    const derivedPreviousRank = numericRank != null
      ? (typeof deltaRank === 'number' ? numericRank + deltaRank : numericRank)
      : null;
    const previousRank = derivedPreviousRank != null && derivedPreviousRank > 0 ? derivedPreviousRank : null;
    const previousPlays = typeof plays === 'number' ? Math.max(0, plays - deltaPlays) : null;
    if (previousRank != null && previousPlays != null) {
      const prevRaw = calculateWeekFormulaValue({ chart, chartType: effectiveType, rank: previousRank, plays: previousPlays });
      previousValue = Number.isFinite(prevRaw) ? Math.round(prevRaw) : null;
    }
    if (previousValue != null && currentValue != null) {
      delta = currentValue - previousValue;
    }
    if (delta == null && typeof deltaPlays === 'number' && currentValue != null) {
      const playsWeight = effectiveType === 'track' ? Number(chart.music_plays_weight || 0) : Number(chart.album_plays_weight || 0);
      const approxDelta = Math.round(deltaPlays * playsWeight);
      delta = approxDelta;
      if (previousValue == null) previousValue = currentValue - approxDelta;
    }
    if (previousValue != null) previousValue = Math.max(0, previousValue);
  } else if (deltaPlays != null) {
    delta = deltaPlays;
  }

  if (delta == null) delta = null;
  return { currentValue, previousValue, delta };
}

// Lightweight public helper to get user playcount with the same cache/expiry used by certification
export async function getUserPlaycountCached(args: {
  username?: string;
  artistName: string;
  entityName: string;
  chartType: 'artist' | 'album' | 'track';
  offline?: boolean;
  nextWeekDay?: number;
}): Promise<number> {
  const { username, artistName, entityName, chartType, offline, nextWeekDay } = args;
  if (!username || offline) return 0;

  // Determine cache expiry (next configured day_of_week or +7 days fallback)
  let cacheUntil = dayjs().add(7, 'day');
  if (typeof nextWeekDay === 'number') {
    let d = dayjs();
    while (d.day() !== nextWeekDay) d = d.add(1, 'day');
    cacheUntil = d.endOf('day');
  }

  const key = `pc:${username}:${artistName}:${chartType === 'album' ? entityName : ''}:${chartType === 'track' ? entityName : ''}`;
  const cached = await getCached(key);
  if (cached !== null) return cached;

  if (Object.prototype.hasOwnProperty.call(inflight, key)) return inflight[key];
  const p = fetchPlaycount({
    username,
    artist: artistName,
    album: chartType === 'album' ? entityName : undefined,
    track: chartType === 'track' ? entityName : undefined,
    enabled: true,
    cacheUntil: cacheUntil.toISOString(),
  }).finally(() => { delete inflight[key]; });
  inflight[key] = p;
  return p;
}
