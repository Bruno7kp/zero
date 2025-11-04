import React from 'react';
import { Card, Flex, Button, Title, Text, Skeleton } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import MiniVerticalBarChart from '../../visualizations/MiniVerticalBarChart';

interface BiggestDebutsCardProps {
  loading: boolean;
  cardBg: string;
  debuts: Array<{
    name: string;
    artistName?: string;
    plays: number;
    entityId: string;
  }>;
  chartType: 'artist' | 'album' | 'track';
}

export const BiggestDebutsCard: React.FC<BiggestDebutsCardProps> = ({
  loading,
  cardBg,
  debuts,
  chartType,
}) => {
  const { t } = useTranslation();

  return (
    <Card withBorder p="lg" style={{ background: cardBg }}>
      <Flex align="center" gap="md" mb="sm">
        <div style={{ flex: 1 }}>
          <Title order={4}>{t('stats.visualizations.overview.biggestDebuts')}</Title>
          <Text size="sm" c="dimmed">
            {t('stats.visualizations.overview.biggestDebutsDescription')}
          </Text>
        </div>
        <Button
          variant="light"
          size="xs"
          component={Link}
          to={`/stats/debuts/all/${chartType}`}
          rightSection={<IconArrowRight size={14} />}
        >
          {t('stats.visualizations.actions.viewDetail')}
        </Button>
      </Flex>
      {loading ? (
        <Skeleton height={200} radius="md" />
      ) : debuts.length === 0 ? (
        <Flex justify="center" align="center" style={{ height: 200 }}>
          <Text c="dimmed" size="sm">
            {t('stats.noData')}
          </Text>
        </Flex>
      ) : (
        <MiniVerticalBarChart
          items={debuts.map(item => ({
            id: item.name,
            value: item.plays,
            subtitle: item.artistName,
            colorKey: item.artistName || item.name,
          }))}
          height={200}
          valueLabel={t('stats.playsLabel')}
        />
      )}
    </Card>
  );
};
