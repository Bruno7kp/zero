import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import { fetchChartData, fetchStatsMapIncremental, computeWeekDeltas } from '../store/chartsSlice';
import { useProgressiveReveal } from '../hooks/useProgressiveReveal';
import { Card, Flex, Text, Collapse, ActionIcon, Box, Divider, useMantineTheme, useMantineColorScheme } from '@mantine/core';
import { DeltaBadge } from './DeltaBadge';
import { selectResolvedBadge } from '../store/badgeStylesSlice';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { SpotifyImageWithModal } from './SpotifyImageWithModal';
import type { ChartData } from '../db/indexedDb';
import { ChartItemStatsLoader } from './ChartItemStatsLoader';
import { CertificationIcon } from './CertificationIcon';

interface ChartWeekListProps {
  chart: any;
  week?: string;
  type: string;
  altVariation?: (row: ChartData, index: number) => string | number | false | null | undefined;
  clientId: string;
  clientSecret: string;
}


// Componente de linha memoizado para minimizar rerenders quando statsMap parcial é atualizado
const ChartWeekListRow: React.FC<{
  row: ChartData;
  idx: number;
  filteredColumns: any[];
  chart: any;
  showDeltaBadge: boolean;
  showDeltaPlaysBadge: boolean;
  showDeltaPercentPlaysBadge: boolean;
  showAltVariationRedux: boolean;
  showImage: boolean;
  altVariation?: (row: ChartData, index: number) => string | number | false | null | undefined;
  type: string;
  clientId: string;
  clientSecret: string;
  colorScheme: string;
  theme: any;
  week?: string;
}> = React.memo(({ row, idx, filteredColumns, chart, showDeltaBadge, showDeltaPlaysBadge, showDeltaPercentPlaysBadge, showAltVariationRedux, showImage, altVariation, type, clientId, clientSecret, colorScheme, theme, week }) => {
  const stats = useSelector((state: any) => state.charts.statsMap[row.entityId]);
  const loadingStats = useSelector((state: any) => state.charts.loadingStats);
  const badgeStylesRank = useSelector((s: any) => selectResolvedBadge(s, 'rank', 'list'));
  const badgeStylesPlays = useSelector((s: any) => selectResolvedBadge(s, 'plays', 'list'));
  const [expanded, setExpanded] = useState(false);
  const [imageForceUpdate, setImageForceUpdate] = useState<number>(0);
  const [lastImageUrl, setLastImageUrl] = useState<string | null>(null);

  const toggle = useCallback(() => setExpanded(e => !e), []);
  const rowId = String(row.id);

  return (
    <Card key={rowId} shadow="md" p={0} radius="md" style={{ background: colorScheme === 'dark' ? theme.colors.dark[7] : 'white' }}>
      <Flex align="stretch" gap="md" px="md" wrap="nowrap" style={{ height: 72 }}>
        <Flex align="center" gap="md" wrap="wrap" style={{ flex: 1 }}>
          {filteredColumns.map((col: any) => {
            if (col.key === 'rank') {
              return (
                <Flex key={col.key} direction="column" align="center" style={{ minWidth: 48, maxWidth: 48, flex: '0 0 48px' }}>
                  <Text fw={700} size="xl" c={row.rank === 1 ? 'blue' : undefined}>{row.rank}</Text>
                  {showDeltaBadge && <DeltaBadge delta={row.deltaRank} cfg={badgeStylesRank} kind="rank" textSize="xs" columnContext contextView="list" />}
                </Flex>
              );
            }
            if (col.key === 'plays') {
              return (
                <Flex key={col.key} direction="column" align="center" mr="sm" style={{ minWidth: 72, maxWidth: 72, flex: '0 0 72px' }}>
                  <Text fw={700} size="xl">{row.plays}</Text>
                  {(showDeltaPlaysBadge || showDeltaPercentPlaysBadge) && <DeltaBadge delta={row.deltaPlays} cfg={badgeStylesPlays} kind="plays" showPercent={showDeltaPercentPlaysBadge} currentValue={row.plays} textSize="xs" columnContext contextView="list" />}
                </Flex>
              );
            }
            if (col.key === 'name') {
              return (
                <Flex key={col.key} direction="row" align="center" style={{ flex: 1, minWidth: 0 }}>
                  {showImage && (
                    <SpotifyImageWithModal
                      entityId={row.entityId}
                      name={row.name}
                      artistName={row.artistName}
                      type={type as 'artist' | 'album' | 'track'}
                      clientId={clientId}
                      clientSecret={clientSecret}
                      forceUpdate={imageForceUpdate}
                      width={72}
                      height={72}
                      borderRadius={0}
                      style={{ minWidth: 72, maxWidth: 72 }}
                      lastImageUrl={lastImageUrl}
                      onImageChange={() => {
                        // Force update counter
                        setImageForceUpdate(f => f + 1);
                      }}
                      onImageLoad={(url: string) => {
                        if (row.entityId && url && lastImageUrl !== url) setLastImageUrl(url);
                      }}
                    />
                  )}
                  <Flex direction="column" align="flex-start" ml="sm" style={{ justifyContent: 'center', height: '100%', flex: 1, minWidth: 0 }}>
                    <Text fw={700} size="lg" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{row.name}</Text>
                    {row.artistName && <Text size="sm" style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{row.artistName}</Text>}
                  </Flex>
                </Flex>
              );
            }
            if (col.key === 'peak') {
              const peakVal = stats?.peak?.position ?? '-';
              return (
                <Flex key={col.key} direction="column" align="center" mr="sm" style={{ minWidth: 48, maxWidth: 48, flex: '0 0 48px' }}>
                  <Text fw={700} size="xl" c={peakVal === 1 ? 'blue' : undefined}>{stats ? peakVal : (loadingStats ? '…' : '-')}</Text>
                </Flex>
              );
            }
            if (col.key === 'cert' && type !== 'artist') {
              return (
                <Flex key={col.key} direction="column" align="center" mr="sm" style={{ minWidth: 48, maxWidth: 48, flex: '0 0 48px' }}>
                  {(type === 'album' || type === 'track') && (stats
                    ? <CertificationIcon
                        chart={chart}
                        chartType={type as 'album' | 'track'}
                        totals={stats?.totals}
                        entity={{ name: row.name, artistName: row.artistName || '' }}
                        username={chart?.lastfm_username}
                        dayOfWeek={chart?.day_of_week}
                        size={24}
                        deferMs={450}
                      />
                    : (loadingStats ? <Text fw={700} size="xl">…</Text> : <Text fw={700} size="xl">-</Text>))}
                </Flex>
              );
            }
            if (col.key === 'totalWeeks') {
              const totalWeeks = stats?.totals?.withinCutoff ?? '-';
              return (
                <Flex key={col.key} direction="column" align="center" mr="sm" style={{ minWidth: 48, maxWidth: 48, flex: '0 0 48px' }}>
                  <Text fw={700} size="xl">{stats ? totalWeeks : (loadingStats ? '…' : '-')}</Text>
                </Flex>
              );
            }
            if (col.key === 'altVariation' && showAltVariationRedux) {
              const value: any = altVariation ? altVariation(row, idx) : false;
              if (!value && value !== 0) return null;
              let cfg: any = badgeStylesRank;
              if (badgeStylesRank.iconPosition === 'split') {
                cfg = { ...badgeStylesRank, iconPosition: 'split', splitTall: badgeStylesRank.splitTall !== false };
              } else if (badgeStylesRank.iconPosition === 'hidden') {
                cfg = { ...badgeStylesRank, iconPosition: 'hidden', splitTall: false };
              } else {
                cfg = { ...badgeStylesRank, splitTall: false };
              }
              // Alt variation as its own column-like block -> use larger font size
              return <DeltaBadge delta={value} cfg={cfg} kind="rank" textSize="md" columnContext noSidePadding contextView="list" />;
            }
            return null;
          })}
          <ActionIcon variant="subtle" onClick={toggle}>
            {expanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
          </ActionIcon>
        </Flex>
      </Flex>
      <Collapse in={expanded} p={0}>
        {expanded && (
          <>
            <Divider size="xs" />
            <Box p={0}>
              <ChartItemStatsLoader chartId={row.chartId} chartType={row.chartType} entityId={row.entityId} week={week} />
            </Box>
          </>
        )}
      </Collapse>
  </Card>
  )
});

// renderStyledBadge removed (use DeltaBadge)

export const ChartWeekList: React.FC<ChartWeekListProps> = ({ chart, week, type, altVariation, clientId, clientSecret }) => {
  const dispatch = useDispatch<AppDispatch>();
  const data = useSelector((state: any) => state.charts.data);
  const columns = useSelector((state: any) => (state.columns?.views?.list?.columns) || state.columns?.columns || []);
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  // Buscar dados ao trocar semana/tipo/chart
  useEffect(() => {
    if (!week || !chart?.id) return;
    dispatch(fetchChartData({ chartId: `${chart.id}`, chartType: type, week }));
  }, [chart?.id, week, type, dispatch]);

  useEffect(() => {
    if (!data.length || !week || !chart?.id) return;
    dispatch(computeWeekDeltas({ chartId: `${chart.id}`, chartType: type, week, rows: data }));
  }, [data, week, chart?.id, type, dispatch]);

  // Stats diferidos: só agenda se colunas que dependem de stats estiverem visíveis (peak/totalWeeks/cert; ignore cert for artist charts)
  useEffect(() => {
    if (!data.length || !week || !chart?.id) return;
    const wantsStats = columns.some((c: any) => (
      (c.key === 'peak' || c.key === 'totalWeeks' || (c.key === 'cert' && type !== 'artist')) && c.visible
    ));
    if (!wantsStats) return;
    let cancelled = false;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const id = setTimeout(() => {
        if (cancelled) return;
        dispatch(fetchStatsMapIncremental({ chartId: `${chart.id}`, chartType: type, data, week }));
      }, 900);
      (window as any).__listStatsTimer = id;
    }));
    return () => {
      cancelled = true;
      if ((window as any).__listStatsTimer) clearTimeout((window as any).__listStatsTimer);
    };
  }, [data, chart?.id, type, week, dispatch, columns]);

  // Refetch incremental quando usuário habilita colunas de stats depois
  const statsColumnsVisible = useMemo(() => columns.some((c: any) => (
    (c.key === 'peak' || c.key === 'totalWeeks' || (c.key === 'cert' && type !== 'artist')) && c.visible
  )), [columns, type]);
  const [statsColsPrev, setStatsColsPrev] = useState(statsColumnsVisible);
  useEffect(() => {
    if (statsColumnsVisible && !statsColsPrev && data.length && week && chart?.id) {
      dispatch(fetchStatsMapIncremental({ chartId: `${chart.id}`, chartType: type, data, week }));
    }
    if (statsColsPrev !== statsColumnsVisible) setStatsColsPrev(statsColumnsVisible);
  }, [statsColumnsVisible, statsColsPrev, data, week, chart?.id, type, dispatch]);

  // Fallback de reforço se stats não chegarem
  useEffect(() => {
    if (!statsColumnsVisible || !data.length || !week || !chart?.id) return;
    const state: any = (window as any).__reduxStateCache; // opcional se existir caching global
  const hasAny = data.some((r: any) => {
      const s = (state?.charts?.statsMap || ({} as any))[r.entityId];
      return s && s.totals && s.totals.withinCutoff != null;
    });
    // Se não temos acesso a state global via hack, fazemos checagem via dispatch indireta (omitido). Simplesmente agenda fallback:
    if (hasAny) return;
    const id = setTimeout(() => {
      dispatch(fetchStatsMapIncremental({ chartId: `${chart.id}`, chartType: type, data, week }));
    }, 1300);
    return () => clearTimeout(id);
  }, [statsColumnsVisible, data, week, chart?.id, type, dispatch]);

  const visibleColumns = useMemo(() => columns.filter((c: any) => c.visible), [columns]);
  const showAltVariationRedux = columns.find((c: any) => c.key === 'altVariation')?.visible;
  const showDeltaBadge = columns.find((c: any) => c.key === 'deltaRankBadge')?.visible;
  const showDeltaPlaysBadge = columns.find((c: any) => c.key === 'deltaPlaysBadge')?.visible;
  const showDeltaPercentPlaysBadge = columns.find((c: any) => c.key === 'deltaPercentPlaysBadge')?.visible;
  const showImage = columns.find((c: any) => c.key === 'image')?.visible;
  const filteredColumns = visibleColumns.filter((c: any) => c.isColumn);

  // Badge util agora está fora

  const useProgressive = data.length > 120;
  const progressiveAll = useProgressiveReveal(data, { initial: 40, step: 50, intervalMs: 18, adaptive: true, disableBelow: 260, targetDurationMs: 260 });
  const progressive = useProgressive ? progressiveAll : { items: data, done: true, total: data.length } as any;
  const visibleRows = progressive.items as ChartData[];
  const showLoadingTail = useProgressive && !progressive.done;

  return (
    <Flex direction="column" gap="sm">
      {visibleRows.map((row: ChartData, idx: number) => (
        <ChartWeekListRow
          key={row.id}
          row={row}
          idx={idx}
          filteredColumns={filteredColumns}
          chart={chart}
          showDeltaBadge={showDeltaBadge}
          showDeltaPlaysBadge={showDeltaPlaysBadge}
          showDeltaPercentPlaysBadge={showDeltaPercentPlaysBadge}
          showAltVariationRedux={showAltVariationRedux}
          showImage={showImage}
          altVariation={altVariation}
          type={type}
          clientId={clientId}
          clientSecret={clientSecret}
          colorScheme={colorScheme}
          theme={theme}
          week={week}
        />
      ))}
    {showLoadingTail && (
      <Flex justify="center" py="sm">
        <Text size="xs" c="dimmed">Carregando {visibleRows.length}/{progressive.total}…</Text>
      </Flex>
    )}
    {/* Modal agora é controlado pelo SpotifyImageWithModal */}
      </Flex>
  );
};
