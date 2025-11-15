import React from 'react';
import { Card, Group, Text, ThemeIcon, Divider, Skeleton, Stack, Button } from '@mantine/core';
import { IconHeadphones, IconArrowRight } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import MiniBarWithImage from '../../visualizations/MiniBarWithImage';
import { useTranslation } from 'react-i18next';
// Link not needed

interface HighestPlaysItem {
  type: 'artist' | 'album' | 'track';
  name: string;
  artistName: string;
  plays: number;
  entityId: string;
  week: string;
  imageUrl?: string;
}

interface MiniHighestPlaysInWeekCardProps {
  loading: boolean;
  cardBg: string;
  items: HighestPlaysItem[];
  limit?: number;
  chartType?: 'artist' | 'album' | 'track';
}

export const MiniHighestPlaysInWeekCard: React.FC<MiniHighestPlaysInWeekCardProps> = ({
  loading,
  cardBg,
  items,
  limit = 3,
  chartType,
}) => {
  const { t } = useTranslation();
  const currentYear = String(new Date().getFullYear());
  const visible = (items || []).filter(i => i.week.startsWith(currentYear)).slice(0, limit);
  const barItems = visible.map(i => ({
    id: `${i.type}-${i.name}`,
    value: i.plays,
    imageUrl: i.imageUrl,
    subtitle: i.artistName,
    colorKey: i.artistName || i.name,
  }));

  return (
    <Card shadow="md" p="md" style={{ background: cardBg }}>
      <Group style={{ justifyContent: 'space-between' }}>
        <Group>
          <ThemeIcon variant="light" size="md">
            <IconHeadphones />
          </ThemeIcon>
          <Text fw={600} size="lg">
            {t('stats.visualizations.overview.highestPlaysInWeekOfYear', { year: currentYear })}
          </Text>
        </Group>
        <Button
          variant="light"
          size="xs"
          component={Link}
          to={`/stats/visualizations/top-weekly-plays/${chartType || 'track'}`}
          rightSection={<IconArrowRight size={14} />}
        >
          {t('stats.visualizations.actions.viewDetail')}
        </Button>
      </Group>

      <Divider variant="dashed" size="sm" my="xs" />

      {loading ? (
        <Skeleton height={140} radius="md" />
      ) : visible.length === 0 ? (
        <Stack align="center">
          <Text c="dimmed" size="sm">
            {t('stats.noData')}
          </Text>
        </Stack>
      ) : (
        <MiniBarWithImage items={barItems} height={140} layout="horizontal" />
      )}
    </Card>
  );
};
