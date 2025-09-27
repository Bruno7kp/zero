import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { db } from '../db/indexedDb';
import { apiUrl } from '../config';
import type { ChartData } from '../db/indexedDb';

export interface ChartsState {
  data: ChartData[];
  statsMap: Record<string, any>;
  loading: boolean;
  charts: any[];
  activeChartId: number | null;
}

const initialState: ChartsState = {
  data: [],
  statsMap: {},
  loading: false,
  charts: [],
  activeChartId: null,
};

export const fetchChartData = createAsyncThunk(
  'charts/fetchChartData',
  async ({ chartId, chartType, week }: { chartId: string; chartType: string; week: string }) => {
    const data = await db.charts_data
      .where(['chartId', 'chartType', 'week'])
      .equals([chartId, chartType, week])
      .toArray();
    return data;
  }
);

export const fetchStatsMap = createAsyncThunk(
  'charts/fetchStatsMap',
  async ({ chartId, chartType, data, cutoff, week }: { chartId: string; chartType: string; data: ChartData[]; cutoff: number; week: string }) => {
    const mod = await import('../utils/calculateStatsForEntityUntilWeek');
    const results = await Promise.all(
      data.map(row =>
        mod.calculateStatsForEntityUntilWeek(chartId, chartType, row.entityId, cutoff, week)
          .then(stats => [row.entityId, stats])
      )
    );
    const next: Record<string, any> = {};
    for (const [entityId, stats] of results) {
      if (entityId && stats) {
        next[String(entityId)] = stats;
      }
    }
    return next;
  }
);

// Exemplo de thunk para buscar charts do servidor
export const fetchCharts = createAsyncThunk(
  'charts/fetchCharts',
  async (_, { getState }) => {
    // Busca token do Redux ou localStorage
    const state: any = getState();
    const token = state.auth?.token || localStorage.getItem('user-token');
  const response = await fetch(apiUrl('/charts'), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error('Erro ao buscar charts');
    return await response.json();
  }
);

export const deleteChart = createAsyncThunk(
  'charts/deleteChart',
  async (chartId: number, { dispatch, getState, rejectWithValue }) => {
    try {
      const state: any = getState();
      const token = state.auth?.token || localStorage.getItem('user-token');
  const response = await fetch(apiUrl(`/charts/${chartId}`), {
        method: 'DELETE',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Accept': 'application/json'
        },
      });
      if (!response.ok) {
        let msg = `Erro ao deletar chart (status ${response.status})`;
        try {
          const data = await response.json();
          if (data?.message) msg = data.message;
        } catch {/* ignore parse error */}
        return rejectWithValue(msg);
      }
      // Remove dados locais relacionados ao chart (weeks + stats)
  await db.charts_data.where('chartId').equals(String(chartId)).delete();
  await db.charts_stats.where('chartId').equals(String(chartId)).delete();
  // Remove marcações de semanas completas, se tabela existir (versão >=12)
  try { await db.chart_weeks.where('chartId').equals(String(chartId)).delete(); } catch { /* ignore if older schema */ }
      // Atualiza lista
      dispatch(fetchCharts());
      return chartId;
    } catch (err: any) {
      return rejectWithValue(err.message || 'Erro ao deletar chart');
    }
  }
);

// Limpa apenas os dados (weeks + stats) de um chart preservando a configuração no backend
export const clearChartLocalData = createAsyncThunk(
  'charts/clearChartLocalData',
  async (chartId: number) => {
    await db.charts_data.where('chartId').equals(String(chartId)).delete();
    await db.charts_stats.where('chartId').equals(String(chartId)).delete();
    try { await db.chart_weeks.where('chartId').equals(String(chartId)).delete(); } catch { /* ignore */ }
    return chartId;
  }
);

export const createChart = createAsyncThunk(
  'charts/createChart',
  async (chartData: any, { dispatch, getState }) => {
    const state: any = getState();
    const token = state.auth?.token || localStorage.getItem('user-token');
  const response = await fetch(apiUrl('/charts'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(chartData),
    });
    if (!response.ok) throw new Error('Erro ao criar chart');
    dispatch(fetchCharts());
    return await response.json();
  }
);

export const updateChart = createAsyncThunk(
  'charts/updateChart',
  async ({ chartId, chartData }: { chartId: number, chartData: any }, { dispatch, getState }) => {
    const state: any = getState();
    const token = state.auth?.token || localStorage.getItem('user-token');
  const response = await fetch(apiUrl(`/charts/${chartId}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(chartData),
    });
    if (!response.ok) throw new Error('Erro ao atualizar chart');
    dispatch(fetchCharts());
    return await response.json();
  }
);

const chartsSlice = createSlice({
  name: 'charts',
  initialState,
  reducers: {
    setActiveChartId(state, action: PayloadAction<number | null>) {
      state.activeChartId = action.payload;
    },
    setCharts(state, action) {
      state.charts = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(fetchChartData.pending, state => {
        state.loading = true;
      })
      .addCase(fetchChartData.fulfilled, (state, action) => {
        state.data = action.payload as ChartData[];
        state.loading = false;
      })
      .addCase(fetchStatsMap.pending, state => {
        state.loading = true;
      })
      .addCase(fetchStatsMap.fulfilled, (state, action) => {
        state.statsMap = action.payload as Record<string, any>;
        state.loading = false;
      })
      .addCase(fetchCharts.pending, state => {
        state.loading = true;
      })
      .addCase(fetchCharts.fulfilled, (state, action) => {
        state.charts = action.payload;
        state.loading = false;
      })
      .addCase(deleteChart.fulfilled, (state, action) => {
        state.charts = state.charts.filter(chart => chart.id !== action.payload);
      });
    // clearChartLocalData does not alter charts list; optional side-effects could reset current stats/data
    builder.addCase(clearChartLocalData.fulfilled, (state, action) => {
      if (state.activeChartId === action.payload) {
        // If active chart was cleared, also clear currently loaded week data & stats map
        state.data = [];
        state.statsMap = {};
      }
    });
  },
});

export const { setActiveChartId, setCharts } = chartsSlice.actions;
export default chartsSlice.reducer;
