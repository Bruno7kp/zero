import React from 'react';
import {
  Card,
  Flex,
  Button,
  Text,
  Skeleton,
  Group,
  ThemeIcon,
  rem,
  Divider,
  Grid,
} from '@mantine/core';
import {
  IconChevronRight,
  IconCoins,
  IconDisc,
  IconMicrophone,
  IconMusic,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { SpotifyImageWithModal } from '../../SpotifyImageWithModal';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../../../services/SpotifyApi';

interface Top1Item {
  type: 'artist' | 'album' | 'track';
  name: string;
  artistName: string;
  entityId: string;
  totalPoints: number;
  imageUrl?: string;
}

interface MostPointsCardProps {
  loading: boolean;
  cardBg: string;
  topArtists: Top1Item[];
}

export const MostPointsCard: React.FC<MostPointsCardProps> = ({ loading, cardBg, topArtists }) => {
  const { t } = useTranslation();

  return (
    <Card shadow="md" p="md" style={{ background: cardBg }}>
      <Group justify="space-between">
        <Group>
          <ThemeIcon variant="light" size="md">
            <IconCoins style={{ width: rem(20), height: rem(20) }} />
          </ThemeIcon>
          <Text fw={600} size="lg">
            {t('stats.visualizations.overview.mostPoints')}
          </Text>
        </Group>
      </Group>
      <Divider variant="dashed" size="sm" my="xs" />
      {loading ? (
        <Skeleton height={140} radius="md" />
      ) : topArtists.length === 0 ? (
        <Flex justify="center" align="center" style={{ height: 140 }}>
          <Text c="dimmed" size="sm">
            {t('stats.noData')}
          </Text>
        </Flex>
      ) : (
        <Flex direction="column" gap="md">
          {topArtists.map(item => {
            let icon = <IconMusic size={18} />;
            if (item.type === 'artist') {
              icon = <IconMicrophone size={18} />;
            }
            if (item.type === 'album') {
              icon = <IconDisc size={18} />;
            }

            return (
              <Grid key={item.type} grow align="center" gutter="xs">
                <Grid.Col span="auto">
                  <Flex align="center" justify="center">
                    {icon}
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
                  {item.artistName && (
                    <Text size="xs" c="dimmed" style={{ lineHeight: 1.3 }}>
                      {item.artistName}
                    </Text>
                  )}
                  <Text size="xs" c="dimmed" style={{ lineHeight: 1.3 }}>
                    {item.totalPoints} {t('charts.stats.points')}
                  </Text>
                </Grid.Col>
                <Grid.Col span="auto">
                  <Flex justify="flex-end">
                    <Button
                      component={Link}
                      to={`/stats/points/${item.type}`}
                      size="xs"
                      variant="light"
                      aria-label={t('charts.view')}
                    >
                      <IconChevronRight size={18} />
                    </Button>
                  </Flex>
                </Grid.Col>
              </Grid>
            );
          })}
        </Flex>
      )}
    </Card>
  );
};
