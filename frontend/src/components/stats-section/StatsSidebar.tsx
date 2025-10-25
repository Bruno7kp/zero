import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
    Paper, 
    Stack, 
    Text, 
    ActionIcon, 
    Group, 
    Divider,
    ScrollArea,
    Tooltip
} from '@mantine/core';
import { 
    IconChevronLeft, 
    IconChevronRight,
    IconTrophy,
    IconFlame,
    IconCalendar,
    IconChartBar,
    IconRocket,
    IconMedal,
    IconUsers,
    IconHome
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

interface StatsSidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

export const StatsSidebar: React.FC<StatsSidebarProps> = ({ collapsed, onToggle }) => {
    const { t } = useTranslation();
    const location = useLocation();
    const chart = useSelector((state: any) => {
        const charts = state.charts.charts;
        const activeChartId = state.charts.activeChartId;
        return charts.find((c: any) => c.id === activeChartId) || null;
    });

    const statsCategories = [
        {
            title: t('stats.home', { defaultValue: 'Home' }),
            icon: IconHome,
            path: '/stats'
        },
        {
            title: t('stats.rank1', { defaultValue: 'All #1s' }),
            icon: IconTrophy,
            path: '/stats/rank/1/artist'
        },
        {
            title: t('stats.pak', { defaultValue: 'Perfect All Kill' }),
            icon: IconFlame,
            path: '/stats/pak'
        },
        {
            title: t('stats.timesAtRank', { defaultValue: 'Most Weeks at #1' }),
            icon: IconCalendar,
            path: '/stats/times_at_rank/1/artist'
        },
        {
            title: t('stats.timesAtTop', { defaultValue: 'Longest in Top 10' }),
            icon: IconChartBar,
            path: '/stats/times_at_top/10/artist'
        },
        {
            title: t('stats.plays', { defaultValue: 'Highest Weekly Plays' }),
            icon: IconRocket,
            path: '/stats/plays/all/artist'
        },
        {
            title: t('stats.debuts', { defaultValue: 'Strongest Debuts' }),
            icon: IconMedal,
            path: '/stats/debuts/all/artist'
        },
        {
            title: t('stats.points', { defaultValue: 'Top Point Accumulators' }),
            icon: IconChartBar,
            path: '/stats/points/artist'
        },
        {
            title: t('stats.artistsWithMost', { defaultValue: 'Artists with Most #1s' }),
            icon: IconUsers,
            path: '/stats/times_at_top_by_artist/1/artist'
        }
    ];

    const isActive = (path: string) => {
        if (path === '/stats') {
            return location.pathname === '/stats';
        }
        return location.pathname.startsWith(path);
    };

    if (!chart) {
        return (
            <Paper p="md" style={{ height: '100vh', position: 'sticky', top: 0 }}>
                <Text size="sm" c="dimmed">{t('stats.noChart', { defaultValue: 'No chart selected' })}</Text>
            </Paper>
        );
    }

    return (
        <Paper 
            p={collapsed ? 'xs' : 'md'} 
            style={{ 
                height: '100vh', 
                position: 'sticky', 
                top: 0,
                overflow: 'hidden'
            }}
        >
            <Group justify="space-between" mb="md">
                {!collapsed && (
                    <Text size="lg" fw={700}>
                        {t('stats.title', { defaultValue: 'Statistics' })}
                    </Text>
                )}
                <ActionIcon 
                    onClick={onToggle} 
                    variant="subtle"
                    size="sm"
                >
                    {collapsed ? <IconChevronRight size={18} /> : <IconChevronLeft size={18} />}
                </ActionIcon>
            </Group>
            
            <Divider mb="md" />
            
            <ScrollArea h="calc(100vh - 100px)">
                <Stack gap="xs">
                    {statsCategories.map((category) => {
                        const Icon = category.icon;
                        const active = isActive(category.path);
                        
                        const content = (
                            <Group 
                                gap="sm"
                                p={collapsed ? 'xs' : 'sm'}
                                style={{ 
                                    borderRadius: '8px',
                                    backgroundColor: active ? 'var(--mantine-color-blue-light)' : 'transparent',
                                    cursor: 'pointer',
                                    transition: 'background-color 0.2s ease'
                                }}
                            >
                                <Icon size={20} />
                                {!collapsed && (
                                    <Text size="sm" fw={active ? 600 : 400}>
                                        {category.title}
                                    </Text>
                                )}
                            </Group>
                        );

                        return collapsed ? (
                            <Tooltip key={category.path} label={category.title} position="right">
                                <NavLink 
                                    to={category.path}
                                    style={{ textDecoration: 'none', color: 'inherit' }}
                                >
                                    {content}
                                </NavLink>
                            </Tooltip>
                        ) : (
                            <NavLink 
                                key={category.path}
                                to={category.path}
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                {content}
                            </NavLink>
                        );
                    })}
                </Stack>
            </ScrollArea>
        </Paper>
    );
};
