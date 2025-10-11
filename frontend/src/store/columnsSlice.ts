import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { DEFAULT_VIEW_SETTINGS, defaultColumns, cloneDefaults } from './columns/defaults';
import { applyArtistDisplayMode, applyPlaysVariationDisplay, applyRankVariationMapping } from './columns/mappings';
import { buildInitialState, ensureViews, persistView, persistGlobal } from './columns/state';
export type { ColumnsState, ColumnConfig, ViewConfig, ViewSettings } from './columns/types';
export { DEFAULT_VIEW_SETTINGS as COLUMNS_DEFAULT_VIEW_SETTINGS, defaultColumns as COLUMNS_DEFAULT_COLUMNS } from './columns/defaults';

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
        const current = viewConfig.columns.find((c: any) => c.key === dc.key) || dc;
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
  state.views[view].settings.fontScale = DEFAULT_VIEW_SETTINGS[view].fontScale;
      state.views[view].settings.rankVariationLocation = DEFAULT_VIEW_SETTINGS[view].rankVariationLocation;
      state.views[view].settings.playsVariationDisplay = DEFAULT_VIEW_SETTINGS[view].playsVariationDisplay;
      state.views[view].settings.playsVariationLocation = DEFAULT_VIEW_SETTINGS[view].playsVariationLocation;
      state.views[view].settings.tableBackground = DEFAULT_VIEW_SETTINGS[view].tableBackground;
      state.views[view].settings.listBackground = DEFAULT_VIEW_SETTINGS[view].listBackground;
  state.views[view].settings.peakCountStyle = DEFAULT_VIEW_SETTINGS[view].peakCountStyle;
      state.views[view].settings.artistDisplayMode = DEFAULT_VIEW_SETTINGS[view].artistDisplayMode;
      state.views[view].settings.listPeakWeeksCombined = DEFAULT_VIEW_SETTINGS[view].listPeakWeeksCombined;
      state.views[view].settings.showDroppedItems = DEFAULT_VIEW_SETTINGS[view].showDroppedItems;
      state.views[view].settings.showFormulaInsteadOfPlays = DEFAULT_VIEW_SETTINGS[view].showFormulaInsteadOfPlays;
      state.views[view].columns = applyRankVariationMapping(state.views[view].columns, state.views[view].settings.rankVariationLocation!, view);
      state.views[view].columns = applyPlaysVariationDisplay(state.views[view].columns, state.views[view].settings.playsVariationDisplay || 'percent', state.views[view].settings.playsVariationLocation || DEFAULT_VIEW_SETTINGS[view].playsVariationLocation, view);
      state.views[view].columns = applyArtistDisplayMode(state.views[view].columns, state.views[view].settings.artistDisplayMode || 'under', view);
      persistView(view, state.views[view]);
    },
    setPeakCountStyle(state, action: PayloadAction<{ view: 'table' | 'list' | 'grid'; mode: 'withCount' | 'noCount' }>) {
      ensureViews(state as any);
      const { view, mode } = action.payload;
      state.views[view].settings.peakCountStyle = mode;
      persistView(view, state.views[view]);
    },
    setContainerSize(state, action: PayloadAction<{ view: 'table' | 'list' | 'grid'; size: 'md' | 'lg' | 'xl' | '100%' }>) {
      ensureViews(state as any);
      const { view, size } = action.payload;
      state.views[view].settings.containerSize = size;
      persistView(view, state.views[view]);
    },
    setRankVariationLocation(state, action: PayloadAction<{ view: 'table' | 'list' | 'grid'; location: 'under' | 'column' | 'hidden' | 'corner' }>) {
      ensureViews(state as any);
      const { view } = action.payload;
      const { location } = action.payload;
      state.views[view].settings.rankVariationLocation = location;
      state.views[view].columns = applyRankVariationMapping(state.views[view].columns, location, view);
      // reaplicar plays mapping
      const disp = state.views[view].settings.playsVariationDisplay || DEFAULT_VIEW_SETTINGS[view].playsVariationDisplay || 'percent';
      const playsLoc = state.views[view].settings.playsVariationLocation || DEFAULT_VIEW_SETTINGS[view].playsVariationLocation || 'under';
      state.views[view].columns = applyPlaysVariationDisplay(state.views[view].columns, disp, playsLoc, view);
      // keep artist mapping consistent
      const artistMode = state.views[view].settings.artistDisplayMode || DEFAULT_VIEW_SETTINGS[view].artistDisplayMode || 'under';
      state.views[view].columns = applyArtistDisplayMode(state.views[view].columns, artistMode, view);
      persistView(view, state.views[view]);
    },
    setPlaysVariationDisplay(state, action: PayloadAction<{ view: 'table' | 'list'; display: 'hidden' | 'absolute' | 'percent' }>) {
      ensureViews(state as any);
      const { view, display } = action.payload;
      state.views[view].settings.playsVariationDisplay = display;
      const playsLoc = state.views[view].settings.playsVariationLocation || DEFAULT_VIEW_SETTINGS[view].playsVariationLocation || 'under';
      state.views[view].columns = applyPlaysVariationDisplay(state.views[view].columns, display, playsLoc, view);
      persistView(view, state.views[view]);
    },
    // New: control plays variation visibility/placement for table/list
    setPlaysVariationLocation(state, action: PayloadAction<{ view: 'table' | 'list'; location: 'hidden' | 'under' | 'column' }>) {
      ensureViews(state as any);
      const { view, location } = action.payload;
      state.views[view].settings.playsVariationLocation = location;
      // Re-apply with current display option
      const disp = state.views[view].settings.playsVariationDisplay || DEFAULT_VIEW_SETTINGS[view].playsVariationDisplay || 'percent';
      state.views[view].columns = applyPlaysVariationDisplay(state.views[view].columns, disp, location, view);
      persistView(view, state.views[view]);
    },
    setTableBackground(state, action: PayloadAction<{ background: 'default' | 'transparent' }>) {
      ensureViews(state as any);
      state.views.table.settings.tableBackground = action.payload.background;
      persistView('table', state.views.table);
    },
    setListBackground(state, action: PayloadAction<{ background: 'default' | 'transparent' }>) {
      ensureViews(state as any);
      state.views.list.settings.listBackground = action.payload.background;
      persistView('list', state.views.list);
    },
    setArtistDisplayMode(state, action: PayloadAction<{ view: 'table'; mode: 'under' | 'column' }>) {
      ensureViews(state as any);
      const { view, mode } = action.payload;
      state.views[view].settings.artistDisplayMode = mode;
      state.views[view].columns = applyArtistDisplayMode(state.views[view].columns, mode, view);
      persistView(view, state.views[view]);
    },
    setFontScale(state, action: PayloadAction<{ view: 'table' | 'list' | 'grid'; scale: -2 | -1 | 0 | 1 | 2 }>) {
      ensureViews(state as any);
      const { view, scale } = action.payload;
      state.views[view].settings.fontScale = scale;
      persistView(view, state.views[view]);
    },
    setListPeakWeeksCombined(state, action: PayloadAction<{ combined: boolean }>) {
      ensureViews(state as any);
      state.views.list.settings.listPeakWeeksCombined = action.payload.combined;
      persistView('list', state.views.list);
    },
    setShowDroppedItems(state, action: PayloadAction<{ view: 'table' | 'list' | 'grid'; show: boolean }>) {
      ensureViews(state as any);
      const { view, show } = action.payload;
      state.views[view].settings.showDroppedItems = show;
      persistView(view, state.views[view]);
    },
    setShowFormulaInsteadOfPlays(state, action: PayloadAction<{ view: 'table' | 'list' | 'grid'; show: boolean }>) {
      ensureViews(state as any);
      const { view, show } = action.payload;
      state.views[view].settings.showFormulaInsteadOfPlays = show;
      persistView(view, state.views[view]);
    },
    setShowCarousel(state, action: PayloadAction<boolean>) {
      state.showCarousel = action.payload;
      persistGlobal(state as any);
    },
  },
  extraReducers: () => {}
});

export const { updateColumn, resetColumns, setContainerSize, setRankVariationLocation, setPlaysVariationDisplay, setPlaysVariationLocation, setTableBackground, setListBackground, setArtistDisplayMode, setPeakCountStyle, setFontScale, setListPeakWeeksCombined, setShowDroppedItems, setShowFormulaInsteadOfPlays, setShowCarousel } = columnsSlice.actions;
export default columnsSlice.reducer;
