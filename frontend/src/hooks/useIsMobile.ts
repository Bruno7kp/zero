import { useMediaQuery } from '@mantine/hooks';

// Centraliza a lógica de breakpoint móvel (mantine md = 48em)
export function useIsMobile() {
  // 48em equivale ao breakpoint md padrão do Mantine
  return useMediaQuery('(max-width: 48em)');
}
