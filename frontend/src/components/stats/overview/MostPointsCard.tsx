import React from 'react';
import {
  Card,
  Flex,
  Button,
  Title,
  Text,
  Skeleton,
  Grid,
} from '@mantine/core';
import { IconArrowRight, IconMicrophone } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { SpotifyImageWithModal } from '../../SpotifyImageWithModal';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../../../services/SpotifyApi';

interface Top1Item {
  type: 'artist';
  name: string;
  artistName: string;
  entityId: string;
  totalPoints: number;
  rank: number;
}

interface MostPointsCardProps {
  loading: boolean;
  cardBg: string;
  topArtists: Top1Item[];
}

export const MostPointsCard: React.FC<MostPointsCardProps> = ({
  loading,
  cardBg,
  topArtists,
}) => {
  const { t } = useTranslation();

  return (
    <Card withBorder p="lg" style={{ background: cardBg }}>
      <Flex align="center" gap="md" mb="sm">
        <div style={{ flex: 1 }}>
          <Title order={4}>{t('stats.visualizations.overview.mostPoints')}</Title>
          <Text size="sm" c="dimmed">
            {t('stats.visualizations.overview.mostPointsDescription')}
          </Text>
        </div>
        <Button
          variant="light"
          size="xs"
          component={Link}
          to="/stats/points/artist"
          rightSection={<IconArrowRight size={14} />}
        >
          {t('stats.visualizations.actions.viewDetail')}
        </Button>
      </Flex>
      {loading ? (
        <Skeleton height={160} radius="md" />
      ) : topArtists.length === 0 ? (
        <Flex justify="center" align="center" style={{ height: 160 }}>
          <Text c="dimmed" size="sm">
            {t('stats.noData')}
          </Text>
        </Flex>
      ) : (
        <Flex direction="column" gap="md">
          {topArtists.map(item => (
            <Grid key={item.entityId} grow align="center" gutter="xs">
              <Grid.Col span="auto">
                <Flex align="center" justify="center">
                  <Text fw={700} size="sm" c="dimmed">
                    #{item.rank}
                  </Text>
                </Flex>
              </Grid.Col>
              <Grid.Col span="auto">
                <Flex align="center" justify="center">
                  <IconMicrophone size={18} />
                </Flex>
              </Grid.Col>
              <Grid.Col span="auto">
                <SpotifyImageWithModal
                  entityId={item.entityId}
                  name={item.name}
                  artistName={item.artistName}
                  type={item.type}
                  clientId={SPOTIFY_TOKEN}
                  clientSecret={SPOTIFY_SECRET}
                  width={40}
                  height={40}
                  borderRadius={4}
                  style={{ borderRadius: '4px' }}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Text fw={600} size="sm" className="entity-name" style={{ lineHeight: 1.3 }}>
                  {item.name}
                </Text>
                <Text size="xs" c="dimmed" style={{ lineHeight: 1.3 }}>
                  {item.totalPoints.toLocaleString()} {t('stats.points').toLowerCase()}
                </Text>
              </Grid.Col>
            </Grid>
          ))}
        </Flex>
      )}
    </Card>
  );
};
