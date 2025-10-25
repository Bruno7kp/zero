// Shared filters component for stats pages
import React from 'react';
import { Group, Select, Switch } from '@mantine/core';
import { useTranslation } from 'react-i18next';

export interface StatsFiltersProps {
  year: string;
  onYearChange: (value: string) => void;
  type?: string;
  onTypeChange?: (value: string) => void;
  position?: string;
  onPositionChange?: (value: string) => void;
  showSales?: boolean;
  onToggleSales?: (value: boolean) => void;
  yearRange?: { minYear: number; maxYear: number };
  showTypeFilter?: boolean;
  showPositionFilter?: boolean;
  showSalesToggle?: boolean;
  positionOptions?: Array<{ value: string; label: string }>;
  customFilters?: React.ReactNode;
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
  positionOptions,
  customFilters
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

  const typeOptions = [
    { value: 'artist', label: t('charts.artist') },
    { value: 'album', label: t('charts.album') },
    { value: 'track', label: t('charts.track') }
  ];

  return (
    <Group gap="md" mb="md">
      <Select
        label={t('stats.filters.year')}
        value={year}
        onChange={(value) => value && onYearChange(value)}
        data={yearOptions}
        style={{ minWidth: 150 }}
      />

      {showTypeFilter && type && onTypeChange && (
        <Select
          label={t('stats.filters.type')}
          value={type}
          onChange={(value) => value && onTypeChange(value)}
          data={typeOptions}
          style={{ minWidth: 150 }}
        />
      )}

      {showPositionFilter && position && onPositionChange && positionOptions && (
        <Select
          label={t('stats.filters.position')}
          value={position}
          onChange={(value) => value && onPositionChange(value)}
          data={positionOptions}
          style={{ minWidth: 150 }}
        />
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
