import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface ColumnConfig {
  key: string;
  label: string;
  labelComplete?: string;
  visible: boolean;
}

const defaultColumns: ColumnConfig[] = [
  { key: 'rank', label: 'Rank', labelComplete: 'charts.rankLabel', visible: true },
  { key: 'deltaRankBadge', label: 'charts.deltaRankLabel', visible: true },
  { key: 'image', label: 'charts.imageLabel', visible: true },
  { key: 'name', label: 'Title', labelComplete: 'charts.titleLabel', visible: true },
  { key: 'plays', label: 'Plays', labelComplete: 'charts.playsLabel', visible: true },
  { key: 'deltaPlaysBadge', label: 'charts.deltaPlaysLabel', visible: true },
  { key: 'peak', label: 'Peak', labelComplete: 'charts.peakLabel', visible: true },
  { key: 'totalWeeks', label: 'Weeks', labelComplete: 'charts.weeksLabel', visible: true },
];

const getInitialColumns = (): ColumnConfig[] => {
  const stored = localStorage.getItem('chartWeekColumns');
  if (stored) {
    try {
      const userPrefs: { key: string; visible: boolean }[] = JSON.parse(stored);
      // Merge userPrefs with defaultColumns
      return defaultColumns.map(col => {
        const pref = userPrefs.find(u => u.key === col.key);
        return pref ? { ...col, visible: pref.visible } : col;
      });
    } catch {
      // fallback to defaults if parse fails
      return defaultColumns;
    }
  }
  return defaultColumns;
};

const columnsSlice = createSlice({
  name: 'columns',
  initialState: { columns: getInitialColumns() },
  reducers: {
    setColumns(state, action: PayloadAction<ColumnConfig[]>) {
      state.columns = action.payload;
      // Save only {key, visible}
      const toSave = action.payload.map(col => ({ key: col.key, visible: col.visible }));
      localStorage.setItem('chartWeekColumns', JSON.stringify(toSave));
    },
    updateColumn(state, action: PayloadAction<{ key: string; visible: boolean }>) {
      const idx = state.columns.findIndex(c => c.key === action.payload.key);
      if (idx !== -1) {
        state.columns[idx].visible = action.payload.visible;
        // Save only {key, visible}
        const toSave = state.columns.map(col => ({ key: col.key, visible: col.visible }));
        localStorage.setItem('chartWeekColumns', JSON.stringify(toSave));
      }
    },
    resetColumns(state) {
      state.columns = defaultColumns;
      // Save only {key, visible}
      const toSave = defaultColumns.map(col => ({ key: col.key, visible: col.visible }));
      localStorage.setItem('chartWeekColumns', JSON.stringify(toSave));
    }
  }
});

export const { setColumns, updateColumn, resetColumns } = columnsSlice.actions;
export default columnsSlice.reducer;
