export const generateStoriesHTML = (
  chartData: any[],
  topCount: 5 | 10,
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
    if (chartType === 'artist') return 'ARTIST';
    if (chartType === 'album') return 'ALBUM';
    if (chartType === 'track') return 'TRACK';
    return '';
  })();

  const data = chartData.slice(0, topCount);
  const topImage = data[0]?.imageUrl || data[0]?.albumImage || '';

  // Data do chart
  const chartDate = week || `Week ${weekNumber || ''}`;

  let html = `
    <style>
      .poster{
        width: 1080px; 
        height: 1920px;
        background:#141517;
        display:grid;
        grid-template-columns: 1fr;
        grid-template-rows:auto 1fr auto;
        overflow: hidden; 
      }

      .poster header, .board, footer {
        grid-column: 1 / -1; 
        min-width: 0; 
      }

      .poster header{
        display: grid;
        grid-template-columns:1fr 280px; 
        gap:20px;
        align-items:end;
        padding:48px 48px 24px;
        border-bottom:1px solid rgba(255,109,104,.45);
      }

      .tag{padding:8px 16px 6px;font-size:28px;margin-bottom:12px; border-width: 4px; text-transform: uppercase;}
      .hstack{color:#ff6d68;display:flex;align-items:flex-end;gap:12px}
      .hstack .t1{font-family:'Poppins', sans-serif; font-weight: 800; font-size:90px}
      .hstack .t2{font-family:'Poppins', sans-serif; font-weight: 800; font-size:170px}
      .shot{width:280px;height:280px;border-radius:12px;overflow:hidden;justify-self:end;box-shadow:0 10px 40px rgba(0,0,0,.45); background: #333; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 24px;}
      .shot img{width:100%;height:100%;object-fit:cover;display:block}

      .board{position:relative; overflow: hidden;}
      .rows{padding:0 48px 12px}

      .headerRow{display:grid;grid-template-columns:90px 125px 65px 1fr 100px;align-items:center;height:60px;color:#cfd2d7;text-transform:uppercase;font-size:18px;letter-spacing:.1em;border-bottom:1px solid rgba(255,109,104,.45)}
      .headerRow div:first-child,.headerRow div:last-child{text-align:center}

      .row{display:grid;grid-template-columns:90px 125px 65px 1fr 100px;align-items:center;height:122px;position:relative}
      .row + .row{border-top:1px solid rgba(255,109,104,.2)}
      .row > div{border-right:1px solid rgba(255,109,104,.2);height:100%;display:flex;align-items:center}
      .row > div:last-child{border-right:none}

      .rank{
        justify-content:center;
        background:#ff6d68;
        color:#000;
        font-weight:900;
        font-size:48px;
        position: relative; 
      }

      .thumb{justify-content:center}
      .thumb img{width:100px;height:100px;border-radius:10px;object-fit:cover;display:block}
      
      .badge{
        position: absolute;
        bottom: 4px;
        right: 4px;
        width: 36px;
        height: 36px;
        border-radius: 6px;
        background:#fff;
        color:#000;
        display:grid;
        place-items:center;
        text-align:center;
        line-height:1;
        box-shadow:0 1px 0 #000, inset 0 0 0 2px #000;
      }
      .badge .b1{font-size: 16px; font-weight:900}

      .move{justify-content:center;position:relative}
      .arrow{display:inline-grid;place-items:center; font-size: 42px;}
      .up {color:#4dff87}
      .down {color:#ff5c5c}
      .same {color:#ffbf4d}
      .re-pill{position:absolute;left:12px;top:15px;bottom:15px;width:38px;background:#000;border-left:3px solid #ff6d68;color:#ff6d68;display:grid;place-items:center;font-weight:900;font-size:18px;letter-spacing:.2em;}

      .row > div:nth-child(4) {
        /* Remove as regras Flexbox da célula que causavam o centro */
        display: block; 
        /* Adiciona preenchimento interno para centralizar o texto (fallback) */
        padding-top: 10px; 
        padding-bottom: 10px;
      }

      .name {
        width: 100%; /* Garante a largura total */
        padding-left: 24px;
        font-size: 36px;
        font-weight: 900;
        letter-spacing: .2px;
        min-width: 0;
        color: #ffffff;
        display: block; /* MUDANÇA CRÍTICA: Volta para display: block */
        /* Remove as regras flexbox de centralização vertical e horizontal */
        /* text-align: left; /* Manteremos nos spans */
      }

      /* O alinhamento vertical agora será responsabilidade dos elementos internos */
      .name .main-name,
      .name .artist-name {
        text-align: left; /* Garante alinhamento esquerdo no texto */
        display: block;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .name .artist-name {
        display: block;
        font-size: 24px;
        font-weight: 500;
        color: #b0b3b8;
        margin-top: 0px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .last{justify-content:center;color:#cfd2d7;font-size:32px;font-weight:800}
      .artist-only{margin-top: 22px;}

      footer{border-top:1px solid rgba(255,109,104,.45);display:flex;justify-content:flex-end;padding:20px 48px;color:#cfd2d7;font-size:18px;letter-spacing:.2em; text-align: right;}
    </style>
  `;

  html += `
    <main class="poster">
      <header>
        <div>
          <div class="tag">zero charts</div>
          <div class="hstack"><div class="t1">${typeLabel}</div><div class="t2">${topCount === 5 ? '5' : '10'}</div></div>
        </div>
        <figure class="shot">${topImage ? `<img src="${topImage}" alt="Foto principal do Chart" crossorigin="anonymous" onerror="this.style.display='none'" />` : '<span>IMAGE</span>'}</figure>
      </header>

      <section class="board">
        <div class="rows">
          <div class="headerRow"><div>#</div><div></div><div></div><div>${typeLabel}</div><div>Last</div></div>
  `;

  data.forEach((row) => {
    const imageUrl = row.imageUrl || row.albumImage || '';
    const deltaRank = row.deltaRank;
    let moveHtml = '';
    let lastPosition = '';

    if (deltaRank === 'NEW') {
      moveHtml = '<div class="arrow same"><svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#13b4ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="9" y1="8" x2="9" y2="16"></line><line x1="9" y1="8" x2="15" y2="16"></line><line x1="15" y1="8" x2="15" y2="16"></line></svg></div>';
      //moveHtml = '<div class="arrow same"><svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#13b4ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg></div>';
      lastPosition = '—';
    } else if (deltaRank === 'RE') {
      moveHtml = '<div class="arrow same"><svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#ffbf4d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="16 12 12 8 8 12"></polyline><line x1="12" y1="16" x2="12" y2="8"></line></svg></div>';
      lastPosition = '—';
    } else if (typeof deltaRank === 'number') {
      const prevRank = row.rank + deltaRank;
      lastPosition = prevRank > 0 ? prevRank.toString() : '—';
      if (deltaRank > 0) {
        moveHtml = '<span class="arrow up" title="Up"><svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#4dff87" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="16 12 12 8 8 12"></polyline><line x1="12" y1="16" x2="12" y2="8"></line></svg></span>';
      } else if (deltaRank < 0) {
        moveHtml = '<span class="arrow down" title="Down"><svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#ff5c5c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="8 12 12 16 16 12"></polyline><line x1="12" y1="8" x2="12" y2="16"></line></svg></span>';
      } else {
        moveHtml = '<span class="arrow same" title="Same"><svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#ffbf4d" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg></span>';
      }
    } else {
      moveHtml = '';
      lastPosition = '—';
    }

    html += `
      <div class="row">
        <div class="rank">${row.rank}</div>
        <div class="thumb">${imageUrl ? `<img src="${imageUrl}" alt="${escapeHtml(row.name)}" crossorigin="anonymous" onerror="this.style.display='none'" />` : '<span>IMG</span>'}</div>
        <div class="move">${moveHtml}</div>
        <div class="name">
          <span class="main-name ${row.artistName ? '' : 'artist-only'}">${escapeHtml(row.name)}</span>
          ${row.artistName ? `<span class="artist-name">${escapeHtml(row.artistName)}</span>` : ''}
        </div>
        <div class="last">${lastPosition}</div>
      </div>
    `;
  });

  html += `
        </div>
      </section>

      <footer>CHART DATED ${chartDate.toUpperCase()}</footer>
    </main>
  `;

  return html;
};