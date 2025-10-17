export const formatInteger = (value: number | null | undefined) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '0';
  return value.toLocaleString();
};

export const parseNumeric = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

export const generatePlainTextChart = (
  t: (k: any, options?: any) => string,
  chartData: any[],
  chartName: string,
  week: string | undefined,
  weekNumber: number | null,
  chartType: 'artist' | 'album' | 'track',
  statsMap: any
) => {
  if (!chartData || chartData.length === 0 || !week) {
    return t('charts.share.noData', 'No data available');
  }

  const lines: string[] = [];

  const typeLabel = (() => {
    if (chartType === 'artist') {
      return t('charts.share.topArtistsHeader', 'Top Artists');
    }
    if (chartType === 'album') {
      return t('charts.share.topAlbumsHeader', 'Top Albums');
    }
    if (chartType === 'track') {
      return t('charts.share.topTracksHeader', 'Top Tracks');
    }
    return '';
  })();

  const headerWeek = weekNumber
    ? t('charts.share.weekNumberLabel', { defaultValue: 'Week {{num}}', num: weekNumber })
    : (week ? t('charts.share.weekLabelFallback', { defaultValue: week, week }) : '');

  const header = typeLabel
    ? `${chartName} :: ${typeLabel}${headerWeek ? ` - ${headerWeek}` : ''}`
    : `${chartName}${headerWeek ? ` - ${headerWeek}` : ''}`;

  lines.push(header);

  // Column headers with separator
  const nameColumnLabel = chartType === 'artist'
    ? t('charts.share.artistColumn', 'Artista')
    : t('charts.share.nameArtist', 'Nome | Artista');

  const headers = [
    t('charts.share.position', 'Posição'),
    nameColumnLabel,
    t('charts.share.plays', 'Reproduções'),
    t('charts.share.peak', 'Pico'),
    t('charts.share.weeks', 'Semanas')
  ];
  lines.push(headers.join(' | '));

  // Data rows
  chartData.forEach((row) => {
    const deltaRank = row.deltaRank;
    let deltaStr = '';

    if (deltaRank === 'NEW') {
      deltaStr = ' (NEW)';
    } else if (deltaRank === 'RE') {
      deltaStr = ' (RE)';
    } else if (typeof deltaRank === 'number') {
      if (deltaRank > 0) {
        deltaStr = ` (+${deltaRank})`;
      } else if (deltaRank < 0) {
        deltaStr = ` (${deltaRank})`;
      } else {
        deltaStr = ' (=)';
      }
    }

    const deltaPlaysRaw = parseNumeric(row.deltaPlays) || 0;
    const playsValue = parseNumeric(row.plays) ?? 0;
    const previousPlays = playsValue - deltaPlaysRaw;
    const percentChange = previousPlays > 0 && deltaPlaysRaw !== 0
      ? (deltaPlaysRaw / previousPlays) * 100
      : null;
    const playsParts: string[] = [formatInteger(playsValue)];
    if (deltaPlaysRaw !== 0) {
      const percentLabel = percentChange !== null
        ? `${deltaPlaysRaw > 0 ? '+' : ''}${percentChange.toFixed(0)}%`
        : `${deltaPlaysRaw > 0 ? '+' : '-'}${formatInteger(Math.abs(deltaPlaysRaw))}`;
      playsParts.push(`(${percentLabel})`);
    }
    const playsStr = playsParts.join(' ');

    const stats = statsMap?.[row.entityId] || row.stats || {};
    const peakValue = stats?.peak?.position ?? row.peak ?? '';
    const weeksValue = stats?.totals?.withinCutoff ?? row.totalWeeks ?? '';

    // Format: rank (delta) | name - artist | plays (change) | peak | weeks
    const nameArtist = row.artistName ? `${row.name} - ${row.artistName}` : row.name || '';

    const rowData = [
      `${row.rank}${deltaStr}`,
      nameArtist,
      playsStr,
      peakValue !== null && peakValue !== undefined ? `${peakValue}` : '',
      weeksValue !== null && weeksValue !== undefined ? `${weeksValue}` : ''
    ];

    lines.push(rowData.join(' | '));
  });

  return lines.join('\n');
};