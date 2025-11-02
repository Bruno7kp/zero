import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import type { VisualizationsPreferences } from '../store/visualizationsPreferencesSlice';
import {
  selectVisualizationsPreferences,
  updatePreference as updatePreferenceAction,
  resetPreferences as resetPreferencesAction,
} from '../store/visualizationsPreferencesSlice';

export function useVisualizationPreferences() {
  const dispatch = useDispatch<AppDispatch>();
  const preferences = useSelector((state: RootState) => selectVisualizationsPreferences(state));

  const updatePreference = <K extends keyof VisualizationsPreferences>(
    key: K,
    value: VisualizationsPreferences[K]
  ) => {
    dispatch(updatePreferenceAction({ key, value } as any));
  };

  const resetPreferences = () => dispatch(resetPreferencesAction());

  return {
    preferences,
    updatePreference,
    resetPreferences,
  };
}
