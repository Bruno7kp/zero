import React, { useState, useMemo } from 'react';
import { DataTable } from 'mantine-datatable';
import { Paper, Switch, Group, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { DataTableColumn, DataTableSortStatus } from 'mantine-datatable';

interface StatsTableProps<T> {
    data: T[];
    columns: DataTableColumn<T>[];
    loading?: boolean;
    defaultSortStatus?: DataTableSortStatus<T>;
    showSalesToggle?: boolean;
    rowExpansion?: any;
}

export function StatsTable<T extends Record<string, any>>({
    data,
    columns,
    loading = false,
    defaultSortStatus,
    showSalesToggle = false,
    rowExpansion
}: StatsTableProps<T>) {
    const { t } = useTranslation();
    const [page, setPage] = useState(1);
    const [pageSize] = useState(100);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus<T>>(
        defaultSortStatus || { columnAccessor: 'rank', direction: 'asc' }
    );
    const [showSales, setShowSales] = useState(false);

    // Filter columns based on sales visibility
    const visibleColumns = useMemo(() => {
        if (!showSalesToggle) return columns;
        
        return columns.filter(col => {
            if (col.accessor === 'sales') return showSales;
            return true;
        });
    }, [columns, showSales, showSalesToggle]);

    // Sort data
    const sortedData = useMemo(() => {
        if (!sortStatus) return data;

        return [...data].sort((a, b) => {
            const aValue = a[sortStatus.columnAccessor as string];
            const bValue = b[sortStatus.columnAccessor as string];

            if (aValue === undefined || aValue === null) return 1;
            if (bValue === undefined || bValue === null) return -1;

            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortStatus.direction === 'asc' ? aValue - bValue : bValue - aValue;
            }

            const aStr = String(aValue);
            const bStr = String(bValue);
            return sortStatus.direction === 'asc' 
                ? aStr.localeCompare(bStr)
                : bStr.localeCompare(aStr);
        });
    }, [data, sortStatus]);

    // Paginate data
    const paginatedData = useMemo(() => {
        const start = (page - 1) * pageSize;
        return sortedData.slice(start, start + pageSize);
    }, [sortedData, page, pageSize]);

    return (
        <Paper>
            {showSalesToggle && (
                <Group p="md" justify="space-between">
                    <Text size="sm" fw={500}>
                        {t('stats.totalRecords', { defaultValue: 'Total Records' })}: {data.length}
                    </Text>
                    <Switch
                        label={t('stats.showSales', { defaultValue: 'Show Sales' })}
                        checked={showSales}
                        onChange={(e) => setShowSales(e.currentTarget.checked)}
                    />
                </Group>
            )}
            
            <DataTable
                columns={visibleColumns}
                records={paginatedData}
                fetching={loading}
                sortStatus={sortStatus}
                onSortStatusChange={setSortStatus}
                page={page}
                onPageChange={setPage}
                totalRecords={sortedData.length}
                recordsPerPage={pageSize}
                striped
                highlightOnHover
                rowExpansion={rowExpansion}
                noRecordsText={t('stats.noData', { defaultValue: 'No data available' })}
            />
        </Paper>
    );
}
