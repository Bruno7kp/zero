import React, { useState, useEffect } from 'react';
import { Title, Text, Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { StatsFilters } from '../StatsFilters';
import { StatsTable } from '../StatsTable';
import { useStatsData } from '../useStatsData';
import { formatNumber } from '../../../utils/format';
import { StatsImageCell } from '../StatsImageCell';
import type { DataTableColumn } from 'mantine-datatable';

interface TimesAtRankRow {
    entityId: string;
    name: string;
    artistName: string;
    count: number;
}

export const StatsTimesAtRankPage: React.FC<{ position?: string; type?: string }> = ({ 
    position = '1', 
    type: initialType = 'artist' 
}) => {
    const { t } = useTranslation();
    const [year, setYear] = useState('all');
    const [type, setType] = useState(initialType);
    const [pos, setPos] = useState(parseInt(position));
    const [data, setData] = useState<TimesAtRankRow[]>([]);
    const [loading, setLoading] = useState(true);
    const { chart, fetchAggregatedStats } = useStatsData();

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const result = await fetchAggregatedStats({ 
                    year, 
                    type, 
                    position: pos,
                    aggregationType: 'times_at_rank' 
                });
                setData(result as TimesAtRankRow[]);
            } catch (error) {
                console.error('Error loading times at rank data:', error);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        if (chart) {
            loadData();
        }
    }, [year, type, pos, chart, fetchAggregatedStats]);

    const columns: DataTableColumn<TimesAtRankRow>[] = [
        {
            accessor: 'image',
            title: '',
            render: (row) => (
                <StatsImageCell
                    entityId={row.entityId}
                    name={row.name}
                    artistName={row.artistName}
                    type={type as 'artist' | 'album' | 'track'}
                />
            ),
            width: 60,
            textAlign: 'center'
        },
        {
            accessor: 'count',
            title: t('stats.weeks', { defaultValue: 'Weeks' }),
            render: (row) => formatNumber(row.count),
            sortable: true
        },
        {
            accessor: 'name',
            title: type === 'artist' ? t('charts.artist', { defaultValue: 'Artist' }) : t('charts.title', { defaultValue: 'Title' }),
            sortable: true
        },
        {
            accessor: 'artistName',
            title: t('charts.artist', { defaultValue: 'Artist' }),
            hidden: type === 'artist',
            sortable: true
        }
    ];

    return (
        <Stack gap="md" p="md">
            <div>
                <Title order={2}>
                    {t('stats.mostWeeksAtRank', { defaultValue: `Most Weeks at #${pos}`, rank: pos })}
                </Title>
                <Text c="dimmed">
                    {t('stats.mostWeeksAtRankDesc', { defaultValue: `Entries with the most weeks at position #${pos}`, rank: pos })}
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
                defaultSortStatus={{ columnAccessor: 'count', direction: 'desc' }}
                showImagesToggle={true}
            />
        </Stack>
    );
};
