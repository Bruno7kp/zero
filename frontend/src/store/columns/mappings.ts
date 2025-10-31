import type { ColumnConfig } from './types';

export function applyRankVariationMapping(
  cols: ColumnConfig[],
  location: 'under' | 'column' | 'hidden' | 'corner',
  view: 'table' | 'list' | 'grid'
): ColumnConfig[] {
  return cols.map(c => {
    if (c.key === 'deltaRankBadge') {
      if (view === 'grid') return { ...c, visible: location === 'corner' };
      return { ...c, visible: location === 'under' };
    }
    if (c.key === 'altVariation') {
      if (view === 'grid') return { ...c, visible: false };
      return { ...c, visible: location === 'column' };
    }
    return c;
  });
}

export function applyPlaysVariationDisplay(
  cols: ColumnConfig[],
  display: 'hidden' | 'absolute' | 'percent',
  location: 'hidden' | 'under' | 'column' | undefined,
  view: 'table' | 'list' | 'grid'
): ColumnConfig[] {
  if (view === 'grid') {
    return cols.map(c =>
      c.key === 'deltaPlaysBadge' ||
      c.key === 'deltaPercentPlaysBadge' ||
      c.key === 'altPlaysVariation'
        ? { ...c, visible: false }
        : c
    );
  }
  const loc = location || 'under';
  return cols.map(c => {
    if (c.key === 'altPlaysVariation') return { ...c, visible: loc === 'column' };
    if (c.key === 'deltaPlaysBadge')
      return { ...c, visible: loc === 'under' && display === 'absolute' };
    if (c.key === 'deltaPercentPlaysBadge')
      return { ...c, visible: loc === 'under' && display === 'percent' };
    return c;
  });
}

export function applyArtistDisplayMode(
  cols: ColumnConfig[],
  mode: 'under' | 'column',
  view: 'table' | 'list' | 'grid'
): ColumnConfig[] {
  if (view !== 'table') return cols;
  return cols.map(c => (c.key === 'artist' ? { ...c, visible: mode === 'column' } : c));
}
