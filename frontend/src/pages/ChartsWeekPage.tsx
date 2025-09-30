import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChartWeekControls } from '../components/ChartWeekControls';
import { ChartWeekTable } from '../components/ChartWeekTable';
import { ChartWeekGrid } from '../components/ChartWeekGrid';
import { ChartWeekList } from '../components/ChartWeekList';
import { Container, Loader, Center, Box } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

const DEFAULT_TYPE = 'artist';
const SPOTIFY_TOKEN = 'd686abb030b34dc2b3446b06507ded9b';
const SPOTIFY_SECRET = '7611153438b2440fa4a7e22c3311f2d6';

// Função de variação para a coluna Δ: usa exatamente o mesmo valor do badge da coluna rank
function getAltVariation(row: any) {
    return row.deltaRank;
}

export const ChartsWeekPage: React.FC = () => {
    const isMobile = useMediaQuery('(max-width: 48em)'); // Mantine md breakpoint
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
    const navigate = useNavigate();

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

    if (!chart) {
        return <div>Nenhum chart ativo.</div>;
    }

    // Sincronizado com rota
    const isSync = chart && selectedWeek === weekParam && selectedType === (typeParam || DEFAULT_TYPE);
    // Está em transição de semana/tipo (aguardando dados novos)
    const isTransitioning = (selectedWeek !== displayedWeek) || (selectedType !== displayedType);
    const hasAnyData = Array.isArray(chartsData) && chartsData.length > 0;

    React.useEffect(() => {
        if (
            isSync &&
            Array.isArray(chartsData) &&
            chartsData.length > 0 &&
            (displayedWeek !== selectedWeek || displayedType !== selectedType)
        ) {
            setDisplayedWeek(selectedWeek);
            setDisplayedType(selectedType);
        }
    }, [isSync, chartsData, selectedWeek, selectedType, displayedWeek, displayedType]);
    return (
        <>
        <Container size={isMobile ? '100%' : 'md'} px="xs">
            <ChartWeekControls
                chart={chart}
                week={selectedWeek}
                type={selectedType}
                onChange={handleChange}
                view={view}
                setView={setView}
            />
        </Container>
        <Container size={isMobile ? '100%' : view === 'grid' ? '100%' : 'md'} px="xs" style={{ position: 'relative' }}>
            {(!hasAnyData && !isTransitioning) && (
                <Center py="xl"><Loader /></Center>
            )}
            {hasAnyData && (
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
                    {isTransitioning && (
                        <Box style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(1px)' }}>
                            <Center style={{ width: '100%', height: '100%' }}>
                                <Loader size="sm" />
                            </Center>
                        </Box>
                    )}
                </>
            )}
        </Container>
        </>
    );
};

export default ChartsWeekPage;
