import React, { useMemo, useState } from 'react';
import { SimpleGrid, Card, Box, Badge, Flex, useMantineTheme, Timeline, Text, Pagination } from '@mantine/core';
import { IconListNumbers } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useSpotifyImage } from '../hooks/useSpotifyImage';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../services/SpotifyApi';
import type { ChartData } from '../db/indexedDb';
import dayjs from 'dayjs';
import { AllKillBadge } from './AllKillBadge';

interface WeekTop1Data {
    week: string;
    weekNumber: number;
    artistTop1: ChartData | null;
    albumTop1: ChartData | null;
    trackTop1: ChartData | null;
}

// Component for All-Kill bullet (artist photo), mirrors Timeline style
const AllKillBullet: React.FC<{ entityId: string; name: string }> = ({ entityId, name }) => {
    const { imageUrl } = useSpotifyImage({
        entityId,
        type: 'artist',
        name,
        clientId: SPOTIFY_TOKEN,
        clientSecret: SPOTIFY_SECRET,
    });

    return (
        <Box
            style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                overflow: 'hidden',
                backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundColor: imageUrl ? 'transparent' : '#ccc',
            }}
            title={name}
        />
    );
};

interface ChartsWeeksGridViewProps {
    weeksData: WeekTop1Data[];
    itemsPerPage?: number;
    typeFilter?: string[];
}

interface GridItemProps {
    item: ChartData | null;
    type: 'artist' | 'album' | 'track';
    week: string;
    timesAtTop1?: number;
}

const GridItem: React.FC<GridItemProps> = ({ item, type, week, timesAtTop1 = 1 }) => {
    const theme = useMantineTheme();
    const navigate = useNavigate();

    const spotifyType = type === 'artist' || type === 'album' || type === 'track' ? type : 'artist';
    const { imageUrl } = useSpotifyImage({
        entityId: item?.entityId || '',
        name: item?.name || '',
        artist: (type === 'album' || type === 'track') ? item?.artistName : undefined,
        type: spotifyType,
        clientId: SPOTIFY_TOKEN,
        clientSecret: SPOTIFY_SECRET,
    });

    const handleClick = () => {
        navigate(`/charts/week/${week}/${type}`);
    };

    if (!item) return null;

    return (
        <Card
            shadow="md"
            radius="md"
            p={0}
            style={{
                background: 'transparent',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
            }}
            onClick={handleClick}
        >
            <Badge
                variant="filled"
                size="lg"
                style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 2,
                }}
            >
                {timesAtTop1}x #1
            </Badge>

            <Box
                style={{
                    width: '100%',
                    paddingBottom: '100%',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <Box
                    style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundColor: imageUrl ? 'transparent' : theme.colors.gray[7],
                    }}
                />
            </Box>
        </Card>
    );
};

export const ChartsWeeksGridView: React.FC<ChartsWeeksGridViewProps> = ({ weeksData, itemsPerPage = 25, typeFilter = ['artist','album','track'] }) => {
    
    const [page, setPage] = useState(1);
    const totalPages = Math.ceil(weeksData.length / itemsPerPage);

    // Determine max width based on how many types are selected
    const selectedCount = ['artist','album','track'].filter((t) => typeFilter.includes(t)).length;
    const containerMaxWidth = selectedCount === 3 ? 800 : selectedCount === 2 ? 500 : 300;

    const pageData = useMemo(() => {
        const start = (page - 1) * itemsPerPage;
        return weeksData.slice(start, start + itemsPerPage);
    }, [weeksData, page, itemsPerPage]);

    // Build cumulative counts up to each week (chronological order)
    const cumulativeByWeek = useMemo(() => {
        const result: { artist: Record<string, Record<string, number>>; album: Record<string, Record<string, number>>; track: Record<string, Record<string, number>> } = {
            artist: {},
            album: {},
            track: {},
        };
        const acc = {
            artist: new Map<string, number>(),
            album: new Map<string, number>(),
            track: new Map<string, number>(),
        };
        const sortedAsc = [...weeksData].sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());
        for (const w of sortedAsc) {
            // Initialize week maps
            result.artist[w.week] = result.artist[w.week] || {};
            result.album[w.week] = result.album[w.week] || {};
            result.track[w.week] = result.track[w.week] || {};
            if (w.artistTop1) {
                const prev = acc.artist.get(w.artistTop1.entityId) || 0;
                const next = prev + 1;
                acc.artist.set(w.artistTop1.entityId, next);
                result.artist[w.week][w.artistTop1.entityId] = next;
            }
            if (w.albumTop1) {
                const prev = acc.album.get(w.albumTop1.entityId) || 0;
                const next = prev + 1;
                acc.album.set(w.albumTop1.entityId, next);
                result.album[w.week][w.albumTop1.entityId] = next;
            }
            if (w.trackTop1) {
                const prev = acc.track.get(w.trackTop1.entityId) || 0;
                const next = prev + 1;
                acc.track.set(w.trackTop1.entityId, next);
                result.track[w.week][w.trackTop1.entityId] = next;
            }
        }
        return result;
    }, [weeksData]);

    return (
        <>
            <Flex justify="center">
                <Box style={{ width: '100%', maxWidth: containerMaxWidth }}>
            <Timeline active={pageData.length} bulletSize={28} lineWidth={2}>
                {pageData.map((weekData, index) => {
                    const startDate = dayjs(weekData.week);
                    const endDate = startDate.add(6, 'day');
                    const dateRange = `${startDate.format('DD/MM/YYYY')} - ${endDate.format('DD/MM/YYYY')}`;
                    // Mirror Timeline logic (data is in descending order): compare current with next
                    const isLast = index === pageData.length - 1;
                    const nextWeek = !isLast ? dayjs(pageData[index + 1].week) : null;
                    const expectedNext = startDate.subtract(7, 'day');
                    const lineVariant: 'solid' | 'dashed' = (!isLast && nextWeek && nextWeek.isSame(expectedNext, 'day')) ? 'solid' : (isLast ? 'solid' : 'dashed');

                    const hasAllKill = !!(
                        weekData.artistTop1 && weekData.albumTop1 && weekData.trackTop1 &&
                        weekData.artistTop1.name === weekData.albumTop1.artistName &&
                        weekData.artistTop1.name === weekData.trackTop1.artistName
                    );
                    const bullet = hasAllKill && weekData.artistTop1 ? (
                        <AllKillBullet entityId={weekData.artistTop1.entityId} name={weekData.artistTop1.name} />
                    ) : (
                        <IconListNumbers size={18} />
                    );
                    // Build active tiles array based on filter and availability
                    const tiles: Array<React.ReactNode> = [];
                    if (typeFilter.includes('artist') && weekData.artistTop1) {
                        tiles.push(
                            <GridItem
                                key={`artist-${weekData.artistTop1.entityId}`}
                                item={weekData.artistTop1}
                                type="artist"
                                week={weekData.week}
                                timesAtTop1={(cumulativeByWeek.artist[weekData.week]?.[weekData.artistTop1.entityId] || 1)}
                            />
                        );
                    }
                    if (typeFilter.includes('album') && weekData.albumTop1) {
                        tiles.push(
                            <GridItem
                                key={`album-${weekData.albumTop1.entityId}`}
                                item={weekData.albumTop1}
                                type="album"
                                week={weekData.week}
                                timesAtTop1={(cumulativeByWeek.album[weekData.week]?.[weekData.albumTop1.entityId] || 1)}
                            />
                        );
                    }
                    if (typeFilter.includes('track') && weekData.trackTop1) {
                        tiles.push(
                            <GridItem
                                key={`track-${weekData.trackTop1.entityId}`}
                                item={weekData.trackTop1}
                                type="track"
                                week={weekData.week}
                                timesAtTop1={(cumulativeByWeek.track[weekData.week]?.[weekData.trackTop1.entityId] || 1)}
                            />
                        );
                    }

                    // Dynamic columns: let grid grow/shrink based on active tiles
                    const cols = Math.max(tiles.length, 1);

                    return (
                        <Timeline.Item key={weekData.week} bullet={bullet} lineVariant={lineVariant} title={
                            <Flex align="center" gap={8} wrap="wrap">
                                <Text fw={700} size="sm">
                                    Semana: {weekData.weekNumber} <Text ms="sm" span size="xs" c="dimmed">{dateRange}</Text>
                                </Text>
                                {hasAllKill && <AllKillBadge />}
                            </Flex>
                        }>
                        <SimpleGrid cols={cols} spacing="md">
                            {tiles}
                        </SimpleGrid>
                    </Timeline.Item>
                    );
                })}
            </Timeline>
                </Box>
            </Flex>
            {totalPages > 1 && (
                <Flex justify="center" mt="md">
                    <Pagination total={totalPages} value={page} onChange={setPage} size="sm" />
                </Flex>
            )}
        </>
    );
};
