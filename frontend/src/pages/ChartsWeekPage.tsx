import React, { useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ChartWeekControls } from '../components/ChartWeekControls';
import { ChartWeekTable, defaultColumns } from '../components/ChartWeekTable';
import { ChartWeekGrid } from '../components/ChartWeekGrid';
import { ChartWeekList } from '../components/ChartWeekList';
import { Container } from '@mantine/core';

const DEFAULT_TYPE = 'artist';

export const ChartsWeekPage: React.FC = () => {
    const { week: weekParam, type: typeParam } = useParams();
    const charts = useSelector((state: any) => state.charts.charts);
    const activeChartId = useSelector((state: any) => state.charts.activeChartId);
    const [view, setView] = useState<'table' | 'grid' | 'list'>('table');
    const [columns, setColumns] = useState(defaultColumns);
    const toggleColumn = useCallback((key: string) => {
        setColumns(cols => cols.map(c => c.key === key ? { ...c, visible: !c.visible } : c));
    }, []);
    const chart = useMemo(() => charts.find((c: any) => c.id === activeChartId) || null, [charts, activeChartId]);
    const [selectedWeek, setSelectedWeek] = useState<string | undefined>(weekParam);
    const [selectedType, setSelectedType] = useState<string>(typeParam || DEFAULT_TYPE);
    const navigate = useNavigate();

    // Atualiza rota ao trocar semana/tipo
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
                columns={columns}
                toggleColumn={toggleColumn}
            />
            {view === 'table' && (
                <ChartWeekTable chart={chart} week={selectedWeek} type={selectedType} columns={columns} toggleColumn={toggleColumn} />
            )}
            {view === 'grid' && <ChartWeekGrid chart={chart} week={selectedWeek} type={selectedType} />}
            {view === 'list' && <ChartWeekList chart={chart} week={selectedWeek} type={selectedType} />}
        </Container>
    );
};

export default ChartsWeekPage;
