import { useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import {
  selectLibraryFilters,
  updateLibraryFilter,
  type LibraryType,
  type ViewMode,
  type VisibleColumns,
  type LibraryFiltersState,
} from '../store/libraryFiltersSlice';

export const useLibraryFilters = () => {
  const dispatch = useDispatch<AppDispatch>();
  const state = useSelector((s: RootState) => selectLibraryFilters(s));

  // Legacy localStorage migration removed. Redux-persist handles persistence.

  const setField = useCallback(
    <K extends keyof typeof state>(key: K, value: (typeof state)[K]) => {
      dispatch(updateLibraryFilter({ key, value } as any));
    },
    [dispatch]
  );

  const stats = useMemo(() => ({ total: 0, number1s: 0, inChart: 0 }), []);

  return {
    selectedType: state.selectedType,
    setSelectedType: useCallback((v: LibraryType) => setField('selectedType', v), [setField]),
    viewMode: state.viewMode,
    setViewMode: useCallback((v: ViewMode) => setField('viewMode', v), [setField]),
    itemsPerPage: state.itemsPerPage,
    setItemsPerPage: useCallback((v: number) => setField('itemsPerPage', v), [setField]),
    search: state.search,
    setSearch: useCallback((v: string) => setField('search', v), [setField]),
    badgeStyle: state.badgeStyle,
    setBadgeStyle: useCallback(
      (v: LibraryFiltersState['badgeStyle']) => setField('badgeStyle', v),
      [setField]
    ),
    visibleColumns: state.visibleColumns,
    setVisibleColumns: useCallback(
      (v: VisibleColumns) => setField('visibleColumns', v),
      [setField]
    ),
    showGridPlays: state.showGridPlays,
    setShowGridPlays: useCallback((v: boolean) => setField('showGridPlays', v), [setField]),
    showGridPeak: state.showGridPeak,
    setShowGridPeak: useCallback((v: boolean) => setField('showGridPeak', v), [setField]),
    showGridPosition: state.showGridPosition,
    setShowGridPosition: useCallback((v: boolean) => setField('showGridPosition', v), [setField]),
    page: state.page,
    setPage: useCallback((p: number) => setField('page', p), [setField]),
    stats,
  };
};
