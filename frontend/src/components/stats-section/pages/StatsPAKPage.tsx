import React, { useState, useEffect } from 'react';
import { Title, Text, Stack, Anchor } from '@mantine/core';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StatsFilters } from '../StatsFilters';
import { StatsTable } from '../StatsTable';
import { useStatsData } from '../useStatsData';
import type { DataTableColumn } from 'mantine-datatable';

interface PAKRow {
    week: string;
    artist: string;
    album: string;
    track: string;
    artistName: string;
}

export const StatsPAKPage: React.FC = () => {
    const { t } = useTranslation();
    const [year, setYear] = useState('all');
    const [data, setData] = useState<PAKRow[]>([]);
    const [loading, setLoading] = useState(true);
    const { chart, fetchPAKData } = useStatsData();

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const result = await fetchPAKData({ year });
                setData(result as PAKRow[]);
            } catch (error) {
                console.error('Error loading PAK data:', error);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        if (chart) {
            loadData();
        }
    }, [year, chart, fetchPAKData]);

    const columns: DataTableColumn<PAKRow>[] = [
        {
            accessor: 'week',
            title: t('charts.week', { defaultValue: 'Week' }),
            render: (row) => (
                <Anchor component={Link} to={`/charts/week/${row.week}/artist`}>
                    {row.week}
                </Anchor>
            ),
            sortable: true
        },
        {
            accessor: 'artistName',
            title: t('charts.artist', { defaultValue: 'Artist' }),
            sortable: true
        },
        {
            accessor: 'album',
            title: t('charts.album', { defaultValue: 'Album' }),
            sortable: true
        },
        {
            accessor: 'track',
            title: t('charts.track', { defaultValue: 'Track' }),
            sortable: true
        }
    ];

    return (
        <Stack gap="md" p="md">
            <div>
                <Title order={2}>
                    {t('stats.pak', { defaultValue: 'Perfect All Kill' })}
                </Title>
                <Text c="dimmed">
                    {t('stats.pakDesc', { defaultValue: 'Artists who reached #1 in all three charts simultaneously' })}
                </Text>
            </div>

            <StatsFilters
                year={year}
                type="artist"
                onYearChange={setYear}
                onTypeChange={() => {}}
                showType={false}
            />

            <StatsTable
                data={data}
                columns={columns}
                loading={loading}
                defaultSortStatus={{ columnAccessor: 'week', direction: 'desc' }}
            />
        </Stack>
    );
};
