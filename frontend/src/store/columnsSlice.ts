import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface ColumnConfig {
  key: string;
  label: string;
  labelComplete?: string;
  visible: boolean;
}

export const defaultColumns: ColumnConfig[] = [
  { key: 'rank', label: 'Rank', labelComplete: 'charts.rankLabel', visible: true },
  { key: 'deltaRankBadge', label: 'charts.deltaRankLabel', visible: true },
  { key: 'altVariation', label: 'charts.altVariationLabel', visible: false },
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
      // Sempre usa as labels e ordem do defaultColumns, só aplica visibilidade do localStorage
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
      // Sempre usa a ordem e labels do defaultColumns, só aplica visibilidade do payload
      const merged = defaultColumns.map(col => {
        const found = action.payload.find(c => c.key === col.key);
        return found ? { ...col, visible: found.visible } : col;
      });
      state.columns = merged;
      const toSave = merged.map(col => ({ key: col.key, visible: col.visible }));
      localStorage.setItem('chartWeekColumns', JSON.stringify(toSave));
    },
    updateColumn(state, action: PayloadAction<{ key: string; visible: boolean }>) {
      // Atualiza visibilidade mantendo ordem e labels do defaultColumns
      const merged = defaultColumns.map(col => {
        const found = state.columns.find(c => c.key === col.key);
        if (col.key === action.payload.key) {
          return { ...col, visible: action.payload.visible };
        }
        return found ? { ...col, visible: found.visible } : col;
      });
      state.columns = merged;
      const toSave = merged.map(col => ({ key: col.key, visible: col.visible }));
      localStorage.setItem('chartWeekColumns', JSON.stringify(toSave));
    },
    resetColumns(state) {
      state.columns = [...defaultColumns];
      const toSave = defaultColumns.map(col => ({ key: col.key, visible: col.visible }));
      localStorage.setItem('chartWeekColumns', JSON.stringify(toSave));
    }
  }
});

export const { setColumns, updateColumn, resetColumns } = columnsSlice.actions;
export default columnsSlice.reducer;
