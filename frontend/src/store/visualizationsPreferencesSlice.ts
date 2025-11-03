import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface VisualizationsPreferences {
  containerSize: '100%' | 'md' | 'lg' | 'xl';
  // Removed - now using shared statsPreferences for sidebar state
  // collapsed: boolean;
  // sidebarMode: 'fixed' | 'speedDial';
}

export const DEFAULT_VISUALIZATIONS_PREFERENCES: VisualizationsPreferences = {
  containerSize: 'xl',
};

const visualizationsPreferencesSlice = createSlice({
  name: 'visualizationsPreferences',
  initialState: DEFAULT_VISUALIZATIONS_PREFERENCES as VisualizationsPreferences,
  reducers: {
    setPreferences: (_state, action: PayloadAction<VisualizationsPreferences>) => action.payload,
    updatePreference: <K extends keyof VisualizationsPreferences>(
      state: VisualizationsPreferences,
      action: PayloadAction<{ key: K; value: VisualizationsPreferences[K] }>
    ) => {
      const { key, value } = action.payload;
      state[key] = value;
    },
    resetPreferences: () => DEFAULT_VISUALIZATIONS_PREFERENCES,
  },
});

export const { setPreferences, updatePreference, resetPreferences } =
  visualizationsPreferencesSlice.actions;

export const selectVisualizationsPreferences = (state: any) =>
  state.visualizationsPreferences as VisualizationsPreferences;

export default visualizationsPreferencesSlice.reducer;
