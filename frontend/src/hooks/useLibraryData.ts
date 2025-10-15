import { useState, useEffect } from 'react';
import { db } from '../db/indexedDb';
import { getUserTopArtists, getUserTopAlbums, getUserTopTracks } from '../services/lastfm';
import { getUserPlaycountFromCache } from '../utils/certification';
import dayjs from 'dayjs';
import type { LibraryItem } from '../pages/LibraryPage';

export const useLibraryData = (
    chart: any,
    selectedType: 'artist' | 'album' | 'track',
    search: string,
    itemsPerPage: number,
    page: number
) => {
    const [loading, setLoading] = useState(true);
    const [libraryData, setLibraryData] = useState<LibraryItem[]>([]);
    const [totalItems, setTotalItems] = useState(0);
    const [number1s, setNumber1s] = useState(0);
    const [inChart, setInChart] = useState(0);

    useEffect(() => {
        if (!chart) {
            setLoading(false);
            return;
        }

        let cancelled = false;
        async function fetchLibraryData() {
            setLoading(true);
            try {
                const chartId = `${chart.id}`;

                if (search.trim() === '') {
                    // Fetch from Last.fm API with pagination
                    if (!chart.lastfm_username) {
                        throw new Error('Last.fm username not configured');
                    }

                    let apiData: any[] = [];
                    let total = 0;

                    if (selectedType === 'artist') {
                        const res = await getUserTopArtists(chart.lastfm_username, itemsPerPage, page);
                        apiData = res?.items || [];
                        total = Number.isFinite(res?.total) ? res.total : apiData.length;
                    } else if (selectedType === 'album') {
                        const res = await getUserTopAlbums(chart.lastfm_username, itemsPerPage, page);
                        apiData = res?.items || [];
                        total = Number.isFinite(res?.total) ? res.total : apiData.length;
                    } else if (selectedType === 'track') {
                        const res = await getUserTopTracks(chart.lastfm_username, itemsPerPage, page);
                        apiData = res?.items || [];
                        total = Number.isFinite(res?.total) ? res.total : apiData.length;
                    }

                    if (!cancelled) {
                        setTotalItems(total);
                    }

                    // Get chart data from IndexedDB for stats
                    const chartData = await db.charts_data
                        .where(['chartId', 'chartType'])
                        .equals([chartId, selectedType])
                        .toArray();

                    // Build a map of chart stats by entity (name + artist)
                    const statsMap = new Map<string, { peak: number; weeks: Set<string>; points: number; timesAtPeak: number; entityId?: string }>();

                    for (const row of chartData) {
                        const key = `${row.name.toLowerCase()}|||${(row.artistName || '').toLowerCase()}`;
                        if (!statsMap.has(key)) {
                            statsMap.set(key, { peak: row.rank, weeks: new Set(), points: 0, timesAtPeak: 0, entityId: row.entityId });
                        }
                        const stats = statsMap.get(key)!;
                        if (row.rank < stats.peak) {
                            stats.peak = row.rank;
                            stats.timesAtPeak = 1;
                        } else if (row.rank === stats.peak) {
                            stats.timesAtPeak++;
                        }
                        stats.weeks.add(row.week);
                        // Simple points calculation: lower rank = more points
                        stats.points += Math.max(0, 101 - row.rank);
                    }

                    // Calculate overall stats from chart data
                    const allChartStats = Array.from(statsMap.values());
                    if (!cancelled) {
                        setNumber1s(allChartStats.filter(s => s.peak === 1).length);
                        setInChart(allChartStats.filter(s => s.weeks.size > 0).length);
                    }

                    // Combine Last.fm data with chart stats
                    // Also persist returned user playcounts into the local playcount cache
                    const items: LibraryItem[] = apiData.map((item: any) => {
                        const name = item.name;
                        let artistName: string | undefined = undefined;
                        if (selectedType !== 'artist') {
                            const art = item.artist;
                            if (!art) {
                                artistName = '';
                            } else if (typeof art === 'string') {
                                artistName = art;
                            } else if (typeof art === 'object') {
                                artistName = art.name || art['#text'] || '';
                            } else {
                                artistName = '';
                            }
                        }
                        const key = `${name.toLowerCase()}|||${(artistName || '').toLowerCase()}`;
                        const stats = statsMap.get(key) || { peak: 999, weeks: new Set(), points: 0, timesAtPeak: 0 };
                        // If API provided playcount, cache it under the same key used by certification.getUserPlaycountCached
                        const rawPlaycount = parseInt(item.playcount || '0', 10) || 0;
                        (async () => {
                            try {
                                if (chart?.lastfm_username && rawPlaycount > 0) {
                                    // Compute cache expiry (next configured day_of_week or +7 days fallback)
                                    let cacheUntil = dayjs().add(7, 'day');
                                    if (typeof chart?.day_of_week === 'number') {
                                        let d = dayjs();
                                        while (d.day() !== chart.day_of_week) d = d.add(1, 'day');
                                        cacheUntil = d.endOf('day');
                                    }
                                    const exp = cacheUntil.toDate().getTime();
                                    const playcountKey = `pc:${chart.lastfm_username}:${artistName || name}:${selectedType === 'album' ? name : ''}:${selectedType === 'track' ? name : ''}`;
                                    try { await db.playcount_cache.put({ key: playcountKey, value: rawPlaycount, expires: exp }); } catch (e) { /* ignore */ }
                                }
                            } catch (e) {
                                // ignore caching errors
                            }
                        })();

                        return {
                            name,
                            artistName,
                            peak: stats.peak,
                            weeks: stats.weeks.size,
                            timesAtPeak: stats.timesAtPeak,
                            points: stats.points,
                            playcount: rawPlaycount,
                            sales: 0, // Placeholder
                            entityId: stats.entityId,
                        };
                    });

                    if (!cancelled) {
                        setLibraryData(items);
                    }
                } else {
                    // Search in IndexedDB
                    const chartData = await db.charts_data
                        .where(['chartId', 'chartType'])
                        .equals([chartId, selectedType])
                        .toArray();

                    // Group by entity
                    const entitiesMap = new Map<string, {
                        name: string;
                        artistName?: string;
                        peak: number;
                        weeks: Set<string>;
                        points: number;
                        timesAtPeak: number;
                        entityId?: string;
                    }>();

                    for (const row of chartData) {
                        const key = `${row.name.toLowerCase()}|||${(row.artistName || '').toLowerCase()}`;
                        if (!entitiesMap.has(key)) {
                            entitiesMap.set(key, {
                                name: row.name,
                                artistName: row.artistName || undefined,
                                peak: row.rank,
                                weeks: new Set(),
                                points: 0,
                                timesAtPeak: 0,
                                entityId: row.entityId,
                            });
                        }
                        const entity = entitiesMap.get(key)!;
                        if (row.rank < entity.peak) {
                            entity.peak = row.rank;
                            entity.timesAtPeak = 1;
                        } else if (row.rank === entity.peak) {
                            entity.timesAtPeak++;
                        }
                        entity.weeks.add(row.week);
                        entity.points += Math.max(0, 101 - row.rank);
                    }

                    // Get playcounts from cache for each entity
                    const entitiesWithPlaycounts = await Promise.all(
                        Array.from(entitiesMap.values()).map(async (entity) => {
                            const pc = await getUserPlaycountFromCache({
                                username: chart.lastfm_username,
                                artistName: entity.artistName || entity.name,
                                entityName: entity.name,
                                chartType: selectedType === 'track' ? 'track' : selectedType === 'album' ? 'album' : 'artist',
                                offline: !!chart?.offline,
                            });
                            return {
                                ...entity,
                                playcount: pc || 0,
                            };
                        })
                    );

                    // Filter by search
                    const searchLower = search.toLowerCase();
                    const filteredEntities = entitiesWithPlaycounts.filter(entity => {
                        const nameMatch = entity.name.toLowerCase().includes(searchLower);
                        const artistMatch = (entity.artistName || '').toLowerCase().includes(searchLower);
                        return nameMatch || artistMatch;
                    });

                    // Sort by playcount descending
                    filteredEntities.sort((a, b) => (b.playcount || 0) - (a.playcount || 0));

                    // Paginate
                    const start = (page - 1) * itemsPerPage;
                    const paginatedEntities = filteredEntities.slice(start, start + itemsPerPage);

                    // Calculate overall stats from all filtered
                    if (!cancelled) {
                        setNumber1s(filteredEntities.filter(e => e.peak === 1).length);
                        setInChart(filteredEntities.filter(e => e.weeks.size > 0).length);
                        setTotalItems(filteredEntities.length);
                    }

                    const items: LibraryItem[] = paginatedEntities.map(e => ({
                        name: e.name,
                        artistName: e.artistName,
                        peak: e.peak,
                        weeks: e.weeks.size,
                        timesAtPeak: e.timesAtPeak,
                        points: e.points,
                        playcount: e.playcount,
                        sales: 0,
                        entityId: e.entityId,
                    }));

                    if (!cancelled) {
                        setLibraryData(items);
                    }
                }

                if (!cancelled) {
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error fetching library data:', error);
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchLibraryData();
        return () => { cancelled = true; };
    }, [chart, selectedType, search, itemsPerPage, page]);

    return {
        loading,
        libraryData,
        totalItems,
        number1s,
        inChart,
    };
};