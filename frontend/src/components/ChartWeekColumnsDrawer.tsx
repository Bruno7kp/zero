import React, { useEffect, useState } from 'react';
import { Group, Button, Paper, Drawer, Divider, Flex, Box, Accordion, Text, ActionIcon, Tooltip } from '@mantine/core';
import { setPreset, selectResolvedBadge, resetAll } from '../store/badgeStylesSlice';
import { useIsMobile } from '../hooks/useIsMobile';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { useTranslation } from 'react-i18next';
import { updateColumn, COLUMNS_DEFAULT_COLUMNS as defaultColumns, resetColumns, setContainerSize, setRankVariationLocation, setPlaysVariationDisplay, setTableBackground, setListBackground, setArtistDisplayMode, setPlaysVariationLocation, setPeakCountStyle, setFontScale, setListPeakWeeksCombined, setShowCarousel, setShowDroppedItems, setShowFormulaInsteadOfPlays } from '../store/columnsSlice';
import { IconSettings, IconLayoutGrid, IconColumns, IconArrowsUpDown, IconAdjustments } from '@tabler/icons-react';
import { LayoutSection } from './chartDrawer/LayoutSection';
import { ColumnsSection } from './chartDrawer/ColumnsSection';
import { VariationsSection } from './chartDrawer/VariationsSection';
import { BadgesSection } from './chartDrawer/BadgesSection';

interface ChartWeekColumnsDrawerProps {
    viewType: 'table' | 'list' | 'grid';
    onColumnsChange?: (cols: any[]) => void;
    opened?: boolean;
    onOpenedChange?: (opened: boolean) => void;
    hideTrigger?: boolean;
}

export const ChartWeekColumnsDrawer: React.FC<ChartWeekColumnsDrawerProps> = ({ viewType, onColumnsChange, opened, onOpenedChange, hideTrigger }) => {
    const { t } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();
    const isMobile = useIsMobile();
    // theme hooks not needed in parent after refactor
    const viewConfig = useSelector((state: RootState) => (state as any)?.columns?.views?.[viewType]);
    const columns = viewConfig?.columns || defaultColumns;
    const showCarousel = viewConfig?.settings?.showCarousel ?? false;
    const containerSize = viewConfig?.settings?.containerSize || (viewType === 'grid' ? 'xl' : 'md');
    const fontScale = (viewConfig?.settings as any)?.fontScale ?? 0;
    const tableBackground = viewConfig?.settings?.tableBackground || 'default';
    const listBackground = viewConfig?.settings?.listBackground || 'default';
    const listPeakWeeksCombined = (viewConfig?.settings as any)?.listPeakWeeksCombined || false;
    const showDroppedItems = (viewConfig?.settings as any)?.showDroppedItems || false;
    const showFormulaInsteadOfPlays = (viewConfig?.settings as any)?.showFormulaInsteadOfPlays || false;
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
                dispatch(setPreset({ view: 'grid', kind: 'rank', preset: 'transparentIconOnly' }));
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
            // Grid agora aceita transparent/light/solid variações; apenas especiais continuam restritas
            if (viewType === 'grid' && kind === 'rank') {
                const allowedGridRankPresets = [
                    'transparent','transparentIcon','transparentIconOnly',
                    'light','lightIcon','lightIconOnly',
                    'solid','solidIcon','solidIconOnly'
                ];
                if (!allowedGridRankPresets.includes(preset)) {
                    dispatch(setPreset({ view: viewType, kind, preset: 'transparentIconOnly' }));
                }
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
                            <Accordion.Item value="layout">
                                <Accordion.Control>
                                    <Flex direction="column" gap={2}>
                                        <Flex align="center" gap={8}><IconLayoutGrid size={16} /><Text fw={600}>{t('charts.general')}</Text></Flex>
                                        <Text size="xs" c="dimmed">{t('charts.drawer.generalDescription')}</Text>
                                    </Flex>
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <LayoutSection
                                        isMobile={isMobile}
                                        viewType={viewType}
                                        containerSize={containerSize as any}
                                        fontScale={fontScale as any}
                                        tableBackground={tableBackground as any}
                                        listBackground={listBackground as any}
                                        showDroppedItems={showDroppedItems}
                                        showCarousel={showCarousel}
                                        onContainerSizeChange={(v) => handleContainerSize(v as any)}
                                        onFontScaleChange={(v) => dispatch(setFontScale({ view: viewType, scale: v as any }))}
                                        onTableBackgroundChange={(v) => dispatch(setTableBackground({ background: v }))}
                                        onListBackgroundChange={(v) => dispatch(setListBackground({ background: v }))}
                                        onShowDroppedItemsChange={(v) => dispatch(setShowDroppedItems({ view: viewType, show: v }))}
                                        onShowCarouselChange={(v) => dispatch(setShowCarousel({ view: viewType, show: v }))}
                                    />
                                </Accordion.Panel>
                            </Accordion.Item>
                            {/* Colunas */}
                            <Accordion.Item value="columns">
                                <Accordion.Control>
                                    <Flex direction="column" gap={2}>
                                        <Flex align="center" gap={8}><IconColumns size={16} /><Text fw={600}>{t('charts.columns')}</Text></Flex>
                                        <Text size="xs" c="dimmed">{t('charts.drawer.columnsDescription')}</Text>
                                    </Flex>
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <ColumnsSection
                                        viewType={viewType}
                                        columnsWithVisibility={columnsWithVisibility}
                                        listPeakWeeksCombined={listPeakWeeksCombined}
                                        artistDisplayMode={artistDisplayMode}
                                        onToggleColumn={(key, visible) => dispatch(updateColumn({ view: viewType, key, visible }))}
                                        onToggleListPeakWeeksCombined={(combined) => dispatch(setListPeakWeeksCombined({ combined }))}
                                        onArtistDisplayModeChange={(mode) => dispatch(setArtistDisplayMode({ view: 'table', mode }))}
                                        peakMode={(columnsWithVisibility.find(c => c.key === 'peak')?.visible ? ((viewConfig?.settings?.peakCountStyle || 'noCount') === 'withCount' ? 'showWithCount' : 'show') : 'hide') as any}
                                        onPeakModeChange={(v) => {
                                            if (v === 'hide') {
                                                dispatch(updateColumn({ view: viewType, key: 'peak', visible: false }));
                                            } else {
                                                dispatch(updateColumn({ view: viewType, key: 'peak', visible: true }));
                                                dispatch(setPeakCountStyle({ view: viewType, mode: v === 'showWithCount' ? 'withCount' : 'noCount' }));
                                            }
                                        }}
                                        showFormulaInsteadOfPlays={showFormulaInsteadOfPlays}
                                        onToggleShowFormulaInsteadOfPlays={(show) => dispatch(setShowFormulaInsteadOfPlays({ view: viewType, show }))}
                                    />
                                </Accordion.Panel>
                            </Accordion.Item>
                            {/* Variações (rank + reproduções) */}
                            <Accordion.Item value="variations">
                                <Accordion.Control>
                                    <Flex direction="column" gap={2}>
                                        <Flex align="center" gap={8}><IconArrowsUpDown size={16} /><Text fw={600}>{t('charts.variations')}</Text></Flex>
                                        <Text size="xs" c="dimmed">{t('charts.drawer.variationDescription')}</Text>
                                    </Flex>
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <VariationsSection
                                        viewType={viewType}
                                        rankVariationLocation={rankVariationLocation as any}
                                        playsVariationLocation={playsVariationLocation as any}
                                        playsVariationDisplay={((viewConfig?.settings as any)?.playsVariationDisplay || 'percent') as any}
                                        onRankLocationChange={(loc) => dispatch(setRankVariationLocation({ view: viewType, location: loc as any }))}
                                        onPlaysLocationChange={(loc) => dispatch(setPlaysVariationLocation({ view: viewType as any, location: loc as any }))}
                                        onPlaysDisplayChange={(display) => dispatch(setPlaysVariationDisplay({ view: viewType as any, display }))}
                                    />
                                </Accordion.Panel>
                            </Accordion.Item>
                            {/* Badges */}
                            <Accordion.Item value="badges">
                                <Accordion.Control>
                                    <Flex direction="column" gap={2}>
                                        <Flex align="center" gap={8}><IconAdjustments size={16} /><Text fw={600}>{t('charts.badgeStyles.title')}</Text></Flex>
                                        <Text size="xs" c="dimmed">{t('charts.drawer.badgesDescription')}</Text>
                                    </Flex>
                                </Accordion.Control>
                                <Accordion.Panel>
                                    <BadgesSection
                                        viewType={viewType}
                                        allowKindSelect={viewType !== 'grid'}
                                        badgeKind={badgeKind}
                                        onBadgeKindChange={(k) => setBadgeKind(k)}
                                        selectedPreset={currentEntry.preset}
                                        allowSpecialsUI={allowSpecialsUI}
                                        onSelectPreset={(k) => dispatch(setPreset({ view: viewType, kind: (viewType === 'grid' ? 'rank' : badgeKind), preset: k }))}
                                        resolvedRank={resolvedRank}
                                        resolvedPlays={resolvedPlays}
                                    />
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
