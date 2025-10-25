import { useMemo } from 'react';
import { db } from '../../db/indexedDb';
import type { ChartData } from '../../db/indexedDb';
import { useSelector } from 'react-redux';

export interface StatsDataOptions {
    year: string;
    type: string;
    position?: number;
}

// Calculate sales for a row: sales = (plays * weightplays) + (points * weightpoints)
export const calculateSales = (plays: number, points: number, chart: any, type: string): number => {
    let weightPlays = 0;
    let weightPoints = 0;

    if (type === 'artist') {
        weightPlays = chart?.artist_weightplays || 0;
        weightPoints = chart?.artist_weightpoints || 0;
    } else if (type === 'album') {
        weightPlays = chart?.album_weightplays || 0;
        weightPoints = chart?.album_weightpoints || 0;
    } else if (type === 'track') {
        weightPlays = chart?.music_weightplays || 0;
        weightPoints = chart?.music_weightpoints || 0;
    }

    return (plays * weightPlays) + (points * weightPoints);
};

// Calculate points from rank for a given chart type
export const calculatePoints = (rank: number, chart: any, type: string): number => {
    let cutoff = 100;
    if (type === 'artist') cutoff = chart?.artist_cutoff || 100;
    else if (type === 'album') cutoff = chart?.album_cutoff || 100;
    else if (type === 'track') cutoff = chart?.music_cutoff || 100;

    if (rank > cutoff) return 0;
    return cutoff - rank + 1;
};

export const useStatsData = () => {
    const charts = useSelector((state: any) => state.charts.charts);
    const activeChartId = useSelector((state: any) => state.charts.activeChartId);
    const chart = useMemo(() => charts.find((c: any) => c.id === activeChartId) || null, [charts, activeChartId]);

    // Fetch all entries at a specific rank
    const fetchRankData = async (options: StatsDataOptions & { position: number }) => {
        if (!chart) return [];
        
        const { year, type, position } = options;
        const query = db.charts_data
            .where('[chartId+chartType+week]')
            .between(
                [`${chart.id}`, type, '0000-W00'],
                [`${chart.id}`, type, '9999-W99'],
                true,
                true
            );

        const allData = await query.toArray();
        
        // Filter by rank and year
        let filtered = allData.filter(row => row.rank === position);
        
        if (year !== 'all') {
            filtered = filtered.filter(row => row.week.startsWith(year));
        }

        // Add sales calculation
        return filtered.map(row => ({
            ...row,
            points: calculatePoints(row.rank, chart, type),
            sales: calculateSales(row.plays, calculatePoints(row.rank, chart, type), chart, type)
        }));
    };

    // Fetch Perfect All Kill data
    const fetchPAKData = async (options: Pick<StatsDataOptions, 'year'>) => {
        if (!chart) return [];
        
        const { year } = options;
        
        // Get all #1s for each type
        const artists = await db.charts_data
            .where('[chartId+chartType]')
            .equals([`${chart.id}`, 'artist'])
            .and(row => row.rank === 1)
            .toArray();
            
        const albums = await db.charts_data
            .where('[chartId+chartType]')
            .equals([`${chart.id}`, 'album'])
            .and(row => row.rank === 1)
            .toArray();
            
        const tracks = await db.charts_data
            .where('[chartId+chartType]')
            .equals([`${chart.id}`, 'track'])
            .and(row => row.rank === 1)
            .toArray();

        // Group by week
        const weekMap: Record<string, { artist?: ChartData; album?: ChartData; track?: ChartData }> = {};
        
        artists.forEach(a => {
            if (!weekMap[a.week]) weekMap[a.week] = {};
            weekMap[a.week].artist = a;
        });
        
        albums.forEach(a => {
            if (!weekMap[a.week]) weekMap[a.week] = {};
            weekMap[a.week].album = a;
        });
        
        tracks.forEach(t => {
            if (!weekMap[t.week]) weekMap[t.week] = {};
            weekMap[t.week].track = t;
        });

        // Find PAKs (weeks where all three exist and have same artist)
        const paks = Object.entries(weekMap)
            .filter(([_week, data]) => {
                if (!data.artist || !data.album || !data.track) return false;
                // All must be from the same artist
                return data.artist.artistName === data.album.artistName && 
                       data.artist.artistName === data.track.artistName;
            })
            .map(([week, data]) => ({
                week,
                artist: data.artist!.name,
                album: data.album!.name,
                track: data.track!.name,
                artistName: data.artist!.artistName
            }));

        // Filter by year
        let filtered = paks;
        if (year !== 'all') {
            filtered = paks.filter(pak => pak.week.startsWith(year));
        }

        return filtered;
    };

    // Fetch aggregated stats (times at rank, times at top, etc.)
    const fetchAggregatedStats = async (options: StatsDataOptions & { 
        aggregationType: 'times_at_rank' | 'times_at_top' | 'points';
        position?: number;
    }) => {
        if (!chart) return [];
        
        const { year, type, position, aggregationType } = options;
        
        const query = db.charts_data
            .where('[chartId+chartType]')
            .equals([`${chart.id}`, type]);

        const allData = await query.toArray();
        
        // Filter by year
        let filtered = allData;
        if (year !== 'all') {
            filtered = allData.filter(row => row.week.startsWith(year));
        }

        // Aggregate by entity
        const entityStats: Record<string, {
            entityId: string;
            name: string;
            artistName: string;
            count: number;
            totalPoints?: number;
            weeksInChart?: number;
        }> = {};

        filtered.forEach(row => {
            if (!entityStats[row.entityId]) {
                entityStats[row.entityId] = {
                    entityId: row.entityId,
                    name: row.name,
                    artistName: row.artistName,
                    count: 0,
                    totalPoints: 0,
                    weeksInChart: 0
                };
            }

            if (aggregationType === 'times_at_rank' && position) {
                if (row.rank === position) {
                    entityStats[row.entityId].count++;
                }
            } else if (aggregationType === 'times_at_top' && position) {
                if (row.rank <= position) {
                    entityStats[row.entityId].count++;
                }
            } else if (aggregationType === 'points') {
                const points = calculatePoints(row.rank, chart, type);
                entityStats[row.entityId].totalPoints! += points;
                entityStats[row.entityId].weeksInChart!++;
            }
        });

        return Object.values(entityStats)
            .filter(stat => {
                if (aggregationType === 'points') return (stat.totalPoints || 0) > 0;
                return stat.count > 0;
            })
            .sort((a, b) => {
                if (aggregationType === 'points') {
                    return (b.totalPoints || 0) - (a.totalPoints || 0);
                }
                return b.count - a.count;
            });
    };

    // Fetch plays/debuts data
    const fetchPlaysOrDebuts = async (options: StatsDataOptions & { 
        dataType: 'plays' | 'debuts';
        position?: string;
    }) => {
        if (!chart) return [];
        
        const { year, type, dataType, position } = options;
        
        const query = db.charts_data
            .where('[chartId+chartType]')
            .equals([`${chart.id}`, type]);

        const allData = await query.toArray();
        
        // Filter by year
        let filtered = allData;
        if (year !== 'all') {
            filtered = allData.filter(row => row.week.startsWith(year));
        }

        // Filter by position if not 'all'
        if (position !== 'all' && position) {
            const posNum = parseInt(position);
            filtered = filtered.filter(row => row.rank <= posNum);
        }

        // For debuts, find first appearance of each entity
        if (dataType === 'debuts') {
            const firstAppearances: Record<string, ChartData> = {};
            const sortedData = [...filtered].sort((a, b) => a.week.localeCompare(b.week));
            
            sortedData.forEach(row => {
                if (!firstAppearances[row.entityId]) {
                    firstAppearances[row.entityId] = row;
                }
            });
            
            filtered = Object.values(firstAppearances);
        }

        // Add points and sales
        const result = filtered.map(row => ({
            ...row,
            points: calculatePoints(row.rank, chart, type),
            sales: calculateSales(row.plays, calculatePoints(row.rank, chart, type), chart, type)
        }));

        // Sort by plays (descending)
        return result.sort((a, b) => b.plays - a.plays);
    };

    // Fetch artist aggregated stats
    const fetchArtistAggregatedStats = async (options: StatsDataOptions & { position: number }) => {
        if (!chart) return [];
        
        const { year, type, position } = options;
        
        const query = db.charts_data
            .where('[chartId+chartType]')
            .equals([`${chart.id}`, type]);

        const allData = await query.toArray();
        
        // Filter by year and position
        let filtered = allData.filter(row => row.rank === position);
        if (year !== 'all') {
            filtered = filtered.filter(row => row.week.startsWith(year));
        }

        // Aggregate by artist
        const artistStats: Record<string, {
            artistName: string;
            titles: Set<string>;
            totalWeeks: number;
        }> = {};

        filtered.forEach(row => {
            if (!artistStats[row.artistName]) {
                artistStats[row.artistName] = {
                    artistName: row.artistName,
                    titles: new Set(),
                    totalWeeks: 0
                };
            }
            
            artistStats[row.artistName].titles.add(row.entityId);
            artistStats[row.artistName].totalWeeks++;
        });

        return Object.values(artistStats)
            .map(stat => ({
                artistName: stat.artistName,
                titlesCount: stat.titles.size,
                totalWeeks: stat.totalWeeks
            }))
            .sort((a, b) => b.titlesCount - a.titlesCount);
    };

    return {
        chart,
        fetchRankData,
        fetchPAKData,
        fetchAggregatedStats,
        fetchPlaysOrDebuts,
        fetchArtistAggregatedStats
    };
};
