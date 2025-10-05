// Central helpers for theme modes so we can add new ones in one place

export type ThemeMode = 'dark' | 'light' | 'blue';

// Single source of truth for supported modes (order controls toggle sequence)
export const THEME_MODES: readonly ThemeMode[] = ['dark', 'light', 'blue'] as const;

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

// For dark schemes, different modes may prefer different background depths
// Default dark uses index 8 as main background; blue uses 7 for a slightly lighter app shell
export function appShellDarkIndex(mode: ThemeMode): number {
  switch (mode) {
    case 'blue':
      return 8;
    default:
      return 8;
  }
}

// Header background depth for dark schemes. Keep the same pattern used in dark
// (header tracks the app shell background), while allowing blue to pick a
// slightly different, standardized depth without per-component overrides.
export function appShellHeaderDarkIndex(mode: ThemeMode): number {
  switch (mode) {
    case 'blue':
    case 'dark':
      return 7;
    default:
      return appShellDarkIndex(mode);
  }
}

// Map which logo (light/white or dark/black) should be shown per theme mode.
// This decouples asset choice from color scheme so future modes can decide explicitly.
export function getLogoSrcByMode(mode: ThemeMode): string {
  // Current assets live in /public
  switch (mode) {
    case 'light':
      return '/zero-black.png';
    case 'dark':
    case 'blue':
    default:
      return '/zero-white.png';
  }
}

// Export a small icon contract so components can render the right toggle icon without
// hardcoding per-mode checks. We return a string identifier to keep this layer UI-agnostic.
export type ThemeToggleIconId = 'sun' | 'moon' | 'droplet';

export function themeIconByMode(mode: ThemeMode, scheme: 'light' | 'dark'): ThemeToggleIconId {
  // For custom modes (not light/dark), use a neutral droplet icon by default.
  if (mode !== 'light' && mode !== 'dark') return 'moon';
  // For native light/dark modes, keep the historical behavior based on computed scheme.
  return scheme === 'dark' ? 'sun' : 'droplet';
}
