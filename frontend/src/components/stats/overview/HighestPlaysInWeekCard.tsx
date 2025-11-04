import React from 'react';
import { Card, Flex, Text, Skeleton, Group, ThemeIcon, rem, Divider, Button } from '@mantine/core';
import { IconHeadphones } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import MiniVerticalBarChart from '../../visualizations/MiniVerticalBarChart';
import { Link } from 'react-router-dom';

interface HighestPlaysInWeekCardProps {
  loading: boolean;
  cardBg: string;
  highestPlays: Array<{
    name: string;
    artistName?: string;
    plays: number;
    entityId: string;
    imageUrl?: string;
  }>;
  chartType: 'artist' | 'album' | 'track';
}

export const HighestPlaysInWeekCard: React.FC<HighestPlaysInWeekCardProps> = ({
  loading,
  cardBg,
  highestPlays,
  chartType,
}) => {
  const { t } = useTranslation();

  return (
    <Card shadow="md" p="md" style={{ background: cardBg }}>
      <Group justify="space-between">
        <Group>
          <ThemeIcon variant="light" size="md">
            <IconHeadphones style={{ width: rem(20), height: rem(20) }} />
          </ThemeIcon>
          <Text fw={600} size="lg">
            {t('stats.visualizations.overview.highestPlaysInWeek')}
          </Text>
        </Group>
      </Group>
      <Divider variant="dashed" size="sm" my="xs" />
      {loading ? (
        <Skeleton height={200} radius="md" />
      ) : highestPlays.length === 0 ? (
        <Flex justify="center" align="center" style={{ height: 200 }}>
          <Text c="dimmed" size="sm">
            {t('stats.noData')}
          </Text>
        </Flex>
      ) : (
        <MiniVerticalBarChart
          items={highestPlays.map((item, index) => ({
            id: `${item.entityId ?? item.name}-${index}`,
            label: item.name,
            value: item.plays,
            subtitle: item.artistName,
            colorKey: item.artistName || item.name,
            imageUrl: item.imageUrl,
          }))}
          height={240}
          layout="horizontal"
          showImages
          showAxisLabels={false}
        />
      )}
      <Divider variant="dashed" size="sm" my="xs" />
      <Group justify="center" align="center">
        <Button
          component={Link}
          to={`/stats/plays/all/${chartType}`}
          size="sm"
          fullWidth
          variant="light"
          aria-label={t('stats.visualizations.actions.viewDetail')}
        >
          {t('stats.visualizations.actions.viewDetail')}
        </Button>
      </Group>
    </Card>
  );
};
