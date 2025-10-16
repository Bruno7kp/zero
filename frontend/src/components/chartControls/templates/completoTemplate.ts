export const generateCompletoHTML = (
  chartData: any[],
  chartName: string,
  week: string | undefined,
  weekNumber: number | null,
  chartType: 'artist' | 'album' | 'track'
): string => {
  if (!chartData || chartData.length === 0 || !week) {
    return '<div>No data available</div>';
  }

  const escapeHtml = (str: string | undefined) => {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (m) => {
      switch (m) {
        case '&': return '&amp;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '"': return '&quot;';
        case "'": return '&#39;';
        default: return m;
      }
    });
  };

  const typeLabel = (() => {
    if (chartType === 'artist') return 'Top Artists';
    if (chartType === 'album') return 'Top Albums';
    if (chartType === 'track') return 'Top Tracks';
    return '';
  })();

  const headerWeek = weekNumber ? `Week ${weekNumber}` : (week ? week : '');
  const header = typeLabel
    ? `${chartName} :: ${typeLabel}${headerWeek ? ` - ${headerWeek}` : ''}`
    : `${chartName}${headerWeek ? ` - ${headerWeek}` : ''}`;

  // Estilos fixos para alta resolução
  const containerStyle = `font-family: Arial, sans-serif; background: #fff; color: #000; padding: 40px; width: 1080px; height: 1920px; box-sizing: border-box; display: flex; flex-direction: column;`;
  const titleFontSize = '36px';
  const itemFontSize = '24px';
  const itemPadding = '10px';
  const gap = '10px';

  let html = `<div class="poster" style="${containerStyle}">`;
  html += `<h2 style="text-align: center; margin-bottom: 20px; font-size: ${titleFontSize};">${header}</h2>`;
  html += `<div style="display: flex; flex-direction: column; gap: ${gap};">`;

  chartData.forEach((row) => {
    const nameArtist = row.artistName ? `${row.name} - ${row.artistName}` : row.name || '';
    const escapedNameArtist = escapeHtml(nameArtist);
    const plays = row.plays ? row.plays.toLocaleString() : '0';
    html += `<div style="font-size: ${itemFontSize}; padding: ${itemPadding}; border-bottom: 1px solid #eee;">${row.rank}. ${escapedNameArtist} - ${plays}</div>`;
  });

  html += '</div></div>';
  return html;
};