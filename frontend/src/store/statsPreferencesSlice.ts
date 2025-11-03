import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

// Keep the same shape as the previous hook
export interface StatsPreferences {
  showImages: boolean;
  showArtistColumn: boolean;
  showWeekColumn: boolean;
  showPositionColumn: boolean;
  fontSize: 'xs' | 'sm' | 'md';
  containerSize: '100%' | 'md' | 'lg' | 'xl';
  // whether the stats sidebar is collapsed (desktop)
  collapsed: boolean;
  // whether the collapsed sidebar is temporarily hidden
  sidebarHidden: boolean;
  showSales: boolean;
  peakOnly: boolean;
  pageSize: number;
}

export const DEFAULT_PREFERENCES: StatsPreferences = {
  showImages: true,
  showArtistColumn: false,
  showWeekColumn: true,
  showPositionColumn: true,
  fontSize: 'sm',
  containerSize: 'xl',
  collapsed: false,
  sidebarHidden: false,
  showSales: false,
  peakOnly: false,
  pageSize: 25,
};

const statsPreferencesSlice = createSlice({
  name: 'statsPreferences',
  initialState: DEFAULT_PREFERENCES as StatsPreferences,
  reducers: {
    setPreferences: (_state, action: PayloadAction<StatsPreferences>) => action.payload,
    updatePreference: <K extends keyof StatsPreferences>(
      state: StatsPreferences,
      action: PayloadAction<{ key: K; value: StatsPreferences[K] }>
    ) => {
      const { key, value } = action.payload as any;
      // mutating draft state is allowed by immer inside createSlice
      // @ts-expect-error narrowing via generic key
      state[key] = value;
    },
    resetPreferences: () => DEFAULT_PREFERENCES,
  },
});

export const { setPreferences, updatePreference, resetPreferences } = statsPreferencesSlice.actions;

export const selectStatsPreferences = (state: any) => state.statsPreferences as StatsPreferences;

export default statsPreferencesSlice.reducer;
