import React from 'react';
import { Card, Flex, Button, Text, Skeleton, Group, ThemeIcon, rem, Divider } from '@mantine/core';
import { IconRocket } from '@tabler/icons-react';
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
    imageUrl?: string;
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
    <Card shadow="md" p="md" style={{ background: cardBg }}>
      <Group justify="space-between">
        <Group>
          <ThemeIcon variant="light" size="md">
            <IconRocket style={{ width: rem(20), height: rem(20) }} />
          </ThemeIcon>
          <Text fw={600} size="lg">
            {t('stats.visualizations.overview.biggestDebuts')}
          </Text>
        </Group>
      </Group>
      <Divider variant="dashed" size="sm" my="xs" />
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
          items={debuts.map((item, index) => ({
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
          to={`/stats/debuts/all/${chartType}`}
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
