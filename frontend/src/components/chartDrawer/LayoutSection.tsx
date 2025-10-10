import React from 'react';
import { Stack, SegmentedControl, Text, Switch, Divider } from '@mantine/core';
import { useTranslation } from 'react-i18next';

export type ContainerSize = 'md' | 'lg' | 'xl' | '100%';

interface LayoutSectionProps {
  isMobile: boolean;
  viewType: 'table' | 'list' | 'grid';
  containerSize: ContainerSize;
  fontScale: -1 | 0 | 1 | number;
  tableBackground: 'default' | 'transparent';
  listBackground: 'default' | 'transparent';
  showDroppedItems: boolean;
  showCarousel: boolean;
  onContainerSizeChange: (size: ContainerSize) => void;
  onFontScaleChange: (scale: -1 | 0 | 1 | number) => void;
  onTableBackgroundChange: (bg: 'default' | 'transparent') => void;
  onListBackgroundChange: (bg: 'default' | 'transparent') => void;
  onShowDroppedItemsChange: (show: boolean) => void;
  onShowCarouselChange: (show: boolean) => void;
}


export const LayoutSection: React.FC<LayoutSectionProps> = ({
  isMobile,
  viewType,
  containerSize,
  fontScale,
  tableBackground,
  listBackground,
  showDroppedItems,
  showCarousel,
  onContainerSizeChange,
  onFontScaleChange,
  onTableBackgroundChange,
  onListBackgroundChange,
  onShowDroppedItemsChange,
  onShowCarouselChange,
}) => {
  const { t } = useTranslation();

  return (
    <Stack gap={6}>
      {!isMobile && (
        <Stack gap={2}>
          <Text size="xs" c="dimmed">{t('charts.containerSizeLabel')}</Text>
          <SegmentedControl
            fullWidth
            size="xs"
            value={containerSize}
            onChange={(v) => onContainerSizeChange(v as ContainerSize)}
            data={[
              { label: 'MD', value: 'md' },
              { label: 'LG', value: 'lg' },
              { label: 'XL', value: 'xl' },
              { label: '100%', value: '100%' },
            ]}
          />
        </Stack>
      )}

      <Stack gap={2}>
        <Text size="xs" c="dimmed">{t('charts.fontScaleLabel') || 'Font size'}</Text>
        <SegmentedControl
          fullWidth
          size="xs"
          value={String(fontScale)}
          onChange={(v) => onFontScaleChange(Number(v))}
          data={[
            { label: 'A-', value: '-1' },
            { label: 'A', value: '0' },
            { label: 'A+', value: '1' },
          ]}
        />
      </Stack>

      {viewType === 'table' && (
        <Stack gap={2}>
          <Text size="xs" c="dimmed">{t('charts.tableBackgroundLabel')}</Text>
          <SegmentedControl
            fullWidth
            size="xs"
            value={tableBackground}
            onChange={(v) => onTableBackgroundChange(v as 'default' | 'transparent')}
            data={[
              { label: t('charts.tableBackground_default'), value: 'default' },
              { label: t('charts.tableBackground_transparent'), value: 'transparent' },
            ]}
          />
        </Stack>
      )}

      {viewType === 'list' && (
        <Stack gap={2}>
          <Text size="xs" c="dimmed">{t('charts.listBackgroundLabel')}</Text>
          <SegmentedControl
            fullWidth
            size="xs"
            value={listBackground}
            onChange={(v) => onListBackgroundChange(v as 'default' | 'transparent')}
            data={[
              { label: t('charts.listBackground_default'), value: 'default' },
              { label: t('charts.listBackground_transparent'), value: 'transparent' },
            ]}
          />
        </Stack>
      )}

      <Divider my="xs" label={t('charts.title')} />

      <Stack gap={2}>
        <Switch
          label={t('charts.showDroppedItemsLabel')}
          description={t('charts.showDroppedItems_description')}
          checked={showDroppedItems}
          onChange={(e) => onShowDroppedItemsChange(e.currentTarget.checked)}
          size="sm"
        />
      </Stack>

      <Stack gap={2}>
        <Switch
          label={t('charts.settings.showCarousel')}
          checked={showCarousel}
          onChange={(e) => onShowCarouselChange(e.currentTarget.checked)}
          size="sm"
        />
      </Stack>
    </Stack>
  );
};
