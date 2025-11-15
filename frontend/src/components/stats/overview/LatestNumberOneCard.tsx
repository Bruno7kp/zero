import React from 'react';
import { Card, Flex, Button, Text, Skeleton, Divider, ThemeIcon, Group, rem } from '@mantine/core';
import { IconArrowRight, IconTimeline } from '@tabler/icons-react';
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
  chartType?: 'artist' | 'album' | 'track';
}

export const LatestNumberOneCard: React.FC<LatestNumberOneCardProps> = ({
  loading,
  cardBg,
  numberOneTrend,
  chartType = 'track',
}) => {
  const { t } = useTranslation();

  return (
    <Card shadow="md" p="md" style={{ background: cardBg }}>
      <Group justify="space-between">
        <Group>
          <ThemeIcon variant="light" size="md">
            <IconTimeline style={{ width: rem(20), height: rem(20) }} />
          </ThemeIcon>
          <Text fw={600} size="lg">
            {t('stats.visualizations.overview.latestNumberOnePlays')}
          </Text>
        </Group>
        <Button
          variant="light"
          size="xs"
          component={Link}
          to={`/stats/visualizations/number-one-timeline/${chartType}`}
          rightSection={<IconArrowRight size={14} />}
        >
          {t('stats.visualizations.actions.viewDetail')}
        </Button>
      </Group>
      <Divider variant="dashed" size="sm" my="xs" />
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
