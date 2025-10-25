import React, { useState, useEffect } from 'react';
import { Title, Text, Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { StatsFilters } from '../StatsFilters';
import { StatsTable } from '../StatsTable';
import { useStatsData } from '../useStatsData';
import { formatNumber } from '../../../utils/format';
import type { DataTableColumn } from 'mantine-datatable';

interface ArtistStatsRow {
    artistName: string;
    titlesCount: number;
    totalWeeks: number;
}

export const StatsTimesAtTopByArtistPage: React.FC<{ position?: string; type?: string }> = ({ 
    position = '1', 
    type: initialType = 'artist' 
}) => {
    const { t } = useTranslation();
    const [year, setYear] = useState('all');
    const [type, setType] = useState(initialType);
    const [pos, setPos] = useState(parseInt(position));
    const [data, setData] = useState<ArtistStatsRow[]>([]);
    const [loading, setLoading] = useState(true);
    const { chart, fetchArtistAggregatedStats } = useStatsData();

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const result = await fetchArtistAggregatedStats({ 
                    year, 
                    type, 
                    position: pos
                });
                setData(result as ArtistStatsRow[]);
            } catch (error) {
                console.error('Error loading artist stats data:', error);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        if (chart) {
            loadData();
        }
    }, [year, type, pos, chart, fetchArtistAggregatedStats]);

    const typeLabel = type === 'album' ? t('charts.albums', { defaultValue: 'Albums' }) : 
                      type === 'track' ? t('charts.tracks', { defaultValue: 'Tracks' }) : 
                      t('charts.artists', { defaultValue: 'Artists' });

    const columns: DataTableColumn<ArtistStatsRow>[] = [
        {
            accessor: 'artistName',
            title: t('charts.artist', { defaultValue: 'Artist' }),
            sortable: true
        },
        {
            accessor: 'titlesCount',
            title: t('stats.titlesAtRank', { defaultValue: `${typeLabel} at #${pos}` }),
            render: (row) => formatNumber(row.titlesCount),
            sortable: true
        },
        {
            accessor: 'totalWeeks',
            title: t('stats.totalWeeksAtRank', { defaultValue: `Total Weeks at #${pos}` }),
            render: (row) => formatNumber(row.totalWeeks),
            sortable: true
        }
    ];

    return (
        <Stack gap="md" p="md">
            <div>
                <Title order={2}>
                    {t('stats.artistsWithMost', { defaultValue: `Artists with Most #${pos}s` })}
                </Title>
                <Text c="dimmed">
                    {t('stats.artistsWithMostDesc', { defaultValue: `Artists with the most entries at position #${pos}` })}
                </Text>
            </div>

            <StatsFilters
                year={year}
                type={type}
                position={pos}
                onYearChange={setYear}
                onTypeChange={setType}
                onPositionChange={setPos}
                showPosition={true}
            />

            <StatsTable
                data={data}
                columns={columns}
                loading={loading}
                defaultSortStatus={{ columnAccessor: 'titlesCount', direction: 'desc' }}
            />
        </Stack>
    );
};
