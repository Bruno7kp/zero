import React, { useEffect, useState } from 'react';
import { Stack, Group, Button, Paper, Drawer, SegmentedControl, Divider, Flex, Box, useMantineTheme, useMantineColorScheme } from '@mantine/core';
import { setPreset, selectResolvedBadge, resetAll } from '../store/badgeStylesSlice';
// Removed expand/collapse icons (no longer used)
import { useIsMobile } from '../hooks/useIsMobile';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { useTranslation } from 'react-i18next';
import { updateColumn, defaultColumns, resetColumns, setContainerSize, setRankVariationLocation, setPlaysVariationDisplay, setTableBackground, setListBackground } from '../store/columnsSlice';
import { IconSettings, IconCaretUpFilled } from '@tabler/icons-react';
import { BadgeStylePreview } from './badgeStyles/BadgeStylePreview';
// Advanced controls removed (only presets retained)

interface ChartWeekColumnsDrawerProps {
    viewType: 'table' | 'list' | 'grid';
    onColumnsChange?: (cols: any[]) => void;
}

export const ChartWeekColumnsDrawer: React.FC<ChartWeekColumnsDrawerProps> = ({ viewType, onColumnsChange }) => {
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
    const tableBackground = viewConfig?.settings?.tableBackground || 'default';
    const listBackground = viewConfig?.settings?.listBackground || 'default';
    // Default: 'under' for all view types (grid uses show/hide UI but mapped to 'under' internally when shown)
    const rankVariationLocation = viewConfig?.settings?.rankVariationLocation || 'under';
    const [opened, setOpened] = useState(false);
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

    // Garante altVariation registrada
    useEffect(() => {
        if (viewConfig && !columns.find((c: any) => c.key === 'altVariation')) {
            dispatch(updateColumn({ view: viewType, key: 'altVariation', visible: false }));
        }
    }, [columns, dispatch, viewConfig, viewType]);

    const columnsWithVisibility = defaultColumns.map((col: { key: string; label: string; labelComplete?: string; visible: boolean }) => {
        const reduxCol = columns.find((c: any) => c.key === col.key);
        return { ...col, visible: reduxCol ? reduxCol.visible : col.visible };
    });

    // Toggles agora são feitos inline em cada SegmentedControl

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
                dispatch(setPlaysVariationDisplay({ view: 'table', display: 'percent' }));
            } else if (viewType === 'list') {
                // list defaults: rank solidIcon, plays light
                dispatch(setPreset({ view: 'list', kind: 'rank', preset: 'solidIcon' }));
                dispatch(setPreset({ view: 'list', kind: 'plays', preset: 'light' }));
                dispatch(setRankVariationLocation({ view: 'list', location: 'column' }));
                dispatch(setPlaysVariationDisplay({ view: 'list', display: 'percent' }));
            } else if (viewType === 'grid') {
                // grid: rank solidIcon, plays hidden (but keep preset consistent)
                dispatch(setPreset({ view: 'grid', kind: 'rank', preset: 'solidIcon' }));
                dispatch(setPreset({ view: 'grid', kind: 'plays', preset: 'light' }));
                dispatch(setRankVariationLocation({ view: 'grid', location: 'under' }));
            }
        }, 0);
    };

    const handleContainerSize = (size: 'md' | 'lg' | 'xl' | '100%') => {
        if (viewConfig) dispatch(setContainerSize({ view: viewType, size }));
    };

    // Ordem agora definida diretamente na renderização das seções abaixo

    const viewTypeLabel = viewType === 'table' ? 'charts.tableView' : viewType === 'list' ? 'charts.listView' : 'charts.gridView';
    // Badge styles (fase inicial de UI - presets)
    const badgeStyles = useSelector((s: any) => s.badgeStyles);
    const resolvedRank = useSelector((s: any) => selectResolvedBadge(s, 'rank', viewType));
    const resolvedPlays = useSelector((s: any) => selectResolvedBadge(s, 'plays', viewType));
    // Regra: especiais (maximalist / maximalistLight) só aparecem se for rank E em coluna
    const currentRankLocation = (viewConfig?.settings?.rankVariationLocation || 'under');
    const [badgeKind, setBadgeKind] = useState<'rank' | 'plays'>('rank');
    // Especiais (maximalist) somente na Tabela (rank na coluna); nunca na Lista nem no Grid
    const allowSpecials = (badgeKind === 'rank') && viewType === 'table' && currentRankLocation === 'column';
    // Ordenação customizada para mostrar estilos básicos antes dos especiais
    const order = [
        'transparent','transparentIconOnly','transparentIcon',
        'light','lightIconOnly','lightIcon',
        'solid','solidIconOnly','solidIcon',
        'maximalist','maximalistLight'
    ];
    // (presetList removido - UI usa grupos diretos; validações permanecem via efeitos)
    const currentEntry = badgeStyles?.views?.[viewType]?.[viewType === 'grid' ? 'rank' : badgeKind] || { preset: 'light' };
    // Saneamento de preset inválido e ajuste para grid / regras de especiais
    useEffect(() => {
    const allValid = order;
        const migrateKind = (kind: 'rank'|'plays') => {
            const preset = badgeStyles?.views?.[viewType]?.[kind]?.preset;
            if (!preset) return;
            if (!allValid.includes(preset)) {
                dispatch(setPreset({ view: viewType, kind, preset: kind === 'rank' && viewType === 'grid' ? 'solidIcon' : (kind === 'rank' ? 'light' : 'transparent') }));
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
        if ((rankPreset === 'maximalist' || rankPreset === 'maximalistLight') && !allowSpecials) {
            dispatch(setPreset({ view: viewType, kind: 'rank', preset: 'light' }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allowSpecials, currentRankLocation, viewType]);

    // Avançado agora expande junto com a seção principal; removido segundo toggle
    // showAdvanced removido (sempre visível em modo custom)
    // Removido collapse: sempre visível

    return (
        <>
            <Button variant="subtle" size="xs" onClick={() => setOpened(true)}>
                <IconSettings size={16} />
            </Button>
                        <Drawer
                            opened={opened}
                            onClose={() => setOpened(false)}
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
                                            <Stack gap={6}>
                        {/* Seletor de tamanho do container (desktop apenas) */}
                        {!isMobile && (
                            <Stack gap={2}>
                                <Divider my={4} size="xl" label={t('charts.size')} />
                                <SegmentedControl
                                    fullWidth
                                    size="xs"
                                    value={containerSize}
                                    onChange={(v) => handleContainerSize(v as 'md' | 'lg' | 'xl' | '100%')}
                                    data={[
                                        { label: 'MD', value: 'md' },
                                        { label: 'LG', value: 'lg' },
                                        { label: 'XL', value: 'xl' },
                                        { label: '100%', value: '100%' }
                                    ]}
                                />
                                                                {viewType === 'table' && (
                                                                    <>
                                                                        <Divider my={4} variant="dashed" label={t('charts.tableBackgroundLabel')} />
                                                                        <SegmentedControl
                                                                            fullWidth
                                                                            size="xs"
                                                                            value={tableBackground}
                                                                            onChange={(v) => dispatch(setTableBackground({ background: v as 'default' | 'transparent' }))}
                                                                            data={[
                                                                                { label: t('charts.tableBackground_default'), value: 'default' },
                                                                                { label: t('charts.tableBackground_transparent'), value: 'transparent' }
                                                                            ]}
                                                                        />
                                                                    </>
                                                                )}
                                                                {viewType === 'list' && (
                                                                    <>
                                                                        <Divider my={4} variant="dashed" label={t('charts.listBackgroundLabel')} />
                                                                        <SegmentedControl
                                                                            fullWidth
                                                                            size="xs"
                                                                            value={listBackground}
                                                                            onChange={(v) => dispatch(setListBackground({ background: v as 'default' | 'transparent' }))}
                                                                            data={[
                                                                                { label: t('charts.listBackground_default'), value: 'default' },
                                                                                { label: t('charts.listBackground_transparent'), value: 'transparent' }
                                                                            ]}
                                                                        />
                                                                    </>
                                                                )}
                            </Stack>
                        )}
                        <Divider my={4} size="xl" label={t('charts.columns')} />
                        {/* Controles de colunas em grid 2 por linha */}
                        <Flex direction="column" gap={4}>
                            <Flex wrap="wrap" gap={8}>
                                {viewType !== 'grid' && (
                                    <Box style={{ flex: '1 1 calc(50% - 8px)', minWidth: 140 }}>
                                        <Divider my={4} variant="dashed" label={t('charts.imageLabel')} />
                                        <SegmentedControl
                                            fullWidth
                                            size="xs"
                                            value={columnsWithVisibility.find(c => c.key === 'image')?.visible ? 'show' : 'hide'}
                                            onChange={(v) => dispatch(updateColumn({ view: viewType, key: 'image', visible: v === 'show' }))}
                                            data={[{ label: t('charts.show'), value: 'show' }, { label: t('charts.hide'), value: 'hide' }]}
                                        />
                                    </Box>
                                )}
                                <Box style={{ flex: '1 1 calc(50% - 8px)', minWidth: 140 }}>
                                    <Divider my={4} variant="dashed" label={t('charts.playsLabel')} />
                                    <SegmentedControl
                                        fullWidth
                                        size="xs"
                                        value={columnsWithVisibility.find(c => c.key === 'plays')?.visible ? 'show' : 'hide'}
                                        onChange={(v) => dispatch(updateColumn({ view: viewType, key: 'plays', visible: v === 'show' }))}
                                        data={[{ label: t('charts.show'), value: 'show' }, { label: t('charts.hide'), value: 'hide' }]}
                                    />
                                </Box>
                                <Box style={{ flex: '1 1 calc(50% - 8px)', minWidth: 140 }}>
                                    <Divider my={4} variant="dashed" label={t('charts.peakLabel')} />
                                    <SegmentedControl
                                        fullWidth
                                        size="xs"
                                        value={columnsWithVisibility.find(c => c.key === 'peak')?.visible ? 'show' : 'hide'}
                                        onChange={(v) => dispatch(updateColumn({ view: viewType, key: 'peak', visible: v === 'show' }))}
                                        data={[{ label: t('charts.show'), value: 'show' }, { label: t('charts.hide'), value: 'hide' }]}
                                    />
                                </Box>
                                <Box style={{ flex: '1 1 calc(50% - 8px)', minWidth: 140 }}>
                                    <Divider my={4} variant="dashed" label={t('charts.weeksLabel')} />
                                    <SegmentedControl
                                        fullWidth
                                        size="xs"
                                        value={columnsWithVisibility.find(c => c.key === 'totalWeeks')?.visible ? 'show' : 'hide'}
                                        onChange={(v) => dispatch(updateColumn({ view: viewType, key: 'totalWeeks', visible: v === 'show' }))}
                                        data={[{ label: t('charts.show'), value: 'show' }, { label: t('charts.hide'), value: 'hide' }]}
                                    />
                                </Box>
                                {(viewType === 'table' || viewType === 'list') && (
                                    <Box style={{ flex: '1 1 calc(50% - 8px)', minWidth: 140 }}>
                                        <Divider my={4} variant="dashed" label={t('charts.certLabel')} />
                                        <SegmentedControl
                                            fullWidth
                                            size="xs"
                                            value={columnsWithVisibility.find(c => c.key === 'cert')?.visible ? 'show' : 'hide'}
                                            onChange={(v) => dispatch(updateColumn({ view: viewType, key: 'cert', visible: v === 'show' }))}
                                            data={[{ label: t('charts.show'), value: 'show' }, { label: t('charts.hide'), value: 'hide' }]}
                                        />
                                    </Box>
                                )}
                            </Flex>
                        </Flex>
                        <Divider my={4} size="xl" label={t('charts.badgeStyles.section')} />
                        {/* Exibição da variação de rank (sempre visível) */}
                        <Stack gap={2}>
                            <Divider my={4} variant="dashed" label={t('charts.rankVariationLocationLabel')} />
                            {viewType === 'grid' ? (
                                <SegmentedControl
                                    fullWidth
                                    size="xs"
                                    value={rankVariationLocation === 'hidden' ? 'hidden' : 'under'}
                                    onChange={(v) => dispatch(setRankVariationLocation({ view: viewType, location: (v === 'hidden' ? 'hidden' : 'under') }))}
                                    data={[
                                        { label: t('charts.show'), value: 'under' },
                                        { label: t('charts.hide'), value: 'hidden' }
                                    ]}
                                />
                            ) : (
                                <SegmentedControl
                                    fullWidth
                                    size="xs"
                                    value={rankVariationLocation}
                                    onChange={(v) => dispatch(setRankVariationLocation({ view: viewType, location: v as 'under' | 'column' | 'hidden' }))}
                                    data={[
                                        { label: t('charts.hide'), value: 'hidden' },
                                        { label: t('charts.rankVariationUnder'), value: 'under' },
                                        { label: t('charts.rankVariationColumn'), value: 'column' }
                                    ]}
                                />
                            )}
                        </Stack>
                        {/* Variação de reproduções (sempre visível quando não grid) */}
                        {viewType !== 'grid' && (
                            <Stack gap={2}>
                                <Divider my={4} variant="dashed" label={t('charts.playsVariationDisplayLabel')} />
                                <SegmentedControl
                                    size="xs"
                                    fullWidth
                                    value={(viewConfig?.settings as any)?.playsVariationDisplay || 'percent'}
                                    onChange={(value) => dispatch(setPlaysVariationDisplay({ view: viewType, display: value as 'hidden' | 'absolute' | 'percent' }))}
                                    data={[
                                        { label: t('charts.playsVariationDisplay_hidden'), value: 'hidden' },
                                        { label: t('charts.playsVariationDisplay_absolute'), value: 'absolute' },
                                        { label: t('charts.playsVariationDisplay_percent'), value: 'percent' },
                                    ]}
                                />
                            </Stack>
                        )}
                        <Divider my={4} size="xl" label={t('charts.badgeStyles.title')} />
                        <Stack gap={6}>
                            {viewType !== 'grid' && (
                                <SegmentedControl
                                    fullWidth
                                    size="xs"
                                    value={badgeKind}
                                    onChange={(v) => setBadgeKind(v as 'rank' | 'plays')}
                                    data={[{ label: t('charts.badgeStyles.kindRank'), value: 'rank' }, { label: t('charts.badgeStyles.kindPlays'), value: 'plays' }]} 
                                />
                            )}
                            {/* Presets agrupados: single seleção global (custom buttons) */}
                            {(() => {
                                const selected = currentEntry.preset;
                                const groups: string[][] = (
                                    viewType === 'grid'
                                        ? [['solid','solidIconOnly','solidIcon']]
                                        : [
                                            ['transparent','transparentIconOnly','transparentIcon'],
                                            ['light','lightIconOnly','lightIcon'],
                                            ['solid','solidIconOnly','solidIcon'],
                                            allowSpecials ? ['maximalist','maximalistLight'] : []
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
                      </Stack>
                    </Box>
                    <Divider my={6} />
                    <Group justify="space-between" px={4} pb={4} mt={4} style={{ flexShrink: 0 }}>
                        <Button variant="light" size="xs" onClick={handleReset}>{t('common.reset')}</Button>
                        <Button size="xs" onClick={() => setOpened(false)}>{t('common.close')}</Button>
                    </Group>
                </Paper>
            </Drawer>
        </>
    );
};
