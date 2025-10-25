import React, { useState, useEffect } from 'react';
import { Title, Text, Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { StatsFilters } from '../StatsFilters';
import { StatsTable } from '../StatsTable';
import { useStatsData } from '../useStatsData';
import { formatNumber } from '../../../utils/format';
import type { DataTableColumn } from 'mantine-datatable';

interface TimesAtTopRow {
    entityId: string;
    name: string;
    artistName: string;
    count: number;
}

export const StatsTimesAtTopPage: React.FC<{ position?: string; type?: string }> = ({ 
    position = '10', 
    type: initialType = 'artist' 
}) => {
    const { t } = useTranslation();
    const [year, setYear] = useState('all');
    const [type, setType] = useState(initialType);
    const [pos, setPos] = useState(parseInt(position));
    const [data, setData] = useState<TimesAtTopRow[]>([]);
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
                    aggregationType: 'times_at_top' 
                });
                setData(result as TimesAtTopRow[]);
            } catch (error) {
                console.error('Error loading times at top data:', error);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        if (chart) {
            loadData();
        }
    }, [year, type, pos, chart, fetchAggregatedStats]);

    const columns: DataTableColumn<TimesAtTopRow>[] = [
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
                    {t('stats.longestInTop', { defaultValue: `Longest in Top ${pos}` })}
                </Title>
                <Text c="dimmed">
                    {t('stats.longestInTopDesc', { defaultValue: `Entries with the most weeks in the top ${pos}` })}
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
            />
        </Stack>
    );
};
