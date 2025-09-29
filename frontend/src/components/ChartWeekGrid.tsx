import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { fetchChartData, fetchStatsMap } from '../store/chartsSlice';
import { Card, Text, Badge, Box, ActionIcon, Grid, Group, Modal, useMantineTheme, useMantineColorScheme, Divider } from '@mantine/core';
import { IconPlus, IconStarFilled, IconArrowBackUp, IconCaretDownFilled, IconCaretUpFilled } from '@tabler/icons-react';
import type { ChartData } from '../db/indexedDb';
import { ChartItemStatsLoader } from './ChartItemStatsLoader';

interface ChartWeekGridProps {
  chart: any;
  week?: string;
  type: string;
  altVariation?: (row: ChartData, index: number) => string | number | false | null | undefined;
}

export const ChartWeekGrid: React.FC<ChartWeekGridProps> = ({ chart, week, type, altVariation }) => {
  // Função para renderizar o ícone de variação
  function renderAltVariation(row: ChartData, idx: number) {
    if (!showAltVariationRedux) return null;
    let value: any = altVariation ? altVariation(row, idx) : false;
    let color = 'gray', label = '', icon = null;
    if (value === 'NEW') {
      color = 'blue'; label = 'NEW'; icon = <IconStarFilled size={14} style={{ verticalAlign: 'middle' }} />;
    } else if (value === 'RE') {
      color = 'yellow'; label = 'RE'; icon = <IconArrowBackUp stroke={3} size={14} style={{ verticalAlign: 'middle', transform: "scaleX(-1)" }} />;
    } else if (typeof value === 'number' && value < 0) {
      color = 'red'; label = String(value); icon = <IconCaretDownFilled size={16} style={{ verticalAlign: 'middle' }} />;
    } else if (typeof value === 'number' && value > 0) {
      color = 'green'; label = `+${value}`; icon = <IconCaretUpFilled size={16} style={{ verticalAlign: 'middle' }} />;
    } else if (value === 0 || value === '=') {
      color = 'gray'; label = '=';
    } else if (!value || value === '-') {
      color = 'gray'; label = '';
    } else {
      label = String(value);
    }
    return label ? (
      <Badge
        color={color}
        variant="filled"
        size="md"
        px={4}
        style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 2,
            borderRadius: 4,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '4px 6px',
        }}
        >
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                {icon}
                <span style={{ fontWeight: 700, fontSize: 12 }}>{label}</span>
            </span>
        </Badge>

    ) : null;
  }
  const dispatch = useDispatch();
  const data = useSelector((state: any) => state.charts.data);
  const statsMap = useSelector((state: any) => state.charts.statsMap);
  const columns = useSelector((state: any) => state.columns.columns);
  const showImage = columns.find((c: any) => c.key === 'image')?.visible;
  const showPeak = columns.find((c: any) => c.key === 'peak')?.visible;
  const showPlays = columns.find((c: any) => c.key === 'plays')?.visible;
  const showTotalWeeks = columns.find((c: any) => c.key === 'totalWeeks')?.visible;
  const showAltVariationRedux = columns.find((c: any) => c.key === 'altVariation')?.visible;
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  // Modal state
  const [modalOpen, setModalOpen] = React.useState(false);
  const [modalRow, setModalRow] = React.useState<ChartData | null>(null);

  useEffect(() => {
    if (!week || !chart?.id) return;
    dispatch(fetchChartData({ chartId: `${chart.id}`, chartType: type, week }));
  }, [chart?.id, week, type, dispatch]);

  useEffect(() => {
    if (!data.length || !week || !chart?.id) return;
    const cutoff = 100;
    dispatch(fetchStatsMap({ chartId: `${chart.id}`, chartType: type, data, cutoff, week }));
  }, [data, chart?.id, type, week, dispatch]);

  return (
    <>
      <Modal opened={modalOpen} onClose={() => setModalOpen(false)} title={modalRow?.name || 'Detalhes'} size="xl">
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
        {data.map((row: ChartData, idx: number) => {
          const stats = statsMap[row.entityId];
          return (
            <Grid.Col key={row.id} span={{ base: 15, md: 10, lg: 6 }}>
              <Card shadow="sm" radius="md" p={0} style={{ height: '100%', display: 'flex', flexDirection: 'column', background: colorScheme === 'dark' ? theme.colors.dark[7] : 'white' }}>
                <Box style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: '#eee', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start' }}>
                  {/* Variação canto superior direito */}
                  {renderAltVariation(row, idx)}
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
                    color={row.rank === 1 ? 'red' : 'red'}
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
                    {row.rank}
                  </Badge>
                  {/* Imagem real */}
                  {showImage && (
                    <img
                      src="https://lastfm.freetls.fastly.net/i/u/300x300/d0c78dc3a80e2e45ac4972089360a051.jpg"
                      alt={row.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 0 }}
                    />
                  )}
                </Box>
                <Box px="sm" py={8} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: 64 }}>
                  <Text fw={700} size="md" lineClamp={2} style={{ width: '100%', textAlign: 'center' }}>{row.name}</Text>
                  {row.artistName && <Text size="sm" c="dimmed" lineClamp={1} style={{ width: '100%', textAlign: 'center' }}>{row.artistName}</Text>}
                </Box>
                {(showPlays || showPeak || showTotalWeeks) && (
                <Group px="sm" pb="sm" style={{ minHeight: 36, width: '100%', justifyContent: 'space-between', gap: 4, display: 'flex' }}>
                  {showPlays && (
                    <Box style={{ textAlign: 'center', flex: 1 }}>
                      <Text size="xs" c="dimmed">Plays</Text>
                      <Text fw={700} size="sm">{row.plays}</Text>
                    </Box>
                  )}
                  {showPeak && (
                    <Box style={{ textAlign: 'center', flex: 1 }}>
                      <Text size="xs" c="dimmed">Peak</Text>
                      <Text fw={700} size="sm">{stats?.peak?.position ?? '-'}</Text>
                    </Box>
                  )}
                  {showTotalWeeks && (
                    <Box style={{ textAlign: 'center', flex: 1 }}>
                      <Text size="xs" c="dimmed">Weeks</Text>
                      <Text fw={700} size="sm">{stats?.totals?.withinCutoff ?? '-'}</Text>
                    </Box>
                  )}
                </Group>
                )}
              </Card>
            </Grid.Col>
          );
        })}
      </Grid>
    </>
  );
};
