import React, { useEffect, useState, useRef } from 'react';
import { ImageEditModal } from './ImageEditModal';
import type { AppDispatch } from '../store/index';
import { useSelector, useDispatch } from 'react-redux';
import { fetchChartData, fetchStatsMapIncremental, computeWeekDeltas } from '../store/chartsSlice';
import { useProgressiveReveal } from '../hooks/useProgressiveReveal';
import { Card, Text, Badge, Box, ActionIcon, Grid, Group, Modal, useMantineTheme, useMantineColorScheme } from '@mantine/core';
import { IconPlus, IconStarFilled, IconArrowBackUp, IconCaretDownFilled, IconCaretUpFilled } from '@tabler/icons-react';
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
  // Sincroniza colunas do grid com localStorage
  useEffect(() => {
    const storageKey = 'chart_columns_grid';
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach((col: any) => {
            dispatch({ type: 'columns/updateColumn', payload: { key: col.key, visible: col.visible } });
          });
        }
      } catch {}
    }
  }, []);
  const [lastImageUrlByEntityId, setLastImageUrlByEntityId] = useState<{ [entityId: string]: string | null }>({});
  // Memorize the last image for each entityId, and only update when a new image is loaded
  // This ensures the image only changes when the new one is ready
  // Função para renderizar o ícone de variação
  function renderAltVariation(row: ChartData, idx: number) {
    if (!showAltVariationRedux) return null;
  const value: any = altVariation ? altVariation(row, idx) : false;
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
  const dispatch = useDispatch<AppDispatch>();
  const data = useSelector((state: any) => state.charts.data);
  // Persist previous data while new data is loading to prevent flicker
  const [displayedData, setDisplayedData] = useState<any[]>(data);
  const prevDataRef = useRef<any[]>(data);
  useEffect(() => {
    // Só troca displayedData quando data realmente muda para não-vazio
    if (Array.isArray(data) && data.length > 0) {
      setDisplayedData(data);
      prevDataRef.current = data;
    }
    // Se data ficou vazio, mantém o anterior (NÃO limpa displayedData)
    // Isso evita flicker total
  }, [data]);

  // Garante que displayedData nunca fique vazio
  const safeDisplayedData = displayedData && displayedData.length > 0 ? displayedData : prevDataRef.current;
  const statsMap = useSelector((state: any) => state.charts.statsMap);
  const loadingStats = useSelector((state: any) => state.charts.loadingStats);
  const columns = useSelector((state: any) => state.columns.columns);
  const showImage = columns.find((c: any) => c.key === 'image')?.visible;
  const showPeak = columns.find((c: any) => c.key === 'peak')?.visible;
  const showPlays = columns.find((c: any) => c.key === 'plays')?.visible;
  const showTotalWeeks = columns.find((c: any) => c.key === 'totalWeeks')?.visible;
  const showAltVariationRedux = columns.find((c: any) => c.key === 'altVariation')?.visible;
  const theme = useMantineTheme();
  const { colorScheme } = useMantineColorScheme();

  // Modal de detalhes
  const [modalOpen, setModalOpen] = useState(false);
  const [modalRow, setModalRow] = useState<ChartData | null>(null);
  // Modal de imagem
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageModalRow] = useState<ChartData | null>(null); // setImageModalRow unused
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
  // Forçar atualização da imagem ao salvar
  const [imageForceUpdate, setImageForceUpdate] = useState<{ [entityId: string]: number }>({});

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
        {visibleCards.map((row: ChartData, idx: number) => {
          const stats = statsMap[row.entityId];
          return (
            <Grid.Col key={row.id} span={{ base: 15, md: 10, lg: 6 }}>
              <Card shadow="sm" radius="md" p={0} style={{ height: '100%', display: 'flex', flexDirection: 'column', background: colorScheme === 'dark' ? theme.colors.dark[7] : 'white' }}>
                <Box style={{ position: 'relative', width: '100%', aspectRatio: '1/1', background: 'transparent', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start' }}>
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
                    color={row.rank === 1 ? 'blue' : 'red'}
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
                      <Text fw={700} size="sm" c={stats?.peak?.position === 1 ? 'blue' : undefined}>{stats?.peak?.position ?? (loadingStats ? '…' : '-')}</Text>
                    </Box>
                  )}
                  {showTotalWeeks && (
                    <Box style={{ textAlign: 'center', flex: 1 }}>
                      <Text size="xs" c="dimmed">Weeks</Text>
                      <Text fw={700} size="sm">{stats?.totals?.withinCutoff ?? (loadingStats ? '…' : '-')}</Text>
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
