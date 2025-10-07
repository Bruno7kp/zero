export type MantineSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export function makeScaleSize(fontScale: number) {
  const sizeOrder: MantineSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
  return function scaleSize(s: MantineSize): MantineSize {
    const idx = sizeOrder.indexOf(s);
    const next = Math.max(0, Math.min(sizeOrder.length - 1, idx + (Number(fontScale) || 0)));
    return sizeOrder[next];
  };
}
