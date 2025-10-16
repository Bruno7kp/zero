import React from 'react';
import { Card, Grid, Group, Select, SegmentedControl, Center, ActionIcon, TextInput, Flex, Menu, Checkbox } from '@mantine/core';
import { IconLayoutGrid, IconFilter, IconMicrophone, IconDisc, IconMusic, IconSearch, IconSettings, IconTable } from '@tabler/icons-react';
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
    visibleColumns: {
        points: boolean;
        peak: boolean;
        weeks: boolean;
        sales: boolean;
        cert: boolean;
    };
    setVisibleColumns: (columns: { points: boolean; peak: boolean; weeks: boolean; sales: boolean; cert: boolean }) => void;
    showGridPlays: boolean;
    setShowGridPlays: (show: boolean) => void;
    showGridPeak: boolean;
    setShowGridPeak: (show: boolean) => void;
    showGridPosition: boolean;
    setShowGridPosition: (show: boolean) => void;
    chart?: any;
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
    visibleColumns,
    setVisibleColumns,
    showGridPlays,
    setShowGridPlays,
    showGridPeak,
    setShowGridPeak,
    showGridPosition,
    setShowGridPosition,
    chart,
}) => {
    const { t } = useTranslation();

    const handleColumnToggle = (column: keyof typeof visibleColumns) => {
        setVisibleColumns({
            ...visibleColumns,
            [column]: !visibleColumns[column],
        });
    };

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

                {/* View mode, columns menu and badge style */}
                <Grid.Col span={{ base: 6, md: 4 }}>
                    <Group justify="end" gap={0}>
                        <SegmentedControl
                            value={viewMode}
                            withItemsBorders={false}
                            onChange={(value) => setViewMode(value as 'table' | 'grid')}
                            data={[
                                { label: <Center><IconTable size={18} /></Center> as any, value: 'table' },
                                { label: <Center><IconLayoutGrid size={18} /></Center> as any, value: 'grid' },
                            ]}
                        />

                        <Menu shadow="md" width={210} closeOnItemClick={false}>
                            <Menu.Target>
                                <ActionIcon variant="subtle" aria-label={t('charts.columnsConfig')}>
                                    <IconSettings size={16} />
                                </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                                <Menu.Label>{t('settings.title')}</Menu.Label>
                                {viewMode === 'table' ? (
                                    <>
                                        <Menu.Item>
                                            <Checkbox
                                                label={t('charts.points')}
                                                checked={visibleColumns.points}
                                                onChange={() => handleColumnToggle('points')}
                                            />
                                        </Menu.Item>
                                        <Menu.Item>
                                            <Checkbox
                                                label={t('charts.peak')}
                                                checked={visibleColumns.peak}
                                                onChange={() => handleColumnToggle('peak')}
                                            />
                                        </Menu.Item>
                                        <Menu.Item>
                                            <Checkbox
                                                label={t('charts.weeks')}
                                                checked={visibleColumns.weeks}
                                                onChange={() => handleColumnToggle('weeks')}
                                            />
                                        </Menu.Item>
                                        <Menu.Item>
                                            <Checkbox
                                                label={chart?.formula_name || 'Sales'}
                                                checked={visibleColumns.sales}
                                                onChange={() => handleColumnToggle('sales')}
                                                styles={{ label: { textTransform: 'capitalize' } }}
                                            />
                                        </Menu.Item>
                                        <Menu.Item>
                                            <Checkbox
                                                label="Cert."
                                                checked={visibleColumns.cert}
                                                onChange={() => handleColumnToggle('cert')}
                                            />
                                        </Menu.Item>
                                    </>
                                ) : (
                                    <>
                                        <Menu.Item>
                                            <Checkbox
                                                label={t('library.showPlays')}
                                                checked={showGridPlays}
                                                onChange={() => setShowGridPlays(!showGridPlays)}
                                            />
                                        </Menu.Item>
                                        <Menu.Item>
                                            <Checkbox
                                                label={t('library.showPosition')}
                                                checked={showGridPosition}
                                                onChange={() => setShowGridPosition(!showGridPosition)}
                                            />
                                        </Menu.Item>
                                        <Menu.Divider />
                                        <Menu.Label>{t('charts.peak')}</Menu.Label>
                                        <Menu.Item>
                                            <Checkbox
                                                label={t('library.showPeak')}
                                                checked={showGridPeak}
                                                onChange={() => setShowGridPeak(!showGridPeak)}
                                            />
                                        </Menu.Item>
                                        <Menu.Item>
                                            <Checkbox
                                                label={t('library.glassBadge')}
                                                checked={badgeStyle === 'glass'}
                                                onChange={() => setBadgeStyle && setBadgeStyle(badgeStyle === 'glass' ? 'solid' : 'glass')}
                                            />
                                        </Menu.Item>
                                    </>
                                )}
                            </Menu.Dropdown>
                        </Menu>
                    </Group>
                </Grid.Col>
            </Grid>
        </Card>
    );
};
