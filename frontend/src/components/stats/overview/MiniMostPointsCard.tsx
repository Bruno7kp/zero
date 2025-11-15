import React from 'react';
import { Card, Group, Text, ThemeIcon, Divider, Skeleton, Stack, Button } from '@mantine/core';
import { IconCoins, IconArrowRight } from '@tabler/icons-react';
import MiniBarWithImage from '../../visualizations/MiniBarWithImage';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

interface MiniTopPointsItem {
  type: 'artist' | 'album' | 'track';
  name: string;
  artistName: string;
  totalPoints: number;
  entityId: string;
  imageUrl?: string;
}

interface MiniMostPointsCardProps {
  loading: boolean;
  cardBg: string;
  items: MiniTopPointsItem[];
  limit?: number;
  chartType?: 'artist' | 'album' | 'track';
}

export const MiniMostPointsCard: React.FC<MiniMostPointsCardProps> = ({
  loading,
  cardBg,
  items,
  limit = 3,
  chartType,
}) => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const visible = (items || []).slice(0, limit);
  const barItems = visible.map(i => ({
    id: i.name,
    value: i.totalPoints,
    imageUrl: i.imageUrl,
    subtitle: i.artistName,
    colorKey: i.artistName || i.name,
  }));
  return (
    <Card shadow="md" p="md" style={{ background: cardBg }}>
      <Group style={{ justifyContent: 'space-between' }}>
        <Group>
          <ThemeIcon variant="light" size="md">
            <IconCoins />
          </ThemeIcon>
          <Text fw={600} size="lg">
            {t('stats.visualizations.overview.mostPointsWithYear', { year: currentYear })}
          </Text>
        </Group>
        <Button
          variant="light"
          size="xs"
          component={Link}
          to={`/stats/visualizations/top-points-leaders/${chartType || 'track'}`}
          rightSection={<IconArrowRight size={14} />}
        >
          {t('stats.visualizations.actions.viewDetail')}
        </Button>
      </Group>

      <Divider variant="dashed" size="sm" my="xs" />

      {loading ? (
        <Skeleton height={140} radius="md" />
      ) : barItems.length === 0 ? (
        <Stack align="center">
          <Text c="dimmed" size="sm">
            {t('stats.noData')}
          </Text>
        </Stack>
      ) : (
        <MiniBarWithImage items={barItems} height={140} />
      )}
    </Card>
  );
};
