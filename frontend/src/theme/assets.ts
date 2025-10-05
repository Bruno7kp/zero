import { toMantineColorScheme, themeIconByMode } from './modes';
import type { ThemeMode, ThemeToggleIconId } from './modes';

export interface ThemeAssets {
  logoSrc: string;
  toggleIconId: ThemeToggleIconId;
}

export function getLogoSrc(mode: ThemeMode): string {
  // Light-like modes use dark (black) logo; dark-like modes use light (white) logo
  const scheme = toMantineColorScheme(mode);
  return scheme === 'light' ? '/zero-black.png' : '/zero-white.png';
}

export function getToggleIconId(mode: ThemeMode, scheme?: 'light' | 'dark'): ThemeToggleIconId {
  const effective = scheme || toMantineColorScheme(mode);
  return themeIconByMode(mode, effective);
}

export function getThemeAssets(mode: ThemeMode, scheme?: 'light' | 'dark'): ThemeAssets {
  const effective = scheme || toMantineColorScheme(mode);
  return {
      logoSrc: getLogoSrc(mode),
      toggleIconId: themeIconByMode(mode, effective),
  };
}
