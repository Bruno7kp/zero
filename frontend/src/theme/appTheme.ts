import { createTheme } from '@mantine/core';
import {
  forest,
  ruby,
  cobalt,
  honey,
  cherry,
  lazuli,
  grass,
  bee,
  darkblue,
  denim,
  mediumblue,
  blackdark,
} from './colors';

// Base theme shared across all modes
const baseTheme = createTheme({
  defaultRadius: 'lg',
  fontFamily: 'Inter, Greycliff CF, sans-serif',
  colors: {
    forest,
    ruby,
    cobalt,
    honey,
    cherry,
    lazuli,
    grass,
    bee,
    mediumblue,
  },
  components: {
    // No borders by default
    Card: {
      styles: () => ({
        root: {
          border: 'none',
        },
      }),
    },
    Paper: {
      styles: () => ({
        root: {
          border: 'none',
        },
      }),
    },
    Modal: {
      defaultProps: {
        centered: true,
        overlayProps: {
          blur: 5,
          backgroundOpacity: 0.5,
        },
      },
    },
  },
});

export type ThemeMode = 'dark' | 'light' | 'blue' | 'black';

export function buildTheme(themeMode: ThemeMode) {
  return createTheme({
    ...baseTheme,
    primaryColor: 'blue',
    colors:
      themeMode === 'blue'
        ? { ...(baseTheme as any).colors, dark: darkblue, denim }
        : themeMode === 'black'
        ? { ...(baseTheme as any).colors, dark: blackdark }
        : (baseTheme as any).colors,
  });
}
