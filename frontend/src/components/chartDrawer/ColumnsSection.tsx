import React from 'react';
import { Box, Flex, SegmentedControl, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

export interface ColumnVisibility {
  key: string;
  visible: boolean;
}

interface ColumnsSectionProps {
  viewType: 'table' | 'list' | 'grid';
  columnsWithVisibility: ColumnVisibility[];
  listPeakWeeksCombined: boolean;
  artistDisplayMode: 'under' | 'column';
  onToggleColumn: (key: string, visible: boolean) => void;
  onToggleListPeakWeeksCombined: (combined: boolean) => void;
  onArtistDisplayModeChange: (mode: 'under' | 'column') => void;
  peakMode: 'hide' | 'show' | 'showWithCount';
  onPeakModeChange: (mode: 'hide' | 'show' | 'showWithCount') => void;
}

export const ColumnsSection: React.FC<ColumnsSectionProps> = ({
  viewType,
  columnsWithVisibility,
  listPeakWeeksCombined,
  artistDisplayMode,
  onToggleColumn,
  onToggleListPeakWeeksCombined,
  onArtistDisplayModeChange,
  peakMode,
  onPeakModeChange,
}) => {
  const { t } = useTranslation();

  return (
    <Flex direction="column" gap={4}>
      <Flex wrap="wrap" gap={8}>
        {viewType !== 'grid' && (
          <Box style={{ flex: '1 1 calc(50% - 8px)', minWidth: 140 }}>
            <Text size="xs" c="dimmed">{t('charts.imageLabel')}</Text>
            <SegmentedControl
              fullWidth
              size="xs"
              value={columnsWithVisibility.find(c => c.key === 'image')?.visible ? 'show' : 'hide'}
              onChange={(v) => onToggleColumn('image', v === 'show')}
              data={[
                { label: t('charts.show'), value: 'show' },
                { label: t('charts.hide'), value: 'hide' },
              ]}
            />
          </Box>
        )}

        {viewType === 'list' && (
          <Box style={{ flex: '1 1 calc(50% - 8px)', minWidth: 140 }}>
            <Text size="xs" c="dimmed">{t('charts.listPeakWeeksCombinedLabel') || 'Peak + Weeks layout (list only)'}</Text>
            <SegmentedControl
              fullWidth
              size="xs"
              value={listPeakWeeksCombined ? 'combined' : 'separate'}
              onChange={(v) => onToggleListPeakWeeksCombined(v === 'combined')}
              data={[
                { label: t('charts.listPeakWeeksCombined_separate') || 'Separate', value: 'separate' },
                { label: t('charts.listPeakWeeksCombined_combined') || 'Combined', value: 'combined' },
              ]}
            />
          </Box>
        )}

        <Box style={{ flex: '1 1 calc(50% - 8px)', minWidth: 140 }}>
          <Text size="xs" c="dimmed">{t('charts.playsLabel')}</Text>
          <SegmentedControl
            fullWidth
            size="xs"
            value={columnsWithVisibility.find(c => c.key === 'plays')?.visible ? 'show' : 'hide'}
            onChange={(v) => onToggleColumn('plays', v === 'show')}
            data={[
              { label: t('charts.show'), value: 'show' },
              { label: t('charts.hide'), value: 'hide' },
            ]}
          />
        </Box>

        <Box style={{ flex: '1 1 calc(50% - 8px)', minWidth: 140 }}>
          <Text size="xs" c="dimmed">{t('charts.peakLabel')}</Text>
          <SegmentedControl
            fullWidth
            size="xs"
            value={peakMode}
            onChange={(v) => onPeakModeChange(v as 'hide' | 'show' | 'showWithCount')}
            data={[
              { label: t('charts.peakShowWithCount'), value: 'showWithCount' },
              { label: t('charts.show'), value: 'show' },
              { label: t('charts.hide'), value: 'hide' },
            ]}
          />
        </Box>

        <Box style={{ flex: '1 1 calc(50% - 8px)', minWidth: 140 }}>
          <Text size="xs" c="dimmed">{t('charts.weeksLabel')}</Text>
          <SegmentedControl
            fullWidth
            size="xs"
            value={columnsWithVisibility.find(c => c.key === 'totalWeeks')?.visible ? 'show' : 'hide'}
            onChange={(v) => onToggleColumn('totalWeeks', v === 'show')}
            data={[
              { label: t('charts.show'), value: 'show' },
              { label: t('charts.hide'), value: 'hide' },
            ]}
          />
        </Box>

        {(viewType === 'table' || viewType === 'list') && (
          <Box style={{ flex: '1 1 calc(50% - 8px)', minWidth: 140 }}>
            <Text size="xs" c="dimmed">{t('charts.certLabel')}</Text>
            <SegmentedControl
              fullWidth
              size="xs"
              value={columnsWithVisibility.find(c => c.key === 'cert')?.visible ? 'show' : 'hide'}
              onChange={(v) => onToggleColumn('cert', v === 'show')}
              data={[
                { label: t('charts.show'), value: 'show' },
                { label: t('charts.hide'), value: 'hide' },
              ]}
            />
          </Box>
        )}

        {viewType === 'table' && (
          <Box style={{ flex: '1 1 calc(50% - 8px)', minWidth: 140 }}>
            <Text size="xs" c="dimmed">{t('charts.artistDisplayModeLabel')}</Text>
            <SegmentedControl
              fullWidth
              size="xs"
              value={artistDisplayMode}
              onChange={(v) => onArtistDisplayModeChange(v as 'under' | 'column')}
              data={[
                { label: t('charts.artistDisplay_separateColumn'), value: 'column' },
                { label: t('charts.artistDisplay_underTitle'), value: 'under' },
              ]}
            />
          </Box>
        )}
      </Flex>
    </Flex>
  );
};
