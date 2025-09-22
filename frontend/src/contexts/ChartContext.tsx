// src/contexts/ChartContext.tsx
import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';

interface Chart {
    id: number;
    user_id: number;
    name: string;
    source: string;
    lastfm_username: string;
    start_date: string;
    day_of_week: number;
    timezone: string;
    music_cutoff: number;
    album_cutoff: number;
    artist_cutoff: number;
    formula_name: string;
    music_points_weight: number;
    music_plays_weight: number;
    album_points_weight: number;
    album_plays_weight: number;
    music_gold_value: number;
    music_platinum_value: number;
    music_diamond_value: number;
    album_gold_value: number;
    album_platinum_value: number;
    album_diamond_value: number;
    created_at: string;
    updated_at: string;
}

interface ChartContextProps {
    charts: Chart[];
    isLoading: boolean;
    activeChartId: number | null;
    fetchCharts: () => Promise<void>;
    setActiveChartId: (id: number | null) => void;
    deleteChart: (chartId: number) => Promise<boolean>;
    createChart: (chartData: any) => Promise<boolean>;
    updateChart: (chartId: number, chartData: any) => Promise<boolean>;
}

const ChartContext = createContext<ChartContextProps | undefined>(undefined);

export const ChartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [charts, setCharts] = useState<Chart[]>([]);
    const [activeChartId, setActiveChartId] = useState<number | null>(() => {
        const storedId = localStorage.getItem('active-chart-id');
        return storedId ? Number(storedId) : null;
    });
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const { isAuthenticated, isAuthLoading } = useAuth();

    const fetchCharts = useCallback(async () => {
        const token = localStorage.getItem('user-token');
        if (!token) {
            setCharts([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch('/api/charts', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Falha na requisição dos charts');
            }

            const data = await response.json();
            setCharts(data);
        } catch (error) {
            console.error('Failed to fetch charts:', error);
            setCharts([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createChart = useCallback(async (chartData: any) => {
        const token = localStorage.getItem('user-token');
        if (!token) return false;

        try {
            const response = await fetch('/api/charts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(chartData),
            });

            if (!response.ok) throw new Error('Falha ao criar o chart');

            await fetchCharts();
            return true;
        } catch (error) {
            console.error('Falha ao criar o chart:', error);
            return false;
        }
    }, [fetchCharts]);

    const updateChart = useCallback(async (chartId: number, chartData: any) => {
        const token = localStorage.getItem('user-token');
        if (!token) return false;

        try {
            const response = await fetch(`/api/charts/${chartId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(chartData),
            });

            if (!response.ok) throw new Error('Falha ao atualizar o chart');

            await fetchCharts();
            return true;
        } catch (error) {
            console.error('Falha ao atualizar o chart:', error);
            return false;
        }
    }, [fetchCharts]);

    const deleteChart = useCallback(async (chartId: number) => {
        const token = localStorage.getItem('user-token');
        if (!token) {
            console.error('Nenhum token de autenticação encontrado.');
            return false;
        }

        try {
            const response = await fetch(`/api/charts/${chartId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Falha ao deletar o chart');
            }

            await fetchCharts();
            setActiveChartId((prevId) => (prevId === chartId ? null : prevId));
            return true; // Retorna sucesso
        } catch (error) {
            console.error('Falha ao deletar o chart:', error);
            return false; // Retorna falha
        }
    }, [fetchCharts]);

    useEffect(() => {
        if (isAuthLoading) {
            return;
        }
        if (isAuthenticated) {
            fetchCharts();
        } else {
            setCharts([]);
            setActiveChartId(null);
        }
    }, [isAuthenticated, fetchCharts, isAuthLoading]);

    useEffect(() => {
        if (activeChartId) {
            localStorage.setItem('active-chart-id', String(activeChartId));
        } else {
            localStorage.removeItem('active-chart-id');
        }
    }, [activeChartId]);

    const value = {
        charts,
        isLoading,
        activeChartId,
        fetchCharts,
        setActiveChartId,
        deleteChart,
        createChart,
        updateChart,
    };

    return (
        <ChartContext.Provider value={value}>{children}</ChartContext.Provider>
    );
};

export const useCharts = () => {
    const context = useContext(ChartContext);
    if (context === undefined) {
        throw new Error('useCharts deve ser usado dentro de um ChartProvider');
    }
    return context;
};