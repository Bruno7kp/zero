import React from 'react';
import { SimpleGrid, Card, Box, Text, Badge, Flex, useMantineTheme } from '@mantine/core';
import { IconMicrophone, IconDisc, IconMusic } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useSpotifyImage } from '../hooks/useSpotifyImage';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../services/SpotifyApi';
import { getCardBackgroundByMode, type ThemeMode } from '../theme/modes';
import type { ChartData } from '../db/indexedDb';

interface WeekTop1Data {
    week: string;
    weekNumber: number;
    artistTop1: ChartData | null;
    albumTop1: ChartData | null;
    trackTop1: ChartData | null;
}

interface ChartsWeeksGridViewProps {
    weeksData: WeekTop1Data[];
    themeMode: ThemeMode;
}

interface GridItemProps {
    item: ChartData | null;
    type: 'artist' | 'album' | 'track';
    week: string;
    weekNumber: number;
    themeMode: ThemeMode;
    timesAtTop1?: number;
}

const GridItem: React.FC<GridItemProps> = ({ item, type, week, weekNumber, themeMode, timesAtTop1 = 1 }) => {
    const theme = useMantineTheme();
    const { t } = useTranslation();
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

    const typeIcon = type === 'artist' ? <IconMicrophone size={16} /> : type === 'album' ? <IconDisc size={16} /> : <IconMusic size={16} />;
    const typeLabel = type === 'artist' ? t('charts.artist') : type === 'album' ? t('charts.album') : t('charts.track');

    const handleClick = () => {
        navigate(`/charts/${week}/${type}`);
    };

    if (!item) return null;

    return (
        <Card
            shadow="md"
            radius="md"
            style={{
                background: getCardBackgroundByMode(theme, themeMode),
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
                    borderRadius: theme.radius.md,
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

            <Flex direction="column" gap="xs" mt="md">
                <Flex align="center" gap="xs">
                    {typeIcon}
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                        {typeLabel}
                    </Text>
                </Flex>
                <Text fw={600} lineClamp={2} size="sm">
                    {item.name}
                </Text>
                {type !== 'artist' && item.artistName && (
                    <Text size="xs" c="dimmed" lineClamp={1}>
                        {item.artistName}
                    </Text>
                )}
                <Text size="xs" c="dimmed">
                    {t('charts.weekNumber')}: {weekNumber}
                </Text>
            </Flex>
        </Card>
    );
};

export const ChartsWeeksGridView: React.FC<ChartsWeeksGridViewProps> = ({ weeksData, themeMode }) => {
    return (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="md">
            {weeksData.map((weekData) => (
                <React.Fragment key={weekData.week}>
                    {weekData.artistTop1 && (
                        <GridItem
                            item={weekData.artistTop1}
                            type="artist"
                            week={weekData.week}
                            weekNumber={weekData.weekNumber}
                            themeMode={themeMode}
                        />
                    )}
                    {weekData.albumTop1 && (
                        <GridItem
                            item={weekData.albumTop1}
                            type="album"
                            week={weekData.week}
                            weekNumber={weekData.weekNumber}
                            themeMode={themeMode}
                        />
                    )}
                    {weekData.trackTop1 && (
                        <GridItem
                            item={weekData.trackTop1}
                            type="track"
                            week={weekData.week}
                            weekNumber={weekData.weekNumber}
                            themeMode={themeMode}
                        />
                    )}
                </React.Fragment>
            ))}
        </SimpleGrid>
    );
};
