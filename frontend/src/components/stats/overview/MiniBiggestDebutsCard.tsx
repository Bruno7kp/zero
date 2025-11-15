import React from 'react';
import { Card, Group, Text, ThemeIcon, Divider, Skeleton, Stack, Button } from '@mantine/core';
import { IconRocket, IconArrowRight } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import MiniBarWithImage from '../../visualizations/MiniBarWithImage';
import { useTranslation } from 'react-i18next';
// Link not needed in mini card

interface DebutItem {
  type: 'artist' | 'album' | 'track';
  name: string;
  artistName: string;
  plays: number;
  entityId: string;
  week: string;
  imageUrl?: string;
}

interface MiniBiggestDebutsCardProps {
  loading: boolean;
  cardBg: string;
  items: DebutItem[];
  limit?: number;
  chartType?: 'artist' | 'album' | 'track';
}

export const MiniBiggestDebutsCard: React.FC<MiniBiggestDebutsCardProps> = ({
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
            <IconRocket />
          </ThemeIcon>
          <Text fw={600} size="lg">
            {t('stats.visualizations.overview.biggestDebutsOfYear', { year: currentYear })}
          </Text>
        </Group>
        <Button
          variant="light"
          size="xs"
          component={Link}
          to={`/stats/visualizations/top-weekly-debuts/${chartType || 'track'}`}
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
        <MiniBarWithImage items={barItems} height={140} layout="horizontal" />
      )}
    </Card>
  );
};
