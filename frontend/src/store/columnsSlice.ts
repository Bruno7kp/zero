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
  { key: 'cert', label: 'Cert', labelComplete: 'charts.certLabel', visible: false, isColumn: true },
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
function hydrateView(view: 'table' | 'list' | 'grid'): ViewConfig {
  // tenta carregar config persistida
  try {
    const raw = localStorage.getItem(`chart_columns_config_${view}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      const savedCols: Array<{ key: string; visible: boolean }> = Array.isArray(parsed?.columns)
        ? parsed.columns
        : (parsed?.columns && typeof parsed.columns === 'object')
          ? Object.keys(parsed.columns).map(k => ({ key: k, visible: !!parsed.columns[k] }))
          : [];
      const settings: ViewSettings = {
        ...DEFAULT_VIEW_SETTINGS[view],
        ...(parsed?.settings || {})
      } as ViewSettings;
      // reconstrói colunas completas com base no defaultColumns preservando ordem/labels e visibilidade salva
      let cols = defaultColumns.map(dc => {
        const found = savedCols.find(c => c.key === dc.key);
        return { ...dc, visible: found != null ? found.visible : dc.visible };
      });
      // aplica mappings derivados (rank/plays) para garantir consistência com settings
      if (settings.rankVariationLocation) {
        cols = applyRankVariationMapping(cols, settings.rankVariationLocation, view);
      }
      if (settings.playsVariationDisplay) {
        cols = applyPlaysVariationDisplay(cols, settings.playsVariationDisplay, view);
      }
      return { columns: cols, settings };
    }
  } catch { /* ignore parse errors */ }
  return { columns: cloneDefaults(), settings: { ...DEFAULT_VIEW_SETTINGS[view] } };
}

function migrateLegacyLocalStorage(): Partial<ColumnsState> | null {
  // Antigo formato: chave única 'chart_columns_config' compartilhada entre as views.
  // Estruturas possíveis:
  // 1) { columns: { key: boolean, ... }, settings?: {...} }
  // 2) { columns: [ { key, visible }, ... ], settings?: {...} }
  try {
    const raw = localStorage.getItem('chart_columns_config');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    let savedCols: Array<{ key: string; visible: boolean }> = [];
    if (Array.isArray(parsed?.columns)) savedCols = parsed.columns;
    else if (parsed?.columns && typeof parsed.columns === 'object') {
      savedCols = Object.keys(parsed.columns).map(k => ({ key: k, visible: !!parsed.columns[k] }));
    }
    const tableCols = defaultColumns.map(dc => {
      const found = savedCols.find(c => c.key === dc.key);
      return { ...dc, visible: found != null ? found.visible : dc.visible };
    });
    const legacySettings = parsed?.settings || {};
    const tableSettings: ViewSettings = { ...DEFAULT_VIEW_SETTINGS.table, ...legacySettings } as ViewSettings;
    // Aplica mappings (caso antigo salvasse flags que mudam delta/alt variation)
    let adjusted = tableCols;
    if (tableSettings.rankVariationLocation) adjusted = applyRankVariationMapping(adjusted, tableSettings.rankVariationLocation, 'table');
    if (tableSettings.playsVariationDisplay) adjusted = applyPlaysVariationDisplay(adjusted, tableSettings.playsVariationDisplay, 'table');
    // Remove chave antiga para evitar reprocessar no futuro
    try { localStorage.removeItem('chart_columns_config'); } catch { /* ignore */ }
    return {
      views: {
        table: { columns: adjusted, settings: tableSettings },
        list: hydrateView('list'),
        grid: hydrateView('grid'),
      }
    } as ColumnsState;
  } catch { return null; }
}

function defaultState(): ColumnsState {
  const legacy = migrateLegacyLocalStorage();
  if (legacy && legacy.views) return legacy as ColumnsState;
  return {
    views: {
      table: hydrateView('table'),
      list: hydrateView('list'),
      grid: hydrateView('grid'),
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

// Garante em runtime (ex: rehydration via persist) que state tenha formato novo
function ensureViews(state: any): asserts state is ColumnsState {
  if (state.views) return;
  // Tenta migrar se detectar shape legado (columns/settings na raiz)
  if (Array.isArray(state.columns) || typeof state.columns === 'object') {
    const legacyCols = Array.isArray(state.columns)
      ? state.columns
      : Object.keys(state.columns || {}).map(k => ({ key: k, visible: !!state.columns[k] }));
    const rebuilt = defaultColumns.map(dc => {
      const found = legacyCols.find((c: any) => c.key === dc.key);
      return { ...dc, visible: found != null ? !!found.visible : dc.visible };
    });
    const legacySettings = state.settings || {};
    let adjusted = rebuilt;
    if (legacySettings.rankVariationLocation) adjusted = applyRankVariationMapping(adjusted, legacySettings.rankVariationLocation, 'table');
    if (legacySettings.playsVariationDisplay) adjusted = applyPlaysVariationDisplay(adjusted, legacySettings.playsVariationDisplay, 'table');
    state.views = {
      table: { columns: adjusted, settings: { ...DEFAULT_VIEW_SETTINGS.table, ...legacySettings } },
      list: hydrateView('list'),
      grid: hydrateView('grid'),
    };
    return;
  }
  // Fallback: simply build defaults
  state.views = {
    table: hydrateView('table'),
    list: hydrateView('list'),
    grid: hydrateView('grid'),
  };
}

const columnsSlice = createSlice({
  name: 'columns',
  initialState: buildInitialState(),
  reducers: {
    updateColumn(state, action: PayloadAction<{ view: 'table' | 'list' | 'grid'; key: string; visible: boolean }>) {
      ensureViews(state as any);
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
      ensureViews(state as any);
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
      ensureViews(state as any);
      const { view, size } = action.payload;
      state.views[view].settings.containerSize = size;
      persistView(view, state.views[view]);
    },
    setRankVariationLocation(state, action: PayloadAction<{ view: 'table' | 'list' | 'grid'; location: 'under' | 'column' | 'hidden' }>) {
      ensureViews(state as any);
      const { view } = action.payload;
      let { location } = action.payload;
      if (view === 'grid') location = location === 'hidden' ? 'hidden' : 'under';
      state.views[view].settings.rankVariationLocation = location;
      state.views[view].columns = applyRankVariationMapping(state.views[view].columns, location, view);
      // reaplicar plays mapping
      const disp = state.views[view].settings.playsVariationDisplay || DEFAULT_VIEW_SETTINGS[view].playsVariationDisplay || 'percent';
      state.views[view].columns = applyPlaysVariationDisplay(state.views[view].columns, disp, view);
      persistView(view, state.views[view]);
    },
    setPlaysVariationDisplay(state, action: PayloadAction<{ view: 'table' | 'list'; display: 'hidden' | 'absolute' | 'percent' }>) {
      ensureViews(state as any);
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
