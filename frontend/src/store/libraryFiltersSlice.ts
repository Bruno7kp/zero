import { createSlice } from '@reduxjs/toolkit';

export type LibraryType = 'artist' | 'album' | 'track';
export type ViewMode = 'table' | 'grid';

export interface VisibleColumns {
  points: boolean;
  peak: boolean;
  weeks: boolean;
  sales: boolean;
  cert: boolean;
}

export interface LibraryFiltersState {
  selectedType: LibraryType;
  viewMode: ViewMode;
  itemsPerPage: number;
  search: string;
  badgeStyle: 'glass' | 'solid';
  visibleColumns: VisibleColumns;
  page: number;
  showGridPlays: boolean;
  showGridPeak: boolean;
  showGridPosition: boolean;
}

export const DEFAULT_VISIBLE_COLUMNS: VisibleColumns = {
  points: true,
  peak: true,
  weeks: true,
  sales: false,
  cert: false,
};

export const DEFAULT_LIBRARY_FILTERS: LibraryFiltersState = {
  selectedType: 'artist',
  viewMode: 'grid',
  itemsPerPage: 25,
  search: '',
  badgeStyle: 'glass',
  visibleColumns: DEFAULT_VISIBLE_COLUMNS,
  page: 1,
  showGridPlays: true,
  showGridPeak: true,
  showGridPosition: false,
};

const slice = createSlice({
  name: 'libraryFilters',
  initialState: DEFAULT_LIBRARY_FILTERS as LibraryFiltersState,
  reducers: {
    setLibraryFilters: (_state, action) => action.payload,
    updateLibraryFilter: (state, action) => {
      const { key, value } = action.payload as any;
      // @ts-expect-error dynamic key
      state[key] = value;
    },
    resetLibraryFilters: () => DEFAULT_LIBRARY_FILTERS,
  },
});

export const { setLibraryFilters, updateLibraryFilter, resetLibraryFilters } = slice.actions;
export const selectLibraryFilters = (s: any) => s.libraryFilters as LibraryFiltersState;
export default slice.reducer;
