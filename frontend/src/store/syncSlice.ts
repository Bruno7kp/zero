import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchCharts } from './charts';

interface SyncState {
  lastFullChartsSync: string | null;
  syncing: boolean;
  error: string | null;
  chartsCount: number;
}

const initialState: SyncState = {
  lastFullChartsSync: null,
  syncing: false,
  error: null,
  chartsCount: 0,
};

// Placeholder util to derive weeks cached for a chart
// (Removed weeks caching logic – weeks already stored locally)

export const syncCharts = createAsyncThunk(
  'sync/full',
  async (_: void, { dispatch, getState }) => {
    if (!navigator.onLine) return { skipped: true };
    await dispatch(fetchCharts());
    const state: any = getState();
    const charts = state.charts.charts || [];
    return { chartsCount: charts.length };
  }
);

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    clearSyncState(state) {
      state.lastFullChartsSync = null;
      state.chartsCount = 0;
    }
  },
  extraReducers: builder => {
    builder
      .addCase(syncCharts.pending, (state) => {
        state.syncing = true;
        state.error = null;
      })
      .addCase(syncCharts.fulfilled, (state, action) => {
        state.syncing = false;
        if (!(action.payload as any).skipped) {
          state.lastFullChartsSync = new Date().toISOString();
          state.chartsCount = (action.payload as any).chartsCount ?? state.chartsCount;
        }
      })
      .addCase(syncCharts.rejected, (state, action) => {
        state.syncing = false;
        state.error = action.error.message || 'Unknown error';
      });
  }
});

export const { clearSyncState } = syncSlice.actions;
export default syncSlice.reducer;