import React, { useEffect, useState, useMemo } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { useSelector } from 'react-redux';
import { db } from '../db/indexedDb';
import type { ChartData } from '../db/indexedDb';
import { Container, Text, Flex, Loader, Center, Divider } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { ChartsWeeksTimeline } from '../components/weeks/ChartsWeeksTimeline.tsx';
import { ChartsWeeksTableView } from '../components/weeks/ChartsWeeksTableView.tsx';
import { ChartsWeeksGridView } from '../components/weeks/ChartsWeeksGridView.tsx';
import { ChartsWeeksFilters } from '../components/weeks/ChartsWeeksFilters.tsx';
import { ChartsWeeksHeader } from '../components/weeks/ChartsWeeksHeader.tsx';
import { type ThemeMode } from '../theme/modes';

interface WeekTop1Data {
    week: string;
    weekNumber: number;
    artistTop1: ChartData | null;
    albumTop1: ChartData | null;
    trackTop1: ChartData | null;
}



export const ChartsWeeksListPage: React.FC = () => {
    const { t } = useTranslation();
    // no-op theme hook kept for potential future use
    const themeMode = useSelector((s: any) => (s.theme?.value as ThemeMode) || 'dark');
    const charts = useSelector((state: any) => state.charts.charts);
    const activeChartId = useSelector((state: any) => state.charts.activeChartId);
    const chart = useMemo(() => charts.find((c: any) => c.id === activeChartId) || null, [charts, activeChartId]);

    const [loading, setLoading] = useState(true);
    const [weeksData, setWeeksData] = useState<WeekTop1Data[]>([]);
    const [searchFilter, setSearchFilter] = useState('');
    const [yearFilter, setYearFilter] = useState<string | null>(null);
    const [debouncedSearch] = useDebouncedValue(searchFilter, 500);
    
    // Load view mode from localStorage
    const [viewMode, setViewMode] = useState<'timeline' | 'table' | 'grid'>(() => {
        try {
            const saved = localStorage.getItem('chartsWeeksViewMode');
            return (saved === 'timeline' || saved === 'table' || saved === 'grid') ? saved : 'timeline';
        } catch {
            return 'timeline';
        }
    });
    
    // Load type filter from localStorage
    const [typeFilter, setTypeFilter] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('chartsWeeksTypeFilter');
            return saved ? JSON.parse(saved) : ['artist', 'album', 'track'];
        } catch {
            return ['artist', 'album', 'track'];
        }
    });
    
    // Load items per page from localStorage
    const [itemsPerPage, setItemsPerPage] = useState<number>(() => {
        try {
            const saved = localStorage.getItem('chartsWeeksItemsPerPage');
            return saved ? parseInt(saved, 10) : 25;
        } catch {
            return 25;
        }
    });
    
    // Save view mode to localStorage when it changes
    useEffect(() => {
        try {
            localStorage.setItem('chartsWeeksViewMode', viewMode);
        } catch (e) {
            console.error('Failed to save view mode:', e);
        }
    }, [viewMode]);
    
    // Save type filter to localStorage when it changes
    useEffect(() => {
        try {
            localStorage.setItem('chartsWeeksTypeFilter', JSON.stringify(typeFilter));
        } catch (e) {
            console.error('Failed to save type filter:', e);
        }
    }, [typeFilter]);
    
    // Save items per page to localStorage when it changes
    useEffect(() => {
        try {
            localStorage.setItem('chartsWeeksItemsPerPage', String(itemsPerPage));
        } catch (e) {
            console.error('Failed to save items per page:', e);
        }
    }, [itemsPerPage]);


    // Fetch all weeks and their #1s
    useEffect(() => {
        if (!chart) return;

        let cancelled = false;
        async function fetchWeeksData() {
            setLoading(true);
            try {
                const chartId = `${chart.id}`;
                
                // Get all data for this chart
                const allData = await db.charts_data
                    .where('chartId')
                    .equals(chartId)
                    .toArray();

                // Get unique weeks sorted descending (most recent first)
                const weeks = Array.from(new Set(allData.map(d => d.week)))
                    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

                // For each week, get the #1 for each chart type
                const weeksWithTop1 = await Promise.all(
                    weeks.map(async (week, index) => {
                        const types: ('artist' | 'album' | 'track')[] = ['artist', 'album', 'track'];
                        const top1s = await Promise.all(
                            types.map(async (type) => {
                                const data = await db.charts_data
                                    .where(['chartId', 'chartType', 'week'])
                                    .equals([chartId, type, week])
                                    .toArray();
                                return data.find(d => d.rank === 1) || null;
                            })
                        );

                        return {
                            week,
                            weekNumber: weeks.length - index,
                            artistTop1: top1s[0],
                            albumTop1: top1s[1],
                            trackTop1: top1s[2],
                        };
                    })
                );

                if (!cancelled) {
                    setWeeksData(weeksWithTop1);
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error fetching weeks data:', error);
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchWeeksData();
        return () => { cancelled = true; };
    }, [chart]);

    // Filter data based on search, year, and type using useMemo
    const filteredData = useMemo(() => {
        let filtered = [...weeksData];

        // Filter by year
        if (yearFilter) {
            filtered = filtered.filter(w => w.week.startsWith(yearFilter));
        }

        // Filter by type - only show weeks that have at least one selected type at #1
        filtered = filtered.map(w => ({
            ...w,
            artistTop1: typeFilter.includes('artist') ? w.artistTop1 : null,
            albumTop1: typeFilter.includes('album') ? w.albumTop1 : null,
            trackTop1: typeFilter.includes('track') ? w.trackTop1 : null,
        })).filter(w => w.artistTop1 || w.albumTop1 || w.trackTop1);

        // Filter by search text (artist/album/track name) - only search in selected types
        if (debouncedSearch.trim()) {
            const search = debouncedSearch.toLowerCase();
            filtered = filtered.filter(w => {
                let matches = false;
                
                if (typeFilter.includes('artist') && w.artistTop1) {
                    const artistName = w.artistTop1.name?.toLowerCase() || '';
                    if (artistName.includes(search)) matches = true;
                }
                
                if (typeFilter.includes('album') && w.albumTop1) {
                    const albumName = w.albumTop1.name?.toLowerCase() || '';
                    const albumArtist = w.albumTop1.artistName?.toLowerCase() || '';
                    if (albumName.includes(search) || albumArtist.includes(search)) matches = true;
                }
                
                if (typeFilter.includes('track') && w.trackTop1) {
                    const trackName = w.trackTop1.name?.toLowerCase() || '';
                    const trackArtist = w.trackTop1.artistName?.toLowerCase() || '';
                    if (trackName.includes(search) || trackArtist.includes(search)) matches = true;
                }
                
                return matches;
            });
        }

        return filtered;
    }, [debouncedSearch, yearFilter, typeFilter, weeksData]);

    // Get available years from data
    const availableYears = useMemo(() => {
        const years = Array.from(new Set(weeksData.map(w => w.week.substring(0, 4)))).sort((a, b) => b.localeCompare(a));
        return years;
    }, [weeksData]);


    if (!chart) {
        return (
            <Container>
                <Center py="xl">
                    <Text>{t('errors.noActiveChart')}</Text>
                </Center>
            </Container>
        );
    }

    if (loading) {
        return (
            <Container>
                <Center py="xl">
                    <Loader size="lg" />
                </Center>
            </Container>
        );
    }

    return (
        <Container className="noPaddingMobile" size={viewMode === 'table' ? 'xl' : 'sm'}>
            <Flex direction="column" p="xs" gap="sm">
                <ChartsWeeksHeader title={`${t('charts.allWeeks')}${chart ? ` - ${chart.name}` : ''}`} />
                <Divider variant="solid" size="sm" my="md"/>
                
                <ChartsWeeksFilters
                    availableYears={availableYears}
                    searchFilter={searchFilter}
                    setSearchFilter={setSearchFilter}
                    yearFilter={yearFilter}
                    setYearFilter={setYearFilter}
                    itemsPerPage={itemsPerPage}
                    setItemsPerPage={setItemsPerPage}
                    typeFilter={typeFilter}
                    setTypeFilter={setTypeFilter}
                    viewMode={viewMode}
                    setViewMode={(v: 'timeline' | 'table' | 'grid') => setViewMode(v)}
                />

                {/* Results count */}
                <Text size="sm" c="dimmed">
                    {t('charts.showingWeeks', { count: filteredData.length, total: weeksData.length })}
                </Text>

                {/* View based on selected mode */}
                {viewMode === 'timeline' && (
                    <ChartsWeeksTimeline 
                        weeksData={filteredData} 
                        themeMode={themeMode} 
                        itemsPerPage={itemsPerPage}
                    />
                )}
                {viewMode === 'table' && (
                    <ChartsWeeksTableView 
                        weeksData={filteredData} 
                        chartId={chart?.id || 0}
                        itemsPerPage={itemsPerPage}
                        typeFilter={typeFilter}
                        themeMode={themeMode}
                    />
                )}
                {viewMode === 'grid' && (
                    <ChartsWeeksGridView 
                        weeksData={filteredData} 
                        itemsPerPage={itemsPerPage}
                        typeFilter={typeFilter}
                    />
                )}
            </Flex>
        </Container>
    );
};

export default ChartsWeeksListPage;
