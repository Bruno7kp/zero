import type { MantineTheme } from '@mantine/core';
// Central helpers for theme modes so we can add new ones in one place

export type ThemeMode = 'dark' | 'light' | 'blue' | 'black';

// Single source of truth for supported modes (order controls toggle sequence)
export const THEME_MODES: readonly ThemeMode[] = ['dark', 'light', 'blue', 'black'] as const;

// Map app modes to Mantine color scheme
export function toMantineColorScheme(mode: ThemeMode): 'light' | 'dark' {
  return mode === 'light' ? 'light' : 'dark';
}

// Get next mode in the toggle sequence
export function getNextThemeMode(current: ThemeMode): ThemeMode {
  const idx = THEME_MODES.indexOf(current);
  const nextIdx = (idx >= 0 ? idx : 0) + 1;
  return THEME_MODES[nextIdx % THEME_MODES.length];
}

export function appShellDarkIndex(mode: ThemeMode): number {
  switch (mode) {
    case 'blue':
      return 8;
    case 'black':
      return 9;
    case 'dark':
    default:
      return 7;
  }
}

export function appShellHeaderDarkIndex(mode: ThemeMode): number {
  switch (mode) {
    case 'blue':
      return 7;
    case 'black':
      return 7;
    case 'dark':
    default:
      return 8;
  }
}

// Map which logo (light/white or dark/black) should be shown per theme mode.
// This decouples asset choice from color scheme so future modes can decide explicitly.
export function getLogoSrcByMode(mode: ThemeMode): string {
  // Current assets live in /public
  switch (mode) {
    case 'light':
      return '/zero-black.png';
    default:
      return '/zero-white.png';
  }
}

export type ThemeToggleIconId = 'sun' | 'moon' | 'droplet' | 'moonAlt';

export function themeIconByMode(mode: ThemeMode, scheme: 'light' | 'dark'): ThemeToggleIconId {
  if (mode === 'black') return 'moon';
  if (mode === 'blue') return 'moonAlt';
  return scheme === 'dark' ? 'sun' : 'droplet';
}

export function getCardBackgroundByMode(theme: MantineTheme, mode: ThemeMode): string {
  switch (mode) {
    case 'light':
      return (theme as any).white || '#ffffff';
    case 'black':
      return ((theme as any).colors?.dark?.[7]) ?? '#000000';
    case 'blue':
      return ((theme as any).colors?.dark?.[7]) ?? '#1A1B1E';
    case 'dark':
    default:
      return ((theme as any).colors?.dark?.[8]) ?? '#1A1B1E';
  }
}

export function getSecondaryCardBackgroundByMode(theme: MantineTheme, mode: ThemeMode): string {
  switch (mode) {
    case 'light':
      return ((theme as any).colors?.gray?.[1]) || '#ffffff';
    case 'black':
      return ((theme as any).colors?.dark?.[6]) ?? '#000000';
    case 'blue':
      return ((theme as any).colors?.dark?.[6]) ?? '#1A1B1E';
    case 'dark':
    default:
      return ((theme as any).colors?.dark?.[6]) ?? '#1A1B1E';
  }
}