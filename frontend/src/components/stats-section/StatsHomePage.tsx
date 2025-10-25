import React from 'react';
import { Title, Text, Paper, SimpleGrid, Group, ThemeIcon, Stack } from '@mantine/core';
import { NavLink } from 'react-router-dom';
import { 
    IconTrophy,
    IconFlame,
    IconCalendar,
    IconChartBar,
    IconRocket,
    IconMedal,
    IconUsers
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

export const StatsHomePage: React.FC = () => {
    const { t } = useTranslation();

    const statCards = [
        {
            title: t('stats.rank1', { defaultValue: 'All #1s' }),
            description: t('stats.rank1Desc', { defaultValue: 'View all songs/artists that reached #1' }),
            icon: IconTrophy,
            path: '/stats/rank/1/artist',
            color: 'yellow'
        },
        {
            title: t('stats.pak', { defaultValue: 'Perfect All Kill' }),
            description: t('stats.pakDesc', { defaultValue: 'Artists #1 in all three charts simultaneously' }),
            icon: IconFlame,
            path: '/stats/pak',
            color: 'red'
        },
        {
            title: t('stats.timesAtRank', { defaultValue: 'Most Weeks at #1' }),
            description: t('stats.timesAtRankDesc', { defaultValue: 'Longest reigning #1s' }),
            icon: IconCalendar,
            path: '/stats/times_at_rank/1/artist',
            color: 'blue'
        },
        {
            title: t('stats.timesAtTop', { defaultValue: 'Longest in Top 10' }),
            description: t('stats.timesAtTopDesc', { defaultValue: 'Most weeks in top positions' }),
            icon: IconChartBar,
            path: '/stats/times_at_top/10/artist',
            color: 'green'
        },
        {
            title: t('stats.plays', { defaultValue: 'Highest Weekly Plays' }),
            description: t('stats.playsDesc', { defaultValue: 'Biggest weekly play counts' }),
            icon: IconRocket,
            path: '/stats/plays/all/artist',
            color: 'violet'
        },
        {
            title: t('stats.debuts', { defaultValue: 'Strongest Debuts' }),
            description: t('stats.debutsDesc', { defaultValue: 'Best first week performances' }),
            icon: IconMedal,
            path: '/stats/debuts/all/artist',
            color: 'orange'
        },
        {
            title: t('stats.points', { defaultValue: 'Top Point Accumulators' }),
            description: t('stats.pointsDesc', { defaultValue: 'Highest total points earned' }),
            icon: IconChartBar,
            path: '/stats/points/artist',
            color: 'teal'
        },
        {
            title: t('stats.artistsWithMost', { defaultValue: 'Artists with Most #1s' }),
            description: t('stats.artistsWithMostDesc', { defaultValue: 'Artists with most chart-toppers' }),
            icon: IconUsers,
            path: '/stats/times_at_top_by_artist/1/artist',
            color: 'pink'
        }
    ];

    return (
        <Stack gap="xl" p="md">
            <div>
                <Title order={1} mb="xs">
                    {t('stats.title', { defaultValue: 'Statistics' })}
                </Title>
                <Text c="dimmed" size="lg">
                    {t('stats.subtitle', { defaultValue: 'Explore chart statistics and achievements' })}
                </Text>
            </div>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {statCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Paper
                            key={card.path}
                            component={NavLink}
                            to={card.path}
                            p="lg"
                            withBorder
                            style={{ 
                                textDecoration: 'none',
                                cursor: 'pointer',
                                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                            }}
                            className="stat-card-hover"
                        >
                            <Group wrap="nowrap" align="flex-start">
                                <ThemeIcon 
                                    size={50} 
                                    radius="md" 
                                    variant="light"
                                    color={card.color}
                                >
                                    <Icon size={28} />
                                </ThemeIcon>
                                <Stack gap="xs" style={{ flex: 1 }}>
                                    <Text fw={600} size="md">
                                        {card.title}
                                    </Text>
                                    <Text size="sm" c="dimmed">
                                        {card.description}
                                    </Text>
                                </Stack>
                            </Group>
                        </Paper>
                    );
                })}
            </SimpleGrid>
        </Stack>
    );
};
