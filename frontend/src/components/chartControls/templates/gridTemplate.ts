export const generateGridHTML = (
  chartData: any[],
  size: 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10,
  showText: boolean = true,
  showVariationIcons: boolean = true
): string => {
  if (!chartData || chartData.length === 0) {
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

  const maxItems = size * size;
  const data = chartData.slice(0, maxItems);
  
  // Estilos fixos para alta resolução
  const sizePx = size * 300;
  const containerStyle = `font-family: 'Satoshi-Variable', sans-serif; background: #fff; color: #000; width: ${sizePx}px; height: ${sizePx}px; box-sizing: border-box; display: grid; grid-template-columns: repeat(${size}, 1fr); grid-template-rows: repeat(${size}, 1fr); gap: 0px;`;
  const itemStyle = `width: 300px; height: 300px; position: relative; display: flex; justify-content: center; align-items: center;`;

  let html = `<div class="poster" style="${containerStyle}">`;

  data.forEach((row: any) => {
    const imageUrl = row.imageUrl || row.albumImage || '';
    const deltaRank = row.deltaRank;
    let iconHtml = '';
    if (deltaRank === 'NEW') {
      iconHtml = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
    } else if (deltaRank === 'RE') {
      iconHtml = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-rotate-cw"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>';
    } else if (deltaRank > 0) {
      iconHtml = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-up"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>';
    } else if (deltaRank < 0) {
      iconHtml = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-down"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>';
    } else {
      iconHtml = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-minus"><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
    }
    const imageHtml = imageUrl ? `<img src="${imageUrl}" alt="" crossorigin="anonymous" onerror="this.style.display='none'" style="width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0;" />` : '<div style="width: 100%; height: 100%; background: #ccc; position: absolute; top: 0; left: 0;"></div>';
    const overlayHtml = showText ? `<div style="position: absolute; bottom: -1px; left: 0; right: 0; background: rgba(0,0,0,0.5); color: white; padding: 5px 10px; font-size: 14px; font-family: 'Satoshi-Variable', sans-serif; height: 55px; display: flex; align-items: center;">
      <div style="display: flex; align-items: center; gap: 5px; width: 100%;">
        <span style="font-weight: bold; font-size: 40px;">${row.rank}</span>
        ${showVariationIcons ? `<div style="width: 30px; display: flex; justify-content: center; align-items: center;">${iconHtml}</div>` : ''}
        <div style="display: flex; flex-direction: column; flex: 1; gap:0px${showVariationIcons ? '' : '; margin-left: 10px'}">
          <span style="font-size: 17px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(row.name || '')}</span>
          <span style="font-size: 17px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(row.artistName || '')}</span>
        </div>
      </div>
    </div>` : '';
    html += `<div style="${itemStyle}">${imageHtml}${overlayHtml}</div>`;
  });

  for (let i = data.length; i < maxItems; i++) {
    html += `<div style="${itemStyle}"><div style="width: 100%; height: 100%; background: #ccc; position: absolute; top: 0; left: 0;"></div></div>`;
  }

  html += '</div>';
  return html;
};