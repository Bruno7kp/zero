import React from 'react';
import { Stack, Group, Select, SegmentedControl, Center, Menu, ActionIcon } from '@mantine/core';
import {
  IconCalendar,
  IconSettings,
  IconMicrophone,
  IconDisc,
  IconMusic,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '../../hooks/useIsMobile';

type ChartTypeOption = 'track' | 'album' | 'artist';

type ContainerSizeOption = '100%' | 'md' | 'lg' | 'xl';

type VisualizationFiltersProps = {
  year: string;
  onYearChange: (value: string) => void;
  yearRange?: { minYear: number; maxYear: number };
  type?: ChartTypeOption;
  onTypeChange?: (value: ChartTypeOption) => void;
  containerSize: ContainerSizeOption;
  onContainerSizeChange: (value: ContainerSizeOption) => void;
  hideArtistType?: boolean;
  inlineFilters?: React.ReactNode;
  customFilters?: React.ReactNode;
};

const VisualizationFilters: React.FC<VisualizationFiltersProps> = ({
  year,
  onYearChange,
  yearRange,
  type,
  onTypeChange,
  containerSize,
  onContainerSizeChange,
  hideArtistType = false,
  inlineFilters,
  customFilters,
}) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const yearOptions = React.useMemo(() => {
    if (!yearRange) {
      return [{ value: 'all', label: t('stats.filters.allYears') }];
    }

    const options = [] as Array<{ value: string; label: string }>;
    for (let current = yearRange.maxYear; current >= yearRange.minYear; current--) {
      options.push({ value: String(current), label: String(current) });
    }
    return [{ value: 'all', label: t('stats.filters.allYears') }, ...options];
  }, [yearRange, t]);

  const typeControl =
    type && onTypeChange ? (
      <SegmentedControl
        value={type}
        withItemsBorders={false}
        onChange={value => {
          if (value === 'track' || value === 'album' || value === 'artist') {
            onTypeChange(value);
          }
        }}
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
      />
    ) : null;

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="center" gap="sm" wrap="wrap">
        <Group gap="sm" align="center" wrap="wrap">
          <Select
            leftSection={<IconCalendar size={16} />}
            value={year}
            onChange={value => value && onYearChange(value)}
            data={yearOptions}
            style={{ minWidth: 150, flex: '0 0 auto' }}
          />
          {inlineFilters}
        </Group>

        {!isMobile && (
          <Menu shadow="md" width={260} closeOnItemClick={false}>
            <Menu.Target>
              <ActionIcon variant="subtle" size="lg" aria-label={t('stats.filters.settings')}>
                <IconSettings size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>{t('stats.filters.displayOptions')}</Menu.Label>
              <Menu.Item>
                <SegmentedControl
                  value={containerSize}
                  size="xs"
                  onChange={value => onContainerSizeChange(value as ContainerSizeOption)}
                  data={[
                    { label: 'MD', value: 'md' },
                    { label: 'LG', value: 'lg' },
                    { label: 'XL', value: 'xl' },
                    { label: '100%', value: '100%' },
                  ]}
                  fullWidth
                />
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        )}
      </Group>

      {typeControl && <Center>{typeControl}</Center>}

      {customFilters ? <Stack gap="sm">{customFilters}</Stack> : null}
    </Stack>
  );
};

export default VisualizationFilters;
