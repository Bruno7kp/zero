// Shared filters component for stats pages
import React from 'react';
import { Group, Select, Switch, SegmentedControl, NumberInput } from '@mantine/core';
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
    <Group gap="md" mb="md" wrap="wrap">
      <Select
        label={t('stats.filters.year')}
        value={year}
        onChange={(value) => value && onYearChange(value)}
        data={yearOptions}
        style={{ minWidth: 150 }}
      />

      {showTypeFilter && type && onTypeChange && (
        <div style={{ minWidth: 200 }}>
          <SegmentedControl
            value={type}
            onChange={onTypeChange}
            data={[
              { value: 'artist', label: t('charts.artist') },
              { value: 'album', label: t('charts.album') },
              { value: 'track', label: t('charts.track') }
            ]}
            fullWidth
          />
        </div>
      )}

      {showPositionFilter && position !== undefined && onPositionChange && (
        allowAllPosition && position === 'all' ? (
          <Select
            label={t('stats.filters.position')}
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
            style={{ minWidth: 120 }}
            searchable
          />
        ) : (
          <NumberInput
            label={t('stats.filters.position')}
            value={typeof position === 'number' ? position : 1}
            onChange={(value) => {
              if (typeof value === 'number') {
                onPositionChange(Math.max(1, Math.min(cutoff, value)));
              }
            }}
            min={1}
            max={cutoff}
            style={{ minWidth: 120 }}
          />
        )
      )}

      {customFilters}

      {showSalesToggle && onToggleSales && (
        <Switch
          label={t('stats.filters.toggleSales')}
          checked={showSales || false}
          onChange={(event) => onToggleSales(event.currentTarget.checked)}
          mt="auto"
        />
      )}
    </Group>
  );
};

export default StatsFilters;
