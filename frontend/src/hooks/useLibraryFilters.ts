import { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { selectLibraryFilters, updateLibraryFilter } from '../store/libraryFiltersSlice';

export const useLibraryFilters = () => {
  const dispatch = useDispatch<AppDispatch>();
  const state = useSelector((s: RootState) => selectLibraryFilters(s));

  // Legacy localStorage migration removed. Redux-persist handles persistence.

  const setField = <K extends keyof typeof state>(key: K, value: any) => {
    dispatch(updateLibraryFilter({ key, value } as any));
  };

  const stats = useMemo(() => ({ total: 0, number1s: 0, inChart: 0 }), []);

  return {
    selectedType: state.selectedType,
    setSelectedType: (v: any) => setField('selectedType', v),
    viewMode: state.viewMode,
    setViewMode: (v: any) => setField('viewMode', v),
    itemsPerPage: state.itemsPerPage,
    setItemsPerPage: (v: number) => setField('itemsPerPage', v),
    search: state.search,
    setSearch: (v: string) => setField('search', v),
    badgeStyle: state.badgeStyle,
    setBadgeStyle: (v: any) => setField('badgeStyle', v),
    visibleColumns: state.visibleColumns,
    setVisibleColumns: (v: any) => setField('visibleColumns', v),
    showGridPlays: state.showGridPlays,
    setShowGridPlays: (v: boolean) => setField('showGridPlays', v),
    showGridPeak: state.showGridPeak,
    setShowGridPeak: (v: boolean) => setField('showGridPeak', v),
    showGridPosition: state.showGridPosition,
    setShowGridPosition: (v: boolean) => setField('showGridPosition', v),
    page: state.page,
    setPage: (p: number) => setField('page', p),
    stats,
  };
};
