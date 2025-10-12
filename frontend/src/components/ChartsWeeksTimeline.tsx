import React, { useState, useMemo } from 'react';
import { Timeline, Pagination, Box } from '@mantine/core';
import { IconListNumbers } from '@tabler/icons-react';
import { ChartWeekCard } from './ChartWeekCard';
import type { ThemeMode } from '../theme/modes';
import type { ChartData } from '../db/indexedDb';
import dayjs from 'dayjs';
import { useSpotifyImage } from '../hooks/useSpotifyImage';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../services/SpotifyApi';

interface WeekTop1Data {
    week: string;
    weekNumber: number;
    artistTop1: ChartData | null;
    albumTop1: ChartData | null;
    trackTop1: ChartData | null;
}

interface ChartsWeeksTimelineProps {
    weeksData: WeekTop1Data[];
    themeMode: ThemeMode;
}

const ITEMS_PER_PAGE = 100;

// Component for All-Kill bullet (artist photo)
const AllKillBullet: React.FC<{ entityId: string; name: string }> = ({ entityId, name }) => {
    const { imageUrl } = useSpotifyImage({
        entityId,
        type: 'artist',
        clientId: SPOTIFY_TOKEN,
        clientSecret: SPOTIFY_SECRET,
    });

    return (
        <Box
            style={{
                width: 32,
                height: 32,
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

export const ChartsWeeksTimeline: React.FC<ChartsWeeksTimelineProps> = ({ weeksData, themeMode }) => {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(weeksData.length / ITEMS_PER_PAGE);

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        return weeksData.slice(start, end);
    }, [weeksData, currentPage]);

    const formatWeekDate = (weekStr: string) => {
        const startDate = dayjs(weekStr);
        const endDate = startDate.add(6, 'day');
        return `${startDate.format('DD/MM/YYYY')} - ${endDate.format('DD/MM/YYYY')}`;
    };

    // Check if weeks are sequential to show dashed lines
    const getLineVariant = (index: number): 'solid' | 'dashed' => {
        if (index === 0) return 'solid';
        const currentWeek = dayjs(paginatedData[index].week);
        const prevWeek = dayjs(paginatedData[index - 1].week);
        const expectedPrev = currentWeek.add(7, 'day');
        // If the previous week is not exactly 7 days after current, show dashed
        return prevWeek.isSame(expectedPrev, 'day') ? 'solid' : 'dashed';
    };

    return (
        <>
            <Timeline active={paginatedData.length} bulletSize={32} lineWidth={2}>
                {paginatedData.map((weekData, index) => {
                    // Prepare top1 array for ChartWeekCard - include all types
                    const top1 = [];
                    if (weekData.artistTop1) {
                        top1.push({
                            type: 'artist' as const,
                            name: weekData.artistTop1.name,
                            artistName: weekData.artistTop1.artistName,
                            entityId: weekData.artistTop1.entityId
                        });
                    }
                    if (weekData.albumTop1) {
                        top1.push({
                            type: 'album' as const,
                            name: weekData.albumTop1.name,
                            artistName: weekData.albumTop1.artistName,
                            entityId: weekData.albumTop1.entityId
                        });
                    }
                    if (weekData.trackTop1) {
                        top1.push({
                            type: 'track' as const,
                            name: weekData.trackTop1.name,
                            artistName: weekData.trackTop1.artistName,
                            entityId: weekData.trackTop1.entityId
                        });
                    }

                    // Check for All-Kill (same artist is #1 in all three charts in the same week)
                    // For artist chart: entityId is the artist's Spotify ID
                    // For album/track: artistName contains the artist's name
                    // We need to check if the artist from artist chart matches the artist of album and track
                    const hasAllKill = weekData.artistTop1 && weekData.albumTop1 && weekData.trackTop1 &&
                        weekData.artistTop1.name === weekData.albumTop1.artistName &&
                        weekData.artistTop1.name === weekData.trackTop1.artistName;

                    const lineVariant = getLineVariant(index);

                    // For All-Kill, show artist photo in bullet
                    const bullet = hasAllKill && weekData.artistTop1 ? (
                        <AllKillBullet 
                            entityId={weekData.artistTop1.entityId}
                            name={weekData.artistTop1.name}
                        />
                    ) : (
                        <IconListNumbers size={20} />
                    );

                    return (
                        <Timeline.Item 
                            key={weekData.week} 
                            bullet={bullet}
                            lineVariant={lineVariant}
                        >
                            <ChartWeekCard
                                week={weekData.week}
                                weekNumber={weekData.weekNumber}
                                top1={top1}
                                themeMode={themeMode}
                                formatWeekDate={formatWeekDate}
                                hasAllKill={hasAllKill}
                            />
                        </Timeline.Item>
                    );
                })}
            </Timeline>
            {totalPages > 1 && (
                <Box mt="md" style={{ display: 'flex', justifyContent: 'center' }}>
                    <Pagination
                        total={totalPages}
                        value={currentPage}
                        onChange={setCurrentPage}
                        size="sm"
                    />
                </Box>
            )}
        </>
    );
};
