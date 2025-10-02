import { createSlice } from '@reduxjs/toolkit';
import { REHYDRATE } from 'redux-persist';
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
  { key: 'deltaPlaysBadge', label: 'charts.deltaPlaysLabel', visible: true, isColumn: false },
  { key: 'deltaPercentPlaysBadge', label: 'charts.deltaPercentPlaysLabel', visible: true, isColumn: false },
  { key: 'peak', label: 'Peak', labelComplete: 'charts.peakLabel', visible: true, isColumn: true },
  { key: 'totalWeeks', label: 'Weeks', labelComplete: 'charts.weeksLabel', visible: true, isColumn: true },
];

// Retorna clone profundo simples
const cloneDefaults = () => defaultColumns.map(c => ({ ...c }));

const DEFAULT_VIEW_SETTINGS: Record<'table' | 'list' | 'grid', ViewSettings> = {
  table: { containerSize: 'md' },
  list: { containerSize: 'md' },
  grid: { containerSize: 'xl' },
};

// Alinha uma lista de colunas existente ao default (mantém ordem do default e visibilidades quando existir)
function alignColumns(existing: any): ColumnConfig[] {
  return defaultColumns.map(dc => {
    const found = Array.isArray(existing) ? existing.find((c: any) => c.key === dc.key) : undefined;
    return found ? { ...dc, visible: !!found.visible } : { ...dc };
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

// Faz merge preenchendo campos faltantes (deep-ish merge controlado)
function mergeWithDefaults(partial: any): ColumnsState {
  const base = defaultState();
  if (!partial || typeof partial !== 'object') return base;
  (['table','list','grid'] as const).forEach(view => {
    const incomingView = partial.views?.[view];
    if (incomingView) {
      // Columns
      base.views[view].columns = alignColumns(incomingView.columns);
      // Settings
      const incSettings = incomingView.settings || {};
      base.views[view].settings = {
        containerSize: ['md','lg','xl','100%'].includes(incSettings.containerSize) ? incSettings.containerSize : DEFAULT_VIEW_SETTINGS[view].containerSize,
      };
    }
  });
  return base;
}

// Migração / carga inicial simples: tenta cada chave e faz merge
function buildInitialState(): ColumnsState {
  const legacySingle = (() => {
    try {
      const stored = localStorage.getItem('chartWeekColumns');
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : null;
    } catch { return null; }
  })();

  const initial = defaultState();

  // Se havia formato legado simples, aplica a TODAS as views como ponto de partida
  if (legacySingle) {
    (['table','list','grid'] as const).forEach(v => {
      initial.views[v].columns = alignColumns(legacySingle);
    });
  }

  (['table','list','grid'] as const).forEach(view => {
    try {
      const raw = localStorage.getItem(`chart_columns_config_${view}`);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      initial.views[view].columns = alignColumns(parsed?.columns);
      const size = parsed?.settings?.containerSize;
      if (['md','lg','xl','100%'].includes(size)) initial.views[view].settings.containerSize = size;
    } catch { /* noop */ }
  });

  return initial;
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
      persistView(view, state.views[view]);
    },
    setContainerSize(state, action: PayloadAction<{ view: 'table' | 'list' | 'grid'; size: 'md' | 'lg' | 'xl' | '100%' }>) {
      const { view, size } = action.payload;
      state.views[view].settings.containerSize = size;
      persistView(view, state.views[view]);
    },
    // (migrateLegacy removido - merge automático cobre casos)
  },
  extraReducers: builder => {
    // Rehydrate: sempre faz merge com defaults para campo faltante
    builder.addCase(REHYDRATE as any, (state, action: any) => {
      const inbound = action.payload?.columns;
      if (!inbound) return;
      const merged = mergeWithDefaults(inbound);
      state.views = merged.views; // substitui tudo por versão saneada
      // Persiste de volta (garante normalização)
      (['table','list','grid'] as const).forEach(view => persistView(view, state.views[view]));
    });
  }
});

export const { updateColumn, resetColumns, setContainerSize } = columnsSlice.actions;
export default columnsSlice.reducer;
