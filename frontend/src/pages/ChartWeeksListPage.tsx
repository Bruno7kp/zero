import React, { useEffect, useState, useMemo } from 'react';
import { useIsMobile } from '../hooks/useIsMobile';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/indexedDb';
import type { ChartData } from '../db/indexedDb';
import {
    Container,
    Title,
    Text,
    Button,
    Table,
    Group,
    TextInput,
    Select,
    Flex,
    Pagination,
    Card,
    ThemeIcon,
    rem,
    Loader,
    Center,
    Divider,
    Box,
    useMantineTheme,
    MultiSelect
} from '@mantine/core';
import { IconListNumbers, IconSearch, IconCalendar, IconChevronRight } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { SpotifyImageWithModal } from '../components/SpotifyImageWithModal';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../services/SpotifyApi';
import { getCardBackgroundByMode, type ThemeMode } from '../theme/modes';
import dayjs from 'dayjs';

interface WeekTop1Data {
    week: string;
    weekNumber: number;
    artistTop1: ChartData | null;
    albumTop1: ChartData | null;
    trackTop1: ChartData | null;
}

const ITEMS_PER_PAGE = 100;

export const ChartWeeksListPage: React.FC = () => {
    const isMobile = useIsMobile();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const theme = useMantineTheme();
    const themeMode = useSelector((s: any) => (s.theme?.value as ThemeMode) || 'dark');
    const charts = useSelector((state: any) => state.charts.charts);
    const activeChartId = useSelector((state: any) => state.charts.activeChartId);
    const chart = useMemo(() => charts.find((c: any) => c.id === activeChartId) || null, [charts, activeChartId]);

    const [loading, setLoading] = useState(true);
    const [weeksData, setWeeksData] = useState<WeekTop1Data[]>([]);
    const [searchFilter, setSearchFilter] = useState('');
    const [yearFilter, setYearFilter] = useState<string | null>(null);
    const [typeFilter, setTypeFilter] = useState<string[]>(isMobile ? ['artist'] : ['artist', 'album', 'track']);
    const [currentPage, setCurrentPage] = useState(1);

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

        // Filter by search text (artist/album/track name) - only in selected types
        if (searchFilter.trim()) {
            const search = searchFilter.toLowerCase();
            filtered = filtered.filter(w => {
                const artistMatch = typeFilter.includes('artist') && w.artistTop1?.name.toLowerCase().includes(search);
                const albumMatch = typeFilter.includes('album') && (
                    w.albumTop1?.name.toLowerCase().includes(search) || 
                    w.albumTop1?.artistName.toLowerCase().includes(search)
                );
                const trackMatch = typeFilter.includes('track') && (
                    w.trackTop1?.name.toLowerCase().includes(search) || 
                    w.trackTop1?.artistName.toLowerCase().includes(search)
                );
                return artistMatch || albumMatch || trackMatch;
            });
        }

        return filtered;
    }, [searchFilter, yearFilter, typeFilter, weeksData]);

    // Get available years from data
    const availableYears = useMemo(() => {
        const years = Array.from(new Set(weeksData.map(w => w.week.substring(0, 4)))).sort((a, b) => b.localeCompare(a));
        return years;
    }, [weeksData]);

    // Paginate data
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, endIndex);
    }, [filteredData, currentPage]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

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

    const formatWeekDate = (weekStr: string) => {
        const startDate = dayjs(weekStr);
        const endDate = startDate.add(6, 'day');
        return `${startDate.format('DD/MM/YYYY')} - ${endDate.format('DD/MM/YYYY')}`;
    };

    return (
        <Container size="xl">
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
                                    setCurrentPage(1);
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
                                    setCurrentPage(1);
                                }}
                                clearable
                            />
                            <MultiSelect
                                placeholder={t('charts.selectTypes')}
                                data={[
                                    { value: 'artist', label: t('charts.artist') },
                                    { value: 'album', label: t('charts.album') },
                                    { value: 'track', label: t('charts.track') }
                                ]}
                                value={typeFilter}
                                onChange={(value) => {
                                    setTypeFilter(value);
                                    setCurrentPage(1);
                                }}
                            />
                        </Group>
                    </Flex>
                </Card>

                {/* Results count */}
                <Text size="sm" c="dimmed">
                    {t('charts.showingWeeks', { count: filteredData.length, total: weeksData.length })}
                </Text>

                {/* Table */}
                <Card shadow="md" p="md" style={{ background: getCardBackgroundByMode(theme, themeMode) }}>
                    <Box style={{ overflowX: 'auto' }}>
                        <Table highlightOnHover>
                            <Table.Thead>
                                <Table.Tr>
                                    <Table.Th ta="center" style={{ width: 170 }}>{t('charts.weekNumber')}</Table.Th>
                                    {typeFilter.includes('artist') && <Table.Th>{t('charts.artistTop1')}</Table.Th>}
                                    {typeFilter.includes('album') && <Table.Th>{t('charts.albumTop1')}</Table.Th>}
                                    {typeFilter.includes('track') && <Table.Th>{t('charts.trackTop1')}</Table.Th>}
                                    <Table.Th ta="center" style={{ width: 125 }}>{t('charts.actions')}</Table.Th>
                                </Table.Tr>
                            </Table.Thead>
                            <Table.Tbody>
                                {paginatedData.map((weekData) => (
                                    <Table.Tr key={weekData.week}>
                                        <Table.Td ta="center">
                                            <Text fw={700} size="md">{weekData.weekNumber}</Text>
                                            <Text size="xs" c="dimmed">{formatWeekDate(weekData.week)}</Text>
                                        </Table.Td>
                                        {typeFilter.includes('artist') && (
                                            <Table.Td>
                                                {weekData.artistTop1 ? (
                                                    <Group gap="xs" wrap="nowrap">
                                                        <SpotifyImageWithModal
                                                            entityId={weekData.artistTop1.entityId}
                                                            name={weekData.artistTop1.name}
                                                            artistName={weekData.artistTop1.artistName}
                                                            type="artist"
                                                            clientId={SPOTIFY_TOKEN}
                                                            clientSecret={SPOTIFY_SECRET}
                                                            width={32}
                                                            height={32}
                                                            borderRadius={4}
                                                        />
                                                        <Text size="sm" lineClamp={1}>{weekData.artistTop1.name}</Text>
                                                    </Group>
                                                ) : (
                                                    <Text size="sm" c="dimmed">-</Text>
                                                )}
                                            </Table.Td>
                                        )}
                                        {typeFilter.includes('album') && (
                                            <Table.Td>
                                                {weekData.albumTop1 ? (
                                                    <Group gap="xs" wrap="nowrap">
                                                        <SpotifyImageWithModal
                                                            entityId={weekData.albumTop1.entityId}
                                                            name={weekData.albumTop1.name}
                                                            artistName={weekData.albumTop1.artistName}
                                                            type="album"
                                                            clientId={SPOTIFY_TOKEN}
                                                            clientSecret={SPOTIFY_SECRET}
                                                            width={32}
                                                            height={32}
                                                            borderRadius={4}
                                                        />
                                                        <Box style={{ minWidth: 0 }}>
                                                            <Text size="sm" lineClamp={1}>{weekData.albumTop1.name}</Text>
                                                            <Text size="xs" c="dimmed" lineClamp={1}>{weekData.albumTop1.artistName}</Text>
                                                        </Box>
                                                    </Group>
                                                ) : (
                                                    <Text size="sm" c="dimmed">-</Text>
                                                )}
                                            </Table.Td>
                                        )}
                                        {typeFilter.includes('track') && (
                                            <Table.Td>
                                                {weekData.trackTop1 ? (
                                                    <Group gap="xs" wrap="nowrap">
                                                        <SpotifyImageWithModal
                                                            entityId={weekData.trackTop1.entityId}
                                                            name={weekData.trackTop1.name}
                                                            artistName={weekData.trackTop1.artistName}
                                                            type="track"
                                                            clientId={SPOTIFY_TOKEN}
                                                            clientSecret={SPOTIFY_SECRET}
                                                            width={32}
                                                            height={32}
                                                            borderRadius={4}
                                                        />
                                                        <Box style={{ minWidth: 0 }}>
                                                            <Text size="sm" lineClamp={1}>{weekData.trackTop1.name}</Text>
                                                            <Text size="xs" c="dimmed" lineClamp={1}>{weekData.trackTop1.artistName}</Text>
                                                        </Box>
                                                    </Group>
                                                ) : (
                                                    <Text size="sm" c="dimmed">-</Text>
                                                )}
                                            </Table.Td>
                                        )}
                                        <Table.Td>
                                            <Button
                                                size="xs"
                                                variant="light"
                                                onClick={() => navigate(`/charts/week/${weekData.week}/artist`)}
                                                rightSection={<IconChevronRight size={16} />}
                                            >
                                                {t('charts.view')}
                                            </Button>
                                        </Table.Td>
                                    </Table.Tr>
                                ))}
                            </Table.Tbody>
                        </Table>
                    </Box>
                </Card>

                {/* Pagination */}
                {totalPages > 1 && (
                    <Flex justify="center" mt="md">
                        <Pagination
                            total={totalPages}
                            value={currentPage}
                            onChange={setCurrentPage}
                            size="md"
                        />
                    </Flex>
                )}
            </Flex>
        </Container>
    );
};

export default ChartWeeksListPage;
