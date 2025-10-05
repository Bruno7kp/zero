import { createTheme } from '@mantine/core';
import { forest, ruby, cobalt, honey, cherry, lazuli, grass, bee, darkblue, denim } from './colors';

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

export type ThemeMode = 'dark' | 'light' | 'blue';

export function buildTheme(themeMode: ThemeMode) {
  return createTheme({
    ...baseTheme,
    primaryColor: themeMode === 'blue' ? 'denim' : 'blue',
    colors: themeMode === 'blue'
      ? { ...(baseTheme as any).colors, dark: darkblue, denim }
      : (baseTheme as any).colors,
  });
}
