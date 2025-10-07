import React, { useEffect, useState } from 'react';
import { Stack, Group, Button, Paper, Drawer, SegmentedControl, Divider, Flex, Box, useMantineTheme, useMantineColorScheme, Accordion, Text, ActionIcon, Tooltip } from '@mantine/core';
import { setPreset, selectResolvedBadge, resetAll } from '../store/badgeStylesSlice';
// Removed expand/collapse icons (no longer used)
import { useIsMobile } from '../hooks/useIsMobile';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { useTranslation } from 'react-i18next';
import { updateColumn, defaultColumns, resetColumns, setContainerSize, setRankVariationLocation, setPlaysVariationDisplay, setTableBackground, setListBackground, setArtistDisplayMode, setPlaysVariationLocation, setPeakCountStyle, setFontScale, setListPeakWeeksCombined } from '../store/columnsSlice';
import { IconSettings, IconCaretUpFilled, IconLayoutGrid, IconColumns, IconArrowsUpDown, IconAdjustments } from '@tabler/icons-react';
import { BadgeStylePreview } from './badgeStyles/BadgeStylePreview';
// Advanced controls removed (only presets retained)

interface ChartWeekColumnsDrawerProps {
    viewType: 'table' | 'list' | 'grid';
    onColumnsChange?: (cols: any[]) => void;
    // When provided, component becomes controlled. Useful to trigger the drawer from an external menu.
    opened?: boolean;
    onOpenedChange?: (opened: boolean) => void;
    // Hide the internal trigger ActionIcon (settings button)
    hideTrigger?: boolean;
}

export const ChartWeekColumnsDrawer: React.FC<ChartWeekColumnsDrawerProps> = ({ viewType, onColumnsChange, opened, onOpenedChange, hideTrigger }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const isMobile = useIsMobile();
    const { colorScheme } = useMantineColorScheme();
    const theme = useMantineTheme();
    // Centralized transient UI state (replaces per-item useState inside loops to satisfy Rules of Hooks)
    const [hoveredPreset, setHoveredPreset] = useState<string | null>(null);
    const [focusedPreset, setFocusedPreset] = useState<string | null>(null);
    const viewConfig = useSelector((state: RootState) => (state as any)?.columns?.views?.[viewType]);
    const columns = viewConfig?.columns || defaultColumns;
    const containerSize = viewConfig?.settings?.containerSize || (viewType === 'grid' ? 'xl' : 'md');
    const fontScale = (viewConfig?.settings as any)?.fontScale ?? 0;
    const tableBackground = viewConfig?.settings?.tableBackground || 'default';
    const listBackground = viewConfig?.settings?.listBackground || 'default';
    const listPeakWeeksCombined = (viewConfig?.settings as any)?.listPeakWeeksCombined || false;
    // Default: 'under' for all view types (grid uses show/hide UI but mapped to 'under' internally when shown)
    const rankVariationLocation = viewConfig?.settings?.rankVariationLocation || 'under';
    const playsVariationLocation = (viewConfig?.settings as any)?.playsVariationLocation || 'under';
    const [internalOpened, setInternalOpened] = useState(false);
    const isOpen = typeof opened === 'boolean' ? opened : internalOpened;
    const open = () => {
        if (onOpenedChange) onOpenedChange(true); else setInternalOpened(true);
    };
    const close = () => {
        if (onOpenedChange) onOpenedChange(false); else setInternalOpened(false);
    };
    // Colunas obrigatórias (rank, name) exibidas como sempre visíveis (badge), sem toggle

    const storageKey = `chart_columns_${viewType}`; // legado (ainda lido para migração leve se necessário)
    // Carrega config persistida
    useEffect(() => {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    parsed.forEach((col: any) => {
                        dispatch(updateColumn({ view: viewType, key: col.key, visible: col.visible }));
                    });
                    onColumnsChange?.(parsed);
                }
            } catch { /* noop */ }
        } else {
            localStorage.setItem(storageKey, JSON.stringify(columns));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewType]);

    // Persiste sempre que mudar
    useEffect(() => {
        localStorage.setItem(storageKey, JSON.stringify(columns));
        onColumnsChange?.(columns);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [columns]);

    // Garante altVariation registrada (legado)
    useEffect(() => {
        if (viewConfig && !columns.find((c: any) => c.key === 'altVariation')) {
            dispatch(updateColumn({ view: viewType, key: 'altVariation', visible: false }));
        }
    }, [columns, dispatch, viewConfig, viewType]);
    // Garante altPlaysVariation registrada (legado)
    useEffect(() => {
        if (viewConfig && !columns.find((c: any) => c.key === 'altPlaysVariation')) {
            dispatch(updateColumn({ view: viewType, key: 'altPlaysVariation', visible: false }));
        }
    }, [columns, dispatch, viewConfig, viewType]);

    const columnsWithVisibility = defaultColumns.map((col: { key: string; label: string; labelComplete?: string; visible: boolean }) => {
        const reduxCol = columns.find((c: any) => c.key === col.key);
        return { ...col, visible: reduxCol ? reduxCol.visible : col.visible };
    });
    const artistDisplayMode = (viewConfig?.settings as any)?.artistDisplayMode || 'under';

    const handleReset = () => {
        if (viewConfig) dispatch(resetColumns({ view: viewType }));
        // Reseta estilos globais e então aplica defaults específicos por view conforme solicitação
        dispatch(resetAll());
        // Delay no próximo tick para garantir que resetAll aplicou
        setTimeout(() => {
            if (viewType === 'table') {
                // rank: preset padrão (outline-> mapped to light), plays: minimalista -> transparent
                dispatch(setPreset({ view: 'table', kind: 'rank', preset: 'light' }));
                dispatch(setPreset({ view: 'table', kind: 'plays', preset: 'transparent' }));
                dispatch(setRankVariationLocation({ view: 'table', location: 'under' }));
                dispatch(setPlaysVariationLocation({ view: 'table', location: 'under' }));
                dispatch(setPlaysVariationDisplay({ view: 'table', display: 'percent' }));
            } else if (viewType === 'list') {
                // list defaults: rank solidIcon, plays light
                dispatch(setPreset({ view: 'list', kind: 'rank', preset: 'solidIcon' }));
                dispatch(setPreset({ view: 'list', kind: 'plays', preset: 'light' }));
                dispatch(setRankVariationLocation({ view: 'list', location: 'column' }));
                dispatch(setPlaysVariationLocation({ view: 'list', location: 'under' }));
                dispatch(setPlaysVariationDisplay({ view: 'list', display: 'percent' }));
            } else if (viewType === 'grid') {
                // grid: rank icon-only (default), plays light; variação sob o rank
                dispatch(setPreset({ view: 'grid', kind: 'rank', preset: 'solidIconOnly' }));
                dispatch(setPreset({ view: 'grid', kind: 'plays', preset: 'light' }));
                dispatch(setRankVariationLocation({ view: 'grid', location: 'under' }));
            }
        }, 0);
    };

    const handleContainerSize = (size: 'md' | 'lg' | 'xl' | '100%') => {
        if (viewConfig) dispatch(setContainerSize({ view: viewType, size }));
    };

    const viewTypeLabel = viewType === 'table' ? 'charts.tableView' : viewType === 'list' ? 'charts.listView' : 'charts.gridView';
    // Badge styles (fase inicial de UI - presets)
    const badgeStyles = useSelector((s: any) => s.badgeStyles);
    const resolvedRank = useSelector((s: any) => selectResolvedBadge(s, 'rank', viewType));
    const resolvedPlays = useSelector((s: any) => selectResolvedBadge(s, 'plays', viewType));
    // Regra: especiais (maximalist / maximalistLight) só aparecem se for rank E em coluna
    const currentRankLocation = (viewConfig?.settings?.rankVariationLocation || 'under');
    const [badgeKind, setBadgeKind] = useState<'rank' | 'plays'>('rank');
    // Especiais (maximalist) somente na Tabela (rank na coluna); nunca na Lista nem no Grid
    // Separar visibilidade na UI de validade no estado para não resetar quando alternar para 'plays'
    const specialsAllowedForRank = (viewType === 'table' && currentRankLocation === 'column');
    const allowSpecialsUI = (badgeKind === 'rank') && specialsAllowedForRank;
    // Ordenação customizada para mostrar estilos básicos antes dos especiais
    const order = [
        'transparent','transparentIconOnly','transparentIcon',
        'light','lightIconOnly','lightIcon',
        'solid','solidIconOnly','solidIcon',
        'maximalist','maximalistLight'
    ];
    const currentEntry = badgeStyles?.views?.[viewType]?.[viewType === 'grid' ? 'rank' : badgeKind] || { preset: 'light' };
    // Saneamento de preset inválido e ajuste para grid / regras de especiais
    useEffect(() => {
        const allValid = order;
        const migrateKind = (kind: 'rank'|'plays') => {
            const preset = badgeStyles?.views?.[viewType]?.[kind]?.preset;
            if (!preset) return;
            if (!allValid.includes(preset)) {
                dispatch(setPreset({ view: viewType, kind, preset: kind === 'rank' && viewType === 'grid' ? 'solidIconOnly' : (kind === 'rank' ? 'light' : 'transparent') }));
                return;
            }
            // Grid aceita presets sólidos, incluindo "apenas ícone"
            if (viewType === 'grid' && kind === 'rank' && !['solid','solidIcon','solidIconOnly'].includes(preset)) {
                dispatch(setPreset({ view: viewType, kind, preset: 'solidIconOnly' }));
            }
            // Invalida especiais fora da condição (badgeKind rank, location column, not grid)
            if (kind === 'rank' && (preset === 'maximalist' || preset === 'maximalistLight')) {
                const loc = currentRankLocation;
                // Só permitido em Tabela com variação na coluna
                if (!(viewType === 'table' && loc === 'column')) {
                    dispatch(setPreset({ view: viewType, kind, preset: 'light' }));
                }
            }
        };
        migrateKind('rank');
        migrateKind('plays');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [badgeStyles?.views?.[viewType]?.rank?.preset, badgeStyles?.views?.[viewType]?.plays?.preset, viewType, currentRankLocation]);

    // Se o usuário mudar a localização de variação para algo que invalida especiais, força fallback imediato
    useEffect(() => {
        const rankPreset = badgeStyles?.views?.[viewType]?.rank?.preset;
        if ((rankPreset === 'maximalist' || rankPreset === 'maximalistLight') && !specialsAllowedForRank) {
            dispatch(setPreset({ view: viewType, kind: 'rank', preset: 'light' }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [specialsAllowedForRank, currentRankLocation, viewType]);

    return (
        <>
            {!hideTrigger && (
                <Tooltip label={t('charts.columnsConfig')}>
                    <ActionIcon variant="subtle" onClick={open} aria-label={t('charts.columnsConfig')}>
                        <IconSettings size={18} />
                    </ActionIcon>
                </Tooltip>
            )}
            <Drawer
                opened={isOpen}
                onClose={close}
                position="right"
                size="md"
                withCloseButton={false}
                overlayProps={{ opacity: 0 }}
                title={`${t('charts.columnsConfig')}: ${t(viewTypeLabel)}`}
                styles={{
                    content: {
                        boxShadow: '0 0 16px 0 rgba(0,0,0,0.15)',
                        padding: 0,
                        display: 'flex',
                        flexDirection: 'column'
                    },
                    header: {
                        justifyContent: 'center'
                    },
                    title: {
                        width: '100%',
                        textAlign: 'center'
                    },
                    body: {
                        padding: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                        minHeight: 0
                    }
                }}
            >
                <Paper p="sm" radius={0} style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
                    <Box style={{ flex: 1, minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain' }}>
                        <Accordion multiple variant="separated" radius="md">
                            {/* Layout */}
                            {!isMobile && (
                                <Accordion.Item value="layout">
                                    <Accordion.Control>
                                        <Flex direction="column" gap={2}>
                                            <Flex align="center" gap={8}><IconLayoutGrid size={16} /><Text fw={700}>{t('charts.general')}</Text></Flex>
                                            <Text size="xs" c="dimmed">{t('charts.drawer.generalDescription')}</Text>
                                        </Flex>
                                    </Accordion.Control>
                                    <Accordion.Panel>
                                        <Stack gap={6}>
                                            <Stack gap={2}>
                                                <Text size="xs" c="dimmed">{t('charts.containerSizeLabel')}</Text>
                                                <SegmentedControl fullWidth size="xs" value={containerSize} onChange={(v) => handleContainerSize(v as 'md' | 'lg' | 'xl' | '100%')} data={[{ label: 'MD', value: 'md' },{ label: 'LG', value: 'lg' },{ label: 'XL', value: 'xl' },{ label: '100%', value: '100%' }]} />
                                            </Stack>
                                            <Stack gap={2}>
                                                <Text size="xs" c="dimmed">{t('charts.fontScaleLabel') || 'Font size'}</Text>
                                                <SegmentedControl
                                                    fullWidth
                                                    size="xs"
                                                    value={String(fontScale)}
                                                    onChange={(v) => dispatch(setFontScale({ view: viewType, scale: Number(v) as any }))}
                                                    data={[
                                                        { label: 'A-', value: '-1' },
                                                        { label: 'A', value: '0' },
                                                        { label: 'A+', value: '1' }
                                                    ]}
                                                />
                                            </Stack>
                                            {viewType === 'table' && (
                                                <Stack gap={2}>
                                                    <Text size="xs" c="dimmed">{t('charts.tableBackgroundLabel')}</Text>
                                                    <SegmentedControl fullWidth size="xs" value={tableBackground} onChange={(v) => dispatch(setTableBackground({ background: v as 'default' | 'transparent' }))} data={[{ label: t('charts.tableBackground_default'), value: 'default' },{ label: t('charts.tableBackground_transparent'), value: 'transparent' }]} />
                                                </Stack>
                                            )}
                                            {viewType === 'list' && (
                                                <Stack gap={2}>
                                                    <Text size="xs" c="dimmed">{t('charts.listBackgroundLabel')}</Text>
                                                    <SegmentedControl fullWidth size="xs" value={listBackground} onChange={(v) => dispatch(setListBackground({ background: v as 'default' | 'transparent' }))} data={[{ label: t('charts.listBackground_default'), value: 'default' },{ label: t('charts.listBackground_transparent'), value: 'transparent' }]} />
                                                </Stack>
                                            )}
                                        </Stack>
                                    </Accordion.Panel>
                                </Accordion.Item>
                            )}
                            {/* Colunas */}
                            <Accordion.Item value="columns">
                                <Accordion.Control>
                                    <Flex direction="column" gap={2}>
                                        <Flex align="center" gap={8}><IconColumns size={16} /><Text fw={700}>{t('charts.columns')}</Text></Flex>
                                        <Text size="xs" c="dimmed">{t('charts.drawer.columnsDescription')}</Text>
                                    </Flex>
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <Flex direction="column" gap={4}>
                                        <Flex wrap="wrap" gap={8}>
                                            {viewType !== 'grid' && (
                                                <Box style={{ flex: '1 1 calc(50% - 8px)', minWidth: 140 }}>
                                                    <Text size="xs" c="dimmed">{t('charts.imageLabel')}</Text>
                                                    <SegmentedControl fullWidth size="xs" value={columnsWithVisibility.find(c => c.key === 'image')?.visible ? 'show' : 'hide'} onChange={(v) => dispatch(updateColumn({ view: viewType, key: 'image', visible: v === 'show' }))} data={[{ label: t('charts.show'), value: 'show' }, { label: t('charts.hide'), value: 'hide' }]} />
                                                </Box>
                                            )}
                                            {viewType === 'list' && (
                                                <Box style={{ flex: '1 1 calc(50% - 8px)', minWidth: 140 }}>
                                                    <Text size="xs" c="dimmed">{t('charts.listPeakWeeksCombinedLabel') || 'Peak + Weeks layout (list only)'}</Text>
                                                    <SegmentedControl
                                                        fullWidth
                                                        size="xs"
                                                        value={listPeakWeeksCombined ? 'combined' : 'separate'}
                                                        onChange={(v) => dispatch(setListPeakWeeksCombined({ combined: v === 'combined' }))}
                                                        data={[
                                                            { label: t('charts.listPeakWeeksCombined_separate') || 'Separate', value: 'separate' },
                                                            { label: t('charts.listPeakWeeksCombined_combined') || 'Combined', value: 'combined' }
                                                        ]}
                                                    />
                                                </Box>
                                            )}
                                            <Box style={{ flex: '1 1 calc(50% - 8px)', minWidth: 140 }}>
                                                <Text size="xs" c="dimmed">{t('charts.playsLabel')}</Text>
                                                <SegmentedControl fullWidth size="xs" value={columnsWithVisibility.find(c => c.key === 'plays')?.visible ? 'show' : 'hide'} onChange={(v) => dispatch(updateColumn({ view: viewType, key: 'plays', visible: v === 'show' }))} data={[{ label: t('charts.show'), value: 'show' }, { label: t('charts.hide'), value: 'hide' }]} />
                                            </Box>
                                            <Box style={{ flex: '1 1 calc(50% - 8px)', minWidth: 140 }}>
                                                <Text size="xs" c="dimmed">{t('charts.peakLabel')}</Text>
                                                <SegmentedControl
                                                    fullWidth
                                                    size="xs"
                                                    value={(columnsWithVisibility.find(c => c.key === 'peak')?.visible ? ((viewConfig?.settings?.peakCountStyle || 'noCount') === 'withCount' ? 'showWithCount' : 'show') : 'hide') as any}
                                                    onChange={(v) => {
                                                        if (v === 'hide') {
                                                            dispatch(updateColumn({ view: viewType, key: 'peak', visible: false }));
                                                        } else {
                                                            dispatch(updateColumn({ view: viewType, key: 'peak', visible: true }));
                                                            dispatch(setPeakCountStyle({ view: viewType, mode: v === 'showWithCount' ? 'withCount' : 'noCount' }));
                                                        }
                                                    }}
                                                    data={[
                                                        { label: t('charts.peakShowWithCount'), value: 'showWithCount' },
                                                        { label: t('charts.show'), value: 'show' },
                                                        { label: t('charts.hide'), value: 'hide' }
                                                    ]}
                                                />
                                            </Box>
                                            <Box style={{ flex: '1 1 calc(50% - 8px)', minWidth: 140 }}>
                                                <Text size="xs" c="dimmed">{t('charts.weeksLabel')}</Text>
                                                <SegmentedControl fullWidth size="xs" value={columnsWithVisibility.find(c => c.key === 'totalWeeks')?.visible ? 'show' : 'hide'} onChange={(v) => dispatch(updateColumn({ view: viewType, key: 'totalWeeks', visible: v === 'show' }))} data={[{ label: t('charts.show'), value: 'show' }, { label: t('charts.hide'), value: 'hide' }]} />
                                            </Box>
                                            {viewType === 'table' && (
                                                <Box style={{ flex: '1 1 calc(50% - 8px)', minWidth: 140 }}>
                                                    <Text size="xs" c="dimmed">{t('charts.artistDisplayModeLabel')}</Text>
                                                    <SegmentedControl
                                                        fullWidth
                                                        size="xs"
                                                        value={artistDisplayMode}
                                                        onChange={(v) => dispatch(setArtistDisplayMode({ view: 'table', mode: v as 'under' | 'column' }))}
                                                        data={[
                                                            { label: t('charts.artistDisplay_separateColumn'), value: 'column' },
                                                            { label: t('charts.artistDisplay_underTitle'), value: 'under' },
                                                        ]}
                                                    />
                                                </Box>
                                            )}
                                            {(viewType === 'table' || viewType === 'list') && (
                                                <Box style={{ flex: '1 1 calc(50% - 8px)', minWidth: 140 }}>
                                                    <Text size="xs" c="dimmed">{t('charts.certLabel')}</Text>
                                                    <SegmentedControl fullWidth size="xs" value={columnsWithVisibility.find(c => c.key === 'cert')?.visible ? 'show' : 'hide'} onChange={(v) => dispatch(updateColumn({ view: viewType, key: 'cert', visible: v === 'show' }))} data={[{ label: t('charts.show'), value: 'show' }, { label: t('charts.hide'), value: 'hide' }]} />
                                                </Box>
                                            )}
                                        </Flex>
                                    </Flex>
                                </Accordion.Panel>
                            </Accordion.Item>
                            {/* Variações (rank + reproduções) */}
                            <Accordion.Item value="variations">
                                <Accordion.Control>
                                    <Flex direction="column" gap={2}>
                                        <Flex align="center" gap={8}><IconArrowsUpDown size={16} /><Text fw={700}>{t('charts.variations')}</Text></Flex>
                                        <Text size="xs" c="dimmed">{t('charts.drawer.variationDescription')}</Text>
                                    </Flex>
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <Stack gap={8}>
                                        <Text size="xs" c="dimmed">{t('charts.rankVariationLocationLabel')}</Text>
                                        {viewType === 'grid' ? (
                                            <SegmentedControl fullWidth size="xs" value={rankVariationLocation} onChange={(v) => dispatch(setRankVariationLocation({ view: viewType, location: v as any }))} data={[{ label: t('charts.hide'), value: 'hidden' },{ label: t('charts.rankVariationUnder'), value: 'under' },{ label: t('charts.rankVariationCorner'), value: 'corner' }]} />
                                        ) : (
                                            <SegmentedControl fullWidth size="xs" value={rankVariationLocation} onChange={(v) => dispatch(setRankVariationLocation({ view: viewType, location: v as 'under' | 'column' | 'hidden' }))} data={[{ label: t('charts.hide'), value: 'hidden' },{ label: t('charts.rankVariationUnder'), value: 'under' },{ label: t('charts.rankVariationColumn'), value: 'column' }]} />
                                        )}
                                        {viewType !== 'grid' && (
                                            <>
                                                {/* Nova opção: localização da variação de reproduções */}
                                                <Text size="xs" c="dimmed">{t('charts.playsVariationLocationLabel')}</Text>
                                                <SegmentedControl
                                                    fullWidth
                                                    size="xs"
                                                    value={playsVariationLocation}
                                                    onChange={(v) => dispatch(setPlaysVariationLocation({ view: viewType as any, location: v as 'hidden' | 'under' | 'column' }))}
                                                    data={[
                                                        { label: t('charts.hide'), value: 'hidden' },
                                                        { label: t('charts.playsVariationUnder'), value: 'under' },
                                                        { label: t('charts.playsVariationColumn'), value: 'column' },
                                                    ]}
                                                />
                                                <Text size="xs" c="dimmed">{t('charts.playsVariationDisplayLabel')}</Text>
                                                {playsVariationLocation !== 'hidden' && (
                                                    <SegmentedControl
                                                        size="xs"
                                                        fullWidth
                                                        value={(() => {
                                                            const disp = (viewConfig?.settings as any)?.playsVariationDisplay || 'percent';
                                                            return disp === 'hidden' ? 'percent' : disp;
                                                        })()}
                                                        onChange={(value) => dispatch(setPlaysVariationDisplay({ view: viewType as any, display: value as 'absolute' | 'percent' }))}
                                                        data={[
                                                            { label: t('charts.playsVariationDisplay_absolute'), value: 'absolute' },
                                                            { label: t('charts.playsVariationDisplay_percent'), value: 'percent' },
                                                        ]}
                                                    />
                                                )}
                                            </>
                                        )}
                                    </Stack>
                                </Accordion.Panel>
                            </Accordion.Item>
                            {/* Badges */}
                            <Accordion.Item value="badges">
                                <Accordion.Control>
                                    <Flex direction="column" gap={2}>
                                        <Flex align="center" gap={8}><IconAdjustments size={16} /><Text fw={700}>{t('charts.badgeStyles.title')}</Text></Flex>
                                        <Text size="xs" c="dimmed">{t('charts.drawer.badgesDescription')}</Text>
                                    </Flex>
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <Stack gap={6}>
                            {viewType !== 'grid' && (
                                <>
                                    <Text size="xs" c="dimmed">{t('charts.badgeStyles.kindSelectLabel')}</Text>
                                    <SegmentedControl
                                        fullWidth
                                        size="xs"
                                        value={badgeKind}
                                        onChange={(v) => setBadgeKind(v as 'rank' | 'plays')}
                                        data={[{ label: t('charts.badgeStyles.kindRank'), value: 'rank' }, { label: t('charts.badgeStyles.kindPlays'), value: 'plays' }]} 
                                    />
                                </>
                            )}
                            {/* Presets agrupados: single seleção global (custom buttons) */}
                            <Text size="xs" c="dimmed">{t('charts.badgeStyles.presetsTitle')}</Text>
                            {(() => {
                                const selected = currentEntry.preset;
                                const groups: string[][] = (
                                    viewType === 'grid'
                                        ? [['solid','solidIconOnly','solidIcon']]
                                        : [
                                            ['transparent','transparentIconOnly','transparentIcon'],
                                            ['light','lightIconOnly','lightIcon'],
                                            ['solid','solidIconOnly','solidIcon'],
                                            allowSpecialsUI ? ['maximalist','maximalistLight'] : []
                                        ].filter(g => g.length)
                                );
                                const presetVisualLabel = (k: string) => {
                                    const baseKey = k.startsWith('transparent') ? 'transparent' : k.startsWith('light') ? 'light' : k.startsWith('solid') ? 'solid' : k;
                                    const rawText = t(`charts.badgeStyles.preset_${baseKey}` as any);
                                    const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
                                    const baseText = cap(rawText);
                                    if (baseKey === 'maximalist') {
                                        return <Flex align="center" justify="center" style={{ width: '100%' }}>{cap(rawText)}</Flex>;
                                    }
                                    if (k.endsWith('IconOnly')) {
                                        return <Flex align="center" justify="center" style={{ width: '100%' }}><IconCaretUpFilled size={12} /></Flex>;
                                    }
                                    if (k.endsWith('Icon')) {
                                        return <Flex align="center" gap={4} justify="center" style={{ width: '100%' }}><IconCaretUpFilled size={12} /> <span>{baseText}</span></Flex>;
                                    }
                                    return <Flex align="center" justify="center" style={{ width: '100%' }}>{baseText}</Flex>;
                                };
                                // Segmented-like styling
                                // Theme-specific palette adjustments:
                                // Dark: track more dark, hover equals active (as requested), active stands out but still subtle.
                                // Light: track just a slightly lighter tone than surrounding, hover one step higher, active white.
                                const trackBg = colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[1];
                                const activeBg = colorScheme === 'dark' ? theme.colors.dark[4] : theme.white;
                                const activeColor = colorScheme === 'dark' ? theme.white : theme.black;
                                const inactiveColor = colorScheme === 'dark' ? theme.colors.gray[4] : theme.colors.dark[6];
                                const hoverInactiveBg = colorScheme === 'dark' ? activeBg : theme.colors.gray[2];
                                const focusRing = theme.colors.blue[5];
                                const segmentStyle = (active: boolean, hovered: boolean, focused: boolean): React.CSSProperties => ({
                                    flex: 1,
                                    cursor: 'pointer',
                                    padding: '4px 10px',
                                    fontSize: 11,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 4,
                                    fontWeight: 600,
                                    background: active ? activeBg : (hovered ? hoverInactiveBg : 'transparent'),
                                    color: active ? activeColor : inactiveColor,
                                    borderRadius: 999,
                                    userSelect: 'none',
                                    transition: 'background .12s ease, color .12s ease, box-shadow .12s ease',
                                    minWidth: 0,
                                    outline: 'none',
                                    boxShadow: focused ? `0 0 0 2px ${focusRing}` : 'none'
                                });
                                return (
                                    <Stack gap={8}>
                                        {groups.map((g,i) => (
                                            <Flex key={i} direction="column" style={{ width: '100%' }}>
                                                <Flex
                                                    style={{
                                                        width: '100%',
                                                        background: trackBg,
                                                        borderRadius: 999,
                                                        padding: 2,
                                                        gap: 2
                                                    }}
                                                >
                                                    {g.map((k) => {
                                                        const active = k === selected;
                                                        const hovered = hoveredPreset === k;
                                                        const focused = focusedPreset === k;
                                                        return (
                                                            <Box
                                                                key={k}
                                                                style={segmentStyle(active, hovered, focused)}
                                                                onClick={() => dispatch(setPreset({ view: viewType, kind: (viewType === 'grid' ? 'rank' : badgeKind), preset: k }))}
                                                                onMouseEnter={() => setHoveredPreset(k)}
                                                                onMouseLeave={() => setHoveredPreset(prev => prev === k ? null : prev)}
                                                                onFocus={() => setFocusedPreset(k)}
                                                                onBlur={() => setFocusedPreset(prev => prev === k ? null : prev)}
                                                                role="button"
                                                                aria-pressed={active}
                                                                tabIndex={0}
                                                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dispatch(setPreset({ view: viewType, kind: (viewType === 'grid' ? 'rank' : badgeKind), preset: k })); } }}
                                                            >
                                                                {presetVisualLabel(k)}
                                                            </Box>
                                                        );
                                                    })}
                                                </Flex>
                                            </Flex>
                                        ))}
                                    </Stack>
                                );
                            })()}
                            <Flex justify="center" mb="lg">
                                <BadgeStylePreview kind={viewType === 'grid' ? 'rank' : badgeKind} rankCfg={resolvedRank} playsCfg={resolvedPlays} />
                            </Flex>
                                    </Stack>
                                </Accordion.Panel>
                            </Accordion.Item>
                        </Accordion>
                    </Box>
                    <Divider my={6} />
                    <Group justify="space-between" px={4} pb={4} mt={4} style={{ flexShrink: 0 }}>
                        <Button variant="light" size="xs" onClick={handleReset}>{t('common.resetToDefault')}</Button>
                        <Button size="xs" onClick={close}>{isMobile ? t('common.closeAndSave') : t('common.close')}</Button>
                    </Group>
                </Paper>
            </Drawer>
        </>
    );
};
