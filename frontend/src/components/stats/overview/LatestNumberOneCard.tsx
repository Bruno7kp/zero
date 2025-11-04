import React from 'react';
import { Card, Flex, Button, Title, Text, Skeleton } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import MiniNumberOneBars from '../../visualizations/MiniNumberOneBars';

interface LatestNumberOneCardProps {
  loading: boolean;
  cardBg: string;
  numberOneTrend: Array<{
    week: string;
    plays: number;
    name: string;
    artistName?: string;
    imageUrl?: string;
  }>;
}

export const LatestNumberOneCard: React.FC<LatestNumberOneCardProps> = ({
  loading,
  cardBg,
  numberOneTrend,
}) => {
  const { t } = useTranslation();

  return (
    <Card withBorder p="lg" style={{ background: cardBg }}>
      <Flex align="center" gap="md" mb="sm">
        <div style={{ flex: 1 }}>
          <Title order={4}>{t('stats.visualizations.overview.latestNumberOnePlays')}</Title>
          <Text size="sm" c="dimmed">
            {t('stats.visualizations.overview.latestNumberOnePlaysDescription', {
              weeks: numberOneTrend.length,
            })}
          </Text>
        </div>
        <Button
          variant="light"
          size="xs"
          component={Link}
          to="/stats/visualizations/number-one-timeline"
          rightSection={<IconArrowRight size={14} />}
        >
          {t('stats.visualizations.actions.viewDetail')}
        </Button>
      </Flex>
      {loading ? (
        <Skeleton height={140} radius="md" />
      ) : numberOneTrend.length === 0 ? (
        <Flex justify="center" align="center" style={{ height: 140 }}>
          <Text c="dimmed" size="sm">
            {t('stats.noData')}
          </Text>
        </Flex>
      ) : (
        <MiniNumberOneBars
          items={numberOneTrend.map(item => ({
            id: item.week,
            value: item.plays,
            imageUrl: item.imageUrl,
            subtitle: `${item.name}${item.artistName ? ` • ${item.artistName}` : ''}`,
            colorKey: item.artistName || item.name,
          }))}
          tooltipTitle={t('stats.visualizations.overview.latestNumberOneTooltip')}
          height={140}
        />
      )}
    </Card>
  );
};
