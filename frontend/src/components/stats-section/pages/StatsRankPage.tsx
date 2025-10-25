import React, { useState, useEffect, useMemo } from 'react';
import { Title, Text, Stack, Badge } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { StatsFilters } from '../StatsFilters';
import { StatsTable } from '../StatsTable';
import { useStatsData } from '../useStatsData';
import { formatNumber } from '../../../utils/format';
import { StatsImageCell } from '../StatsImageCell';
import type { DataTableColumn } from 'mantine-datatable';

interface RankRow {
    week: string;
    name: string;
    artistName: string;
    plays: number;
    points: number;
    sales: number;
    rank: number;
    entityId: string;
}

export const StatsRankPage: React.FC<{ position?: string; type?: string }> = ({ 
    position = '1', 
    type: initialType = 'artist' 
}) => {
    const { t } = useTranslation();
    const [year, setYear] = useState('all');
    const [type, setType] = useState(initialType);
    const [pos, setPos] = useState(parseInt(position));
    const [data, setData] = useState<RankRow[]>([]);
    const [loading, setLoading] = useState(true);
    const { chart, fetchRankData } = useStatsData();

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const result = await fetchRankData({ year, type, position: pos });
                setData(result as RankRow[]);
            } catch (error) {
                console.error('Error loading rank data:', error);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        if (chart) {
            loadData();
        }
    }, [year, type, pos, chart, fetchRankData]);

    // Count occurrences per entity
    const aggregatedData = useMemo(() => {
        const entityMap: Record<string, RankRow & { count: number }> = {};
        
        data.forEach(row => {
            if (!entityMap[row.entityId]) {
                entityMap[row.entityId] = { ...row, count: 0 };
            }
            entityMap[row.entityId].count++;
        });

        return Object.values(entityMap).sort((a, b) => b.count - a.count);
    }, [data]);

    const columns: DataTableColumn<RankRow & { count: number }>[] = [
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
            title: t('stats.timesAtRank', { defaultValue: 'Times at #' + pos, rank: pos }),
            render: (row) => <Badge color="blue" variant="filled">{row.count}</Badge>,
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
                    {t('stats.allAtRank', { defaultValue: `All #${pos}s`, rank: pos })}
                </Title>
                <Text c="dimmed">
                    {t('stats.allAtRankDesc', { defaultValue: `All entries that reached position #${pos}`, rank: pos })}
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
                data={aggregatedData}
                columns={columns}
                loading={loading}
                defaultSortStatus={{ columnAccessor: 'count', direction: 'desc' }}
                showSalesToggle={true}
                showImagesToggle={true}
            />
        </Stack>
    );
};
