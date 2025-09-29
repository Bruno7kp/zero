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
import { Container } from '@mantine/core';

const DEFAULT_TYPE = 'artist';

export const ChartsWeekPage: React.FC = () => {
    const { week: weekParam, type: typeParam } = useParams();
    const charts = useSelector((state: any) => state.charts.charts);
    const activeChartId = useSelector((state: any) => state.charts.activeChartId);
    const [view, setView] = useState<'table' | 'grid' | 'list'>('table');
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

    return (
        <Container>
            <ChartWeekControls
                chart={chart}
                week={selectedWeek}
                type={selectedType}
                onChange={handleChange}
                view={view}
                setView={setView}
            />
                        {view === 'table' && (
                                <ChartWeekTable
                                    chart={chart}
                                    week={selectedWeek}
                                    type={selectedType}
                                    altVariation={getAltVariation}
                                />
                        )}
            {view === 'grid' && <ChartWeekGrid chart={chart} week={selectedWeek} type={selectedType} />}
            {view === 'list' && <ChartWeekList chart={chart} week={selectedWeek} type={selectedType} />}
        </Container>
    );
};

export default ChartsWeekPage;
