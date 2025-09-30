import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import { fetchChartData, fetchStatsMapIncremental, computeWeekDeltas } from '../store/chartsSlice';
import { useProgressiveReveal } from '../hooks/useProgressiveReveal';
import { Card, Flex, Text, Badge, Collapse, ActionIcon, Box, Divider, useMantineTheme, useMantineColorScheme } from '@mantine/core';
import { IconArrowBackUp, IconCaretDownFilled, IconCaretUpFilled, IconChevronDown, IconChevronUp, IconStarFilled } from '@tabler/icons-react';
import { SpotifyImageWithModal } from './SpotifyImageWithModal';
import type { ChartData } from '../db/indexedDb';
import { ChartItemStatsLoader } from './ChartItemStatsLoader';

interface ChartWeekListProps {
  chart: any;
  week?: string;
  type: string;
  altVariation?: (row: ChartData, index: number) => string | number | false | null | undefined;
  clientId: string;
  clientSecret: string;
}

// Utilitário fora do componente principal para não recriar a cada render
function getDeltaBadgeProps(delta: any, showPercent: boolean = false, currentValue: number = 0) {
  // Rules:
  //  - number > 0 => +N green
  //  - number < 0 => -N red
  //  - number === 0 => '=' gray
  //  - 'NEW' => blue
  //  - 'RE'  => yellow
  //  - anything else / '-' => gray
  let color = 'gray';
  let label: string | number = delta;
  if (typeof delta === 'number') {
    if (delta > 0) {
      color = 'green';
      if (showPercent && currentValue - delta > 0) {
        const percent = ((delta / (currentValue - delta)) * 100);
        label = `+${percent.toFixed(0)}%`;
      } else {
        label = `+${delta}`;
      }
    } else if (delta < 0) {
      color = 'red';
      if (showPercent && currentValue - delta > 0) {
        const percent = ((delta / (currentValue - delta)) * 100);
        label = `${percent.toFixed(0)}%`;
      } else {
        label = `${delta}`;
      }
    } else {
      color = 'gray';
      label = '=';
    }
  } else if (delta === 'NEW') {
    color = 'blue';
    label = 'NEW';
  } else if (delta === 'RE') {
    color = 'yellow';
    label = 'RE';
  } else if (delta === '-' || delta == null) {
    color = 'gray';
    label = '-';
  }
  return { color, label };
}

// Componente de linha memoizado para minimizar rerenders quando statsMap parcial é atualizado
const ChartWeekListRow: React.FC<{
  row: ChartData;
  idx: number;
  filteredColumns: any[];
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
}> = React.memo(({ row, idx, filteredColumns, showDeltaBadge, showDeltaPlaysBadge, showDeltaPercentPlaysBadge, showAltVariationRedux, showImage, altVariation, type, clientId, clientSecret, colorScheme, theme, week }) => {
  const stats = useSelector((state: any) => state.charts.statsMap[row.entityId]);
  const loadingStats = useSelector((state: any) => state.charts.loadingStats);
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
                  {showDeltaBadge && (
                    <Badge variant="light" color={getDeltaBadgeProps(row.deltaRank).color} size="xs">
                      {getDeltaBadgeProps(row.deltaRank).label}
                    </Badge>
                  )}
                </Flex>
              );
            }
            if (col.key === 'plays') {
              return (
                <Flex key={col.key} direction="column" align="center" mr="sm" style={{ minWidth: 72, maxWidth: 72, flex: '0 0 72px' }}>
                  <Text fw={700} size="xl">{row.plays}</Text>
                  {showDeltaPlaysBadge && (
                    <Badge variant="light" color={getDeltaBadgeProps(row.deltaPlays).color} size="xs">
                      {getDeltaBadgeProps(row.deltaPlays, showDeltaPercentPlaysBadge, row.plays).label}
                    </Badge>
                  )}
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
              let color = 'gray', label = '', icon = null;
              if (value === 'NEW') { color = 'blue'; label = 'NEW'; icon = <IconStarFilled size={10} style={{ verticalAlign: 'middle' }} />; }
              else if (value === 'RE') { color = 'yellow'; label = 'RE'; icon = <IconArrowBackUp stroke={3} size={14} style={{ verticalAlign: 'middle', transform: 'scaleX(-1)' }} />; }
              else if (typeof value === 'number' && value < 0) { color = 'red'; label = String(value); icon = <IconCaretDownFilled size={18} style={{ verticalAlign: 'middle' }} />; }
              else if (typeof value === 'number' && value > 0) { color = 'green'; label = `+${value}`; icon = <IconCaretUpFilled size={18} style={{ verticalAlign: 'middle' }} />; }
              else if (value === 0 || value === '=') { color = 'gray'; label = '='; }
              else if (!value || value === '-') { color = 'gray'; label = ''; }
              else { label = String(value); }
              return label ? (
                <Badge
                  key={col.key}
                  color={color}
                  variant={color === 'gray' ? 'light' : 'filled'}
                  px={0}
                  mx={0}
                  style={{ borderRadius: 0, width: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {icon}
                    <span style={{ fontWeight: 700, fontSize: 12 }}>{label}</span>
                  </span>
                </Badge>
              ) : null;
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

export const ChartWeekList: React.FC<ChartWeekListProps> = ({ chart, week, type, altVariation, clientId, clientSecret }) => {
  const dispatch = useDispatch<AppDispatch>();
  const data = useSelector((state: any) => state.charts.data);
  const columns = useSelector((state: any) => state.columns.columns);
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

  // Stats diferidos: só agenda se colunas que dependem de stats estiverem visíveis (peak/totalWeeks)
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
      (window as any).__listStatsTimer = id;
    }));
    return () => {
      cancelled = true;
      if ((window as any).__listStatsTimer) clearTimeout((window as any).__listStatsTimer);
    };
  }, [data, chart?.id, type, week, dispatch, columns]);

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
