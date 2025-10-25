// Shared filters component for stats pages
import React from 'react';
import { Group, Select, SegmentedControl, NumberInput, Center, ActionIcon, Menu, Checkbox, Flex } from '@mantine/core';
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
  yearRange?: { minYear: number; maxYear: number };
  showTypeFilter?: boolean;
  showPositionFilter?: boolean;
  showSalesToggle?: boolean;
  cutoff?: number;
  customFilters?: React.ReactNode;
  allowAllPosition?: boolean;
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
  yearRange,
  showTypeFilter = true,
  showPositionFilter = false,
  showSalesToggle = true,
  cutoff = 100,
  customFilters,
  allowAllPosition = false
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
            data={[
              { label: <Center><IconMicrophone size={18} /></Center>, value: 'artist' },
              { label: <Center><IconDisc size={18} /></Center>, value: 'album' },
              { label: <Center><IconMusic size={18} /></Center>, value: 'track' },
            ]}
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
          allowAllPosition && position === 'all' ? (
            <Select
              leftSection={<IconHash size={16} />}
              value={String(position)}
              onChange={(value) => {
                if (value === 'all') {
                  // Keep as string 'all'
                } else if (value) {
                  onPositionChange(Number(value));
                }
              }}
              data={[
                { value: 'all', label: t('stats.filters.all') },
                ...Array.from({ length: cutoff }, (_, i) => ({
                  value: String(i + 1),
                  label: `#${i + 1}`
                }))
              ]}
              style={{ minWidth: 150 }}
              searchable
            />
          ) : (
            <NumberInput
              leftSection={<IconHash size={16} />}
              value={typeof position === 'number' ? position : 1}
              onChange={(value) => {
                if (typeof value === 'number') {
                  onPositionChange(Math.max(1, Math.min(cutoff, value)));
                }
              }}
              min={1}
              max={cutoff}
              style={{ minWidth: 150 }}
            />
          )
        )}

        {customFilters}
      </Group>

      {/* Right side - Settings menu */}
      {showSalesToggle && onToggleSales && (
        <Menu shadow="md" width={200} closeOnItemClick={false}>
          <Menu.Target>
            <ActionIcon variant="subtle" size="lg" aria-label={t('stats.filters.settings')}>
              <IconSettings size={18} />
            </ActionIcon>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>{t('stats.filters.displayOptions')}</Menu.Label>
            <Menu.Item>
              <Checkbox
                label={t('stats.filters.toggleSales')}
                checked={showSales || false}
                onChange={(event) => onToggleSales(event.currentTarget.checked)}
              />
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      )}
    </Flex>
  );
};

export default StatsFilters;
