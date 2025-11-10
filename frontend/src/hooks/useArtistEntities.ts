import { useEffect, useMemo, useState } from 'react';
import { db } from '../db/indexedDb';
import { getUserPlaycountCached } from '../utils/certification';

export interface ArtistEntitySummary {
  entityId: string;
  name: string;
  artistName: string;
  points: number;
  totalPlays: number;
  peak: number;
  weeks: number;
  timesAtPeak?: number;
  lastAppearance: string | null;
}

type ChartContext = {
  id?: string | number;
  lastfm_username?: string | null;
  offline?: boolean | null;
  day_of_week?: number | null;
} | null;

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();

const compareDates = (a: string | null, b: string | null) => {
  if (a == null) return b;
  if (b == null) return a;
  return a > b ? a : b;
};

export function useArtistEntities(
  chart: ChartContext,
  chartType: 'album' | 'track',
  artistName: string | undefined,
  options?: { limit?: number }
) {
  const [loading, setLoading] = useState(true);
  const [entities, setEntities] = useState<ArtistEntitySummary[]>([]);

  const chartId = chart?.id != null ? String(chart.id) : undefined;
  const username = chart?.lastfm_username || undefined;
  const offline = Boolean(chart?.offline);
  const nextWeekDay =
    typeof chart?.day_of_week === 'number' ? chart.day_of_week ?? undefined : undefined;
  const limit = options?.limit;

  const normalizedArtist = useMemo(() => {
    if (!artistName) return '';
    try {
      return normalize(artistName);
    } catch {
      return artistName.trim().toLowerCase();
    }
  }, [artistName]);

  useEffect(() => {
    let cancelled = false;

    async function fetchEntities() {
      if (!chartId || !normalizedArtist) {
        if (!cancelled) {
          setEntities([]);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      try {
        const rows = await db.charts_data
          .where('[chartId+chartType]')
          .equals([chartId, chartType])
          .toArray();

        const map = new Map<
          string,
          {
            entityId: string;
            name: string;
            artistName: string;
            points: number;
            totalPlays: number;
            peak: number;
            weeks: Set<string>;
            timesAtPeak: number;
            lastAppearance: string | null;
          }
        >();

        for (const row of rows) {
          const artistValue = row.artistName || row.name;
          let normalizedValue: string;
          try {
            normalizedValue = normalize(artistValue);
          } catch {
            normalizedValue = artistValue.trim().toLowerCase();
          }
          if (normalizedValue !== normalizedArtist) continue;

          const key = row.entityId || `${row.name}|||${row.artistName}`;
          if (!map.has(key)) {
            map.set(key, {
              entityId: row.entityId,
              name: row.name,
              artistName: row.artistName || artistName || row.name,
              points: 0,
              totalPlays: 0,
              peak: row.rank,
              weeks: new Set<string>(),
              timesAtPeak: 0,
              lastAppearance: null,
            });
          }
          const entry = map.get(key)!;
          entry.points += Math.max(0, 101 - row.rank);
          entry.totalPlays += row.plays || 0;
          entry.peak = Math.min(entry.peak, row.rank);
          if (row.rank === 1) {
            entry.timesAtPeak += 1;
          }
          entry.weeks.add(row.week);
          entry.lastAppearance = compareDates(entry.lastAppearance, row.week);
        }

        let list = Array.from(map.values()).map(entry => ({
          entityId: entry.entityId,
          name: entry.name,
          artistName: entry.artistName,
          points: entry.points,
          totalPlays: entry.totalPlays,
          peak: entry.peak,
          weeks: entry.weeks.size,
          timesAtPeak: entry.timesAtPeak,
          lastAppearance: entry.lastAppearance,
        }));

        // Refresh playcounts from Last.fm cache when available for consistency
        if (username && !offline && list.length) {
          const refreshed = await Promise.all(
            list.map(async item => {
              try {
                const playcount = await getUserPlaycountCached({
                  username,
                  artistName: item.artistName,
                  entityName: item.name,
                  chartType,
                  offline,
                  nextWeekDay,
                });
                if (Number.isFinite(playcount) && (playcount as number) > item.totalPlays) {
                  return { ...item, totalPlays: playcount as number };
                }
              } catch {
                /* ignore playcount refresh failures */
              }
              return item;
            })
          );
          list = refreshed;
        }

        list.sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (a.peak !== b.peak) return a.peak - b.peak;
          if (b.totalPlays !== a.totalPlays) return b.totalPlays - a.totalPlays;
          return (b.lastAppearance || '').localeCompare(a.lastAppearance || '');
        });

        if (typeof limit === 'number' && limit > 0) {
          list = list.slice(0, limit);
        }

        if (!cancelled) {
          setEntities(list);
        }
      } catch (error) {
        console.error('Failed to load artist entities', error);
        if (!cancelled) {
          setEntities([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchEntities();
    return () => {
      cancelled = true;
    };
  }, [chartId, chartType, normalizedArtist, username, offline, nextWeekDay, limit, artistName]);

  return { loading, entities };
}
