// Hook to manage stats page preferences in localStorage
import { useState, useEffect } from 'react';
import * as storage from '../utils/storage';
import { KEYS, LEGACY_KEYS } from '../constants/storageKeys';

export interface StatsPreferences {
  showImages: boolean;
  showArtistColumn: boolean;
  fontSize: 'xs' | 'sm' | 'md';
  showSales: boolean;
  peakOnly: boolean;
  pageSize: number;
}

const DEFAULT_PREFERENCES: StatsPreferences = {
  showImages: true,
  showArtistColumn: false,
  fontSize: 'sm',
  showSales: false,
  peakOnly: false,
  pageSize: 25
};

const STORAGE_KEY = KEYS.STATS_PREFERENCES;

export function useStatsPreferences() {
  const [preferences, setPreferences] = useState<StatsPreferences>(() => {
    try {
      // Read stored preferences (may be legacy shape)
      const storedRaw = storage.getJson<any>(STORAGE_KEY, [LEGACY_KEYS.STATS_PREFERENCES]);
      if (storedRaw) {
        // Migrate legacy `tableSize` -> `fontSize` if present
        const migrated = { ...storedRaw } as any;
        if (!migrated.fontSize && migrated.tableSize) {
          migrated.fontSize = migrated.tableSize;
          // It's okay to keep tableSize in the transient object; we'll persist the migrated shape below via effect
        }
        return { ...DEFAULT_PREFERENCES, ...migrated } as StatsPreferences;
      }
    } catch (error) {
      console.error('Error loading stats preferences:', error);
    }
    return DEFAULT_PREFERENCES;
  });

  useEffect(() => {
    try {
      storage.setJson(STORAGE_KEY, preferences);
    } catch (error) {
      console.error('Error saving stats preferences:', error);
    }
  }, [preferences]);

  const updatePreference = <K extends keyof StatsPreferences>(
    key: K,
    value: StatsPreferences[K]
  ) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
  };

  return {
    preferences,
    updatePreference,
    resetPreferences
  };
}
