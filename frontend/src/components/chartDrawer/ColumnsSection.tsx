import React from 'react';
import { Box, SegmentedControl, Text, Switch, Stack, Divider } from '@mantine/core';
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
  showFormulaInsteadOfPlays?: boolean;
  onToggleShowFormulaInsteadOfPlays?: (show: boolean) => void;
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
  showFormulaInsteadOfPlays = false,
  onToggleShowFormulaInsteadOfPlays,
}) => {
  const { t } = useTranslation();

  return (
    <Stack gap={6}>
      {viewType === 'list' && (
        <Box>
          <Text size="xs" c="dimmed" mb={4}>
            {t('charts.listPeakWeeksCombinedLabel') || 'Peak + Weeks layout (list only)'}
          </Text>
          <SegmentedControl
            fullWidth
            size="xs"
            value={listPeakWeeksCombined ? 'combined' : 'separate'}
            onChange={v => onToggleListPeakWeeksCombined(v === 'combined')}
            data={[
              {
                label: t('charts.listPeakWeeksCombined_separate') || 'Separate',
                value: 'separate',
              },
              {
                label: t('charts.listPeakWeeksCombined_combined') || 'Combined',
                value: 'combined',
              },
            ]}
          />
        </Box>
      )}

      {viewType === 'table' && (
        <Box>
          <Text size="xs" c="dimmed" mb={4}>
            {t('charts.artistDisplayModeLabel')}
          </Text>
          <SegmentedControl
            fullWidth
            size="xs"
            value={artistDisplayMode}
            onChange={v => onArtistDisplayModeChange(v as 'under' | 'column')}
            data={[
              { label: t('charts.artistDisplay_separateColumn'), value: 'column' },
              { label: t('charts.artistDisplay_underTitle'), value: 'under' },
            ]}
          />
        </Box>
      )}

      <Box>
        <Text size="xs" c="dimmed" mb={4}>
          {t('charts.peakLabel')}
        </Text>
        <SegmentedControl
          fullWidth
          size="xs"
          value={peakMode}
          onChange={v => onPeakModeChange(v as 'hide' | 'show' | 'showWithCount')}
          data={[
            { label: t('charts.peakShowWithCount'), value: 'showWithCount' },
            { label: t('charts.show'), value: 'show' },
            { label: t('charts.hide'), value: 'hide' },
          ]}
        />
      </Box>

      <Divider my="xs" label={t('charts.columns')} />

      {viewType !== 'grid' && (
        <Switch
          label={t('charts.imageLabel')}
          checked={columnsWithVisibility.find(c => c.key === 'image')?.visible ?? false}
          onChange={e => onToggleColumn('image', e.currentTarget.checked)}
          size="sm"
        />
      )}

      <Switch
        label={t('charts.playsLabel')}
        checked={columnsWithVisibility.find(c => c.key === 'plays')?.visible ?? false}
        onChange={e => onToggleColumn('plays', e.currentTarget.checked)}
        size="sm"
      />

      {onToggleShowFormulaInsteadOfPlays && (
        <Switch
          label={t('charts.showFormulaInsteadOfPlays')}
          checked={showFormulaInsteadOfPlays}
          onChange={e => onToggleShowFormulaInsteadOfPlays(e.currentTarget.checked)}
          size="sm"
        />
      )}

      <Switch
        label={t('charts.weeksLabel')}
        checked={columnsWithVisibility.find(c => c.key === 'totalWeeks')?.visible ?? false}
        onChange={e => onToggleColumn('totalWeeks', e.currentTarget.checked)}
        size="sm"
      />

      {(viewType === 'table' || viewType === 'list') && (
        <Switch
          label={t('charts.certLabel')}
          checked={columnsWithVisibility.find(c => c.key === 'cert')?.visible ?? false}
          onChange={e => onToggleColumn('cert', e.currentTarget.checked)}
          size="sm"
        />
      )}
    </Stack>
  );
};
