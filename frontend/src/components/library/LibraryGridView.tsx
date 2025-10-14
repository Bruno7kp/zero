import React, { useState } from 'react';
import { Card, SimpleGrid, Group, Text, Pagination, Stack, Box, Badge, useMantineTheme } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useSpotifyImage } from '../../hooks/useSpotifyImage';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../../services/SpotifyApi';
import type { LibraryItem } from '../../pages/LibraryPage';
import { ImageEditModal } from '../dialogs/ImageEditModal';

interface LibraryGridViewProps {
    items: LibraryItem[];
    type: 'artist' | 'album' | 'track';
    page: number;
    setPage: (page: number) => void;
    totalPages: number;
    chart: any;
    badgeStyle?: 'glass' | 'solid';
}

export const LibraryGridView: React.FC<LibraryGridViewProps> = ({
    items,
    type,
    page,
    setPage,
    totalPages,
    chart,
    badgeStyle = 'glass',
}) => {
    return (
        <>
            <SimpleGrid
                cols={{ base: 2, sm: 3, lg: 5 }}
                spacing="md"
            >
                {items.map((item, index) => (
                    <GridItem
                        key={`${item.name}-${item.artistName || ''}-${index}`}
                        item={item}
                        type={type}
                        chart={chart}
                        badgeStyle={badgeStyle}
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
    badgeStyle?: 'glass' | 'solid';
}

const GridItem: React.FC<GridItemProps> = ({ item, type, chart, badgeStyle = 'glass' }) => {
    const theme = useMantineTheme();
    const [modalOpen, setModalOpen] = useState(false);

    const spotifyType = type === 'artist' || type === 'album' || type === 'track' ? type : 'artist';
    const { imageUrl } = useSpotifyImage({
        entityId: item.entityId || '',
        name: item.name,
        artist: (type === 'album' || type === 'track') ? item.artistName : undefined,
        type: spotifyType,
        clientId: SPOTIFY_TOKEN,
        clientSecret: SPOTIFY_SECRET,
    });

    const handleClick = () => {
        setModalOpen(true);
    };

    // Show badge if item has peaked in the chart
    const showBadge = item.peak < 999 && item.timesAtPeak && item.timesAtPeak > 0;

    return (
        <>
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
                {showBadge && (
                    <Badge
                        variant="filled"
                        size="lg"
                        style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            zIndex: 2,
                        }}
                        className={badgeStyle === 'glass' ? 'frosted-glass' : undefined}
                    >
                        {item.timesAtPeak}x #{item.peak}
                    </Badge>
                )}

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
                    {/* Bottom gradient overlay with centered text */}
                    {item?.name && (
                        <Box
                            style={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                bottom: 0,
                                padding: '8px 10px',
                                background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.75) 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Text c="#fff" fw={700} size="sm" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '90%', textAlign: 'center' }}>
                                {item.name}
                            </Text>
                        </Box>
                    )}
                </Box>
            </Card>

            <ImageEditModal
                opened={modalOpen}
                onClose={() => setModalOpen(false)}
                entityId={item.entityId || ''}
                name={item.name}
                artistName={item.artistName || ''}
                imageUrl={imageUrl || ''}
                type={type}
                clientId={SPOTIFY_TOKEN}
                clientSecret={SPOTIFY_SECRET}
                onImageChange={() => {}}
            />
        </>
    );
};
