import React from 'react';
import { Card, Flex, Button, Title, Text, Skeleton } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import MiniBarWithImage from '../../visualizations/MiniBarWithImage';

interface RankLeaderPreview {
  id: string;
  value: number;
  entityId: string;
  artistName?: string;
  imageUrl?: string;
}

interface RankDominanceCardProps {
  loading: boolean;
  cardBg: string;
  rankLeaders: RankLeaderPreview[];
}

export const RankDominanceCard: React.FC<RankDominanceCardProps> = ({
  loading,
  cardBg,
  rankLeaders,
}) => {
  const { t } = useTranslation();

  return (
    <Card withBorder p="lg" style={{ background: cardBg }}>
      <Flex align="center" gap="md" mb="sm">
        <div style={{ flex: 1 }}>
          <Title order={4}>{t('stats.visualizations.overview.rankDominance')}</Title>
          <Text size="sm" c="dimmed">
            {t('stats.visualizations.overview.rankDominanceDescription')}
          </Text>
        </div>
        <Button
          variant="light"
          size="xs"
          component={Link}
          to="/stats/visualizations/top-rank-leaders"
          rightSection={<IconArrowRight size={14} />}
        >
          {t('stats.visualizations.actions.viewDetail')}
        </Button>
      </Flex>
      {loading ? (
        <Skeleton height={160} radius="md" />
      ) : rankLeaders.length === 0 ? (
        <Flex justify="center" align="center" style={{ height: 160 }}>
          <Text c="dimmed" size="sm">
            {t('stats.noData')}
          </Text>
        </Flex>
      ) : (
        <MiniBarWithImage
          items={rankLeaders.map(item => ({
            id: item.id,
            value: item.value,
            imageUrl: item.imageUrl,
            subtitle: item.artistName,
            colorKey: item.artistName,
          }))}
          height={160}
        />
      )}
    </Card>
  );
};
