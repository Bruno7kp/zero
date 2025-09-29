import React, { useMemo, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import { fetchChartData, fetchStatsMap } from '../store/chartsSlice';
import { Card, Flex, Text, Badge, Collapse, ActionIcon, Box, Divider, useMantineTheme, useMantineColorScheme } from '@mantine/core';
import { IconArrowBackUp, IconCaretDownFilled, IconCaretUpFilled, IconChevronDown, IconChevronUp, IconStarFilled } from '@tabler/icons-react';
import type { ChartData } from '../db/indexedDb';
import { ChartItemStatsLoader } from './ChartItemStatsLoader';

interface ChartWeekListProps {
  chart: any;
  week?: string;
  type: string;
  altVariation?: (row: ChartData, index: number) => string | number | false | null | undefined;
}

export const ChartWeekList: React.FC<ChartWeekListProps> = ({ chart, week, type, altVariation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const data = useSelector((state: any) => state.charts.data);
  const statsMap = useSelector((state: any) => state.charts.statsMap);
  const columns = useSelector((state: any) => state.columns.columns);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  // Buscar dados ao trocar semana/tipo/chart
  useEffect(() => {
    if (!week || !chart?.id) return;
    dispatch(fetchChartData({ chartId: `${chart.id}`, chartType: type, week }));
  }, [chart?.id, week, type, dispatch]);

  // Buscar stats ao trocar dados/semana
  useEffect(() => {
    if (!data.length || !week || !chart?.id) return;
    const cutoff = 100;
    dispatch(fetchStatsMap({ chartId: `${chart.id}`, chartType: type, data, cutoff, week }));
  }, [data, chart?.id, type, week, dispatch]);

  const visibleColumns = useMemo(() => columns.filter((c: any) => c.visible), [columns]);
  const showAltVariationRedux = columns.find((c: any) => c.key === 'altVariation')?.visible;
  const showDeltaBadge = columns.find((c: any) => c.key === 'deltaRankBadge')?.visible;
  const showDeltaPlaysBadge = columns.find((c: any) => c.key === 'deltaPlaysBadge')?.visible;
  const showImage = columns.find((c: any) => c.key === 'image')?.visible;
  const filteredColumns = visibleColumns.filter((c: any) => c.key !== 'deltaRankBadge' && c.key !== 'deltaPlaysBadge' && c.key !== 'image');

  function getDeltaBadgeProps(delta: any) {
    let color = 'gray';
    let label: string | number = delta;
    if (typeof delta === 'number') {
      if (delta > 0) { color = 'green'; label = `+${delta}`; }
      else if (delta < 0) { color = 'red'; label = `${delta}`; }
      else { color = 'gray'; label = '='; }
    } else if (delta === 'NEW') {
      color = 'blue'; label = 'NEW';
    } else if (delta === 'RE') {
      color = 'yellow'; label = 'RE';
    } else if (delta === '-' || delta == null) {
      color = 'gray'; label = '-';
    }
    return { color, label };
  }

  const handleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Flex direction="column" gap="sm">
      {data.map((row: ChartData, idx: number) => {
        const stats = statsMap[row.entityId];
        const rowId = String(row.id);
        return (
          <Card key={rowId} shadow="md" p={0} radius="md" style={{ background: colorScheme === 'dark' ? theme.colors.dark[7] : 'white', }}>
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
                            {getDeltaBadgeProps(row.deltaPlays).label}
                          </Badge>
                        )}
                      </Flex>
                    );
                  }
                  if (col.key === 'name') {
                    return (
                      <Flex key={col.key} direction="row" align="center" style={{ flex: 1, minWidth: 0 }}>
                        {showImage && (
                          <img
                            src="https://lastfm.freetls.fastly.net/i/u/300x300/d0c78dc3a80e2e45ac4972089360a051.jpg"
                            alt={row.name}
                            style={{ height: 72, width: 72, objectFit: 'cover', borderRadius: 0 }}
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
                        <Text fw={700} size="xl" c={peakVal === 1 ? 'blue' : undefined}>{peakVal}</Text>
                      </Flex>
                    );
                  }
                  if (col.key === 'totalWeeks') {
                    const totalWeeks = stats?.totals?.withinCutoff ?? '-';
                    return (
                      <Flex key={col.key} direction="column" align="center" mr="sm" style={{ minWidth: 48, maxWidth: 48, flex: '0 0 48px' }}>
                        <Text fw={700} size="xl">{totalWeeks}</Text>
                      </Flex>
                    );
                  }
                  if (col.key === 'altVariation' && showAltVariationRedux) {
                    let value: any = altVariation ? altVariation(row, idx) : false;
                    let color = 'gray', label = '', icon = null;
                    if (value === 'NEW') {
                      color = 'blue'; label = 'NEW'; icon = <IconStarFilled size={10} style={{ verticalAlign: 'middle' }} />;
                    } else if (value === 'RE') {
                      color = 'yellow'; label = 'RE'; icon = <IconArrowBackUp stroke={3} size={14} style={{ verticalAlign: 'middle', transform: "scaleX(-1)" }} />;
                    } else if (typeof value === 'number' && value < 0) {
                      color = 'red'; label = String(value); icon = <IconCaretDownFilled size={18} style={{ verticalAlign: 'middle' }} />;
                    } else if (typeof value === 'number' && value > 0) {
                      color = 'green'; label = `+${value}`; icon = <IconCaretUpFilled size={18} style={{ verticalAlign: 'middle' }} />;
                    } else if (value === 0 || value === '=') {
                      color = 'gray'; label = '=';
                    } else if (!value || value === '-') {
                      color = 'gray'; label = '';
                    } else {
                      label = String(value);
                    }
                    return label ? (
                      <Badge
                        key={col.key}
                        color={color}
                        variant={color === 'gray' ? 'light' : 'filled'}
                        px={0}
                        mx={0}
                        style={{
                            borderRadius: 0,
                            width: 60,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
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
                <ActionIcon variant="subtle" onClick={() => handleExpand(rowId)}>
                  {expanded[rowId] ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
                </ActionIcon>
              </Flex>
            </Flex>
            <Collapse in={!!expanded[rowId]} p={0}>
                <Divider size="xs"/>
                <Box p={0}>
                    <ChartItemStatsLoader
                        chartId={row.chartId}
                        chartType={row.chartType}
                        entityId={row.entityId}
                        week={week}
                    />
                </Box>
            </Collapse>
          </Card>
        );
      })}
    </Flex>
  );
};
