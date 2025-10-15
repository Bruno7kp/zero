import React, { useState, useMemo } from 'react';
import { Card, Table, ScrollArea, Group, Text, Pagination, useMantineTheme, Avatar } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { getCardBackgroundByMode, type ThemeMode } from '../../theme/modes';
import { useSpotifyImage } from '../../hooks/useSpotifyImage';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../../services/SpotifyApi';
import type { LibraryItem } from '../../pages/LibraryPage';
import { CertificationIcon } from '../CertificationIcon';
import { ImageEditModal } from '../dialogs/ImageEditModal';
import { db } from '../../db/indexedDb';
import { getUserPlaycountFromCache } from '../../utils/certification';

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
                                <Table.Th style={{ width: 60, textAlign: 'center' }}>Rank</Table.Th>
                                <Table.Th>{t('charts.titleLabel')}</Table.Th>
                                <Table.Th style={{ width: 80, textAlign: 'center' }}>{t('charts.peak')}</Table.Th>
                                <Table.Th style={{ width: 85, textAlign: 'center' }}>{t('charts.weeks')}</Table.Th>
                                <Table.Th style={{ width: 80, textAlign: 'center' }}>{t('charts.points')}</Table.Th>
                                <Table.Th style={{ width: 80, textAlign: 'center' }}>Plays</Table.Th>
                                {type !== 'artist' && <Table.Th style={{ width: 80, textAlign: 'center' }}>Cert.</Table.Th>}
                                <Table.Th tt="capitalize" style={{ width: 80, textAlign: 'center' }}>{chart?.formula_name || 'Sales'}</Table.Th>
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
    const [modalOpen, setModalOpen] = useState(false);
    const [playcount, setPlaycount] = useState<number | undefined>(item.playcount);
    const [totals, setTotals] = useState<{ totalPoints?: number; totalPlays?: number } | null>(null);

    const spotifyType = type === 'artist' || type === 'album' || type === 'track' ? type : 'artist';
    const { imageUrl } = useSpotifyImage({
        entityId: item.entityId || '',
        name: item.name,
        artist: (type === 'album' || type === 'track') ? item.artistName : undefined,
        type: spotifyType,
        clientId: SPOTIFY_TOKEN,
        clientSecret: SPOTIFY_SECRET,
    });

    // Calculate sales (formula value) based on totals
    const sales = useMemo(() => {
        if (!totals || type === 'artist') return 0;
        
        const pointsWeight = type === 'track' ? (chart?.music_points_weight || 0) : (chart?.album_points_weight || 0);
        const playsWeight = type === 'track' ? (chart?.music_plays_weight || 0) : (chart?.album_plays_weight || 0);
        const totalPoints = totals.totalPoints || 0;
        const totalPlays = totals.totalPlays || 0;
        
        return totalPoints * pointsWeight + totalPlays * playsWeight;
    }, [totals, chart, type]);

    // Load totals for certification calculation
    React.useEffect(() => {
        if (!item.entityId || type === 'artist') return;

        const loadTotals = async () => {
            try {
                const chartIdStr = String(chart?.id || '');
                const stats = await db.charts_stats.get([chartIdStr, type, item.entityId]);
                if (stats?.totals) {
                    setTotals(stats.totals);
                } else {
                    // If not in stats, calculate from points and playcount
                    setTotals({
                        totalPoints: item.points || 0,
                        totalPlays: playcount || item.playcount || 0,
                    });
                }
            } catch (error) {
                console.error('Error loading totals:', error);
            }
        };

        loadTotals();
    }, [item, type, chart, playcount]);

    // Load playcount lazily if not already loaded — BUT ONLY FROM CACHE: do not trigger network fetches here
    React.useEffect(() => {
        if (playcount === undefined && chart?.lastfm_username) {
            setLoadingPlaycount(true);
            const loadPlaycount = async () => {
                try {
                    const pc = await getUserPlaycountFromCache({
                        username: chart.lastfm_username,
                        artistName: item.artistName || item.name,
                        entityName: item.name,
                        chartType: type === 'track' ? 'track' : type === 'album' ? 'album' : 'artist',
                        offline: !!chart?.offline,
                    });
                    if (pc !== null) setPlaycount(pc);
                    else setPlaycount(undefined); // keep undefined => UI shows '-' instead of fetching
                } catch (error) {
                    console.error('Error reading playcount from cache:', error);
                } finally {
                    setLoadingPlaycount(false);
                }
            };
            loadPlaycount();
        }
    }, [item, type, chart, playcount]);

    const handleClick = () => {
        setModalOpen(true);
    };

    return (
        <>
            <Table.Tr>
                <Table.Td style={{ textAlign: 'center' }}>
                    <Text size="sm" c="dimmed">{index + 1}</Text>
                </Table.Td>
                <Table.Td>
                    <Group align="center">
                        <Avatar
                            src={imageUrl}
                            alt={item.name}
                            size="md"
                            radius="sm"
                            onClick={handleClick}
                            style={{ cursor: 'pointer' }}
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <Text fw={600} size="sm" lineClamp={1}>
                                {item.name}
                            </Text>
                            {type !== 'artist' && (
                                <Text c="dimmed" size="xs" lineClamp={1}>
                                    {item.artistName || '-'}
                                </Text>
                            )}
                        </div>
                    </Group>
                </Table.Td>
                
                <Table.Td style={{ textAlign: 'center' }}>
                    {item.peak === 1 ? (
                        <Group gap={4} justify="center" wrap="nowrap">
                            <Text size="sm" fw={600} c="mediumblue">1</Text>
                            {item.timesAtPeak && item.timesAtPeak > 0 && (
                                <Text size="xs" c="dimmed">({item.timesAtPeak}x)</Text>
                            )}
                        </Group>
                    ) : item.peak < 999 ? (
                        <Group gap={4} justify="center" wrap="nowrap">
                            <Text size="sm">{item.peak}</Text>
                            {item.timesAtPeak && item.timesAtPeak > 0 && (
                                <Text size="xs" c="dimmed">({item.timesAtPeak}x)</Text>
                            )}
                        </Group>
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
                {type !== 'artist' && (
                    <Table.Td style={{ textAlign: 'center' }}>
                        {totals && item.entityId ? (
                            <CertificationIcon
                                chart={chart}
                                chartType={type as 'album' | 'track'}
                                totals={totals}
                                entity={{ name: item.name, artistName: item.artistName || '' }}
                                entityId={item.entityId}
                                username={chart?.lastfm_username}
                                size={24}
                            />
                        ) : (
                            <Text size="sm" c="dimmed">-</Text>
                        )}
                    </Table.Td>
                )}
                <Table.Td style={{ textAlign: 'center' }}>
                    <Text size="sm">{sales > 0 ? Math.floor(sales).toLocaleString() : '-'}</Text>
                </Table.Td>
            </Table.Tr>
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
