import { generateCertificationSvg } from './utils/certificationSvg';
import { isLightColor } from './utils/colorUtils';
import type { DiscLevel } from '../../MetalVinylDisc';

export const generateCompletoHTML = (
  chartData: any[],
  week: string | undefined,
  _weekNumber: number | null,
  _chartType: 'artist' | 'album' | 'track',
  backgroundColor: string = '#000000',
  topCount: number = 20,
  showColoredIcons: boolean = true,
  selectedColumns: string[] = ['plays', 'last'],
  chart?: any,
  customHeaderImage?: string,
  certificationsData?: Record<string, any>,
  showCert: boolean = false
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

  const truncateText = (text: string, maxLength: number): string => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  const typeLabel = (() => {
    if (_chartType === 'artist') return 'ARTISTS';
    if (_chartType === 'album') return 'ALBUMS';
    if (_chartType === 'track') return 'TRACKS';
    return '';
  })();

  const data = chartData.slice(0, topCount); // Use variable topCount
  const defaultTopImage = data[0]?.imageUrl || data[0]?.albumImage || '';
  const topImage = customHeaderImage || defaultTopImage;

  // Calculate date range for the week
  let dateRange = '';
  if (week) {
    const endDate = new Date(week);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 6);
    const formatDate = (d: Date) => `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')}`;
    dateRange = `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }

  // Split data into two columns
  const midPoint = Math.ceil(data.length / 2);
  const column1 = data.slice(0, midPoint);
  const column2 = data.slice(midPoint);

  const isLightBackground = isLightColor(backgroundColor);

  // Function to format numbers with abbreviations (k, M, B)
  const formatNumber = (num: number): string => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return num.toString();
  };

  // Function to calculate sales based on chart formula
  const calculateSales = (row: any): number => {
    if (!chart) return 0;
    
    const effectiveType = _chartType === 'track' ? 'track' : 'album';
    const pointsWeight = effectiveType === 'track' ? Number(chart?.music_points_weight || 0) : Number(chart?.album_points_weight || 0);
    const playsWeight = effectiveType === 'track' ? Number(chart?.music_plays_weight || 0) : Number(chart?.album_plays_weight || 0);
    
    const stabilityPoints = row.rank != null && row.rank > 0 ? Math.max(0, 101 - row.rank) : 0;
    const safePlays = typeof row.plays === 'number' ? row.plays : 0;
    const raw = stabilityPoints * pointsWeight + safePlays * playsWeight;
    
    return Number.isFinite(raw) ? Math.round(raw) : 0;
  };

  // Function to render certification badge
  const renderCertification = (row: any): string => {
    if (!showCert || _chartType === 'artist' || !certificationsData) {
      return '';
    }
    
    const cert = certificationsData[row.entityId];
    if (!cert || !cert.level) {
      return '';
    }

    // Generate inline SVG without multiplier
    const svgDataUrl = generateCertificationSvg(cert.level as DiscLevel);
    return `<img src="${svgDataUrl}" width="24" height="24" style="margin: auto;" alt="${cert.level}" />`;
  };

  let html = `
    <style>
      :root {
        ---completo-color-up: #1db954;
        ---completo-color-down: #e22c2c;
        ---completo-color-stable: #888;
        ---completo-color-new: #3498db;
        ---completo-base-font-size: 14px;
        ---completo-cover-size: 45px;
        ---completo-vertical-gap: 12px;
        ---completo-text-color: ${isLightBackground ? '#000000' : '#ffffff'};
        ---completo-secondary-text: ${isLightBackground ? '#333333' : '#d5d5e0'};
        ---completo-muted-text: ${isLightBackground ? '#666666' : 'rgba(255,255,255,0.6)'};
      }

      .chart-container {
        font-family: 'Inter', sans-serif;
        width: 950px;
        margin: 0 auto;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        background-color: ${backgroundColor};
      }

      .chart-header {
        position: relative;
        height: 250px;
        ${topImage ? `background-image: url("${topImage}");` : `background-color: ${backgroundColor};`}
        background-size: cover;
        background-position: center 30%;
        padding: 20px;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
      }

      .chart-header::before {
        content: '';
        position: absolute;
        top: 0;
        left: -1px;
        right: 0;
        bottom: -1px;
        background: linear-gradient(
          to right,
          rgba(0, 0, 0, 0.9) 20%,
          rgba(0, 0, 0, 0.1) 100%
        );
        pointer-events: none;
      }

      .header-text {
        flex-shrink: 0;
        position: relative;
        z-index: 1;
      }

      .logo {
        font-size: 18px;
        font-weight: 700;
        letter-spacing: 1px;
        text-transform: uppercase;
        color: #fff;
      }

      .logo img {
        width: 170px;
      }

      .logo-star {
        color: var(---completo-color-up);
      }

      .chart-title {
        font-family: 'Satoshi-Variable', sans-serif;
        font-weight: 900;
        font-size: 72px;
        line-height: 1;
        margin: 0;
        letter-spacing: -1px;
        color: #fff;
      }

      .chart-dates {
        display: none;
        position: absolute;
        bottom: 0px;
        right: 0px;
        font-family: 'Inter', sans-serif;
        font-size: 12px;
        font-weight: 500;
        color: #fff;
        text-shadow: 0 0 4px rgba(0,0,0,0.5);
        background: rgba(0,0,0,0.3);
        padding: 4px 8px;
        border-radius: 4px;
        z-index: 1;
      }

      .chart-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0 30px;
        padding-top: 20px;
      }

      .chart-column {
        display: flex;
        flex-direction: column;
        gap: var(---completo-vertical-gap);
      }

      .song-item {
        display: flex;
        align-items: center;
        position: relative;
        padding-bottom: var(---completo-vertical-gap);
        border-bottom: 1px solid rgba(125, 125, 125, 0.2);
      }

      .song-position {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 30px;
        flex-shrink: 0;
      }

      .song-rank {
        font-size: 18px;
        font-weight: 700;
        color: var(---completo-text-color);
        width: auto;
        text-align: center;
        flex-shrink: 0;
      }

      .icon-wrapper {
        width: auto;
        height: auto;
        border-radius: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: transparent;
        margin-left: 0;
      }

      .icon-wrapper svg {
        stroke-width: 2.5;
        width: 16px;
        height: 16px;
      }

      .move-up {
        color: var(---completo-color-up);
      }
      .move-down {
        color: var(---completo-color-down);
      }
      .move-stable {
        color: var(---completo-color-stable);
      }
      .new-entry {
        color: var(---completo-color-new);
      }
      .neutral {
        color: var(---completo-text-color);
      }

      .song-cover {
        width: var(---completo-cover-size);
        height: var(---completo-cover-size);
        margin: 0 12px;
        object-fit: cover;
        flex-shrink: 0;
        border-radius: 8px;
      }

      .song-info {
        flex-grow: 1;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .song-title {
        font-size: var(---completo-base-font-size);
        font-weight: 700;
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: var(---completo-text-color);
        font-family: 'Satoshi-Variable', sans-serif;
      }

      .song-artist {
        font-size: 12px;
        color: var(---completo-secondary-text);
        margin-top: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .song-stats {
        display: flex;
        text-align: right;
        flex-shrink: 0;
      }

      .stat {
        margin-left: 15px;
        text-align: center;
        width: 40px;
      }

      .stat-cert {
        margin-left: 15px;
        text-align: center;
        width: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .stat-label {
        display: block;
        font-size: 9px;
        color: var(---completo-muted-text);
        text-transform: uppercase;
      }

      .stat-value {
        display: block;
        font-size: var(---completo-base-font-size);
        font-weight: 700;
        color: var(---completo-text-color);
      }
    </style>
  `;

  html += `
    <div class="chart-container">
      <div class="chart-header">
        <div class="header-text">
          <div class="logo">
            <img src="/zero-white.svg" alt="ZERO" />
          </div>
          <h1 class="chart-title">TOP ${topCount} ${typeLabel}</h1>
        </div>
        ${dateRange ? `<div class="chart-dates">${dateRange}</div>` : ''}
      </div>
      <div class="chart-grid">
  `;

  // Function to generate stats HTML based on selected columns
  const generateStatsHTML = (row: any): string => {
    let statsHTML = '';
    
    // Add certification first if enabled
    if (showCert && _chartType !== 'artist') {
      const certHTML = renderCertification(row);
      
      if (certHTML) {
        statsHTML += `
          <div class="stat-cert">
            ${certHTML}
          </div>
        `;
      }
    }
    
    selectedColumns.forEach(column => {
      let label = '';
      let value = '';
      
      switch (column) {
        case 'plays':
          label = 'plays';
          value = row.plays ? formatNumber(row.plays) : '0';
          break;
        case 'vendas':
          label = 'vendas';
          value = formatNumber(calculateSales(row));
          break;
        case 'peak':
          label = 'peak';
          value = row.peak ? row.peak.toString() : '—';
          break;
        case 'last':
          label = 'last';
          if (row.deltaRank === 'NEW' || row.deltaRank === 'RE') {
            value = '—';
          } else if (typeof row.deltaRank === 'number') {
            const prev = row.rank + row.deltaRank;
            value = prev > 0 ? prev.toString() : '—';
          } else {
            value = '—';
          }
          break;
        case 'weeks':
          label = 'weeks';
          value = row.weeks ? row.weeks.toString() : '—';
          break;
      }
      
      statsHTML += `
        <div class="stat">
          <span class="stat-label">${label}</span>
          <span class="stat-value">${value}</span>
        </div>
      `;
    });
    
    return statsHTML;
  };

  // Function to generate trend icon
  const getTrendIcon = (deltaRank: any) => {
    let trendClass = 'move-stable';
    let trendIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-minus"><line x1="5" y1="12" x2="19" y2="12"></line></svg>';

    if (deltaRank === 'NEW') {
      trendClass = showColoredIcons ? 'new-entry' : 'neutral';
      trendIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    } else if (deltaRank === 'RE') {
      trendClass = showColoredIcons ? 'new-entry' : 'neutral'; // Using new-entry for reentry as well
      trendIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-rotate-cw"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>';
    } else if (typeof deltaRank === 'number') {
      if (deltaRank > 0) {
        trendClass = showColoredIcons ? 'move-up' : 'neutral';
        trendIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-up"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>';
      } else if (deltaRank < 0) {
        trendClass = showColoredIcons ? 'move-down' : 'neutral';
        trendIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-down"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>';
      } else {
        trendClass = 'neutral';
      }
    } else {
      trendClass = 'neutral';
    }

    return { trendClass, trendIcon };
  };

  // Generate column 1
  html += '<div class="chart-column">';
  column1.forEach((row) => {
    const imageUrl = row.imageUrl || row.albumImage || '';
    const { trendClass, trendIcon } = getTrendIcon(row.deltaRank);

    html += `
      <div class="song-item">
        <div class="song-position">
          <div class="song-rank">${row.rank}</div>
          <div class="icon-wrapper ${trendClass}">${trendIcon}</div>
        </div>
        <img src="${imageUrl}" alt="${escapeHtml(row.name)}" class="song-cover" crossorigin="anonymous" onerror="this.style.display='none'" />
        <div class="song-info">
          <p class="song-title">${escapeHtml(truncateText(row.name, 30))}</p>
          ${row.artistName ? `<p class="song-artist">${escapeHtml(truncateText(row.artistName, 30))}</p>` : ''}
        </div>
        <div class="song-stats">
          ${generateStatsHTML(row)}
        </div>
      </div>
    `;
  });
  html += '</div>';

  // Generate column 2
  html += '<div class="chart-column">';
  column2.forEach((row) => {
    const imageUrl = row.imageUrl || row.albumImage || '';
    const { trendClass, trendIcon } = getTrendIcon(row.deltaRank);

    html += `
      <div class="song-item">
        <div class="song-position">
          <div class="song-rank">${row.rank}</div>
          <div class="icon-wrapper ${trendClass}">${trendIcon}</div>
        </div>
        <img src="${imageUrl}" alt="${escapeHtml(row.name)}" class="song-cover" crossorigin="anonymous" onerror="this.style.display='none'" />
        <div class="song-info">
          <p class="song-title">${escapeHtml(truncateText(row.name, 30))}</p>
          ${row.artistName ? `<p class="song-artist">${escapeHtml(truncateText(row.artistName, 30))}</p>` : ''}
        </div>
        <div class="song-stats">
          ${generateStatsHTML(row)}
        </div>
      </div>
    `;
  });
  html += '</div>';

  html += `
      </div>
    </div>
  `;

  return html;
};