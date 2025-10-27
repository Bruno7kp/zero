// Stats home page with overview cards
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  SimpleGrid, 
  Card, 
  Text, 
  Title, 
  Stack,
  Group,
  ActionIcon,
  useMantineTheme
} from '@mantine/core';
import { useTranslation } from 'react-i18next';
import {
  IconTrophy,
  IconFlame,
  IconStar,
  IconHeadphones,
  IconRocket,
  IconCoin,
  IconCrown,
  IconArrowRight,
  IconCalendarUp
} from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { getCardBackgroundByMode, type ThemeMode } from '../../theme/modes';

const StatsHome: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useMantineTheme();
  const themeMode = useSelector((state: any) => state.theme?.value || 'dark') as ThemeMode;
  
  const statsCards = [
    {
      icon: IconTrophy,
      title: t('stats.rank.title', { n: 1 }),
      description: t('stats.rank.description', { n: 1 }),
      path: '/stats/rank/1/track',
      color: 'gold'
    },
    {
      icon: IconFlame,
      title: t('stats.pak.title'),
      description: t('stats.pak.description'),
      path: '/stats/pak',
      color: 'orange'
    },
    {
      icon: IconStar,
      title: t('stats.timesAtRank.title', { n: 1 }),
      description: t('stats.timesAtRank.description', { n: 1 }),
      path: '/stats/times_at_rank/1/track',
      color: 'yellow'
    },
    {
      icon: IconCalendarUp,
      title: t('stats.timesAtTop.title', { n: 10 }),
      description: t('stats.timesAtTop.description', { n: 10 }),
      path: '/stats/times_at_top/10/track',
      color: 'blue'
    },
    {
      icon: IconHeadphones,
      title: t('stats.plays.title'),
      description: t('stats.plays.description'),
      path: '/stats/plays/all/track',
      color: 'purple'
    },
    {
      icon: IconRocket,
      title: t('stats.debuts.title'),
      description: t('stats.debuts.description'),
      path: '/stats/debuts/all/track',
      color: 'green'
    },
    {
      icon: IconCoin,
      title: t('stats.points.title'),
      description: t('stats.points.description'),
      path: '/stats/points/track',
      color: 'cyan'
    },
    {
      icon: IconCrown,
      title: t('stats.timesAtTopByArtist.title', { n: 1 }),
      description: t('stats.timesAtTopByArtist.description', { n: 1 }),
      path: '/stats/times_at_top_by_artist/1/track',
      color: 'pink'
    }
  ];

  return (
    <Stack gap="xl">

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        {statsCards.map((card, index) => (
          <Card
            key={index}
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            style={{ 
              cursor: 'pointer',
              backgroundColor: getCardBackgroundByMode(theme, themeMode),
              transition: 'transform 0.2s',
              ':hover': {
                transform: 'translateY(-4px)'
              }
            }}
            onClick={() => navigate(card.path)}
          >
            <Stack gap="md">
              <Group justify="space-between">
                <card.icon size={32} color={card.color} />
                <ActionIcon 
                  variant="subtle" 
                  color={card.color}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(card.path);
                  }}
                >
                  <IconArrowRight size={18} />
                </ActionIcon>
              </Group>
              
              <div>
                <Title order={4} mb="xs">{card.title}</Title>
                <Text size="sm" c="dimmed">{card.description}</Text>
              </div>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </Stack>
  );
};

export default StatsHome;
