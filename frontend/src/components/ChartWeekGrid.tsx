import React, { useEffect, useState, useRef } from 'react';
import { ImageEditModal } from './ImageEditModal';
import type { AppDispatch } from '../store/index';
import { useSelector, useDispatch } from 'react-redux';
import { fetchChartData, fetchStatsMapIncremental, computeWeekDeltas } from '../store/chartsSlice';
import { useProgressiveReveal } from '../hooks/useProgressiveReveal';
import { Card, Text, Badge, Box, ActionIcon, Grid, Group, Modal, useMantineTheme, useMantineColorScheme } from '@mantine/core';
import { formatNumber } from '../utils/format';
import { IconPlus, IconCaretUpFilled, IconCaretDownFilled, IconStarFilled, IconArrowBackUp } from '@tabler/icons-react';
import { DeltaBadge } from './DeltaBadge';
import { selectResolvedBadge } from '../store/badgeStylesSlice';
import { SpotifyImageWithModal } from './SpotifyImageWithModal';
import type { ChartData } from '../db/indexedDb';
import { ChartItemStatsLoader } from './ChartItemStatsLoader';

interface ChartWeekGridProps {
    chart: any;
    week?: string;
    type: string;
    clientId: string;
    clientSecret: string;
    altVariation?: (row: ChartData, index: number) => string | number | false | null | undefined;
}

export const ChartWeekGrid: React.FC<ChartWeekGridProps> = ({ chart, week, type, clientId, clientSecret, altVariation }) => {
    const dispatch = useDispatch<AppDispatch>();
    // Sincroniza colunas do grid com localStorage
    useEffect(() => {
        const storageKey = 'chart_columns_grid';
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    parsed.forEach((col: any) => {
                        dispatch({ type: 'columns/updateColumn', payload: { view: 'grid', key: col.key, visible: col.visible } });
                    });
                }
            } catch {
                // Ignora JSON inválido no localStorage
            }
        }
    }, [dispatch]);
    const [lastImageUrlByEntityId, setLastImageUrlByEntityId] = useState<{ [entityId: string]: string | null }>({});
    // Memorize the last image for each entityId, and only update when a new image is loaded
    // This ensures the image only changes when the new one is ready
    // Função para renderizar o ícone de variação
    // hook must be at top-level (was incorrectly inside renderAltVariation causing hook order issues)
    const badgeStylesRank = useSelector((s: any) => selectResolvedBadge(s, 'rank', 'grid'));
    const rankVariationLocation = useSelector((state: any) => (state.columns?.views?.grid?.settings?.rankVariationLocation) || 'under');
    const peakCountStyle = useSelector((state: any) => state.columns?.views?.grid?.settings?.peakCountStyle) || 'noCount';
    const showPeakCount = peakCountStyle === 'withCount';

    function renderAltVariation(row: ChartData, idx: number, rankCfg: any) {
        const showDelta = columns.find((c: any) => c.key === 'deltaRankBadge')?.visible;
        if (!showDelta) return null;
        const raw: any = altVariation ? altVariation(row, idx) : undefined;
        const value: any = (raw || raw === 0) ? (raw === '-' ? undefined : raw) : undefined;
        let cfg: any = rankCfg;
        if (rankCfg.iconPosition === 'split') {
            // In grid we keep compact inline look; disable tall split but allow split pair
            cfg = { ...rankCfg, iconPosition: 'split', splitTall: false };
        } else if (rankCfg.iconPosition === 'hidden') {
            cfg = { ...rankCfg, iconPosition: 'hidden', splitTall: false };
        } else {
            cfg = { ...rankCfg, splitTall: false };
        }
        return (
            <Box style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
                {/* Grid corner badge -> medium font size for readability without overpowering */}
                <DeltaBadge delta={value} cfg={cfg} kind="rank" textSize="md" contextView="grid" />
            </Box>
        );
    }
    const data = useSelector((state: any) => state.charts.data);
    // Persist previous data while new data is loading to prevent flicker
    const [displayedData, setDisplayedData] = useState<any[]>(data);
    const prevDataRef = useRef<any[]>(data);
    const [displayedKey, setDisplayedKey] = useState<string | null>(null);
    const [switchHoldUntil, setSwitchHoldUntil] = useState<number | null>(null);
    const currentKey = `${chart?.id || 'x'}|${type}|${week || 'n/a'}`;
    const isDeltasReady = React.useCallback((rows: any[], targetWeek?: string) => {
        if (!Array.isArray(rows) || !rows.length || !targetWeek) return false;
        const cur = rows.filter((r: any) => r.week === targetWeek);
        if (!cur.length) return false;
        let ready = 0;
        for (const r of cur) {
            const d = (r as any).deltaRank;
            if (d !== undefined && d !== null && d !== '-') ready++;
        }
        return ready >= Math.ceil(cur.length * 0.9); // 90% prontos
    }, []);
    useEffect(() => {
        if (!Array.isArray(data) || data.length === 0) return; // mantém anterior
        const sameKey = displayedKey === currentKey;
        const ready = isDeltasReady(data as any[], week);
        if (!sameKey) {
            if (ready) {
                setDisplayedData(data);
                prevDataRef.current = data;
                setDisplayedKey(currentKey);
                setSwitchHoldUntil(null);
            } else {
                if (!switchHoldUntil) setSwitchHoldUntil(Date.now() + 450);
            }
        } else {
            if (ready) {
                setDisplayedData(data);
                prevDataRef.current = data;
            }
        }
    }, [data, week, type, chart?.id, displayedKey, currentKey, isDeltasReady, switchHoldUntil]);
    useEffect(() => {
        if (!switchHoldUntil) return;
        const id = setInterval(() => {
            const ready = isDeltasReady(data as any[], week);
            if (ready || Date.now() >= switchHoldUntil) {
                if (Array.isArray(data) && data.length) {
                    setDisplayedData(data);
                    prevDataRef.current = data;
                    setDisplayedKey(currentKey);
                }
                setSwitchHoldUntil(null);
            }
        }, 60);
        return () => clearInterval(id);
    }, [switchHoldUntil, data, week, isDeltasReady, currentKey]);

    // Garante que displayedData nunca fique vazio
    const safeDisplayedData = displayedData && displayedData.length > 0 ? displayedData : prevDataRef.current;
    const statsMap = useSelector((state: any) => state.charts.statsMap);
    const columns = useSelector((state: any) => (state.columns?.views?.grid?.columns) || state.columns?.columns || []);
    const showImage = columns.find((c: any) => c.key === 'image')?.visible;
    const showPeak = columns.find((c: any) => c.key === 'peak')?.visible;
    const showPlays = columns.find((c: any) => c.key === 'plays')?.visible;
    const showTotalWeeks = columns.find((c: any) => c.key === 'totalWeeks')?.visible;
    // altVariation column is never used in grid (mapping forces it off); badge visibility controls variation
    const theme = useMantineTheme();
    const { colorScheme } = useMantineColorScheme();
    const gridView = useSelector((state: any) => (state as any).columns?.views?.grid);
    const fontScale = (gridView?.settings as any)?.fontScale ?? 0;
    const sizeOrder = ['xs','sm','md','lg','xl'] as const;
    const scaleSize = (s: typeof sizeOrder[number]): typeof sizeOrder[number] => {
        const idx = sizeOrder.indexOf(s);
        const next = Math.max(0, Math.min(sizeOrder.length - 1, idx + fontScale));
        return sizeOrder[next];
    };

    // Modal de detalhes
    const [modalOpen, setModalOpen] = useState(false);
    const [modalRow, setModalRow] = useState<ChartData | null>(null);
    // Modal de imagem
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [imageModalRow] = useState<ChartData | null>(null); // setImageModalRow unused
    const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
    // Forçar atualização da imagem ao salvar
    const [imageForceUpdate, setImageForceUpdate] = useState<{ [entityId: string]: number }>({});

    // Últimos valores estáveis para Peak/Weeks para evitar flicker
    const [lastPeakById, setLastPeakById] = useState<Record<string, number | null>>({});
    const [lastWeeksById, setLastWeeksById] = useState<Record<string, number | null>>({});
    const [lastWeeksAtPeakById, setLastWeeksAtPeakById] = useState<Record<string, number | null>>({});
    useEffect(() => {
        // Atualiza caches com valores definitivos presentes no statsMap
        try {
            const nextPeak = { ...lastPeakById };
            const nextWeeks = { ...lastWeeksById };
            const nextWeeksAtPeak = { ...lastWeeksAtPeakById };
            let changed = false;
            for (const [entityId, s] of Object.entries(statsMap || {})) {
                const peak = (s as any)?.peak?.position;
                if (peak != null && nextPeak[entityId] !== peak) { nextPeak[entityId] = peak; changed = true; }
                const weeks = (s as any)?.totals?.withinCutoff;
                if (weeks != null && nextWeeks[entityId] !== weeks) { nextWeeks[entityId] = weeks; changed = true; }
                const weeksAtPeak = (s as any)?.peak?.weeksAtPeak;
                if (weeksAtPeak != null && nextWeeksAtPeak[entityId] !== weeksAtPeak) { nextWeeksAtPeak[entityId] = weeksAtPeak; changed = true; }
            }
            if (changed) {
                setLastPeakById(nextPeak);
                setLastWeeksById(nextWeeks);
                setLastWeeksAtPeakById(nextWeeksAtPeak);
            }
        } catch { /* noop */ }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [statsMap]);

    useEffect(() => {
        if (!week || !chart?.id) return;
        dispatch(fetchChartData({ chartId: `${chart.id}`, chartType: type, week }));
    }, [chart?.id, week, type, dispatch]);

    useEffect(() => {
        if (!data.length || !week || !chart?.id) return;
        dispatch(computeWeekDeltas({ chartId: `${chart.id}`, chartType: type, week, rows: data }));
    }, [data, week, chart?.id, type, dispatch]);

    // Stats diferidos somente se peak ou totalWeeks estiverem visíveis
    useEffect(() => {
        if (!data.length || !week || !chart?.id) return;
        const wantsStats = columns.some((c: any) => (c.key === 'peak' || c.key === 'totalWeeks') && c.visible);
        if (!wantsStats) return;
        let cancelled = false;
        requestAnimationFrame(() => requestAnimationFrame(() => {
            const id = setTimeout(() => {
                if (cancelled) return;
                dispatch(fetchStatsMapIncremental({ chartId: `${chart.id}`, chartType: type, data, week }));
            }, 900);
            (window as any).__gridStatsTimer = id;
        }));
        return () => {
            cancelled = true;
            if ((window as any).__gridStatsTimer) clearTimeout((window as any).__gridStatsTimer);
        };
    }, [data, chart?.id, type, week, dispatch, columns]);

    // Progressive reveal dos cards (melhora percepção de velocidade em listas grandes)
    const useProgressive = safeDisplayedData.length > 120;
    const progressiveAll = useProgressiveReveal(safeDisplayedData, { initial: 30, step: 36, intervalMs: 24, adaptive: true, disableBelow: 180, targetDurationMs: 240 });
    const progressive = useProgressive ? progressiveAll : { items: safeDisplayedData, done: true, total: safeDisplayedData.length } as any;
    const visibleCards = progressive.items;
    const showLoadingTail = useProgressive && !progressive.done;

    const modalTitle = modalRow ? `${modalRow.name}${modalRow.artistName ? ' — ' + modalRow.artistName : ''}` : 'Detalhes';
    return (
        <>
            <Modal
                opened={modalOpen}
                onClose={() => setModalOpen(false)}
                title={modalTitle}
                size="xl"
                styles={{
                    header: { justifyContent: 'center', position: 'relative' },
                    title: { width: '100%', textAlign: 'center', fontWeight: 700 },
                    close: { position: 'absolute', right: 8 }
                }}
            >
                {modalRow && (
                    <ChartItemStatsLoader
                        chartId={modalRow.chartId}
                        chartType={modalRow.chartType}
                        entityId={modalRow.entityId}
                        week={week}
                    />
                )}
            </Modal>
            <Grid gutter="md" columns={30}>
                {visibleCards.map((row: ChartData, idx: number) => {
                    const stats = statsMap[row.entityId];
                    let deltaValue: any = altVariation ? altVariation(row, idx) : undefined;
                    if (deltaValue === '-') deltaValue = undefined;
                    const deltaColor = (() => {
                        if (deltaValue === 'NEW') return 'lazuli';
                        if (deltaValue === 'RE') return 'bee';
                        if (typeof deltaValue === 'number') {
                            if (deltaValue > 0) return 'grass';
                            if (deltaValue < 0) return 'cherry';
                            return 'gray'; // '=' / 0 mantém cinza
                        }
                        return 'gray';
                    })();
                    return (
                        <Grid.Col key={row.id} span={{ base: 15, md: 10, lg: 6 }}>
                            <Card shadow="sm" radius="md" p={0} style={{ height: '100%', display: 'flex', flexDirection: 'column', background: colorScheme === 'dark' ? theme.colors.dark[7] : 'white' }}>
                                <Box style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: 'transparent', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start' }}>
                                    {/* Variação (grid):
                                                                            - 'hidden': sem overlay nem ícone
                                                                            - 'under': sem overlay (ícone aparece sob o rank)
                                                                            - 'corner': overlay no canto superior direito */}
                                    {rankVariationLocation === 'corner' && renderAltVariation(row, idx, badgeStylesRank)}
                                    {/* Botão modal canto superior esquerdo */}
                                    <ActionIcon
                                        size="sm"
                                        variant="filled"
                                        color="gray"
                                        style={{ position: 'absolute', top: 8, left: 8, zIndex: 2 }}
                                        onClick={() => { setModalRow(row); setModalOpen(true); }}
                                    >
                                        <IconPlus size={16} />
                                    </ActionIcon>
                                    {/* Posição (rank) canto inferior esquerdo */}
                                    <Badge
                                        color={row.rank === 1 ? 'lazuli' : deltaColor}
                                        size="xl"
                                        variant="filled"
                                        py="xl"
                                        px="xs"
                                        style={{
                                            position: 'absolute',
                                            left: 0,
                                            bottom: 0,
                                            zIndex: 2,
                                            fontWeight: 800,
                                            fontSize: 32,
                                            minWidth: 40,
                                            borderTopRightRadius: 12,
                                            borderTopLeftRadius: 0,
                                            borderBottomRightRadius: 0,
                                            borderBottomLeftRadius: 0,
                                        }}
                                    >
                                        {/* Número da posição + (opcional) ícone abaixo em branco quando localização = 'under' */}
                                        <Box component="span" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
                                            <span>{row.rank}</span>
                                            {(() => {
                                                if (rankVariationLocation !== 'under') return null;
                                                const value: any = deltaValue;
                                                // Placeholder enquanto carrega a variação (ex.: computeWeekDeltas ainda não preencheu)
                                                if (value === undefined || value === null) {
                                                    return (
                                                        <span
                                                            aria-label="loading-delta"
                                                            style={{
                                                                marginTop: 4,
                                                                width: 8,
                                                                height: 8,
                                                                borderRadius: 8,
                                                                backgroundColor: theme.white,
                                                                opacity: 0.7,
                                                                display: 'inline-block',
                                                            }}
                                                        />
                                                    );
                                                }
                                                if (!value && value !== 0) return null;
                                                // Respeita a customização do badge: ícone/texto/ambos
                                                let cfg = badgeStylesRank as any;
                                                // No grid under-rank não suportamos 'split'; converte para inline antes
                                                if (cfg.iconPosition === 'split') cfg = { ...cfg, iconPosition: 'before' };
                                                const showIcon = cfg.iconPosition !== 'hidden';
                                                const hideLabel = !!cfg.hideLabel;
                                                const color = theme.white;
                                                const baseSize = 12;
                                                const label = (() => {
                                                    if (typeof value === 'number') {
                                                        if (value > 0) return `+${value}`;
                                                        if (value < 0) return `${value}`;
                                                        return '=';
                                                    }
                                                    if (value === 'NEW' || value === 'RE' || value === '=') return value as string;
                                                    return '';
                                                })();
                                                const isIconOnly = showIcon && hideLabel && label !== '=';
                                                const iconEl = (() => {
                                                    const upDownSize = baseSize + (isIconOnly ? 4 : 0);
                                                    const reSize = baseSize + (isIconOnly ? 2 : 0);
                                                    if (value === 'NEW') return <IconStarFilled size={baseSize} color={color} style={{ marginTop: 2 }} />;
                                                    if (value === 'RE') return <IconArrowBackUp size={reSize} stroke={3} color={color} style={{ marginTop: 2, transform: 'scaleX(-1)' }} />;
                                                    if (typeof value === 'number') {
                                                        if (value > 0) return <IconCaretUpFilled size={upDownSize} color={color} style={{ marginTop: 2 }} />;
                                                        if (value < 0) return <IconCaretDownFilled size={upDownSize} color={color} style={{ marginTop: 2 }} />;
                                                    }
                                                    if ((value === '=' || value === 0)) return null;
                                                    return null;
                                                })();
                                                // Label a exibir considerando hideLabel; mantém '=' mesmo em modo ícone
                                                let displayLabel = hideLabel ? (label === '=' ? label : '') : label;
                                                // Em modo texto+ícone, não mostrar texto para NEW/RE (somente ícone)
                                                if (!hideLabel && showIcon && (value === 'NEW' || value === 'RE')) {
                                                    displayLabel = '';
                                                }
                                                if (!showIcon && !displayLabel) return null;
                                                return (
                                                    <span style={{ marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 4, color }}>
                                                        {showIcon && cfg.iconPosition === 'before' && iconEl}
                                                        {displayLabel && <span style={{ fontSize: baseSize, lineHeight: 1 }}>{displayLabel}</span>}
                                                        {showIcon && cfg.iconPosition === 'after' && iconEl}
                                                    </span>
                                                );
                                            })()}
                                        </Box>
                                    </Badge>
                                    {/* Imagem do Spotify ou placeholder */}
                                    {showImage && (
                                        <SpotifyImageWithModal
                                            entityId={row.entityId}
                                            name={row.name}
                                            artistName={row.artistName}
                                            type={type === 'artist' || type === 'album' || type === 'track' ? type : 'artist'}
                                            clientId={clientId}
                                            clientSecret={clientSecret}
                                            forceUpdate={imageForceUpdate[row.entityId]}
                                            width={'100%'}
                                            height={'100%'}
                                            style={{ aspectRatio: '1/1', minHeight: 0, minWidth: 0 }}
                                            lastImageUrl={lastImageUrlByEntityId[row.entityId]}
                                            onImageChange={() => {
                                                if (row.entityId) {
                                                    setImageForceUpdate(fu => ({ ...fu, [row.entityId]: (fu[row.entityId] || 0) + 1 }));
                                                    // Não atualiza a imagem imediatamente, só quando a nova carregar
                                                }
                                            }}
                                            onImageLoad={(url: string) => {
                                                // Só troca a imagem quando a nova já está pronta, com delay para suavizar
                                                if (row.entityId && url && lastImageUrlByEntityId[row.entityId] !== url) {
                                                    setTimeout(() => {
                                                        setLastImageUrlByEntityId(prev => {
                                                            // Garante que não mudou de entityId durante o delay
                                                            if (prev[row.entityId] !== url) {
                                                                return { ...prev, [row.entityId]: url };
                                                            }
                                                            return prev;
                                                        });
                                                    }, 1000);
                                                }
                                            }}
                                        />
                                    )}
                                </Box>
                                <Box px="sm" py={8} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 64 }}>
                                    <Text fw={700} size={scaleSize('md')} lineClamp={2} style={{ width: '100%', textAlign: 'center' }}>{row.name}</Text>
                                    {row.artistName && <Text size={scaleSize('sm')} c="dimmed" lineClamp={1} style={{ width: '100%', textAlign: 'center' }}>{row.artistName}</Text>}
                                </Box>
                                {(showPlays || showPeak || showTotalWeeks) && (
                                    <Group px="sm" pb="sm" style={{ minHeight: 36, width: '100%', justifyContent: 'space-between', gap: 4, display: 'flex' }}>
                                        {showPeak && (
                                            <Box style={{ textAlign: 'center', flex: 1 }}>
                                                <Text size={scaleSize('xs')} c="dimmed">Peak</Text>
                                                {(() => {
                                                    const current = stats?.peak?.position;
                                                    const stable = lastPeakById[row.entityId];
                                                    const display = (current != null) ? current : (stable != null ? stable : undefined);
                                                    const showCount = showPeakCount;
                                                    const hasStats = !!stats;
                                                    const liveCount = stats?.peak?.weeksAtPeak;
                                                    const stableWeeksAtPeak = lastWeeksAtPeakById[row.entityId];
                                                    const rawCountAtOne = (liveCount != null ? liveCount : stableWeeksAtPeak);
                                                    const renderedCountAtOne = display === 1
                                                        ? (hasStats ? Math.max(1, (rawCountAtOne as number) ?? 1) : 1)
                                                        : null;
                                                    return (
                                                        <Text fw={700} size={scaleSize('sm')} c={display === 1 ? 'blue' : undefined} style={{ transition: 'color 120ms ease' }}>
                                                            {display != null ? display : <span style={{ opacity: 0, display: 'inline-block', minWidth: 10 }}>0</span>}
                                                            {showCount && display === 1 && renderedCountAtOne != null && (
                                                                <span
                                                                    style={{
                                                                        marginLeft: 6,
                                                                        fontWeight: 500,
                                                                        fontSize: '0.75em',
                                                                        color: colorScheme === 'dark' ? theme.colors.gray[4] : theme.colors.gray[6]
                                                                    }}
                                                                >
                                                                    {`${renderedCountAtOne}`}x
                                                                </span>
                                                            )}
                                                        </Text>
                                                    );
                                                })()}
                                            </Box>
                                        )}
                                        {showPlays && (
                                            <Box style={{ textAlign: 'center', flex: 1 }}>
                                                <Text size={scaleSize('xs')} c="dimmed">Plays</Text>
                                                <Text fw={700} size={scaleSize('sm')}>{formatNumber(row.plays as any)}</Text>
                                            </Box>
                                        )}
                                        {showTotalWeeks && (
                                            <Box style={{ textAlign: 'center', flex: 1 }}>
                                                <Text size={scaleSize('xs')} c="dimmed">Weeks</Text>
                                                {(() => {
                                                    const current = stats?.totals?.withinCutoff;
                                                    const stable = lastWeeksById[row.entityId];
                                                    const display = (current != null) ? current : (stable != null ? stable : undefined);
                                                    return (
                                                        <Text fw={700} size={scaleSize('sm')} style={{ transition: 'color 120ms ease' }}>
                                                            {display != null ? display : <span style={{ opacity: 0, display: 'inline-block', minWidth: 10 }}>0</span>}
                                                        </Text>
                                                    );
                                                })()}
                                            </Box>
                                        )}
                                    </Group>
                                )}
                            </Card>
                        </Grid.Col>
                    );
                })}
            </Grid>
            {showLoadingTail && (
                <Box py="sm" style={{ textAlign: 'center' }}>
                    <Text size="xs" c="dimmed">Carregando {visibleCards.length}/{progressive.total}…</Text>
                </Box>
            )}
            {/* Modal de imagem grande e edição */}
            <ImageEditModal
                opened={imageModalOpen}
                onClose={() => setImageModalOpen(false)}
                entityId={imageModalRow?.entityId || ''}
                name={imageModalRow?.name || ''}
                artistName={imageModalRow?.artistName || ''}
                imageUrl={imageModalUrl || ''}
                type={type === 'artist' || type === 'album' || type === 'track' ? type : 'artist'}
                clientId={clientId}
                clientSecret={clientSecret}
                onImageChange={url => {
                    setImageModalUrl(url);
                    if (imageModalRow?.entityId) {
                        setImageForceUpdate(fu => ({ ...fu, [imageModalRow.entityId]: (fu[imageModalRow.entityId] || 0) + 1 }));
                    }
                }}
            />
        </>
    );
};
