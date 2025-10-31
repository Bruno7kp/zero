import React from 'react';
import { Card, Group, Text, Flex, Divider, useMantineTheme } from '@mantine/core';
import { getCardBackgroundByMode, type ThemeMode } from '../../../theme/modes';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { ChartWeekCardItem } from './ChartWeekCardItem.tsx';
import { AllKillBadge } from '../../AllKillBadge';

interface Top1Item {
  type: 'artist' | 'album' | 'track';
  name: string;
  artistName: string;
  entityId: string;
}

interface ChartWeekCardProps {
  week: string;
  weekNumber: number;
  top1: Top1Item[];
  themeMode: ThemeMode;
  formatWeekDate: (weekStr: string) => string;
  hasAllKill?: boolean | null;
}

export const ChartWeekCard: React.FC<ChartWeekCardProps> = ({
  week,
  weekNumber,
  top1,
  themeMode,
  formatWeekDate,
  hasAllKill = false,
}) => {
  const theme = useMantineTheme();
  const { t } = useTranslation();

  // Get the showFormulaInsteadOfPlays setting and chart info from state
  const showFormulaInsteadOfPlays = useSelector(
    (state: any) => state.columns?.views?.table?.settings?.showFormulaInsteadOfPlays ?? false
  );
  const charts = useSelector((state: any) => state.charts.charts);
  const activeChartId = useSelector((state: any) => state.charts.activeChartId);
  const chart = charts.find((c: any) => c.id === activeChartId);

  const formulaLabel = chart?.formula_name
    ? chart.formula_name.charAt(0).toUpperCase() + chart.formula_name.slice(1)
    : t('charts.sales');

  return (
    <Card
      shadow="md"
      p="md"
      mb="md"
      style={{ background: getCardBackgroundByMode(theme, themeMode) }}
    >
      <Group>
        <Text fw={600} size="md">
          {t('charts.weekNumber')}: {weekNumber}
        </Text>
        <Text size="xs" c="dimmed">
          {formatWeekDate(week)}
        </Text>
        {hasAllKill && <AllKillBadge />}
      </Group>
      <Divider variant="dashed" size="sm" my="xs" />
      <Flex direction="column" gap="md">
        {top1.map(item => (
          <ChartWeekCardItem
            key={item.type}
            type={item.type}
            name={item.name}
            artistName={item.artistName}
            entityId={item.entityId}
            week={week}
            chartId={String(activeChartId)}
            showFormulaInsteadOfPlays={showFormulaInsteadOfPlays}
            formulaLabel={formulaLabel}
            chart={chart}
          />
        ))}
      </Flex>
    </Card>
  );
};
