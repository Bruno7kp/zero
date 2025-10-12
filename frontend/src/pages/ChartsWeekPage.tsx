import React, { useMemo, useState, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChartWeekControls } from '../components/ChartWeekControls';
import { ChartWeekTable } from '../components/ChartWeekTable';
import { ChartWeekGrid } from '../components/ChartWeekGrid';
import { ChartWeekList } from '../components/ChartWeekList';
import { Container, Loader, Center, Box, Skeleton } from '@mantine/core';
import { useIsMobile } from '../hooks/useIsMobile';
import { SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../services/SpotifyApi';
const ChartCarousel = lazy(() => import('../components/chartPage/ChartCarousel'));

const DEFAULT_TYPE = 'artist';

// Função de variação para a coluna Δ: usa exatamente o mesmo valor do badge da coluna rank
function getAltVariation(row: any) {
    return row.deltaRank;
}

export const ChartsWeekPage: React.FC = () => {
    const isMobile = useIsMobile();
    const { week: weekParam, type: typeParam } = useParams();
    const charts = useSelector((state: any) => state.charts.charts);
    const activeChartId = useSelector((state: any) => state.charts.activeChartId);
    const [view, setView] = useState<'table' | 'grid' | 'list'>(() => {
        const saved = typeof window !== 'undefined' ? localStorage.getItem('chartWeekView') : null;
        return (saved === 'table' || saved === 'grid' || saved === 'list') ? saved : 'table';
    });
    const chart = useMemo(() => charts.find((c: any) => c.id === activeChartId) || null, [charts, activeChartId]);
    const [selectedWeek, setSelectedWeek] = useState<string | undefined>(weekParam);
    const [selectedType, setSelectedType] = useState<string>(typeParam || DEFAULT_TYPE);
    const [displayedWeek, setDisplayedWeek] = useState<string | undefined>(weekParam);
    const [displayedType, setDisplayedType] = useState<string>(typeParam || DEFAULT_TYPE);
    const chartsData = useSelector((state: any) => state.charts.data);
    const loadingData = useSelector((state: any) => state.charts.loadingData);
    const navigate = useNavigate();
    const columnsState = useSelector((state: any) => state.columns);
    const currentContainerSize = columnsState?.views?.[view]?.settings?.containerSize || (view === 'grid' ? 'xl' : 'md');
    const showCarousel = columnsState?.views?.[view]?.settings?.showCarousel ?? false;

    // Sincroniza quando rota muda externamente (ex: clique em ChartRun)
    React.useEffect(() => {
        if (weekParam && weekParam !== selectedWeek) setSelectedWeek(weekParam);
        if (typeParam && typeParam !== selectedType) setSelectedType(typeParam);
    }, [weekParam, typeParam, selectedWeek, selectedType]);

    // Atualiza rota ao trocar semana/tipo internamente
    const handleChange = (week: string, type: string) => {
        setSelectedWeek(week);
        setSelectedType(type);
        navigate(`/charts/week/${week}/${type}`);
    };

    const noChart = !chart;

    // Sincronizado com rota
    const isSync = chart && selectedWeek === weekParam && selectedType === (typeParam || DEFAULT_TYPE);
    const hasAnyData = Array.isArray(chartsData) && chartsData.length > 0;
    // Semana alvo diferente da atualmente exibida
    const isSwitchingTarget = (selectedWeek !== displayedWeek) || (selectedType !== displayedType);

    React.useEffect(() => {
        if (!isSync) return;
        // Só troca semana exibida quando a requisição terminou (loadingData false)
        if (!loadingData && (displayedWeek !== selectedWeek || displayedType !== selectedType)) {
            setDisplayedWeek(selectedWeek);
            setDisplayedType(selectedType);
        }
    }, [isSync, loadingData, chartsData, selectedWeek, selectedType, displayedWeek, displayedType]);
    return (
        <>
            <Container size={isMobile ? '100%' : currentContainerSize} px="xs">
                {chart && showCarousel && (
                    <Suspense
                        fallback={
                            <Box style={{ height: 200, width: '100%' }}>
                                <Skeleton height="100%" radius="md" />
                            </Box>
                        }
                    >
                        <ChartCarousel
                            chart={chart}
                            week={displayedWeek}
                            type={displayedType as any}
                            clientId={SPOTIFY_TOKEN}
                            clientSecret={SPOTIFY_SECRET}
                        />
                    </Suspense>
                )}
                {!noChart && (
                    <ChartWeekControls
                        chart={chart}
                        week={selectedWeek}
                        type={selectedType}
                        onChange={handleChange}
                        view={view}
                        setView={setView}
                    />
                )}
            </Container>
            <Container size={isMobile ? '100%' : currentContainerSize} px="xs" style={{ position: 'relative', minHeight: 180 }}>
                {noChart && (
                    <Center py="xl"><div>Nenhum chart ativo.</div></Center>
                )}
                {!noChart && (
                    <>
                        {view === 'table' && (
                            <ChartWeekTable
                                chart={chart}
                                week={displayedWeek || ''}
                                type={displayedType}
                                altVariation={getAltVariation}
                                clientId={SPOTIFY_TOKEN}
                                clientSecret={SPOTIFY_SECRET}
                            />
                        )}
                        {view === 'grid' && (
                            <ChartWeekGrid
                                chart={chart}
                                week={displayedWeek}
                                type={displayedType}
                                altVariation={getAltVariation}
                                clientId={SPOTIFY_TOKEN}
                                clientSecret={SPOTIFY_SECRET}
                            />
                        )}
                        {view === 'list' && (
                            <ChartWeekList
                                chart={chart}
                                week={displayedWeek}
                                type={displayedType}
                                altVariation={getAltVariation}
                                clientId={SPOTIFY_TOKEN}
                                clientSecret={SPOTIFY_SECRET}
                            />
                        )}
                        {/* Spinner discreto no canto durante transição */}
                        {isSwitchingTarget && loadingData && (
                            <Box style={{ position: 'absolute', top: 8, right: 8, zIndex: 5 }}>
                                <Loader size="xs" />
                            </Box>
                        )}
                        {!loadingData && !hasAnyData && !isSwitchingTarget && (
                            <Center py="md"><div style={{ opacity: 0.7, fontSize: 14 }}>Sem dados para esta semana.</div></Center>
                        )}
                    </>
                )}
            </Container>
        </>
    );
};

export default ChartsWeekPage;
