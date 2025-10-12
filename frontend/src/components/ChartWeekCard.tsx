import React from 'react';
import { Card, Group, Text, Flex, Divider, Box, Button, ThemeIcon, rem, useMantineTheme } from '@mantine/core';
import { IconListNumbers, IconMicrophone, IconDisc, IconMusic, IconChevronRight } from '@tabler/icons-react';
import { SpotifyImageWithModal } from '../components/SpotifyImageWithModal';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../services/SpotifyApi';
import { getCardBackgroundByMode, type ThemeMode } from '../theme/modes';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface Top1Item {
  type: 'artist' | 'album' | 'track';
  name: string;
  artistName: string;
  entityId: string;
}

interface ChartWeekCardProps {
  week: string;
  weekNumber: number;
  top1: Top1Item[];
  themeMode: ThemeMode;
  formatWeekDate: (weekStr: string) => string;
}

export const ChartWeekCard: React.FC<ChartWeekCardProps> = ({ week, weekNumber, top1, themeMode, formatWeekDate }) => {
  const theme = useMantineTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Card shadow="md" p="md" mb="md" style={{ background: getCardBackgroundByMode(theme, themeMode) }}>
      <Group>
        <ThemeIcon variant="light" size="md">
          <IconListNumbers style={{ width: rem(20), height: rem(20) }} />
        </ThemeIcon>
        <Text fw={700} size="md">{t('charts.weekNumber')}: {weekNumber}</Text>
        <Text size="xs" c="dimmed">{formatWeekDate(week)}</Text>
      </Group>
      <Divider variant="dashed" size="sm" my="xs" />
      <Flex direction="column" gap="md">
        {top1.map(item => {
          let icon = <IconMusic size={18} />;
          if (item.type === 'artist') icon = <IconMicrophone size={18} />;
          if (item.type === 'album') icon = <IconDisc size={18} />;
          return (
            <Group key={item.type} gap="xs" align="center">
              {icon}
              <SpotifyImageWithModal
                entityId={item.entityId}
                name={item.name}
                artistName={item.artistName}
                type={item.type}
                clientId={SPOTIFY_TOKEN}
                clientSecret={SPOTIFY_SECRET}
                width={32}
                height={32}
                borderRadius={4}
              />
              <Box style={{ minWidth: 0 }}>
                <Text fw={700} size="sm" style={{ lineHeight: 1.3 }}>{item.name}</Text>
                {item.artistName && (
                  <Text size="xs" c="dimmed" style={{ lineHeight: 1.3 }}>{item.artistName}</Text>
                )}
              </Box>
              <Button
                size="xs"
                variant="light"
                onClick={() => navigate(`/charts/week/${week}/${item.type}`)}
                rightSection={<IconChevronRight size={16} />}
                aria-label={t('charts.view')}
              >
                {t('charts.view')}
              </Button>
            </Group>
          );
        })}
      </Flex>
    </Card>
  );
};
