import React from 'react';
import {
  Card,
  Flex,
  Button,
  Text,
  Skeleton,
  Divider,
  Group,
  ThemeIcon,
  SimpleGrid,
  rem,
} from '@mantine/core';
import { IconArrowRight, IconFlame } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { encodeLastFmSlug } from '../../../utils/urlEncoding';
import { SpotifyImageWithModal } from '../../SpotifyImageWithModal';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../../../services/SpotifyApi';

interface LastPerfectAllKillCardProps {
  loading: boolean;
  cardBg: string;
  lastPAK: {
    artistName: string;
    albumName: string;
    trackName: string;
    artistImageUrl?: string;
    albumImageUrl?: string;
    trackImageUrl?: string;
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
    <Card shadow="md" p="md" style={{ background: cardBg }}>
      <Group justify="space-between">
        <Group>
          <ThemeIcon variant="light" size="md">
            <IconFlame style={{ width: rem(20), height: rem(20) }} />
          </ThemeIcon>
          <Text fw={600} size="lg">
            {t('stats.visualizations.overview.lastPerfectAllKill')}
          </Text>
        </Group>
        <Button
          variant="light"
          size="xs"
          component={Link}
          to="/stats/pak"
          rightSection={<IconArrowRight size={14} />}
        >
          {t('stats.visualizations.actions.viewDetail')}
        </Button>
      </Group>
      <Divider variant="dashed" size="sm" my="xs" />
      {loading ? (
        <Skeleton height={100} radius="md" />
      ) : !lastPAK ? (
        <Flex justify="center" align="center" style={{ height: 100 }}>
          <Text c="dimmed" size="sm">
            {t('stats.noData')}
          </Text>
        </Flex>
      ) : (
        <>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md" verticalSpacing="md">
            <Flex direction="column" align="center" gap={8}>
              <SpotifyImageWithModal
                entityId={`artist-${lastPAK.artistName}-`}
                name={lastPAK.artistName}
                artistName={lastPAK.artistName}
                type="artist"
                clientId={SPOTIFY_TOKEN}
                clientSecret={SPOTIFY_SECRET}
                width={80}
                height={80}
                borderRadius={8}
                style={{ borderRadius: '8px' }}
              />
              <Text
                fw={600}
                size="sm"
                ta="center"
                component={Link}
                to={`/library/music/${encodeLastFmSlug(lastPAK.artistName)}`}
                className="mantine-Link-root"
              >
                {lastPAK.artistName}
              </Text>
            </Flex>
            <Flex direction="column" align="center" gap={8}>
              <SpotifyImageWithModal
                entityId={`album-${lastPAK.albumName}-${lastPAK.artistName}`}
                name={lastPAK.albumName}
                artistName={lastPAK.artistName}
                type="album"
                clientId={SPOTIFY_TOKEN}
                clientSecret={SPOTIFY_SECRET}
                width={80}
                height={80}
                borderRadius={8}
                style={{ borderRadius: '8px' }}
              />
              <Text
                fw={600}
                size="sm"
                ta="center"
                component={Link}
                to={`/library/music/${encodeLastFmSlug(lastPAK.artistName)}/${encodeLastFmSlug(
                  lastPAK.albumName
                )}`}
                className="mantine-Link-root"
              >
                {lastPAK.albumName}
              </Text>
            </Flex>
            <Flex direction="column" align="center" gap={8}>
              <SpotifyImageWithModal
                entityId={`track-${lastPAK.trackName}-${lastPAK.artistName}`}
                name={lastPAK.trackName}
                artistName={lastPAK.artistName}
                type="track"
                clientId={SPOTIFY_TOKEN}
                clientSecret={SPOTIFY_SECRET}
                width={80}
                height={80}
                borderRadius={8}
                style={{ borderRadius: '8px' }}
              />
              <Text
                fw={600}
                size="sm"
                ta="center"
                component={Link}
                to={`/library/music/${encodeLastFmSlug(lastPAK.artistName)}/_/${encodeLastFmSlug(
                  lastPAK.trackName
                )}`}
                className="mantine-Link-root"
              >
                {lastPAK.trackName}
              </Text>
            </Flex>
          </SimpleGrid>
        </>
      )}
    </Card>
  );
};
