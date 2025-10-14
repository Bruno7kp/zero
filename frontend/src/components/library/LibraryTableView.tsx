import React, { useState } from 'react';
import { Card, Table, ScrollArea, Group, Text, Pagination, useMantineTheme, Avatar, Badge } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { getCardBackgroundByMode, type ThemeMode } from '../../theme/modes';
import { useSpotifyImage } from '../../hooks/useSpotifyImage';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../../services/SpotifyApi';
import type { LibraryItem } from '../../pages/LibraryPage';

interface LibraryTableViewProps {
    items: LibraryItem[];
    type: 'artist' | 'album' | 'track';
    page: number;
    setPage: (page: number) => void;
    totalPages: number;
    chart: any;
}

export const LibraryTableView: React.FC<LibraryTableViewProps> = ({
    items,
    type,
    page,
    setPage,
    totalPages,
    chart,
}) => {
    const { t } = useTranslation();
    const theme = useMantineTheme();
    const themeMode = useSelector((s: any) => (s.theme?.value as ThemeMode) || 'dark');

    return (
        <>
            <Card withBorder style={{ background: getCardBackgroundByMode(theme, themeMode) }}>
                <ScrollArea>
                    <Table highlightOnHover>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th style={{ width: 60 }}>#</Table.Th>
                                <Table.Th style={{ width: 60 }}></Table.Th>
                                <Table.Th>{t('charts.titleLabel')}</Table.Th>
                                {type !== 'artist' && <Table.Th>{t('charts.artistLabel')}</Table.Th>}
                                <Table.Th style={{ width: 100, textAlign: 'center' }}>{t('charts.peak')}</Table.Th>
                                <Table.Th style={{ width: 100, textAlign: 'center' }}>{t('charts.weeks')}</Table.Th>
                                <Table.Th style={{ width: 120, textAlign: 'center' }}>{t('charts.points')}</Table.Th>
                                <Table.Th style={{ width: 140, textAlign: 'center' }}>{t('charts.plays')}</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {items.map((item, index) => (
                                <TableRow
                                    key={`${item.name}-${item.artistName || ''}-${index}`}
                                    item={item}
                                    type={type}
                                    index={index}
                                    chart={chart}
                                />
                            ))}
                        </Table.Tbody>
                    </Table>
                </ScrollArea>
            </Card>

            {totalPages > 1 && (
                <Group justify="center" mt="md">
                    <Pagination value={page} onChange={setPage} total={totalPages} />
                </Group>
            )}
        </>
    );
};

interface TableRowProps {
    item: LibraryItem;
    type: 'artist' | 'album' | 'track';
    index: number;
    chart: any;
}

const TableRow: React.FC<TableRowProps> = ({ item, type, index, chart }) => {
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
        <Table.Tr>
            <Table.Td style={{ textAlign: 'center' }}>
                <Text size="sm" c="dimmed">{index + 1}</Text>
            </Table.Td>
            <Table.Td>
                <Avatar
                    src={imageUrl || undefined}
                    alt={item.name}
                    size="md"
                    radius="md"
                />
            </Table.Td>
            <Table.Td>
                <Text fw={600} size="sm" lineClamp={1}>
                    {item.name}
                </Text>
            </Table.Td>
            {type !== 'artist' && (
                <Table.Td>
                    <Text c="dimmed" size="xs" lineClamp={1}>
                        {item.artistName || '-'}
                    </Text>
                </Table.Td>
            )}
            <Table.Td style={{ textAlign: 'center' }}>
                {item.peak === 1 ? (
                    <Badge color="yellow" variant="filled">
                        #1
                    </Badge>
                ) : item.peak < 999 ? (
                    <Text size="sm">#{item.peak}</Text>
                ) : (
                    <Text size="sm" c="dimmed">-</Text>
                )}
            </Table.Td>
            <Table.Td style={{ textAlign: 'center' }}>
                <Text size="sm">{item.weeks > 0 ? item.weeks : '-'}</Text>
            </Table.Td>
            <Table.Td style={{ textAlign: 'center' }}>
                <Text size="sm">{item.points > 0 ? item.points.toLocaleString() : '-'}</Text>
            </Table.Td>
            <Table.Td style={{ textAlign: 'center' }}>
                {loadingPlaycount ? (
                    <Text size="sm" c="dimmed">...</Text>
                ) : playcount !== undefined ? (
                    <Text size="sm">{playcount.toLocaleString()}</Text>
                ) : (
                    <Text size="sm" c="dimmed">-</Text>
                )}
            </Table.Td>
        </Table.Tr>
    );
};
