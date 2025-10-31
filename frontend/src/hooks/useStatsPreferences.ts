// Hook to manage stats page preferences in localStorage
import { useState, useEffect } from 'react';
import * as storage from '../utils/storage';
import { KEYS, LEGACY_KEYS } from '../constants/storageKeys';

export interface StatsPreferences {
  showImages: boolean;
  showArtistColumn: boolean;
  tableSize: 'xs' | 'sm' | 'md';
  showSales: boolean;
  peakOnly: boolean;
  pageSize: number;
}

const DEFAULT_PREFERENCES: StatsPreferences = {
  showImages: true,
  showArtistColumn: false,
  tableSize: 'sm',
  showSales: false,
  peakOnly: false,
  pageSize: 25
};

const STORAGE_KEY = KEYS.STATS_PREFERENCES;

export function useStatsPreferences() {
  const [preferences, setPreferences] = useState<StatsPreferences>(() => {
    try {
      const stored = storage.getJson<StatsPreferences>(STORAGE_KEY, [LEGACY_KEYS.STATS_PREFERENCES]);
      if (stored) return { ...DEFAULT_PREFERENCES, ...stored };
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
