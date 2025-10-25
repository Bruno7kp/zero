import React, { useState, useEffect } from 'react';
import { Title, Text, Stack, Anchor } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StatsFilters } from '../StatsFilters';
import { StatsTable } from '../StatsTable';
import { useStatsData } from '../useStatsData';
import { formatNumber } from '../../../utils/format';
import { StatsImageCell } from '../StatsImageCell';
import type { DataTableColumn } from 'mantine-datatable';

interface PlaysRow {
    week: string;
    rank: number;
    name: string;
    artistName: string;
    plays: number;
    points: number;
    sales: number;
    entityId: string;
}

export const StatsPlaysPage: React.FC<{ position?: string; type?: string }> = ({ 
    position = 'all', 
    type: initialType = 'artist' 
}) => {
    const { t } = useTranslation();
    const [year, setYear] = useState('all');
    const [type, setType] = useState(initialType);
    const [data, setData] = useState<PlaysRow[]>([]);
    const [loading, setLoading] = useState(true);
    const { chart, fetchPlaysOrDebuts } = useStatsData();

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const result = await fetchPlaysOrDebuts({ 
                    year, 
                    type, 
                    position,
                    dataType: 'plays' 
                });
                setData(result as PlaysRow[]);
            } catch (error) {
                console.error('Error loading plays data:', error);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        if (chart) {
            loadData();
        }
    }, [year, type, position, chart, fetchPlaysOrDebuts]);

    const columns: DataTableColumn<PlaysRow>[] = [
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
            accessor: 'week',
            title: t('charts.week', { defaultValue: 'Week' }),
            render: (row) => (
                <Anchor component={Link} to={`/charts/week/${row.week}/${type}`}>
                    {row.week}
                </Anchor>
            ),
            sortable: true
        },
        {
            accessor: 'rank',
            title: t('charts.position', { defaultValue: 'Position' }),
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
        },
        {
            accessor: 'plays',
            title: t('charts.plays', { defaultValue: 'Plays' }),
            render: (row) => formatNumber(row.plays),
            sortable: true
        },
        {
            accessor: 'sales',
            title: t('charts.sales', { defaultValue: 'Sales' }),
            render: (row) => formatNumber(row.sales),
            sortable: true
        }
    ];

    return (
        <Stack gap="md" p="md">
            <div>
                <Title order={2}>
                    {t('stats.highestPlays', { defaultValue: 'Highest Weekly Plays' })}
                </Title>
                <Text c="dimmed">
                    {t('stats.highestPlaysDesc', { defaultValue: 'Entries with the highest weekly play counts' })}
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
                defaultSortStatus={{ columnAccessor: 'plays', direction: 'desc' }}
                showSalesToggle={true}
                showImagesToggle={true}
            />
        </Stack>
    );
};
