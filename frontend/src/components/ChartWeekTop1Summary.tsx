import React, { useEffect, useState } from 'react';
import { db } from '../db/indexedDb';
import { Button, Card, Group, Text, Flex, Divider, Grid, rem, ThemeIcon, useMantineTheme } from '@mantine/core';
import { SpotifyImageWithModal } from './SpotifyImageWithModal';
import {
    IconMicrophone,
    IconDisc,
    IconMusic,
    IconChevronRight,
    IconListNumbers
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../services/SpotifyApi';
import { useSelector } from 'react-redux';
import { getCardBackgroundByMode, type ThemeMode } from '../theme/modes';


interface ChartWeekTop1SummaryProps {
    chartId: string;
    week?: string;
    refreshKey?: number; // muda quando sync completa para reprocessar
}

type Top1Type = 'artist' | 'album' | 'track';
interface Top1Item {
    type: Top1Type;
    name: string;
    artistName: string;
    entityId: string;
}

export const ChartWeekTop1Summary: React.FC<ChartWeekTop1SummaryProps> = ({ chartId, week, refreshKey }) => {
    const [top1, setTop1] = useState<Top1Item[]>([]);
    const [weekStr, setWeekStr] = useState<string | undefined>(week);
    const { t } = useTranslation();
    const theme = useMantineTheme();
    const themeMode = useSelector((s: any) => (s.theme?.value as ThemeMode) || 'dark');

    useEffect(() => {
        let cancelled = false;
        async function fetchTop1() {
            try {
                let targetWeek = week;
                if (!targetWeek) {
                    const all = await db.charts_data
                        .where('chartId')
                        .equals(chartId)
                        .toArray();
                    const weeks = Array.from(new Set(all.map(i => i.week))).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
                    targetWeek = weeks[0];
                }
                if (!targetWeek) {
                    if (!cancelled) {
                        setTop1([]);
                        setWeekStr(undefined);
                    }
                    return;
                }
                if (!cancelled) setWeekStr(targetWeek);
                const types: Top1Type[] = ['artist', 'album', 'track'];
                const results = await Promise.all(
                    types.map(async (type) => {
                        const recs = await db.charts_data
                            .where(['chartId', 'chartType', 'week'])
                            .equals([chartId, type, targetWeek!])
                            .toArray();
                        const top = recs.find(r => r.rank === 1);
                        return top ? { type, name: top.name, artistName: top.artistName, entityId: top.entityId } : null;
                    })
                );
                if (!cancelled) setTop1(results.filter(Boolean) as Top1Item[]);
            } catch {
                if (!cancelled) {
                    setTop1([]);
                }
            }
        }
        fetchTop1();
        return () => { cancelled = true; };
    }, [chartId, week, refreshKey]);

    if (!weekStr || !top1 || top1.length === 0) {
        return (
            <Card shadow="md" p="md" style={{ background: getCardBackgroundByMode(theme, themeMode) }}>
                <Group>
                    <ThemeIcon variant="light" size="md">
                        <IconListNumbers style={{ width: rem(20), height: rem(20) }} />
                    </ThemeIcon>
                    <Text fw={600} size="lg">{t('charts.lastWeek')}</Text>
                </Group>
                <Divider variant="dashed" size="sm" my="xs" />
                <Flex direction="column" gap="md">
                    <Text c="dimmed" size="sm" style={{ textAlign: 'center' }}>
                        {t('errors.noTop1Data')}
                    </Text>
                </Flex>
            </Card>
        );
    }

    return (
        <Card shadow="md" p="md" style={{ background: getCardBackgroundByMode(theme, themeMode) }}>
            <Group>
                <ThemeIcon variant="light" size="md">
                    <IconListNumbers style={{ width: rem(20), height: rem(20) }} />
                </ThemeIcon>
                <Text fw={600} size="lg">{t('charts.lastWeek')}</Text>
            </Group>
            <Divider variant="dashed" size="sm" my="xs" />
            <Flex direction="column" gap="md">
                {top1.map(item => {
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
                                <Text fw={700} size="sm" style={{ lineHeight: 1.3 }}>
                                    {item.name}
                                </Text>
                                {item.artistName && (
                                    <Text size="xs" c="dimmed" style={{ lineHeight: 1.3 }}>
                                        {item.artistName}
                                    </Text>
                                )}
                            </Grid.Col>
                            <Grid.Col span="auto">
                                <Flex justify="flex-end">
                                    <Button
                                        component={Link}
                                        to={`/charts/week/${weekStr}/${item.type}`}
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
            <Divider variant="dashed" size="sm" my="xs" />
            <Group justify="center" align="center">
                <Button
                    component={Link}
                    to={`/charts/weeks`}
                    size="sm"
                    fullWidth
                    variant="light"
                    aria-label={t('charts.viewAll')}
                >
                    {t('charts.viewAll')}
                </Button>
            </Group>
        </Card>
    );
};
