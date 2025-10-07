import type { FormattedChartItem } from '../../services/lastfm';

export type LiveRow = FormattedChartItem & { deltaRank?: number | string };
