import React, { useEffect, useState, useMemo } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { useSelector } from 'react-redux';
// ...existing code...
import { db } from '../db/indexedDb';
import type { ChartData } from '../db/indexedDb';
import {
    Container,
    Title,
    Text,
    Group,
    TextInput,
    Select,
    Flex,
    Card,
    ThemeIcon,
    rem,
    Loader,
    Center,
    Divider,
    useMantineTheme
} from '@mantine/core';
import { IconListNumbers, IconSearch, IconCalendar } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
// ...existing code...
import { ChartsWeeksTimeline } from '../components/ChartsWeeksTimeline';
// ...existing code...
import { getCardBackgroundByMode, type ThemeMode } from '../theme/modes';

interface WeekTop1Data {
    week: string;
    weekNumber: number;
    artistTop1: ChartData | null;
    albumTop1: ChartData | null;
    trackTop1: ChartData | null;
}



export const ChartsWeeksListPage: React.FC = () => {
    const { t } = useTranslation();
    // ...existing code...
    const theme = useMantineTheme();
    const themeMode = useSelector((s: any) => (s.theme?.value as ThemeMode) || 'dark');
    const charts = useSelector((state: any) => state.charts.charts);
    const activeChartId = useSelector((state: any) => state.charts.activeChartId);
    const chart = useMemo(() => charts.find((c: any) => c.id === activeChartId) || null, [charts, activeChartId]);

    const [loading, setLoading] = useState(true);
    const [weeksData, setWeeksData] = useState<WeekTop1Data[]>([]);
    const [searchFilter, setSearchFilter] = useState('');
    const [yearFilter, setYearFilter] = useState<string | null>(null);
    const [debouncedSearch] = useDebouncedValue(searchFilter, 500);


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

    // Filter data based on search and year using useMemo
    const filteredData = useMemo(() => {
        let filtered = [...weeksData];

        // Filter by year
        if (yearFilter) {
            filtered = filtered.filter(w => w.week.startsWith(yearFilter));
        }

        // Filter by search text (artist/album/track name)
        if (debouncedSearch.trim()) {
            const search = debouncedSearch.toLowerCase();
            filtered = filtered.filter(w => {
                const artistName = w.artistTop1?.name?.toLowerCase() || '';
                const albumName = w.albumTop1?.name?.toLowerCase() || '';
                const albumArtist = w.albumTop1?.artistName?.toLowerCase() || '';
                const trackName = w.trackTop1?.name?.toLowerCase() || '';
                const trackArtist = w.trackTop1?.artistName?.toLowerCase() || '';

                const artistMatch = artistName.includes(search);
                const albumMatch = albumName.includes(search) || albumArtist.includes(search);
                const trackMatch = trackName.includes(search) || trackArtist.includes(search);
                return artistMatch || albumMatch || trackMatch;
            });
        }

        return filtered;
    }, [debouncedSearch, yearFilter, weeksData]);

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
        <Container className="noPaddingMobile">
            <Flex direction="column" p="xs" gap="sm">
                <Flex justify="center" align="center" gap="sm">
                    <Title order={2} style={{ display: 'flex', alignItems: 'center', gap: rem(8) }}>
                        <ThemeIcon variant="light" color="blue" size="md">
                            <IconListNumbers style={{ width: rem(20), height: rem(20) }} />
                        </ThemeIcon>
                        {t('charts.allWeeks')}
                        {chart && ` - ${chart.name}`}
                    </Title>
                </Flex>
                <Divider variant="solid" size="sm" my="md"/>
                {/* Filters */}
                <Card shadow="md" p="md" style={{ background: getCardBackgroundByMode(theme, themeMode) }}>
                    <Flex direction="column" gap="md">
                        <Group grow>
                            <TextInput
                                placeholder={t('charts.searchByName')}
                                leftSection={<IconSearch size={16} />}
                                value={searchFilter}
                                onChange={(e) => {
                                    setSearchFilter(e.currentTarget.value);
                                }}
                            />
                            <Select
                                placeholder={t('charts.filterByYear')}
                                leftSection={<IconCalendar size={16} />}
                                data={[
                                    { value: '', label: t('charts.allYears') },
                                    ...availableYears.map(y => ({ value: y, label: y }))
                                ]}
                                value={yearFilter || ''}
                                onChange={(value) => {
                                    setYearFilter(value || null);
                                }}
                                clearable
                            />
                        </Group>
                    </Flex>
                </Card>

                {/* Results count */}
                <Text size="sm" c="dimmed">
                    {t('charts.showingWeeks', { count: filteredData.length, total: weeksData.length })}
                </Text>

                {/* Timeline */}
                <ChartsWeeksTimeline weeksData={filteredData} themeMode={themeMode} yearFilter={yearFilter} />
            </Flex>
        </Container>
    );
};

export default ChartsWeeksListPage;
