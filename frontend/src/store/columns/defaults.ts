import type { ColumnConfig, ViewSettings } from './types';

export const defaultColumns: ColumnConfig[] = [
  { key: 'rank', label: 'Rank', labelComplete: 'charts.rankLabel', visible: true, isColumn: true },
  { key: 'deltaRankBadge', label: 'charts.deltaRankLabel', visible: true, isColumn: false },
  { key: 'altVariation', label: 'charts.altVariationLabel', visible: false, isColumn: true },
  { key: 'image', label: 'charts.imageLabel', visible: true, isColumn: false },
  { key: 'name', label: 'charts.titleLabel', labelComplete: 'charts.titleLabel', visible: true, isColumn: true },
  { key: 'artist', label: 'charts.artistLabel', labelComplete: 'charts.artistLabel', visible: false, isColumn: true },
  { key: 'cert', label: 'Cert', labelComplete: 'charts.certLabel', visible: false, isColumn: true },
  { key: 'plays', label: 'Plays', labelComplete: 'charts.playsLabel', visible: true, isColumn: true },
  { key: 'altPlaysVariation', label: 'charts.altPlaysVariationLabel', visible: false, isColumn: true },
  { key: 'deltaPlaysBadge', label: 'charts.deltaPlaysLabel', visible: false, isColumn: false },
  { key: 'deltaPercentPlaysBadge', label: 'charts.deltaPercentPlaysLabel', visible: true, isColumn: false },
  { key: 'peak', label: 'charts.peak', labelComplete: 'charts.peakLabel', visible: true, isColumn: true },
  { key: 'totalWeeks', label: 'charts.weeks', labelComplete: 'charts.weeksLabel', visible: true, isColumn: true },
];

export const cloneDefaults = () => defaultColumns.map(c => ({ ...c }));

export const DEFAULT_VIEW_SETTINGS: Record<'table' | 'list' | 'grid', ViewSettings> = {
  table: { containerSize: 'md', fontScale: 0, rankVariationLocation: 'under', playsVariationLocation: 'under', playsVariationDisplay: 'percent', peakCountStyle: 'noCount', tableBackground: 'default', artistDisplayMode: 'under' },
  list: { containerSize: 'md', fontScale: 0, rankVariationLocation: 'column', playsVariationLocation: 'under', playsVariationDisplay: 'percent', peakCountStyle: 'noCount', listBackground: 'default', listPeakWeeksCombined: false },
  grid: { containerSize: 'xl', fontScale: 0, rankVariationLocation: 'under', playsVariationLocation: 'hidden', playsVariationDisplay: 'hidden', peakCountStyle: 'noCount' },
};
