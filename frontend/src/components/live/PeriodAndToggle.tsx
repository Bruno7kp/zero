import React from 'react';
import { ActionIcon, Flex, Group, Text } from '@mantine/core';
import { IconArrowsDownUp } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

type Props = {
  chartName?: string;
  startDate: string;
  endDate: string;
  showVariation: boolean;
  setShowVariation: (value: boolean) => void;
};

const PeriodAndToggle: React.FC<Props> = ({ chartName, startDate, endDate, showVariation, setShowVariation }) => {
  const { t } = useTranslation();
  return (
    <Group justify="center">
      {chartName && (
        <Flex align="center" gap="xs">
          <Text size="sm" c="dimmed">
            {t('charts.live_chart_period', { from: startDate, to: endDate })}
          </Text>
          <ActionIcon
            variant={showVariation ? 'filled' : 'subtle'}
            color={showVariation ? 'blue' : 'gray'}
            size="sm"
            aria-pressed={showVariation}
            aria-label={t('charts.deltaRankLabel')}
            title={`${t('charts.deltaRankLabel')} — ${showVariation ? t('charts.show') : t('charts.hide')}`}
            onClick={() => setShowVariation(!showVariation)}
          >
            <IconArrowsDownUp size={16} />
          </ActionIcon>
        </Flex>
      )}
    </Group>
  );
};

export default PeriodAndToggle;
