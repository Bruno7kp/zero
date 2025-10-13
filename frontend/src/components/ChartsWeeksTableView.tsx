import React, { useMemo, useState } from 'react';
import { Table, ScrollArea, Button, Group, Text, Box, Pagination, Avatar, Tooltip, Card, Flex, useMantineTheme } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { ChartData } from '../db/indexedDb';
import dayjs from 'dayjs';
import { useSpotifyImage } from '../hooks/useSpotifyImage';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../services/SpotifyApi';
import { AllKillBadge } from './AllKillBadge';
import { getCardBackgroundByMode, type ThemeMode } from '../theme/modes';

interface WeekTop1Data {
    week: string;
    weekNumber: number;
    artistTop1: ChartData | null;
    albumTop1: ChartData | null;
    trackTop1: ChartData | null;
}

interface ChartsWeeksTableViewProps {
    weeksData: WeekTop1Data[];
    chartId: number;
    itemsPerPage?: number;
    typeFilter?: string[];
    themeMode?: ThemeMode;
}

const EntityCell: React.FC<{ item: ChartData | null; type: 'artist' | 'album' | 'track' }> = ({ item, type }) => {
    const { imageUrl } = useSpotifyImage({
        entityId: item?.entityId || '',
        name: item?.name || '',
        artist: (type === 'album' || type === 'track') ? item?.artistName : undefined,
        type,
        clientId: SPOTIFY_TOKEN,
        clientSecret: SPOTIFY_SECRET,
    });

    if (!item) return <Text c="dimmed">-</Text>;

    return (
        <Group gap="sm" wrap="nowrap" align="center">
            <Avatar src={imageUrl || undefined} size={40} radius="sm" />
            <Box style={{ flex: 1, minWidth: 0 }}>
                <Text fw={600} size="sm" lineClamp={1}>{item.name}</Text>
                {(type !== 'artist' && item.artistName) && (
                    <Group gap={6} align="center" wrap="nowrap">
                        <Text c="dimmed" size="xs" lineClamp={1} style={{ flex: 1, minWidth: 0 }}>
                            {item.artistName}
                        </Text>
                    </Group>
                )}
            </Box>
        </Group>
    );
};

export const ChartsWeeksTableView: React.FC<ChartsWeeksTableViewProps> = ({ weeksData, itemsPerPage = 25, typeFilter = ['artist','album','track'], themeMode = 'dark' }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const theme = useMantineTheme();

    const firstSelectedType: 'artist' | 'album' | 'track' = (typeFilter[0] as any) || 'artist';

    const totalPages = Math.ceil(weeksData.length / itemsPerPage);
    const pageData = useMemo(() => {
        const start = (page - 1) * itemsPerPage;
        return weeksData.slice(start, start + itemsPerPage);
    }, [weeksData, page, itemsPerPage]);

    return (
        <Card withBorder style={{ background: getCardBackgroundByMode(theme, themeMode) }}>
            <ScrollArea>
                <Table highlightOnHover>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th style={{ width: 120, whiteSpace: 'nowrap', textAlign: 'center' }}>{t('charts.weekNumber')}</Table.Th>
                            {typeFilter.includes('artist') && <Table.Th style={{ width: 'auto' }}>{t('charts.artistTop1')}</Table.Th>}
                            {typeFilter.includes('album') && <Table.Th style={{ width: 'auto' }}>{t('charts.albumTop1')}</Table.Th>}
                            {typeFilter.includes('track') && <Table.Th style={{ width: 'auto' }}>{t('charts.trackTop1')}</Table.Th>}
                            <Table.Th style={{ width: 1 }}></Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {pageData.map((weekData) => {
                            const startDate = dayjs(weekData.week);
                            const endDate = startDate.add(6, 'day');
                            const dateRange = `${startDate.format('DD/MM/YYYY')} - ${endDate.format('DD/MM/YYYY')}`;

                            const hasAllKill = !!(
                                weekData.artistTop1 && weekData.albumTop1 && weekData.trackTop1 &&
                                weekData.artistTop1.name === weekData.albumTop1.artistName &&
                                weekData.artistTop1.name === weekData.trackTop1.artistName
                            );

                            return (
                                <Table.Tr key={weekData.week}>
                                    <Table.Td style={{ textAlign: 'center' }}>
                                        <Flex direction="column" align="center">
                                            <Tooltip label={dateRange} withArrow>
                                                <Text fw={800} size="lg">{weekData.weekNumber}</Text>
                                            </Tooltip>
                                            {hasAllKill && (
                                                <Box mt={4}>
                                                    <AllKillBadge />
                                                </Box>
                                            )}
                                        </Flex>
                                    </Table.Td>
                                    {typeFilter.includes('artist') && (
                                        <Table.Td style={{ verticalAlign: 'middle' }}>
                                            <EntityCell item={weekData.artistTop1} type="artist" />
                                        </Table.Td>
                                    )}
                                    {typeFilter.includes('album') && (
                                        <Table.Td style={{ verticalAlign: 'middle' }}>
                                            <EntityCell item={weekData.albumTop1} type="album" />
                                        </Table.Td>
                                    )}
                                    {typeFilter.includes('track') && (
                                        <Table.Td style={{ verticalAlign: 'middle' }}>
                                            <EntityCell item={weekData.trackTop1} type="track" />
                                        </Table.Td>
                                    )}
                                    <Table.Td style={{ width: 1, whiteSpace: 'nowrap' }}>
                                        <Button
                                            size="xs"
                                            variant="light"
                                            px={6}
                                            onClick={() => navigate(`/charts/week/${weekData.week}/${firstSelectedType}`)}
                                        >
                                            <IconChevronRight size={16} />
                                        </Button>
                                    </Table.Td>
                                </Table.Tr>
                            );
                        })}
                    </Table.Tbody>
                </Table>
            </ScrollArea>
            {totalPages > 1 && (
                <Box mt="md" style={{ display: 'flex', justifyContent: 'center' }}>
                    <Pagination total={totalPages} value={page} onChange={setPage} size="sm" />
                </Box>
            )}
        </Card>
    );
};
