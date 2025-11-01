import type { ColumnsState, ViewConfig } from './types';
import { defaultColumns, cloneDefaults, DEFAULT_VIEW_SETTINGS } from './defaults';
import {
  applyArtistDisplayMode,
  applyPlaysVariationDisplay,
  applyRankVariationMapping,
} from './mappings';
export const hydrateView = (view: 'table' | 'list' | 'grid'): ViewConfig => {
  // Legacy localStorage read removed. Always use defaults; persisted state is
  // handled by redux-persist. If users had previous localStorage config they
  // will fall back to defaults.
  return { columns: cloneDefaults(), settings: { ...DEFAULT_VIEW_SETTINGS[view] } };
};

export const defaultState = (): ColumnsState => ({
  views: {
    table: hydrateView('table'),
    list: hydrateView('list'),
    grid: hydrateView('grid'),
  },
  showCarousel: false,
});

export const buildInitialState = (): ColumnsState => defaultState();

export const persistView = (_view: 'table' | 'list' | 'grid', _cfg: ViewConfig) => {
  // persistence is handled by redux-persist at the store level; avoid
  // writing to localStorage here to prevent duplication and conflicting writes.
  return;
};

export const persistGlobal = (_state: ColumnsState) => {
  // noop: global persistence is handled by redux-persist
  return;
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
    if (legacySettings.rankVariationLocation)
      adjusted = applyRankVariationMapping(adjusted, legacySettings.rankVariationLocation, 'table');
    adjusted = applyPlaysVariationDisplay(
      adjusted,
      legacySettings.playsVariationDisplay || DEFAULT_VIEW_SETTINGS.table.playsVariationDisplay!,
      legacySettings.playsVariationLocation || DEFAULT_VIEW_SETTINGS.table.playsVariationLocation,
      'table'
    );
    if (legacySettings.artistDisplayMode)
      adjusted = applyArtistDisplayMode(adjusted, legacySettings.artistDisplayMode, 'table');
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
