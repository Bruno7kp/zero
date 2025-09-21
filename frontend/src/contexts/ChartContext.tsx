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
    json: string;
    created_at: string;
    updated_at: string;
}

interface ChartContextProps {
    charts: Chart[];
    isLoading: boolean;
    activeChartId: number | null;
    fetchCharts: () => Promise<void>;
    setActiveChartId: (id: number | null) => void;
}

const ChartContext = createContext<ChartContextProps | undefined>(undefined);

export const ChartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [charts, setCharts] = useState<Chart[]>([]);
    const [activeChartId, setActiveChartId] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const { isAuthenticated } = useAuth();

    const fetchCharts = useCallback(async () => {
        // Recupera o token diretamente do localStorage
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

    useEffect(() => {
        if (isAuthenticated) {
            fetchCharts();
        } else {
            setCharts([]);
            setActiveChartId(null);
            setIsLoading(false);
        }
    }, [isAuthenticated, fetchCharts]);

    const value = {
        charts,
        isLoading,
        activeChartId,
        fetchCharts,
        setActiveChartId,
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
