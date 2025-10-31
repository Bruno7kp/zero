// Shared filters component for stats pages
import React from 'react';
import {
  Group,
  Select,
  SegmentedControl,
  Center,
  ActionIcon,
  Menu,
  Checkbox,
  Flex,
  Divider,
  TextInput,
} from '@mantine/core';
import {
  IconMicrophone,
  IconDisc,
  IconMusic,
  IconSettings,
  IconCalendar,
  IconHash,
  IconSearch,
  IconSortDescending,
  IconFilter,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '../../hooks/useIsMobile';

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
  fontSize?: 'xs' | 'sm' | 'md';
  onFontSizeChange?: (value: 'xs' | 'sm' | 'md') => void;
  containerSize?: '100%' | 'md' | 'lg' | 'xl';
  onContainerSizeChange?: (value: '100%' | 'md' | 'lg' | 'xl') => void;
  yearRange?: { minYear: number; maxYear: number };
  showTypeFilter?: boolean;
  showPositionFilter?: boolean;
  showSalesToggle?: boolean;
  showPeakOnlyToggle?: boolean;
  showImageToggle?: boolean;
  showArtistColumnToggle?: boolean;
  showFontSizeToggle?: boolean;
  showContainerSizeToggle?: boolean;
  cutoff?: number;
  customFilters?: React.ReactNode;
  allowAllPosition?: boolean;
  hideArtistType?: boolean;
  // New props
  pageSize?: number;
  onPageSizeChange?: (value: number) => void;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  sortBy?: string;
  onSortChange?: (value: string) => void;
  sortOptions?: Array<{ value: string; label: string }>;
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
  containerSize,
  onContainerSizeChange,
  fontSize,
  onFontSizeChange,
  yearRange,
  showTypeFilter = true,
  showPositionFilter = false,
  showSalesToggle = true,
  showPeakOnlyToggle = false,
  showImageToggle = true,
  showArtistColumnToggle = true,
  cutoff = 100,
  customFilters,
  allowAllPosition = false,
  hideArtistType = false,
  pageSize,
  onPageSizeChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  showContainerSizeToggle = true,
  showFontSizeToggle = true,
  sortOptions,
}) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const showContainer = showContainerSizeToggle && !isMobile;

  // Generate year options
  const yearOptions = React.useMemo(() => {
    if (!yearRange) return [{ value: 'all', label: t('stats.filters.allYears') }];

    const years = [];
    for (let y = yearRange.maxYear; y >= yearRange.minYear; y--) {
      years.push({ value: String(y), label: String(y) });
    }
    return [{ value: 'all', label: t('stats.filters.allYears') }, ...years];
  }, [yearRange, t]);

  // Sorted sortOptions by label to present alphabetical options in the Select
  const sortedSortOptions = React.useMemo(() => {
    if (!sortOptions) return sortOptions;
    return [...sortOptions].sort((a, b) => a.label.localeCompare(b.label));
  }, [sortOptions]);

  return (
    <Flex direction="column" gap="md" mb="md">
      {/* First row - Year (left), Type (center), Items per page + Settings (right) */}
      <Flex gap="md" wrap="wrap" justify="space-between" align="center">
        {/* Left - Year */}
        <Select
          leftSection={<IconCalendar size={16} />}
          value={year}
          onChange={value => value && onYearChange(value)}
          data={yearOptions}
          style={{ minWidth: 150, flex: '0 0 auto' }}
        />

        {/* Center - Type SegmentedControl */}
        {showTypeFilter && type && onTypeChange && (
          <SegmentedControl
            value={type}
            withItemsBorders={false}
            onChange={onTypeChange}
            data={
              hideArtistType
                ? [
                    {
                      label: (
                        <Center>
                          <IconDisc size={18} />
                        </Center>
                      ),
                      value: 'album',
                    },
                    {
                      label: (
                        <Center>
                          <IconMusic size={18} />
                        </Center>
                      ),
                      value: 'track',
                    },
                  ]
                : [
                    {
                      label: (
                        <Center>
                          <IconMicrophone size={18} />
                        </Center>
                      ),
                      value: 'artist',
                    },
                    {
                      label: (
                        <Center>
                          <IconDisc size={18} />
                        </Center>
                      ),
                      value: 'album',
                    },
                    {
                      label: (
                        <Center>
                          <IconMusic size={18} />
                        </Center>
                      ),
                      value: 'track',
                    },
                  ]
            }
            style={{ flex: '0 0 auto' }}
          />
        )}

        {/* Right - Items per page + Settings */}
        <Group gap="xs" wrap="nowrap">
          {onPageSizeChange && (
            <Select
              leftSection={<IconFilter size={16} />}
              value={String(pageSize || 25)}
              onChange={value => value && onPageSizeChange(Number(value))}
              data={[
                { value: '10', label: `10` },
                { value: '25', label: `25` },
                { value: '50', label: `50` },
                { value: '100', label: `100` },
              ]}
              style={{ width: 100 }}
            />
          )}

          {(showSalesToggle ||
            showPeakOnlyToggle ||
            showImageToggle ||
            showArtistColumnToggle ||
            showFontSizeToggle) &&
            (onToggleSales ||
              onTogglePeakOnly ||
              onToggleImages ||
              onToggleArtistColumn ||
              onFontSizeChange) && (
              <Menu shadow="md" width={300} closeOnItemClick={false}>
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
                        onChange={event => onToggleSales(event.currentTarget.checked)}
                      />
                    </Menu.Item>
                  )}

                  {showPeakOnlyToggle && onTogglePeakOnly && (
                    <Menu.Item>
                      <Checkbox
                        label={t('stats.filters.peakOnly')}
                        checked={peakOnly || false}
                        onChange={event => onTogglePeakOnly(event.currentTarget.checked)}
                      />
                    </Menu.Item>
                  )}

                  {(showSalesToggle || showPeakOnlyToggle) &&
                    (showImageToggle || showArtistColumnToggle || showFontSizeToggle) && (
                      <Divider my="xs" />
                    )}

                  {showImageToggle && onToggleImages && (
                    <Menu.Item>
                      <Checkbox
                        label={t('stats.filters.showImages')}
                        checked={showImages !== false}
                        onChange={event => onToggleImages(event.currentTarget.checked)}
                      />
                    </Menu.Item>
                  )}

                  {showArtistColumnToggle && onToggleArtistColumn && (
                    <Menu.Item>
                      <Checkbox
                        label={t('stats.filters.showArtistColumn')}
                        checked={showArtistColumn || false}
                        onChange={event => onToggleArtistColumn(event.currentTarget.checked)}
                      />
                    </Menu.Item>
                  )}

                  {showContainer && onContainerSizeChange && (
                    <>
                      <Divider my="xs" />
                      <Menu.Label>{t('stats.filters.containerSize')}</Menu.Label>
                      <Menu.Item>
                        <SegmentedControl
                          value={containerSize || 'xl'}
                          size="xs"
                          onChange={value =>
                            onContainerSizeChange(value as '100%' | 'md' | 'lg' | 'xl')
                          }
                          data={[
                            { label: 'MD', value: 'md' },
                            { label: 'LG', value: 'lg' },
                            { label: 'XL', value: 'xl' },
                            { label: '100%', value: '100%' },
                          ]}
                          fullWidth
                        />
                      </Menu.Item>
                    </>
                  )}

                  {showFontSizeToggle && onFontSizeChange && (
                    <>
                      <Menu.Label>{t('stats.filters.fontSize')}</Menu.Label>
                      <Menu.Item>
                        <SegmentedControl
                          value={fontSize || 'sm'}
                          size="xs"
                          onChange={value => onFontSizeChange(value as 'xs' | 'sm' | 'md')}
                          data={[
                            { label: 'A-', value: 'xs' },
                            { label: 'A', value: 'sm' },
                            { label: 'A+', value: 'md' },
                          ]}
                          fullWidth
                        />
                      </Menu.Item>
                    </>
                  )}
                </Menu.Dropdown>
              </Menu>
            )}
        </Group>
      </Flex>

      {/* Second row - Search (left), Position/TopN filter (center), Sort (right) */}
      <Group gap="md" wrap="wrap" align="flex-start">
        {onSearchChange && (
          <TextInput
            leftSection={<IconSearch size={16} />}
            placeholder={t('stats.filters.searchPlaceholder')}
            value={searchQuery || ''}
            onChange={event => onSearchChange(event.currentTarget.value)}
            style={{ flex: '1 1 200px', minWidth: 150 }}
          />
        )}

        {showPositionFilter && position !== undefined && onPositionChange && (
          <Select
            leftSection={<IconHash size={16} />}
            value={String(position)}
            onChange={value => {
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
                      label: `#${i + 1}`,
                    })),
                  ]
                : Array.from({ length: cutoff }, (_, i) => ({
                    value: String(i + 1),
                    label: `${i + 1}`,
                  }))
            }
            style={{ flex: '0 1 150px', minWidth: 120 }}
            searchable
          />
        )}

        {customFilters}

        {onSortChange && sortOptions && sortOptions.length > 1 && (
          <Select
            leftSection={<IconSortDescending size={16} />}
            value={sortBy}
            onChange={value => value && onSortChange(value)}
            data={sortedSortOptions}
            placeholder={t('stats.filters.sortBy')}
            style={{ flex: '0 1 250px', minWidth: 150 }}
          />
        )}
      </Group>
    </Flex>
  );
};

export default StatsFilters;
