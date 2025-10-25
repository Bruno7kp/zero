import React, { useState, useEffect } from 'react';
import { Title, Text, Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { StatsFilters } from '../StatsFilters';
import { StatsTable } from '../StatsTable';
import { useStatsData } from '../useStatsData';
import { formatNumber } from '../../../utils/format';
import type { DataTableColumn } from 'mantine-datatable';

interface PointsRow {
    entityId: string;
    name: string;
    artistName: string;
    totalPoints: number;
    weeksInChart: number;
}

export const StatsPointsPage: React.FC<{ type?: string }> = ({ 
    type: initialType = 'artist' 
}) => {
    const { t } = useTranslation();
    const [year, setYear] = useState('all');
    const [type, setType] = useState(initialType);
    const [data, setData] = useState<PointsRow[]>([]);
    const [loading, setLoading] = useState(true);
    const { chart, fetchAggregatedStats } = useStatsData();

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const result = await fetchAggregatedStats({ 
                    year, 
                    type,
                    aggregationType: 'points' 
                });
                setData(result as PointsRow[]);
            } catch (error) {
                console.error('Error loading points data:', error);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        if (chart) {
            loadData();
        }
    }, [year, type, chart, fetchAggregatedStats]);

    const columns: DataTableColumn<PointsRow>[] = [
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
        },
        {
            accessor: 'weeksInChart',
            title: t('stats.weeksInChart', { defaultValue: 'Weeks in Chart' }),
            render: (row) => formatNumber(row.weeksInChart || 0),
            sortable: true
        },
        {
            accessor: 'totalPoints',
            title: t('stats.totalPoints', { defaultValue: 'Total Points' }),
            render: (row) => formatNumber(row.totalPoints || 0),
            sortable: true
        }
    ];

    return (
        <Stack gap="md" p="md">
            <div>
                <Title order={2}>
                    {t('stats.topPointAccumulators', { defaultValue: 'Top Point Accumulators' })}
                </Title>
                <Text c="dimmed">
                    {t('stats.topPointAccumulatorsDesc', { defaultValue: 'Entries with the highest total points earned' })}
                </Text>
            </div>

            <StatsFilters
                year={year}
                type={type}
                onYearChange={setYear}
                onTypeChange={setType}
            />

            <StatsTable
                data={data}
                columns={columns}
                loading={loading}
                defaultSortStatus={{ columnAccessor: 'totalPoints', direction: 'desc' }}
            />
        </Stack>
    );
};
