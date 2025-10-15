import React from 'react';
import { Card, Flex, Group, TextInput, Select, MultiSelect, SegmentedControl, Center, ActionIcon, Tooltip } from '@mantine/core';
import { IconSearch, IconCalendar, IconFilter, IconTable, IconTimeline, IconLayoutGrid, IconHash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface ChartsWeeksFiltersProps {
	availableYears: string[];
	searchFilter: string;
	setSearchFilter: (v: string) => void;
	yearFilter: string | null;
	setYearFilter: (v: string | null) => void;
	itemsPerPage: number;
	setItemsPerPage: (v: number) => void;
	typeFilter: string[];
	setTypeFilter: (v: string[]) => void;
	viewMode?: 'timeline' | 'table' | 'grid';
	setViewMode?: (v: 'timeline' | 'table' | 'grid') => void;
	badgeStyle: 'glass' | 'solid';
	setBadgeStyle: (v: 'glass' | 'solid') => void;
}

export const ChartsWeeksFilters: React.FC<ChartsWeeksFiltersProps> = ({
	availableYears,
	searchFilter,
	setSearchFilter,
	yearFilter,
	setYearFilter,
	itemsPerPage,
	setItemsPerPage,
	typeFilter,
	setTypeFilter,
	viewMode,
	setViewMode,
	badgeStyle,
	setBadgeStyle,
}) => {
	const { t } = useTranslation();

	return (
		<Card shadow="none" p="md" style={{ background: 'transparent' }}>
			<Flex direction="column" gap="md">
				<Group grow>
					<TextInput
						placeholder={t('charts.searchByName')}
						leftSection={<IconSearch size={16} />}
						value={searchFilter}
						onChange={(e) => setSearchFilter(e.currentTarget.value)}
					/>
					<Select
						placeholder={t('charts.filterByYear')}
						leftSection={<IconCalendar size={16} />}
						data={[
							{ value: '', label: t('charts.allYears') },
							...availableYears.map((y) => ({ value: y, label: y })),
						]}
						value={yearFilter || ''}
						onChange={(value) => setYearFilter(value || null)}
						clearable
					/>
					<Select
						placeholder={t('charts.itemsPerPage')}
						leftSection={<IconFilter size={16} />}
						data={[
							{ value: '10', label: '10' },
							{ value: '25', label: '25' },
							{ value: '30', label: '30' },
							{ value: '50', label: '50' },
							{ value: '100', label: '100' },
						]}
						value={String(itemsPerPage)}
						onChange={(value) => {
							if (value) setItemsPerPage(parseInt(value, 10));
						}}
					/>
				</Group>

				<Group grow>
					<MultiSelect
						placeholder={t('charts.selectTypes')}
						leftSection={<IconFilter size={16} />}
						data={[
							{ value: 'artist', label: t('charts.artist') },
							{ value: 'album', label: t('charts.album') },
							{ value: 'track', label: t('charts.track') },
						]}
						value={typeFilter}
						onChange={setTypeFilter}
						clearable={false}
						hidePickedOptions
					/>
				</Group>

				<Group justify="center">
					{typeof viewMode !== 'undefined' && typeof setViewMode === 'function' && (
						<SegmentedControl
							value={viewMode}
							withItemsBorders={false}
							onChange={(value) => setViewMode(value as 'timeline' | 'table' | 'grid')}
							data={[
								{ label: <Center><IconTable size={18} /></Center> as any, value: 'table' },
								{ label: <Center><IconTimeline size={18} /></Center> as any, value: 'timeline' },
								{ label: <Center><IconLayoutGrid size={18} /></Center> as any, value: 'grid' },
							]}
						/>
					)}
					{viewMode === 'grid' && (
						<Tooltip label={badgeStyle === 'glass' ? t('badge.glass') : t('badge.solid') }>
							<ActionIcon
								variant={badgeStyle === 'glass' ? 'light' : 'filled'}
								size="md"
								onClick={() => setBadgeStyle(badgeStyle === 'glass' ? 'solid' : 'glass')}
							>
								{badgeStyle === 'glass' ? <IconHash size={18} /> : <IconHash size={18} />}
							</ActionIcon>
						</Tooltip>
					)}
				</Group>
			</Flex>
		</Card>
	);
};

export default ChartsWeeksFilters;

