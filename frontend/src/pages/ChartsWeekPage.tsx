// Função de variação para a coluna Δ: usa exatamente o mesmo valor do badge da coluna rank
function getAltVariation(row: any) {
    return row.deltaRank;
}
import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChartWeekControls } from '../components/ChartWeekControls';
import { ChartWeekTable } from '../components/ChartWeekTable';
import { ChartWeekGrid } from '../components/ChartWeekGrid';
import { ChartWeekList } from '../components/ChartWeekList';
import { Container, Loader, Center } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

const DEFAULT_TYPE = 'artist';

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

    if (!chart) return <div>Nenhum chart ativo.</div>;

    // Loading: só renderiza tabela se chart.id, selectedWeek e selectedType batem com a rota
    const isSync = chart && selectedWeek === weekParam && selectedType === (typeParam || DEFAULT_TYPE);

    return (
        <Container size={isMobile ? '100%' : 'md'} px="xs">
            <ChartWeekControls
                chart={chart}
                week={selectedWeek}
                type={selectedType}
                onChange={handleChange}
                view={view}
                setView={setView}
            />
            {!isSync ? (
                <Center py="xl"><Loader /></Center>
            ) : (
                <>
                    {view === 'table' && (
                        <ChartWeekTable
                            chart={chart}
                            week={selectedWeek}
                            type={selectedType}
                            altVariation={getAltVariation}
                        />
                    )}
                    {view === 'grid' && (
                        <ChartWeekGrid
                            chart={chart}
                            week={selectedWeek}
                            type={selectedType}
                            altVariation={getAltVariation}
                        />
                    )}
                    {view === 'list' && (
                        <ChartWeekList
                            chart={chart}
                            week={selectedWeek}
                            type={selectedType}
                            altVariation={getAltVariation}
                        />
                    )}
                </>
            )}
        </Container>
    );
};

export default ChartsWeekPage;
