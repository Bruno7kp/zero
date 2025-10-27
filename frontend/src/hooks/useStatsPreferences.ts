// Hook to manage stats page preferences in localStorage
import { useState, useEffect } from 'react';

export interface StatsPreferences {
  showImages: boolean;
  showArtistColumn: boolean;
  tableSize: 'xs' | 'sm' | 'md';
  showSales: boolean;
  peakOnly: boolean;
}

const DEFAULT_PREFERENCES: StatsPreferences = {
  showImages: true,
  showArtistColumn: false,
  tableSize: 'sm',
  showSales: false,
  peakOnly: false
};

const STORAGE_KEY = 'stats-preferences';

export function useStatsPreferences() {
  const [preferences, setPreferences] = useState<StatsPreferences>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading stats preferences:', error);
    }
    return DEFAULT_PREFERENCES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
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
