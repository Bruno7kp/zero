import React from 'react';
import { Card, Flex, Button, Text, Skeleton, Group, rem, ThemeIcon, Divider } from '@mantine/core';
import { IconArrowRight, IconCrown } from '@tabler/icons-react';
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
    <Card shadow="md" p="md" style={{ background: cardBg }}>
      <Group justify="space-between">
        <Group>
          <ThemeIcon variant="light" size="md">
            <IconCrown style={{ width: rem(20), height: rem(20) }} />
          </ThemeIcon>
          <Text fw={600} size="lg">
            {t('stats.visualizations.overview.rankDominance')}
          </Text>
        </Group>
        <Button
          variant="light"
          size="xs"
          component={Link}
          to="/stats/visualizations/top-rank-leaders"
          rightSection={<IconArrowRight size={14} />}
        >
          {t('stats.visualizations.actions.viewDetail')}
        </Button>
      </Group>
      <Divider variant="dashed" size="sm" my="xs" />
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
