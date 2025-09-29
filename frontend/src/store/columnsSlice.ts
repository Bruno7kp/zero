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
  { key: 'altVariation', label: 'Δ', visible: false },
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
      // Merge userPrefs with defaultColumns, garantindo que colunas novas sejam adicionadas
      const merged = defaultColumns.map(col => {
        const pref = userPrefs.find(u => u.key === col.key);
        return pref ? { ...col, visible: pref.visible } : col;
      });
      // Adiciona colunas do userPrefs que não existem mais no defaultColumns (caso o usuário tenha prefs antigas)
      userPrefs.forEach(pref => {
        if (!merged.find(col => col.key === pref.key)) {
          merged.push({ key: pref.key, label: pref.key, visible: pref.visible });
        }
      });
      return merged;
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
      // Garante que todas as colunas do defaultColumns estejam presentes
      const merged = defaultColumns.map(col => {
        const found = action.payload.find(c => c.key === col.key);
        return found ? { ...col, visible: found.visible } : col;
      });
      // Adiciona colunas customizadas do payload que não existem no defaultColumns
      action.payload.forEach(col => {
        if (!merged.find(c => c.key === col.key)) {
          merged.push(col);
        }
      });
      state.columns = merged;
      const toSave = merged.map(col => ({ key: col.key, visible: col.visible }));
      localStorage.setItem('chartWeekColumns', JSON.stringify(toSave));
    },
    updateColumn(state, action: PayloadAction<{ key: string; visible: boolean }>) {
      // Atualiza visibilidade
      const idx = state.columns.findIndex(c => c.key === action.payload.key);
      if (idx !== -1) {
        state.columns[idx].visible = action.payload.visible;
      }
      // Garante que todas as colunas do defaultColumns estejam presentes
      defaultColumns.forEach(col => {
        if (!state.columns.find(c => c.key === col.key)) {
          state.columns.push({ ...col });
        }
      });
      const toSave = state.columns.map(col => ({ key: col.key, visible: col.visible }));
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
