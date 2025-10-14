import React from 'react';
import { Card, Flex, Group, Select, SegmentedControl, Center } from '@mantine/core';
import { IconTable, IconLayoutGrid, IconFilter } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface LibraryFiltersProps {
    selectedType: 'artist' | 'album' | 'track';
    setSelectedType: (type: 'artist' | 'album' | 'track') => void;
    viewMode: 'table' | 'grid';
    setViewMode: (mode: 'table' | 'grid') => void;
    itemsPerPage: number;
    setItemsPerPage: (value: number) => void;
    sortBy: 'playcount' | 'points' | 'sales' | 'weeks' | 'peak';
    setSortBy: (value: 'playcount' | 'points' | 'sales' | 'weeks' | 'peak') => void;
    badgeStyle?: 'glass' | 'solid';
    setBadgeStyle?: (style: 'glass' | 'solid') => void;
}

export const LibraryFilters: React.FC<LibraryFiltersProps> = ({
    selectedType,
    setSelectedType,
    viewMode,
    setViewMode,
    itemsPerPage,
    setItemsPerPage,
    sortBy,
    setSortBy,
    badgeStyle,
    setBadgeStyle,
}) => {
    const { t } = useTranslation();

    return (
        <Card shadow="none" p="md" style={{ background: 'transparent' }}>
            <Flex direction="column" gap="md">
                <Group grow>
                    <SegmentedControl
                        value={selectedType}
                        onChange={(value) => setSelectedType(value as 'artist' | 'album' | 'track')}
                        data={[
                            { label: t('charts.artist'), value: 'artist' },
                            { label: t('charts.album'), value: 'album' },
                            { label: t('charts.track'), value: 'track' },
                        ]}
                    />
                </Group>

                <Group grow>
                    <Select
                        label={t('library.sortBy')}
                        value={sortBy}
                        onChange={(value) => {
                            if (value) setSortBy(value as any);
                        }}
                        data={[
                            { value: 'playcount', label: t('library.sortByPlaycount') },
                            { value: 'points', label: t('library.sortByPoints') },
                            { value: 'sales', label: t('library.sortBySales') },
                            { value: 'weeks', label: t('library.sortByWeeks') },
                            { value: 'peak', label: t('library.sortByPeak') },
                        ]}
                    />
                    <Select
                        label={t('charts.itemsPerPage')}
                        leftSection={<IconFilter size={16} />}
                        value={String(itemsPerPage)}
                        onChange={(value) => {
                            if (value) setItemsPerPage(parseInt(value, 10));
                        }}
                        data={[
                            { value: '10', label: '10' },
                            { value: '25', label: '25' },
                            { value: '30', label: '30' },
                            { value: '50', label: '50' },
                        ]}
                    />
                </Group>

                <Group justify="center" gap="md">
                    <SegmentedControl
                        value={viewMode}
                        withItemsBorders={false}
                        onChange={(value) => setViewMode(value as 'table' | 'grid')}
                        data={[
                            { label: <Center><IconTable size={18} /></Center> as any, value: 'table' },
                            { label: <Center><IconLayoutGrid size={18} /></Center> as any, value: 'grid' },
                        ]}
                    />
                    
                    {viewMode === 'grid' && setBadgeStyle && (
                        <SegmentedControl
                            value={badgeStyle || 'glass'}
                            onChange={(value) => setBadgeStyle(value as 'glass' | 'solid')}
                            data={[
                                { label: 'Glass', value: 'glass' },
                                { label: 'Solid', value: 'solid' },
                            ]}
                        />
                    )}
                </Group>
            </Flex>
        </Card>
    );
};
