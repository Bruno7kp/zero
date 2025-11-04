import React from 'react';
import { Card, Flex, Button, Title, Text, Skeleton, Grid, Avatar } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

interface LastPerfectAllKillCardProps {
  loading: boolean;
  cardBg: string;
  lastPAK: {
    artistName: string;
    albumName: string;
    trackName: string;
    artistImageUrl?: string;
    week: string;
  } | null;
}

export const LastPerfectAllKillCard: React.FC<LastPerfectAllKillCardProps> = ({
  loading,
  cardBg,
  lastPAK,
}) => {
  const { t } = useTranslation();

  return (
    <Card withBorder p="lg" style={{ background: cardBg }}>
      <Flex align="center" gap="md" mb="sm">
        <div style={{ flex: 1 }}>
          <Title order={4}>{t('stats.visualizations.overview.lastPerfectAllKill')}</Title>
          <Text size="sm" c="dimmed">
            {t('stats.visualizations.overview.lastPerfectAllKillDescription')}
          </Text>
        </div>
        <Button
          variant="light"
          size="xs"
          component={Link}
          to="/stats/pak"
          rightSection={<IconArrowRight size={14} />}
        >
          {t('stats.visualizations.actions.viewDetail')}
        </Button>
      </Flex>
      {loading ? (
        <Skeleton height={100} radius="md" />
      ) : !lastPAK ? (
        <Flex justify="center" align="center" style={{ height: 100 }}>
          <Text c="dimmed" size="sm">
            {t('stats.noData')}
          </Text>
        </Flex>
      ) : (
        <Grid gutter="md" align="center">
          <Grid.Col span="auto">
            <Avatar src={lastPAK.artistImageUrl} alt={lastPAK.artistName} size={80} radius="md" />
          </Grid.Col>
          <Grid.Col span={8}>
            <Flex direction="column" gap={4}>
              <Text fw={600} size="md">
                {lastPAK.artistName}
              </Text>
              <Text size="sm" c="dimmed">
                {lastPAK.albumName}
              </Text>
              <Text size="sm" c="dimmed">
                {lastPAK.trackName}
              </Text>
              <Text size="xs" c="dimmed" mt={4}>
                {lastPAK.week.replace(/-/g, '.')}
              </Text>
            </Flex>
          </Grid.Col>
        </Grid>
      )}
    </Card>
  );
};
