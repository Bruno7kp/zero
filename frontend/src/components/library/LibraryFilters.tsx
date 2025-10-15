import React from 'react';
import { Card, Grid, Group, Select, SegmentedControl, Center, Tooltip, ActionIcon } from '@mantine/core';
import { IconTable, IconLayoutGrid, IconFilter, IconHash, IconMicrophone, IconDisc, IconMusic, IconArrowsUpDown } from '@tabler/icons-react';
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
        <Card shadow="none" style={{ background: 'transparent' }}>
            <Grid align="center">
                {/* Sort and Items per Page */}
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Group>
                        <Select
                            leftSection={<IconArrowsUpDown size={16} />}
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
                            style={{ width: 160 }}
                        />
                        <Select
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
                            style={{ width: 100 }}
                        />
                    </Group>
                </Grid.Col>

                {/* Type SegmentedControl */}
                <Grid.Col span={{ base: 6, md: 4 }}>
                    <Group justify="center">
                        <SegmentedControl
                            value={selectedType}
                            withItemsBorders={false}
                            onChange={(value) => setSelectedType(value as 'artist' | 'album' | 'track')}
                            data={[
                                { label: <IconMicrophone size={18} />, value: 'artist' },
                                { label: <IconDisc size={18} />, value: 'album' },
                                { label: <IconMusic size={18} />, value: 'track' },
                            ]}
                        />
                    </Group>
                </Grid.Col>

                {/* View mode and badge style */}
                <Grid.Col span={{ base: 6, md: 4 }}>
                    <Group justify="end">
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
                            <Tooltip label={badgeStyle === 'glass' ? t('badge.glass') : t('badge.solid')}>
                                <ActionIcon
                                    variant={badgeStyle === 'glass' ? 'light' : 'filled'}
                                    size="md"
                                    onClick={() => setBadgeStyle(badgeStyle === 'glass' ? 'solid' : 'glass')}
                                >
                                    <IconHash size={18} />
                                </ActionIcon>
                            </Tooltip>
                        )}
                    </Group>
                </Grid.Col>
            </Grid>
        </Card>
    );
};
