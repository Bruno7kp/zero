import React from 'react';
import { SegmentedControl, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

interface VariationsSectionProps {
  viewType: 'table' | 'list' | 'grid';
  rankVariationLocation: 'hidden' | 'under' | 'column' | 'corner';
  playsVariationLocation: 'hidden' | 'under' | 'column';
  playsVariationDisplay: 'absolute' | 'percent';
  onRankLocationChange: (loc: 'hidden' | 'under' | 'column' | 'corner') => void;
  onPlaysLocationChange: (loc: 'hidden' | 'under' | 'column') => void;
  onPlaysDisplayChange: (display: 'absolute' | 'percent') => void;
}

export const VariationsSection: React.FC<VariationsSectionProps> = ({
  viewType,
  rankVariationLocation,
  playsVariationLocation,
  playsVariationDisplay,
  onRankLocationChange,
  onPlaysLocationChange,
  onPlaysDisplayChange,
}) => {
  const { t } = useTranslation();

  return (
    <Stack gap={8}>
      <Text size="xs" c="dimmed">{t('charts.rankVariationLocationLabel')}</Text>
      {viewType === 'grid' ? (
        <SegmentedControl
          fullWidth
          size="xs"
          value={rankVariationLocation}
          onChange={(v) => onRankLocationChange(v as any)}
          data={[
            { label: t('charts.hide'), value: 'hidden' },
            { label: t('charts.rankVariationUnder'), value: 'under' },
            { label: t('charts.rankVariationCorner'), value: 'corner' },
          ]}
        />
      ) : (
        <SegmentedControl
          fullWidth
          size="xs"
          value={rankVariationLocation}
          onChange={(v) => onRankLocationChange(v as any)}
          data={[
            { label: t('charts.hide'), value: 'hidden' },
            { label: t('charts.rankVariationUnder'), value: 'under' },
            { label: t('charts.rankVariationColumn'), value: 'column' },
          ]}
        />
      )}

      {viewType !== 'grid' && (
        <>
          <Text size="xs" c="dimmed">{t('charts.playsVariationLocationLabel')}</Text>
          <SegmentedControl
            fullWidth
            size="xs"
            value={playsVariationLocation}
            onChange={(v) => onPlaysLocationChange(v as any)}
            data={[
              { label: t('charts.hide'), value: 'hidden' },
              { label: t('charts.playsVariationUnder'), value: 'under' },
              { label: t('charts.playsVariationColumn'), value: 'column' },
            ]}
          />

          {playsVariationLocation !== 'hidden' && (
            <>
              <Text size="xs" c="dimmed">{t('charts.playsVariationDisplayLabel')}</Text>
              <SegmentedControl
                size="xs"
                fullWidth
                value={playsVariationDisplay}
                onChange={(value) => onPlaysDisplayChange(value as any)}
                data={[
                  { label: t('charts.playsVariationDisplay_absolute'), value: 'absolute' },
                  { label: t('charts.playsVariationDisplay_percent'), value: 'percent' },
                ]}
              />
            </>
          )}
        </>
      )}
    </Stack>
  );
};
