import React, { useEffect, useState } from 'react';
import { Grid, Text, Box, ActionIcon, Flex } from '@mantine/core';
import { IconMicrophone, IconDisc, IconMusic, IconChevronRight } from '@tabler/icons-react';
import { SpotifyImageWithModal } from '../../SpotifyImageWithModal';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../../../services/SpotifyApi';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db } from '../../../db/indexedDb';

interface ChartWeekCardItemProps {
    type: 'artist' | 'album' | 'track';
    name: string;
    artistName: string;
    entityId: string;
    week: string;
    chartId: string;
    showFormulaInsteadOfPlays: boolean;
    formulaLabel: string;
    chart: any;
}

export const ChartWeekCardItem: React.FC<ChartWeekCardItemProps> = React.memo(({
    type,
    name,
    artistName,
    entityId,
    week,
    chartId,
    showFormulaInsteadOfPlays,
    formulaLabel,
    chart
}) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [plays, setPlays] = useState<number | null>(null);
    const [rank, setRank] = useState<number | null>(null);

    useEffect(() => {
        let cancelled = false;
        
        async function fetchPlays() {
            try {
                // Fetch the #1 entry for this type in this week
                const data = await db.charts_data
                    .where(['chartId', 'chartType', 'week'])
                    .equals([chartId, type, week])
                    .toArray();
                
                const top1 = data.find(d => d.rank === 1);
                if (!cancelled) {
                    // Use nullish coalescing so zero is preserved
                    setPlays(top1?.plays ?? null);
                    setRank(top1?.rank ?? null);
                }
            } catch (error) {
                console.error('Error fetching plays:', error);
            }
        }

        fetchPlays();
        return () => { cancelled = true; };
    }, [chartId, type, week]);

    let icon = <IconMusic size={18} />;
    if (type === 'artist') icon = <IconMicrophone size={18} />;
    if (type === 'album') icon = <IconDisc size={18} />;

    const formatNumber = (num: number) => {
        return new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(num);
    };

    // Compute display value according to setting
    let displayValue: number | null = null;
    if (showFormulaInsteadOfPlays) {
        // Calculate formula for current week using rank and plays
        // Formula: stabilityPoints * pointsWeight + plays * playsWeight
        const effectiveType = type === 'track' ? 'track' : 'album';
        const pointsWeight = effectiveType === 'track' ? Number(chart?.music_points_weight || 0) : Number(chart?.album_points_weight || 0);
        const playsWeight = effectiveType === 'track' ? Number(chart?.music_plays_weight || 0) : Number(chart?.album_plays_weight || 0);
        const stabilityPoints = rank != null && rank > 0 ? Math.max(0, 101 - rank) : 0;
        const safePlays = typeof plays === 'number' ? plays : 0;
        const raw = stabilityPoints * pointsWeight + safePlays * playsWeight;
        displayValue = Number.isFinite(raw) ? Math.round(raw) : 0;
    } else {
        displayValue = typeof plays === 'number' ? plays : null;
    }

    return (
        <Grid align="center" gutter="xs">
            <Grid.Col span="content">
                <Flex align="center" justify="center">
                    {icon}
                </Flex>
            </Grid.Col>
            <Grid.Col span="content">
                <SpotifyImageWithModal
                    entityId={entityId}
                    name={name}
                    artistName={artistName}
                    type={type}
                    clientId={SPOTIFY_TOKEN}
                    clientSecret={SPOTIFY_SECRET}
                    width={32}
                    height={32}
                    borderRadius={4}
                />
            </Grid.Col>
            <Grid.Col span="auto">
                <Box style={{ minWidth: 0 }}>
                    <Text fw={700} size="sm" style={{ lineHeight: 1.3 }}>{name}</Text>
                    {artistName && (
                        <Text size="xs" c="dimmed" style={{ lineHeight: 1.3 }}>{artistName}</Text>
                    )}
                </Box>
            </Grid.Col>
            <Grid.Col span="content">
                <Box style={{ minWidth: 80, textAlign: 'right' }}>
                    {displayValue !== null ? (
                        <>
                            <Text size="xs" fw={500}>
                                {formatNumber(displayValue)}
                            </Text>
                            <Text size="xs" c="dimmed" style={{ lineHeight: 1.2 }}>
                                {showFormulaInsteadOfPlays ? formulaLabel : t('charts.plays')}
                            </Text>
                        </>
                    ) : (
                        <Text size="xs" c="dimmed">-</Text>
                    )}
                </Box>
            </Grid.Col>
            <Grid.Col span="content">
                <ActionIcon
                    variant="light"
                    onClick={() => navigate(`/charts/week/${week}/${type}`)}
                    aria-label={t('charts.view')}
                    size="sm"
                >
                    <IconChevronRight size={16} />
                </ActionIcon>
            </Grid.Col>
        </Grid>
    );
});
