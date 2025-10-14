import React, { useEffect, useState, useMemo } from 'react';
import { Container, Text, Flex, Loader, Center } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { LibraryFilters } from '../components/library/LibraryFilters';
import { LibraryStats } from '../components/library/LibraryStats';
import { LibraryTableView } from '../components/library/LibraryTableView';
import { LibraryGridView } from '../components/library/LibraryGridView';
import { db } from '../db/indexedDb';
import type { ChartData } from '../db/indexedDb';
import * as lastfm from '../services/lastfm';

export interface LibraryItem {
    name: string;
    artistName?: string;
    peak: number;
    weeks: number;
    points: number;
    playcount?: number;
    sales?: number;
    image?: string;
    certification?: string;
}

type LibraryType = 'artist' | 'album' | 'track';
type ViewMode = 'table' | 'grid';
type SortBy = 'playcount' | 'points' | 'sales' | 'weeks' | 'peak';

export const LibraryPage: React.FC = () => {
    const { t } = useTranslation();
    const charts = useSelector((state: any) => state.charts.charts);
    const activeChartId = useSelector((state: any) => state.charts.activeChartId);
    const chart = useMemo(() => charts.find((c: any) => c.id === activeChartId) || null, [charts, activeChartId]);

    // Load preferences from localStorage
    const [selectedType, setSelectedType] = useState<LibraryType>(() => {
        try {
            const saved = localStorage.getItem('libraryType');
            return (saved === 'artist' || saved === 'album' || saved === 'track') ? saved : 'artist';
        } catch {
            return 'artist';
        }
    });

    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        try {
            const saved = localStorage.getItem('libraryViewMode');
            return (saved === 'table' || saved === 'grid') ? saved : 'table';
        } catch {
            return 'table';
        }
    });

    const [itemsPerPage, setItemsPerPage] = useState<number>(() => {
        try {
            const saved = localStorage.getItem('libraryItemsPerPage');
            return saved ? parseInt(saved, 10) : 25;
        } catch {
            return 25;
        }
    });

    const [sortBy, setSortBy] = useState<SortBy>(() => {
        try {
            const saved = localStorage.getItem('librarySortBy');
            return (saved === 'playcount' || saved === 'points' || saved === 'sales' || saved === 'weeks' || saved === 'peak') 
                ? saved : 'playcount';
        } catch {
            return 'playcount';
        }
    });

    const [loading, setLoading] = useState(true);
    const [libraryData, setLibraryData] = useState<LibraryItem[]>([]);
    const [page, setPage] = useState(1);

    // Save preferences to localStorage
    useEffect(() => {
        try {
            localStorage.setItem('libraryType', selectedType);
        } catch (e) {
            console.error('Failed to save library type:', e);
        }
    }, [selectedType]);

    useEffect(() => {
        try {
            localStorage.setItem('libraryViewMode', viewMode);
        } catch (e) {
            console.error('Failed to save view mode:', e);
        }
    }, [viewMode]);

    useEffect(() => {
        try {
            localStorage.setItem('libraryItemsPerPage', String(itemsPerPage));
        } catch (e) {
            console.error('Failed to save items per page:', e);
        }
    }, [itemsPerPage]);

    useEffect(() => {
        try {
            localStorage.setItem('librarySortBy', sortBy);
        } catch (e) {
            console.error('Failed to save sort by:', e);
        }
    }, [sortBy]);

    // Fetch library data
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
                
                if (sortBy === 'playcount') {
                    // Fetch from Last.fm API
                    if (!chart.lastfm_username) {
                        throw new Error('Last.fm username not configured');
                    }

                    let apiData: any[] = [];
                    if (selectedType === 'artist') {
                        const response = await fetch(
                            `https://ws.audioscrobbler.com/2.0/?method=user.gettopartists&user=${chart.lastfm_username}&api_key=e35699481c9c3134d856e99792a2b6de&format=json&limit=1000&period=overall`
                        );
                        const json = await response.json();
                        apiData = json?.topartists?.artist || [];
                    } else if (selectedType === 'album') {
                        const response = await fetch(
                            `https://ws.audioscrobbler.com/2.0/?method=user.gettopalbums&user=${chart.lastfm_username}&api_key=e35699481c9c3134d856e99792a2b6de&format=json&limit=1000&period=overall`
                        );
                        const json = await response.json();
                        apiData = json?.topalbums?.album || [];
                    } else if (selectedType === 'track') {
                        const response = await fetch(
                            `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${chart.lastfm_username}&api_key=e35699481c9c3134d856e99792a2b6de&format=json&limit=1000&period=overall`
                        );
                        const json = await response.json();
                        apiData = json?.toptracks?.track || [];
                    }

                    // Get chart data from IndexedDB
                    const chartData = await db.charts_data
                        .where(['chartId', 'chartType'])
                        .equals([chartId, selectedType])
                        .toArray();

                    // Build a map of chart stats by entity (name + artist)
                    const statsMap = new Map<string, { peak: number; weeks: Set<string>; points: number }>();
                    
                    for (const row of chartData) {
                        const key = `${row.name}|||${row.artistName || ''}`;
                        if (!statsMap.has(key)) {
                            statsMap.set(key, { peak: row.rank, weeks: new Set(), points: 0 });
                        }
                        const stats = statsMap.get(key)!;
                        stats.peak = Math.min(stats.peak, row.rank);
                        stats.weeks.add(row.week);
                        // Simple points calculation: lower rank = more points
                        stats.points += Math.max(0, 101 - row.rank);
                    }

                    // Combine Last.fm data with chart stats
                    const items: LibraryItem[] = apiData.map((item: any) => {
                        const name = item.name;
                        const artistName = selectedType === 'artist' ? undefined : (item.artist?.name || item.artist?.['#text'] || '');
                        const key = `${name}|||${artistName || ''}`;
                        const stats = statsMap.get(key) || { peak: 999, weeks: new Set(), points: 0 };

                        return {
                            name,
                            artistName,
                            peak: stats.peak,
                            weeks: stats.weeks.size,
                            points: stats.points,
                            playcount: parseInt(item.playcount || '0', 10),
                            sales: 0, // Placeholder
                        };
                    });

                    if (!cancelled) {
                        setLibraryData(items);
                    }
                } else {
                    // Fetch from IndexedDB and sort by chart stats
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
                        sales: number;
                    }>();

                    for (const row of chartData) {
                        const key = `${row.name}|||${row.artistName || ''}`;
                        if (!entitiesMap.has(key)) {
                            entitiesMap.set(key, {
                                name: row.name,
                                artistName: row.artistName || undefined,
                                peak: row.rank,
                                weeks: new Set(),
                                points: 0,
                                sales: 0,
                            });
                        }
                        const entity = entitiesMap.get(key)!;
                        entity.peak = Math.min(entity.peak, row.rank);
                        entity.weeks.add(row.week);
                        entity.points += Math.max(0, 101 - row.rank);
                    }

                    const items: LibraryItem[] = Array.from(entitiesMap.values()).map(e => ({
                        name: e.name,
                        artistName: e.artistName,
                        peak: e.peak,
                        weeks: e.weeks.size,
                        points: e.points,
                        sales: e.sales,
                    }));

                    // Sort based on sortBy
                    if (sortBy === 'points') {
                        items.sort((a, b) => b.points - a.points);
                    } else if (sortBy === 'weeks') {
                        items.sort((a, b) => {
                            if (b.weeks !== a.weeks) return b.weeks - a.weeks;
                            return a.peak - b.peak;
                        });
                    } else if (sortBy === 'peak') {
                        items.sort((a, b) => {
                            if (a.peak !== b.peak) return a.peak - b.peak;
                            return b.weeks - a.weeks;
                        });
                    } else if (sortBy === 'sales') {
                        items.sort((a, b) => (b.sales || 0) - (a.sales || 0));
                    }

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
    }, [chart, selectedType, sortBy]);

    // Reset page when type or sort changes
    useEffect(() => {
        setPage(1);
    }, [selectedType, sortBy, itemsPerPage]);

    // Calculate stats for header
    const stats = useMemo(() => {
        const total = libraryData.length;
        const number1s = libraryData.filter(item => item.peak === 1).length;
        const inChart = libraryData.filter(item => item.weeks > 0).length;
        
        return { total, number1s, inChart };
    }, [libraryData]);

    // Paginate data
    const paginatedData = useMemo(() => {
        const start = (page - 1) * itemsPerPage;
        return libraryData.slice(start, start + itemsPerPage);
    }, [libraryData, page, itemsPerPage]);

    const totalPages = Math.ceil(libraryData.length / itemsPerPage);

    if (!chart) {
        return (
            <Container size="xl" py="xl">
                <Center>
                    <Text>{t('errors.selectActiveChart')}</Text>
                </Center>
            </Container>
        );
    }

    return (
        <Container size="xl" py="xl">
            <Flex direction="column" gap="md">
                <Text size="xl" fw={700}>
                    {t('library.title')}
                </Text>

                <LibraryFilters
                    selectedType={selectedType}
                    setSelectedType={setSelectedType}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    itemsPerPage={itemsPerPage}
                    setItemsPerPage={setItemsPerPage}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                />

                <LibraryStats
                    type={selectedType}
                    total={stats.total}
                    number1s={stats.number1s}
                    inChart={stats.inChart}
                />

                {loading ? (
                    <Center py="xl">
                        <Flex direction="column" align="center" gap="md">
                            <Loader size="xl" />
                            <Text>{t('library.loading')}</Text>
                        </Flex>
                    </Center>
                ) : (
                    <>
                        {viewMode === 'table' ? (
                            <LibraryTableView
                                items={paginatedData}
                                type={selectedType}
                                page={page}
                                setPage={setPage}
                                totalPages={totalPages}
                                chart={chart}
                            />
                        ) : (
                            <LibraryGridView
                                items={paginatedData}
                                type={selectedType}
                                page={page}
                                setPage={setPage}
                                totalPages={totalPages}
                                chart={chart}
                            />
                        )}
                    </>
                )}
            </Flex>
        </Container>
    );
};

export default LibraryPage;
