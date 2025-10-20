import React, { useMemo, useState } from 'react';
import { SimpleGrid, Card, Box, Badge, Flex, useMantineTheme, Text, Pagination, Button, Tooltip } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useSpotifyImage } from '../../hooks/useSpotifyImage';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../../services/SpotifyApi';
import type { ChartData } from '../../db/indexedDb';
import { AllKillBadge } from '../AllKillBadge';
import { ImageEditModal } from '../dialogs/ImageEditModal';
import dayjs from 'dayjs';
import { t } from 'i18next';

interface WeekTop1Data {
	week: string;
	weekNumber: number;
	artistTop1: ChartData | null;
	albumTop1: ChartData | null;
	trackTop1: ChartData | null;
}

interface ChartsWeeksGridViewProps {
	weeksData: WeekTop1Data[];
	itemsPerPage?: number;
	typeFilter?: string[];
	badgeStyle?: 'glass' | 'solid';
}

interface GridItemProps {
    item: ChartData | null;
    type: 'artist' | 'album' | 'track';
    timesAtTop1?: number;
    onOpenModal: (row: ChartData, imageUrl?: string) => void;
    badgeStyle?: 'glass' | 'solid';
    forceUpdate?: number;
}

const GridItem: React.FC<GridItemProps> = ({ item, type, timesAtTop1 = 1, onOpenModal, badgeStyle = 'glass', forceUpdate = 0 }) => {
	const theme = useMantineTheme();

	const spotifyType = type === 'artist' || type === 'album' || type === 'track' ? type : 'artist';
	const { imageUrl } = useSpotifyImage({
		entityId: (item?.entityId || '') + (forceUpdate ? `_${forceUpdate}` : ''),
		name: item?.name || '',
		artist: (type === 'album' || type === 'track') ? item?.artistName : undefined,
		type: spotifyType,
		clientId: SPOTIFY_TOKEN,
		clientSecret: SPOTIFY_SECRET,
	});

    const handleClick = () => {
        if (!item) return;
        onOpenModal(item, imageUrl || undefined);
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
				className={badgeStyle === 'glass' ? 'frosted-glass' : undefined}
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
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Text c="#fff" fw={600} size="sm" pt="sm" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '90%', textAlign: 'center' }}>
                            {item.name}
                        </Text>
						{type !== 'artist' && item.artistName && (
							<Text c="#fff" size="xs" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '90%', textAlign: 'center', opacity: 0.8 }}>
								{item.artistName}
							</Text>
						)}
                    </Box>
                )}
			</Box>
		</Card>
	);
};

export const ChartsWeeksGridView: React.FC<ChartsWeeksGridViewProps> = ({ weeksData, itemsPerPage = 25, typeFilter = ['artist','album','track'], badgeStyle = 'glass' }) => {
    
	const [page, setPage] = useState(1);
	const totalPages = Math.ceil(weeksData.length / itemsPerPage);
    const navigate = useNavigate();
    // Modal state
    const [imageModalRow, setImageModalRow] = useState<ChartData | null>(null);
    const [imageModalUrl, setImageModalUrl] = useState<string>('');
    const [imageForceUpdate, setImageForceUpdate] = useState<{ [entityId: string]: number }>({});

	const pageData = useMemo(() => {
		const start = (page - 1) * itemsPerPage;
		return weeksData.slice(start, start + itemsPerPage);
	}, [weeksData, page, itemsPerPage]);

    // Fixed max width for the grid container
    const containerMaxWidth = 1000;

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
                    <SimpleGrid cols={{ base: 1, sm: (typeFilter.length === 3 ? 1 : typeFilter.length === 2 ? 2 : 2), lg: (typeFilter.length === 3 ? 1 : typeFilter.length === 2 ? 2 : 3) }} spacing="lg">
                        {pageData.map((weekData) => {
                            const hasAllKill = !!(
                                weekData.artistTop1 && weekData.albumTop1 && weekData.trackTop1 &&
                                weekData.artistTop1.name === weekData.albumTop1.artistName &&
                                weekData.artistTop1.name === weekData.trackTop1.artistName
                            );
                            const tiles: Array<React.ReactNode> = [];
                            if (typeFilter.includes('artist') && weekData.artistTop1) {
                                tiles.push(
                            <GridItem
                                        key={`artist-${weekData.artistTop1.entityId}`}
                                        item={weekData.artistTop1}
                                        type="artist"
                                        timesAtTop1={(cumulativeByWeek.artist[weekData.week]?.[weekData.artistTop1.entityId] || 1)}
                                        onOpenModal={(row, url) => { setImageModalRow(row); setImageModalUrl(url || ''); }}
                                        badgeStyle={badgeStyle}
                                        forceUpdate={imageForceUpdate[weekData.artistTop1.entityId] || 0}
                                    />
                                );
                            }
                            if (typeFilter.includes('album') && weekData.albumTop1) {
                                tiles.push(
                            <GridItem
                                        key={`album-${weekData.albumTop1.entityId}`}
                                        item={weekData.albumTop1}
                                        type="album"
                                        timesAtTop1={(cumulativeByWeek.album[weekData.week]?.[weekData.albumTop1.entityId] || 1)}
                                        onOpenModal={(row, url) => { setImageModalRow(row); setImageModalUrl(url || ''); }}
                                        badgeStyle={badgeStyle}
                                        forceUpdate={imageForceUpdate[weekData.albumTop1.entityId] || 0}
                                    />
                                );
                            }
                            if (typeFilter.includes('track') && weekData.trackTop1) {
                                tiles.push(
                            <GridItem
                                        key={`track-${weekData.trackTop1.entityId}`}
                                        item={weekData.trackTop1}
                                        type="track"
                                        timesAtTop1={(cumulativeByWeek.track[weekData.week]?.[weekData.trackTop1.entityId] || 1)}
                                        onOpenModal={(row, url) => { setImageModalRow(row); setImageModalUrl(url || ''); }}
                                        badgeStyle={badgeStyle}
                                        forceUpdate={imageForceUpdate[weekData.trackTop1.entityId] || 0}
                                    />
                                );
                            }
                            const cols = Math.max(tiles.length, 1);
							const startDate = dayjs(weekData.week);
							const endDate = startDate.add(6, 'day');
							const dateRange = `${startDate.format('DD/MM/YYYY')} - ${endDate.format('DD/MM/YYYY')}`;
                            return (
                                <Flex key={weekData.week} direction="column" gap={8}>
                                    <Flex align="center" justify="center" gap={8} wrap="wrap">
										<Tooltip label={dateRange} withArrow>
                                        	<Text fw={600} size="lg">{t('charts.weekNumber')}: {weekData.weekNumber}</Text>
										</Tooltip>
                                        {(typeFilter.length === 3) && hasAllKill && (
                                            <AllKillBadge />
                                        )}
                                        <Button size="xs" variant="light" px={6} onClick={() => navigate(`/charts/week/${weekData.week}/artist`)}>
                                            <IconChevronRight size={16} />
                                        </Button>
                                    </Flex>
                                    <Flex justify="center">
                                        <SimpleGrid cols={cols} spacing="md" style={{ width: '100%' }}>
                                            {tiles}
                                        </SimpleGrid>
                                    </Flex>
                                </Flex>
                            );
                        })}
                    </SimpleGrid>
                </Box>
            </Flex>
			{totalPages > 1 && (
				<Flex justify="center" mt="md">
					<Pagination total={totalPages} value={page} onChange={setPage} size="sm" />
				</Flex>
			)}
            <ImageEditModal
                opened={!!imageModalRow}
                onClose={() => setImageModalRow(null)}
                entityId={imageModalRow?.entityId || ''}
                name={imageModalRow?.name || ''}
                artistName={imageModalRow?.artistName || ''}
                imageUrl={imageModalUrl}
                type={(imageModalRow?.chartType as any) || 'artist'}
                clientId={SPOTIFY_TOKEN}
                clientSecret={SPOTIFY_SECRET}
                onImageChange={(url: string) => {
                    setImageForceUpdate(f => ({ ...f, [imageModalRow!.entityId]: Date.now() }));
                    setImageModalUrl(url);
                }}
            />
		</>
	);
};

