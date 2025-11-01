// Hook backed by Redux to manage stats page preferences
// Hook backed by Redux to manage stats page preferences
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import type { StatsPreferences as SliceStatsPreferences } from '../store/statsPreferencesSlice';
import {
  updatePreference as updatePreferenceAction,
  resetPreferences as resetPreferencesAction,
  selectStatsPreferences,
} from '../store/statsPreferencesSlice';

export function useStatsPreferences() {
  const dispatch = useDispatch<AppDispatch>();
  const preferences = useSelector((state: RootState) => selectStatsPreferences(state));

  // Legacy localStorage migration removed. We rely on redux-persist for
  // persisted preferences. If users had previous preferences stored under
  // the older localStorage key they will fall back to defaults.

  const updatePreference = <K extends keyof SliceStatsPreferences>(
    key: K,
    value: SliceStatsPreferences[K]
  ) => {
    dispatch(updatePreferenceAction({ key, value } as any));
  };

  const reset = () => dispatch(resetPreferencesAction());

  return {
    preferences,
    updatePreference,
    resetPreferences: reset,
  };
}
