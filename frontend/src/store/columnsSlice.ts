import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

// Configuração de uma coluna individual
export interface ColumnConfig {
  key: string;
  isColumn?: boolean; // se representa uma coluna real na tabela/lista
  label: string; // chave simples ou label direto
  labelComplete?: string; // chave completa de tradução
  visible: boolean; // visibilidade (atributo boolean)
}

// Configurações adicionais por view que não são booleanas
export interface ViewSettings {
  containerSize: 'md' | 'lg' | 'xl' | '100%';
  rankVariationLocation?: 'under' | 'column' | 'hidden';
  playsVariationDisplay?: 'hidden' | 'absolute' | 'percent'; // tabela/lista
}

export interface ViewConfig {
  columns: ColumnConfig[];
  settings: ViewSettings;
}

export interface ColumnsState { views: Record<'table' | 'list' | 'grid', ViewConfig>; }

export const defaultColumns: ColumnConfig[] = [
  { key: 'rank', label: 'Rank', labelComplete: 'charts.rankLabel', visible: true, isColumn: true },
  { key: 'deltaRankBadge', label: 'charts.deltaRankLabel', visible: true, isColumn: false },
  { key: 'altVariation', label: 'charts.altVariationLabel', visible: false, isColumn: true },
  { key: 'image', label: 'charts.imageLabel', visible: true, isColumn: false },
  { key: 'name', label: 'Title', labelComplete: 'charts.titleLabel', visible: true, isColumn: true },
  { key: 'plays', label: 'Plays', labelComplete: 'charts.playsLabel', visible: true, isColumn: true },
  { key: 'deltaPlaysBadge', label: 'charts.deltaPlaysLabel', visible: false, isColumn: false },
  { key: 'deltaPercentPlaysBadge', label: 'charts.deltaPercentPlaysLabel', visible: true, isColumn: false },
  { key: 'peak', label: 'Peak', labelComplete: 'charts.peakLabel', visible: true, isColumn: true },
  { key: 'totalWeeks', label: 'Weeks', labelComplete: 'charts.weeksLabel', visible: true, isColumn: true },
];

// Retorna clone profundo simples
const cloneDefaults = () => defaultColumns.map(c => ({ ...c }));

const DEFAULT_VIEW_SETTINGS: Record<'table' | 'list' | 'grid', ViewSettings> = {
  table: { containerSize: 'md', rankVariationLocation: 'under', playsVariationDisplay: 'percent' },
  // Lista: pedido para default ser coluna (variação em coluna)
  list: { containerSize: 'md', rankVariationLocation: 'column', playsVariationDisplay: 'percent' },
  grid: { containerSize: 'xl', rankVariationLocation: 'under', playsVariationDisplay: 'hidden' },
};

// (helpers legacy removidos – lógica agora fica apenas nos reducers diretos)

function applyRankVariationMapping(cols: ColumnConfig[], location: 'under' | 'column' | 'hidden', view: 'table' | 'list' | 'grid'): ColumnConfig[] {
  return cols.map(c => {
    if (c.key === 'deltaRankBadge') {
      if (view === 'grid') return { ...c, visible: location !== 'hidden' }; // grid: only show/hide badge overlay
      return { ...c, visible: location === 'under' };
    }
    if (c.key === 'altVariation') {
      if (view === 'grid') return { ...c, visible: false }; // grid will not use separate column
      return { ...c, visible: location === 'column' };
    }
    return c;
  });
}

function applyPlaysVariationDisplay(cols: ColumnConfig[], display: 'hidden' | 'absolute' | 'percent', view: 'table' | 'list' | 'grid'): ColumnConfig[] {
  if (view === 'grid') {
    return cols.map(c => (c.key === 'deltaPlaysBadge' || c.key === 'deltaPercentPlaysBadge') ? { ...c, visible: false } : c);
  }
  return cols.map(c => {
    if (c.key === 'deltaPlaysBadge') return { ...c, visible: display === 'absolute' };
    if (c.key === 'deltaPercentPlaysBadge') return { ...c, visible: display === 'percent' };
    return c;
  });
}

// Gera estado default puro
function defaultState(): ColumnsState {
  return {
    views: {
      table: { columns: cloneDefaults(), settings: { ...DEFAULT_VIEW_SETTINGS.table } },
      list: { columns: cloneDefaults(), settings: { ...DEFAULT_VIEW_SETTINGS.list } },
      grid: { columns: cloneDefaults(), settings: { ...DEFAULT_VIEW_SETTINGS.grid } },
    }
  };
}

// Estado inicial simples (sem suporte a formatos legados)
function buildInitialState(): ColumnsState {
  return defaultState();
}

const persistView = (view: 'table' | 'list' | 'grid', cfg: ViewConfig) => {
  try {
    const toSave = {
      columns: cfg.columns.map(c => ({ key: c.key, visible: c.visible })),
      settings: cfg.settings,
    };
    localStorage.setItem(`chart_columns_config_${view}`, JSON.stringify(toSave));
  } catch { /* noop */ }
};

const columnsSlice = createSlice({
  name: 'columns',
  initialState: buildInitialState(),
  reducers: {
    updateColumn(state, action: PayloadAction<{ view: 'table' | 'list' | 'grid'; key: string; visible: boolean }>) {
      const { view, key, visible } = action.payload;
      const viewConfig = state.views[view];
      // Mantém ordem e labels do defaultColumns
      viewConfig.columns = defaultColumns.map(dc => {
        const current = viewConfig.columns.find(c => c.key === dc.key) || dc;
        if (dc.key === key) {
          return { ...dc, visible };
        }
        return { ...dc, visible: current.visible };
      });
      persistView(view, viewConfig);
    },
    resetColumns(state, action: PayloadAction<{ view: 'table' | 'list' | 'grid' }>) {
      const { view } = action.payload;
      state.views[view].columns = cloneDefaults();
      // Reseta também o tamanho do container para o default da view
      state.views[view].settings.containerSize = DEFAULT_VIEW_SETTINGS[view].containerSize;
      state.views[view].settings.rankVariationLocation = DEFAULT_VIEW_SETTINGS[view].rankVariationLocation;
      state.views[view].settings.playsVariationDisplay = DEFAULT_VIEW_SETTINGS[view].playsVariationDisplay;
      state.views[view].columns = applyRankVariationMapping(state.views[view].columns, state.views[view].settings.rankVariationLocation!, view);
      state.views[view].columns = applyPlaysVariationDisplay(state.views[view].columns, state.views[view].settings.playsVariationDisplay || 'percent', view);
      persistView(view, state.views[view]);
    },
    setContainerSize(state, action: PayloadAction<{ view: 'table' | 'list' | 'grid'; size: 'md' | 'lg' | 'xl' | '100%' }>) {
      const { view, size } = action.payload;
      state.views[view].settings.containerSize = size;
      persistView(view, state.views[view]);
    },
    setRankVariationLocation(state, action: PayloadAction<{ view: 'table' | 'list' | 'grid'; location: 'under' | 'column' | 'hidden' }>) {
      let { view, location } = action.payload;
      if (view === 'grid') location = location === 'hidden' ? 'hidden' : 'under';
      state.views[view].settings.rankVariationLocation = location;
      state.views[view].columns = applyRankVariationMapping(state.views[view].columns, location, view);
      // reaplicar plays mapping
      const disp = state.views[view].settings.playsVariationDisplay || DEFAULT_VIEW_SETTINGS[view].playsVariationDisplay || 'percent';
      state.views[view].columns = applyPlaysVariationDisplay(state.views[view].columns, disp, view);
      persistView(view, state.views[view]);
    },
    setPlaysVariationDisplay(state, action: PayloadAction<{ view: 'table' | 'list'; display: 'hidden' | 'absolute' | 'percent' }>) {
      const { view, display } = action.payload;
      state.views[view].settings.playsVariationDisplay = display;
      state.views[view].columns = applyPlaysVariationDisplay(state.views[view].columns, display, view);
      persistView(view, state.views[view]);
    },
  },
  extraReducers: () => {}
});

export const { updateColumn, resetColumns, setContainerSize, setRankVariationLocation, setPlaysVariationDisplay } = columnsSlice.actions;
export default columnsSlice.reducer;
