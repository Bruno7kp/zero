import React from 'react';
import { Card, Grid, Group, Select, SegmentedControl, Center, Tooltip, ActionIcon, TextInput, Flex } from '@mantine/core';
import { IconTable, IconLayoutGrid, IconFilter, IconMicrophone, IconDisc, IconMusic, IconSearch, IconHash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface LibraryFiltersProps {
    selectedType: 'artist' | 'album' | 'track';
    setSelectedType: (type: 'artist' | 'album' | 'track') => void;
    viewMode: 'table' | 'grid';
    setViewMode: (mode: 'table' | 'grid') => void;
    itemsPerPage: number;
    setItemsPerPage: (value: number) => void;
    search: string;
    setSearch: (value: string) => void;
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
    search,
    setSearch,
    badgeStyle,
    setBadgeStyle,
}) => {
    const { t } = useTranslation();

    return (
        <Card shadow="none" style={{ background: 'transparent' }}>
            <Grid align="center">
                {/* Search and Items per Page */}
                <Grid.Col span={{ base: 12, md: 4 }}>
                    <Flex
                        justify={{ base: 'center', md: 'flex-start' }}
                        align="center"
                        gap="sm"
                    >
                        <TextInput
                            leftSection={<IconSearch size={16} />}
                            placeholder={t('library.search')}
                            value={search}
                            onChange={(event) => setSearch(event.currentTarget.value)}
                            style={{ width: 150 }}
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
                    </Flex>
                </Grid.Col>

                {/* Type SegmentedControl */}
                <Grid.Col span={{ base: 6, md: 4 }}>
                    <Group justify="center">
                        <SegmentedControl
                            value={selectedType}
                            withItemsBorders={false}
                            onChange={(value) => setSelectedType(value as 'artist' | 'album' | 'track')}
                            data={[
                                { label: <Center><IconMicrophone size={18} /></Center>, value: 'artist' },
                                { label: <Center><IconDisc size={18} /></Center>, value: 'album' },
                                { label: <Center><IconMusic size={18} /></Center>, value: 'track' },
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
