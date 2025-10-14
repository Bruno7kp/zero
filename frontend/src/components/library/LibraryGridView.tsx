import React, { useState } from 'react';
import { Card, SimpleGrid, Group, Text, Pagination, Stack, Box, Avatar, Badge } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useSpotifyImage } from '../../hooks/useSpotifyImage';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../../services/SpotifyApi';
import type { LibraryItem } from '../../pages/LibraryPage';

interface LibraryGridViewProps {
    items: LibraryItem[];
    type: 'artist' | 'album' | 'track';
    page: number;
    setPage: (page: number) => void;
    totalPages: number;
    chart: any;
}

export const LibraryGridView: React.FC<LibraryGridViewProps> = ({
    items,
    type,
    page,
    setPage,
    totalPages,
    chart,
}) => {
    return (
        <>
            <SimpleGrid
                cols={{ base: 2, sm: 3, md: 4, lg: 5, xl: 6 }}
                spacing="md"
            >
                {items.map((item, index) => (
                    <GridItem
                        key={`${item.name}-${item.artistName || ''}-${index}`}
                        item={item}
                        type={type}
                        chart={chart}
                    />
                ))}
            </SimpleGrid>

            {totalPages > 1 && (
                <Group justify="center" mt="md">
                    <Pagination value={page} onChange={setPage} total={totalPages} />
                </Group>
            )}
        </>
    );
};

interface GridItemProps {
    item: LibraryItem;
    type: 'artist' | 'album' | 'track';
    chart: any;
}

const GridItem: React.FC<GridItemProps> = ({ item, type, chart }) => {
    const { t } = useTranslation();
    const [loadingPlaycount, setLoadingPlaycount] = useState(false);
    const [playcount, setPlaycount] = useState<number | undefined>(item.playcount);

    // Get image from Spotify
    const imageUrl = useSpotifyImage({
        name: item.name,
        artist: item.artistName,
        type: type === 'track' ? 'track' : type === 'album' ? 'album' : 'artist',
        enabled: true,
    }, SPOTIFY_TOKEN, SPOTIFY_SECRET);

    // Load playcount lazily if not already loaded
    React.useEffect(() => {
        if (playcount === undefined && chart?.lastfm_username) {
            setLoadingPlaycount(true);
            
            const loadPlaycount = async () => {
                try {
                    if (type === 'artist') {
                        const response = await fetch(
                            `https://ws.audioscrobbler.com/2.0/?method=artist.getInfo&artist=${encodeURIComponent(item.name)}&user=${chart.lastfm_username}&api_key=e35699481c9c3134d856e99792a2b6de&format=json`
                        );
                        const json = await response.json();
                        setPlaycount(parseInt(json?.artist?.stats?.userplaycount || '0', 10));
                    } else if (type === 'album' && item.artistName) {
                        const response = await fetch(
                            `https://ws.audioscrobbler.com/2.0/?method=album.getInfo&artist=${encodeURIComponent(item.artistName)}&album=${encodeURIComponent(item.name)}&user=${chart.lastfm_username}&api_key=e35699481c9c3134d856e99792a2b6de&format=json`
                        );
                        const json = await response.json();
                        setPlaycount(parseInt(json?.album?.userplaycount || '0', 10));
                    } else if (type === 'track' && item.artistName) {
                        const response = await fetch(
                            `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&artist=${encodeURIComponent(item.artistName)}&track=${encodeURIComponent(item.name)}&user=${chart.lastfm_username}&api_key=e35699481c9c3134d856e99792a2b6de&format=json`
                        );
                        const json = await response.json();
                        setPlaycount(parseInt(json?.track?.userplaycount || '0', 10));
                    }
                } catch (error) {
                    console.error('Error loading playcount:', error);
                    setPlaycount(0);
                } finally {
                    setLoadingPlaycount(false);
                }
            };

            loadPlaycount();
        }
    }, [item, type, chart, playcount]);

    return (
        <Card 
            withBorder 
            p="xs" 
            style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
            <Stack gap="xs" align="center">
                <Box style={{ position: 'relative', width: '100%', aspectRatio: '1', overflow: 'hidden', borderRadius: 8 }}>
                    <Avatar
                        src={imageUrl || undefined}
                        alt={item.name}
                        size="100%"
                        radius="md"
                        style={{ width: '100%', height: '100%' }}
                    />
                    {item.peak === 1 && (
                        <Badge
                            color="yellow"
                            variant="filled"
                            size="sm"
                            style={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                            }}
                        >
                            #1
                        </Badge>
                    )}
                </Box>

                <Stack gap={4} style={{ width: '100%' }}>
                    <Text fw={600} size="sm" lineClamp={2} style={{ textAlign: 'center', minHeight: '2.5em' }}>
                        {item.name}
                    </Text>
                    
                    {type !== 'artist' && item.artistName && (
                        <Text c="dimmed" size="xs" lineClamp={1} style={{ textAlign: 'center' }}>
                            {item.artistName}
                        </Text>
                    )}

                    <Group gap="xs" justify="center" wrap="nowrap">
                        {item.peak < 999 && (
                            <Text size="xs" c="dimmed">
                                {t('charts.peak')}: #{item.peak}
                            </Text>
                        )}
                        {item.weeks > 0 && (
                            <Text size="xs" c="dimmed">
                                {item.weeks}w
                            </Text>
                        )}
                    </Group>

                    {(playcount !== undefined || loadingPlaycount) && (
                        <Text size="xs" c="dimmed" style={{ textAlign: 'center' }}>
                            {loadingPlaycount ? '...' : playcount?.toLocaleString()}
                        </Text>
                    )}
                </Stack>
            </Stack>
        </Card>
    );
};
