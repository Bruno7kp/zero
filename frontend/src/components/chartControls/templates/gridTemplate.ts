export const generateGridHTML = (
  chartData: any[],
  size: 3 | 4 | 5,
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
  const containerStyle = `font-family: Poppins, sans-serif; background: #fff; color: #000; width: ${sizePx}px; height: ${sizePx}px; box-sizing: border-box; display: grid; grid-template-columns: repeat(${size}, 1fr); grid-template-rows: repeat(${size}, 1fr); gap: 0px;`;
  const itemStyle = `width: 300px; height: 300px; position: relative; display: flex; justify-content: center; align-items: center;`;

  let html = `<div class="poster" style="${containerStyle}">`;

  data.forEach((row: any) => {
    const imageUrl = row.imageUrl || row.albumImage || '';
    const nameArtist = row.artistName ? `${row.name} - ${row.artistName}` : row.name || '';
    const escapedNameArtist = escapeHtml(nameArtist);
    const deltaRank = row.deltaRank;
    let iconHtml = '';
    if (deltaRank === 'NEW') {
      iconHtml = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#13b4ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="9" y1="8" x2="9" y2="16"></line><line x1="9" y1="8" x2="15" y2="16"></line><line x1="15" y1="8" x2="15" y2="16"></line></svg>';
    } else if (deltaRank === 'RE') {
      iconHtml = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffbf4d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="16 12 12 8 8 12"></polyline><line x1="12" y1="16" x2="12" y2="8"></line></svg>';
    } else if (deltaRank > 0) {
      iconHtml = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4dff87" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="16 12 12 8 8 12"></polyline><line x1="12" y1="16" x2="12" y2="8"></line></svg>';
    } else if (deltaRank < 0) {
      iconHtml = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff5c5c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="8 12 12 16 16 12"></polyline><line x1="12" y1="8" x2="12" y2="16"></line></svg>';
    } else {
      iconHtml = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffbf4d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>';
    }
    const imageHtml = imageUrl ? `<img src="${imageUrl}" alt="" crossorigin="anonymous" onerror="this.style.display='none'" style="width: 100%; height: 100%; object-fit: cover; position: absolute; top: 0; left: 0;" />` : '<div style="width: 100%; height: 100%; background: #ccc; position: absolute; top: 0; left: 0;"></div>';
    const overlayHtml = `<div style="position: absolute; bottom: -1px; left: 0; right: 0; background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 50%, transparent 100%); color: white; padding: 5px 10px; font-size: 14px; font-family: Arial, sans-serif; height: 40px; display: flex; align-items: center;">
      <div style="display: flex; align-items: center; gap: 5px; width: 100%;">
        <span style="font-weight: bold; font-size: 18px;">${row.rank}</span>
        ${iconHtml}
        <span style="font-size: 18px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">${escapedNameArtist}</span>
      </div>
    </div>`;
    html += `<div style="${itemStyle}">${imageHtml}${overlayHtml}</div>`;
  });

  for (let i = data.length; i < maxItems; i++) {
    html += `<div style="${itemStyle}"><div style="width: 100%; height: 100%; background: #ccc; position: absolute; top: 0; left: 0;"></div></div>`;
  }

  html += '</div>';
  return html;
};