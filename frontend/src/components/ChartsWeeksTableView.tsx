import React from 'react';
import { Table, ScrollArea, Button } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { ChartData } from '../db/indexedDb';

interface WeekTop1Data {
    week: string;
    weekNumber: number;
    artistTop1: ChartData | null;
    albumTop1: ChartData | null;
    trackTop1: ChartData | null;
}

interface ChartsWeeksTableViewProps {
    weeksData: WeekTop1Data[];
    chartId: number;
}

export const ChartsWeeksTableView: React.FC<ChartsWeeksTableViewProps> = ({ weeksData, chartId }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleViewWeek = (week: string, type: string) => {
        navigate(`/charts/${week}/${type}`);
    };

    return (
        <ScrollArea>
            <Table striped highlightOnHover>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>{t('charts.weekNumber')}</Table.Th>
                        <Table.Th>{t('charts.weekDate')}</Table.Th>
                        <Table.Th>{t('charts.artistTop1')}</Table.Th>
                        <Table.Th>{t('charts.albumTop1')}</Table.Th>
                        <Table.Th>{t('charts.trackTop1')}</Table.Th>
                        <Table.Th>{t('charts.actions')}</Table.Th>
                    </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                    {weeksData.map((weekData) => {
                        const startDate = new Date(weekData.week);
                        const endDate = new Date(startDate);
                        endDate.setDate(endDate.getDate() + 6);
                        const dateRange = `${startDate.toLocaleDateString('pt-BR')} - ${endDate.toLocaleDateString('pt-BR')}`;

                        return (
                            <Table.Tr key={weekData.week}>
                                <Table.Td>{weekData.weekNumber}</Table.Td>
                                <Table.Td>{dateRange}</Table.Td>
                                <Table.Td>{weekData.artistTop1?.name || '-'}</Table.Td>
                                <Table.Td>
                                    {weekData.albumTop1?.name || '-'}
                                    {weekData.albumTop1?.artistName && ` (${weekData.albumTop1.artistName})`}
                                </Table.Td>
                                <Table.Td>
                                    {weekData.trackTop1?.name || '-'}
                                    {weekData.trackTop1?.artistName && ` (${weekData.trackTop1.artistName})`}
                                </Table.Td>
                                <Table.Td>
                                    <Button
                                        size="xs"
                                        variant="subtle"
                                        leftSection={<IconExternalLink size={14} />}
                                        onClick={() => handleViewWeek(weekData.week, 'artist')}
                                    >
                                        {t('charts.viewChart')}
                                    </Button>
                                </Table.Td>
                            </Table.Tr>
                        );
                    })}
                </Table.Tbody>
            </Table>
        </ScrollArea>
    );
};
