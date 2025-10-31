import type { ColumnsState, ViewConfig, ViewSettings } from './types';
import { defaultColumns, cloneDefaults, DEFAULT_VIEW_SETTINGS } from './defaults';
import { applyArtistDisplayMode, applyPlaysVariationDisplay, applyRankVariationMapping } from './mappings';
import * as storage from '../../utils/storage';

export const hydrateView = (view: 'table' | 'list' | 'grid'): ViewConfig => {
  try {
    const parsed = storage.getJson<any>(`chart_columns_config_${view}`, []);
    if (parsed) {
      const savedCols: Array<{ key: string; visible: boolean }> = Array.isArray(parsed?.columns)
        ? parsed.columns
        : (parsed?.columns && typeof parsed.columns === 'object')
          ? Object.keys(parsed.columns).map(k => ({ key: k, visible: !!parsed.columns[k] }))
          : [];
      const settings: ViewSettings = {
        ...DEFAULT_VIEW_SETTINGS[view],
        ...(parsed?.settings || {})
      } as ViewSettings;
      let cols = defaultColumns.map(dc => {
        const found = savedCols.find(c => c.key === dc.key);
        return { ...dc, visible: found != null ? found.visible : dc.visible };
      });
      if (settings.rankVariationLocation) cols = applyRankVariationMapping(cols, settings.rankVariationLocation, view);
      cols = applyPlaysVariationDisplay(
        cols,
        settings.playsVariationDisplay || DEFAULT_VIEW_SETTINGS[view].playsVariationDisplay || 'percent',
        settings.playsVariationLocation || DEFAULT_VIEW_SETTINGS[view].playsVariationLocation,
        view
      );
      if (settings.artistDisplayMode) cols = applyArtistDisplayMode(cols, settings.artistDisplayMode, view);
      return { columns: cols, settings };
    }
  } catch { /* ignore parse errors */ }
  return { columns: cloneDefaults(), settings: { ...DEFAULT_VIEW_SETTINGS[view] } };
};

export const migrateLegacyLocalStorage = (): Partial<ColumnsState> | null => {
  try {
    const parsed = storage.getJson<any>('chart_columns_config', []);
    if (!parsed) return null;
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
    let adjusted = tableCols;
    if (tableSettings.rankVariationLocation) adjusted = applyRankVariationMapping(adjusted, tableSettings.rankVariationLocation, 'table');
    adjusted = applyPlaysVariationDisplay(
      adjusted,
      tableSettings.playsVariationDisplay || DEFAULT_VIEW_SETTINGS.table.playsVariationDisplay!,
      tableSettings.playsVariationLocation || DEFAULT_VIEW_SETTINGS.table.playsVariationLocation,
      'table'
    );
    if (tableSettings.artistDisplayMode) adjusted = applyArtistDisplayMode(adjusted, tableSettings.artistDisplayMode, 'table');
    try { storage.remove('chart_columns_config'); } catch { /* ignore */ }
    return {
      views: {
        table: { columns: adjusted, settings: tableSettings },
        list: hydrateView('list'),
        grid: hydrateView('grid'),
      }
    } as ColumnsState;
  } catch { return null; }
};

export const defaultState = (): ColumnsState => {
  const legacy = migrateLegacyLocalStorage();
  if (legacy && (legacy as any).views) return legacy as ColumnsState;
  return {
    views: {
      table: hydrateView('table'),
      list: hydrateView('list'),
      grid: hydrateView('grid'),
    },
    showCarousel: false,
  };
};

export const buildInitialState = (): ColumnsState => {
  const base = defaultState();
  try {
    const parsed = storage.getJson<any>('columns.global', []);
    if (parsed) {
      if (typeof parsed.showCarousel === 'boolean') base.showCarousel = parsed.showCarousel;
    }
  } catch { /* ignore */ }
  return base;
};

export const persistView = (view: 'table' | 'list' | 'grid', cfg: ViewConfig) => {
  try {
    const toSave = {
      columns: cfg.columns.map(c => ({ key: c.key, visible: c.visible })),
      settings: cfg.settings,
    };
    storage.setJson(`chart_columns_config_${view}`, toSave);
  } catch { /* noop */ }
};

export const persistGlobal = (state: ColumnsState) => {
  try {
    storage.setJson('columns.global', { showCarousel: !!state.showCarousel });
  } catch { /* noop */ }
};

export function ensureViews(state: any): asserts state is ColumnsState {
  if (state.views) return;
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
    adjusted = applyPlaysVariationDisplay(
      adjusted,
      legacySettings.playsVariationDisplay || DEFAULT_VIEW_SETTINGS.table.playsVariationDisplay!,
      legacySettings.playsVariationLocation || DEFAULT_VIEW_SETTINGS.table.playsVariationLocation,
      'table'
    );
    if (legacySettings.artistDisplayMode) adjusted = applyArtistDisplayMode(adjusted, legacySettings.artistDisplayMode, 'table');
    state.views = {
      table: { columns: adjusted, settings: { ...DEFAULT_VIEW_SETTINGS.table, ...legacySettings } },
      list: hydrateView('list'),
      grid: hydrateView('grid'),
    };
    return;
  }
  state.views = {
    table: hydrateView('table'),
    list: hydrateView('list'),
    grid: hydrateView('grid'),
  };
}
