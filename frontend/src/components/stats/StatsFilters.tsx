// Shared filters component for stats pages
import React from 'react';
import { Group, Select, SegmentedControl, Center, ActionIcon, Menu, Checkbox, Flex, Divider } from '@mantine/core';
import { IconMicrophone, IconDisc, IconMusic, IconSettings, IconCalendar, IconHash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

export interface StatsFiltersProps {
  year: string;
  onYearChange: (value: string) => void;
  type?: string;
  onTypeChange?: (value: string) => void;
  position?: number | string;
  onPositionChange?: (value: number) => void;
  showSales?: boolean;
  onToggleSales?: (value: boolean) => void;
  peakOnly?: boolean;
  onTogglePeakOnly?: (value: boolean) => void;
  showImages?: boolean;
  onToggleImages?: (value: boolean) => void;
  showArtistColumn?: boolean;
  onToggleArtistColumn?: (value: boolean) => void;
  tableSize?: 'xs' | 'sm' | 'md';
  onTableSizeChange?: (value: 'xs' | 'sm' | 'md') => void;
  yearRange?: { minYear: number; maxYear: number };
  showTypeFilter?: boolean;
  showPositionFilter?: boolean;
  showSalesToggle?: boolean;
  showPeakOnlyToggle?: boolean;
  showImageToggle?: boolean;
  showArtistColumnToggle?: boolean;
  showTableSizeToggle?: boolean;
  cutoff?: number;
  customFilters?: React.ReactNode;
  allowAllPosition?: boolean;
  hideArtistType?: boolean;
}

const StatsFilters: React.FC<StatsFiltersProps> = ({
  year,
  onYearChange,
  type,
  onTypeChange,
  position,
  onPositionChange,
  showSales,
  onToggleSales,
  peakOnly,
  onTogglePeakOnly,
  showImages,
  onToggleImages,
  showArtistColumn,
  onToggleArtistColumn,
  tableSize,
  onTableSizeChange,
  yearRange,
  showTypeFilter = true,
  showPositionFilter = false,
  showSalesToggle = true,
  showPeakOnlyToggle = false,
  showImageToggle = true,
  showArtistColumnToggle = true,
  showTableSizeToggle = true,
  cutoff = 100,
  customFilters,
  allowAllPosition = false,
  hideArtistType = false
}) => {
  const { t } = useTranslation();

  // Generate year options
  const yearOptions = React.useMemo(() => {
    if (!yearRange) return [{ value: 'all', label: t('stats.filters.allYears') }];
    
    const years = [];
    for (let y = yearRange.maxYear; y >= yearRange.minYear; y--) {
      years.push({ value: String(y), label: String(y) });
    }
    return [{ value: 'all', label: t('stats.filters.allYears') }, ...years];
  }, [yearRange, t]);

  return (
    <Flex gap="md" mb="md" wrap="wrap" justify="space-between" align="flex-end">
      {/* Left side - Type and other filters */}
      <Group gap="md" wrap="wrap">
        {showTypeFilter && type && onTypeChange && (
          <SegmentedControl
            value={type}
            withItemsBorders={false}
            onChange={onTypeChange}
            data={
              hideArtistType
                ? [
                    { label: <Center><IconDisc size={18} /></Center>, value: 'album' },
                    { label: <Center><IconMusic size={18} /></Center>, value: 'track' },
                  ]
                : [
                    { label: <Center><IconMicrophone size={18} /></Center>, value: 'artist' },
                    { label: <Center><IconDisc size={18} /></Center>, value: 'album' },
                    { label: <Center><IconMusic size={18} /></Center>, value: 'track' },
                  ]
            }
          />
        )}

        <Select
          leftSection={<IconCalendar size={16} />}
          value={year}
          onChange={(value) => value && onYearChange(value)}
          data={yearOptions}
          style={{ minWidth: 150 }}
        />

        {showPositionFilter && position !== undefined && onPositionChange && (
          <Select
            leftSection={<IconHash size={16} />}
            value={String(position)}
            onChange={(value) => {
              if (value === 'all' && allowAllPosition) {
                // Keep as string 'all' - handled by parent
              } else if (value) {
                onPositionChange(Number(value));
              }
            }}
            data={
              allowAllPosition
                ? [
                    { value: 'all', label: t('stats.filters.all') },
                    ...Array.from({ length: cutoff }, (_, i) => ({
                      value: String(i + 1),
                      label: `#${i + 1}`
                    }))
                  ]
                : Array.from({ length: cutoff }, (_, i) => ({
                    value: String(i + 1),
                    label: `${i + 1}`
                  }))
            }
            style={{ minWidth: 150 }}
            searchable
          />
        )}

        {customFilters}
      </Group>

      {/* Right side - Settings menu */}
      {(showSalesToggle || showPeakOnlyToggle || showImageToggle || showArtistColumnToggle || showTableSizeToggle) && 
       (onToggleSales || onTogglePeakOnly || onToggleImages || onToggleArtistColumn || onTableSizeChange) && (
        <Menu shadow="md" width={220} closeOnItemClick={false}>
          <Menu.Target>
            <ActionIcon variant="subtle" size="lg" aria-label={t('stats.filters.settings')}>
              <IconSettings size={18} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>{t('stats.filters.displayOptions')}</Menu.Label>
            
            {showSalesToggle && onToggleSales && (
              <Menu.Item>
                <Checkbox
                  label={t('stats.filters.toggleSales')}
                  checked={showSales || false}
                  onChange={(event) => onToggleSales(event.currentTarget.checked)}
                />
              </Menu.Item>
            )}
            
            {showPeakOnlyToggle && onTogglePeakOnly && (
              <Menu.Item>
                <Checkbox
                  label={t('stats.filters.peakOnly')}
                  checked={peakOnly || false}
                  onChange={(event) => onTogglePeakOnly(event.currentTarget.checked)}
                />
              </Menu.Item>
            )}
            
            {(showSalesToggle || showPeakOnlyToggle) && (showImageToggle || showArtistColumnToggle || showTableSizeToggle) && (
              <Divider my="xs" />
            )}
            
            {showImageToggle && onToggleImages && (
              <Menu.Item>
                <Checkbox
                  label={t('stats.filters.showImages')}
                  checked={showImages !== false}
                  onChange={(event) => onToggleImages(event.currentTarget.checked)}
                />
              </Menu.Item>
            )}
            
            {showArtistColumnToggle && onToggleArtistColumn && (
              <Menu.Item>
                <Checkbox
                  label={t('stats.filters.showArtistColumn')}
                  checked={showArtistColumn || false}
                  onChange={(event) => onToggleArtistColumn(event.currentTarget.checked)}
                />
              </Menu.Item>
            )}
            
            {showTableSizeToggle && onTableSizeChange && (
              <>
                <Divider my="xs" />
                <Menu.Label>{t('stats.filters.tableSize')}</Menu.Label>
                <Menu.Item>
                  <SegmentedControl
                    value={tableSize || 'sm'}
                    onChange={(value) => onTableSizeChange(value as 'xs' | 'sm' | 'md')}
                    data={[
                      { label: 'A-', value: 'xs' },
                      { label: 'A', value: 'sm' },
                      { label: 'A+', value: 'md' }
                    ]}
                    fullWidth
                  />
                </Menu.Item>
              </>
            )}
          </Menu.Dropdown>
        </Menu>
      )}
    </Flex>
  );
};

export default StatsFilters;
