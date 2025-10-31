import { createSlice } from '@reduxjs/toolkit';

export type ChartsWeeksViewMode = 'timeline' | 'table' | 'grid';

export interface ChartsWeeksState {
  viewMode: ChartsWeeksViewMode;
  typeFilter: string[];
  itemsPerPage: number;
  badgeStyle: 'glass' | 'solid';
}

export const DEFAULT_CHARTS_WEEKS: ChartsWeeksState = {
  viewMode: 'timeline',
  typeFilter: ['artist', 'album', 'track'],
  itemsPerPage: 25,
  badgeStyle: 'glass',
};

const slice = createSlice({
  name: 'chartsWeeks',
  initialState: DEFAULT_CHARTS_WEEKS as ChartsWeeksState,
  reducers: {
    setChartsWeeks: (_state, action) => action.payload,
    updateChartsWeeks: (state, action) => {
      const { key, value } = action.payload as any;
      // @ts-expect-error dynamic key
      state[key] = value;
    },
    resetChartsWeeks: () => DEFAULT_CHARTS_WEEKS,
  },
});

export const { setChartsWeeks, updateChartsWeeks, resetChartsWeeks } = slice.actions;
export const selectChartsWeeks = (s: any) => s.chartsWeeks as ChartsWeeksState;
export default slice.reducer;
