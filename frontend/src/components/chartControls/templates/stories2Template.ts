export const generateStories2HTML = async (
    chartData: any[],
    topCount: 5 | 10,
    week: string | undefined,
    weekNumber: number | null,
    chartType: 'artist' | 'album' | 'track',
    dateRange?: string,
    backgroundType: 'blur' | 'solid' = 'blur',
    backgroundColor: string = '#1a1a1a',
    username?: string,
    showColumn: 'last' | 'plays' | 'peak' | 'weeks' = 'last',
    listWrapBackgroundType: 'transparent' | 'solid' = 'transparent',
    listWrapBackgroundColor: string = '#ffffff',
    showAlbumCovers: boolean = true
): Promise<string> => {
    if (!chartData || chartData.length === 0 || !week) {
        return '<div>No data available</div>';
    }

    // Function to detect if color is light or dark
    const isLightColor = (color: string): boolean => {
        // Remove # if present
        const hex = color.replace('#', '');
        
        // Convert to RGB
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        
        // Calculate luminance
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Return true if light (luminance > 0.5)
        return luminance > 0.5;
    };

    // Determine theme based on background color
    const isLightBackground = backgroundType === 'solid' ? isLightColor(backgroundColor) : false;

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
        if (chartType === 'artist') return 'ARTISTS';
        if (chartType === 'album') return 'ALBUMS';
        if (chartType === 'track') return 'TRACKS';
        return '';
    })();

    const data = chartData.slice(0, topCount);
    const topImage = data[0]?.imageUrl || data[0]?.albumImage || '';

    // Generate background
    let backgroundStyle = '';
    if (backgroundType === 'blur' && topImage) {
        try {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.src = topImage;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            const canvas = document.createElement('canvas');
            canvas.width = 1080;
            canvas.height = 1920;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Canvas context not available');

            // Preencher fundo escuro antes de desenhar a imagem
            ctx.fillStyle = '#111'; // ou outra cor escura que combine
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            const scale = Math.max(1080 / img.width, 1920 / img.height);
            const drawWidth = img.width * scale;
            const drawHeight = img.height * scale;
            const offsetX = (1080 - drawWidth) / 2;
            const offsetY = (1920 - drawHeight) / 2;

            // Aplica blur, brilho e contraste
            ctx.filter = 'blur(100px) brightness(0.6)';
            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

            const blurredUrl = canvas.toDataURL();
            backgroundStyle = `background-image: url(${blurredUrl}); background-size: cover; background-position: center;`;
        } catch (error) {
            console.error('Error generating blurred background:', error);
            backgroundStyle = `background-color: ${backgroundColor};`;
        }
    } else {
        backgroundStyle = `background-color: ${backgroundColor};`;
    }

    // Data do chart
    const chartDate = week || `Week ${weekNumber || ''}`;

    let html = `
    <style>
      :root {
        --stories-text-color: ${isLightBackground ? '#000000' : '#ffffff'};
        --stories-text-secondary: ${isLightBackground ? '#333333' : '#d5d5e0'};
        --stories-text-muted: ${isLightBackground ? '#666666' : 'rgba(255,255,255,0.6)'};
        --stories-bg-overlay: ${isLightBackground ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)'};
        --stories-bg-overlay-strong: ${isLightBackground ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)'};
        --stories-border-color: ${isLightBackground ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)'};
        --stories-shadow-color: ${isLightBackground ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.45)'};
        --stories-rank-bg: ${isLightBackground ? '#ffffff' : '#241b38'};
        --stories-fallback-bg: ${isLightBackground ? '#cccccc' : '#333333'};
        --stories-fallback-text: ${isLightBackground ? '#000000' : '#ffffff'};
      }

      .story {
        width: 1080px;
        height: 1920px;
        margin: 0 auto;
        position: relative;
        overflow: hidden;
        ${backgroundStyle}
      }

      /* ===== HEADER (Topo) ===== */
      .header { padding: 84px 72px 36px 72px; display: grid; grid-template-columns: 1fr 380px 120px; gap: 48px; align-items: center; }
      .brandRow { display: flex; align-items: center; gap: 18px; margin-bottom: 24px; opacity: 0.95; }
      .brandText { font-weight: 800; letter-spacing: 0.02em; }
      .title { font-family: 'Satoshi-Variable', sans-serif; line-height: 0.92; color: var(--stories-text-color); }
      .title .a { display: block; font-size: 124px; font-weight: 900; letter-spacing: -0.01em; }
      .chartdate { font-size: 25px; margin-top: 18px; font-weight: 700; letter-spacing: 0.18em; opacity: 0.9; color: var(--stories-text-color); }

      .cover { width: 380px; aspect-ratio: 1/1; border-radius: 28px; overflow: hidden; position: relative; box-shadow: 0 28px 90px var(--stories-shadow-color); }
      .cover img { width: 100%; height: 100%; object-fit: cover; }

      .table { margin: 24px 48px 0 48px; }
      .thead, .row { display: grid; grid-template-columns: ${showAlbumCovers ? '100px 110px 70px 500px 150px' : '100px 70px 600px 150px'}; align-items: center; }
      .thead { background: var(--stories-bg-overlay-strong); padding: 22px 28px; color: var(--stories-text-secondary); font-weight: 800; letter-spacing: 0.12em; }
      .row { padding: 16px 28px; position: relative; }
      .row + .row { border-top: 1px solid var(--stories-bg-overlay); }

      .rankCell { display: flex; align-items: center; }
      .rank { height: 72px; width: 88px; border-radius: 18px; color: var(--stories-text-color); display: flex; align-items: center; justify-content: center; font-family: 'Satoshi-Variable', sans-serif; font-weight: 900; font-size: 42px; }

      .thumb { height: 84px; width: 84px; border-radius: 14px; background: var(--stories-rank-bg); overflow: hidden; justify-self: center; }
      .thumb img { width: 100%; height: 100%; object-fit: cover; }

      .albumInfo { padding-left: 12px; min-width: 0; max-width: 600px; overflow: hidden; }
      .albumName { width: 100%; overflow: hidden; font-size: 34px; font-weight: 800; line-height: 1.1; color: var(--stories-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .albumArtist { font-size: 28px; font-weight: 400; opacity: 0.85; margin-top: 2px; color: var(--stories-text-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

      .last { justify-self: end; font-size: 28px; font-weight: 800; opacity: 0.95; color: var(--stories-text-color); font-family: 'Satoshi-Variable', sans-serif; }

      .listWrap { background: var(--stories-bg-overlay); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); border: 1px solid var(--stories-border-color); border-radius: 28px; overflow: hidden;  }
      .row.top { background: var(--stories-bg-overlay-strong); }

      .trendCell { display: flex; justify-content: center; align-items: center; }
      .trendIcon { width: 52px; height: 52px; border-radius: 50%; display: flex; justify-content: center; align-items: center; color: #fff; }
      .trendIcon.trend-up { background-color: #1ed760; }
      .trendIcon.trend-down { background-color: #f43f5e; }
      .trendIcon.trend-neutral { background-color: var(--stories-bg-overlay); }
      .trendIcon.trend-debut { background-color: #3f86f4; }
      .trendIcon.trend-reentry { background-color: #f4b63f; }
      .feather { width: 32px; height: 32px; stroke-width: 2; }

      .footer { position: absolute; left: 0; right: 0; bottom: 0; height: 120px; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 28px; letter-spacing: 0.1em; color: var(--stories-text-muted); }
      .brandText img { width: 50%; }
    </style>
  `;

    if (listWrapBackgroundType === 'solid') {
        const isLightListWrap = isLightColor(listWrapBackgroundColor);
        html += `
    <style>
      .listWrap {
        background: ${listWrapBackgroundColor} !important;
        backdrop-filter: none !important;
      }
      .listWrap .thead,
      .listWrap .albumName,
      .listWrap .albumArtist,
      .listWrap .last,
      .listWrap .rank,
      .listWrap .trendIcon {
        color: ${isLightListWrap ? '#000000' : '#ffffff'} !important;
      }
    </style>
    `;
    }

    html += `
    <main class="story">
      <header class="header">
        <div>
          <div class="brandRow">
            <span class="brandText">
                <img src="/${isLightBackground ? 'zero-black.svg' : 'zero-white.svg'}" alt="ZERO" />
            </span>
          </div>
          <h1 class="title"><span class="a">TOP ${typeLabel}</span></h1>
          <div class="chartdate">${dateRange || chartDate.toUpperCase()}</div>
        </div>
        <div class="cover">
          ${topImage ? `<img src="${topImage}" alt="Capa do ${typeLabel.toLowerCase()} número 1" crossorigin="anonymous" onerror="this.style.display='none'" />` : `<div style="width:100%;height:100%;background:var(--stories-fallback-bg);display:flex;align-items:center;justify-content:center;color:var(--stories-fallback-text);">IMG</div>`}
        </div>
        <div></div>
      </header>

      <section class="table">
        <div class="listWrap">
          <div class="thead">
            <div style="text-align: center;">#</div>
            ${showAlbumCovers ? '<div></div>' : ''}
            <div></div>
            <div>${typeLabel}</div>
            <div style="text-align: right">${showColumn === 'plays' ? 'PLAYS' : showColumn === 'peak' ? 'PEAK' : showColumn === 'weeks' ? 'WEEKS' : 'LAST'}</div>
          </div>
  `;

    data.forEach((row, index) => {
        const imageUrl = row.imageUrl || row.albumImage || '';
        const deltaRank = row.deltaRank;
        let trendClass = 'trend-neutral';
        let trendIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-minus"><line x1="5" y1="12" x2="19" y2="12"></line></svg>';

        if (deltaRank === 'NEW') {
            trendClass = 'trend-debut';
            trendIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-star"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
        } else if (deltaRank === 'RE') {
            trendClass = 'trend-reentry';
            trendIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-rotate-cw"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>';
        } else if (typeof deltaRank === 'number') {
            if (deltaRank > 0) {
                trendClass = 'trend-up';
                trendIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-up"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>';
            } else if (deltaRank < 0) {
                trendClass = 'trend-down';
                trendIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-arrow-down"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>';
            } else {
                trendClass = 'trend-neutral';
                trendIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-minus"><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
            }
        }

        const lastPosition = (() => {
            if (showColumn === 'plays') {
                return row.plays ? row.plays.toLocaleString() : '—';
            } else if (showColumn === 'peak') {
                // Peak position - assuming it's available in row.peak or similar
                return row.peak ? `${row.peak}` : '—';
            } else if (showColumn === 'weeks') {
                // Weeks on chart - assuming it's available in row.weeks or similar
                return row.weeks ? row.weeks.toString() : '—';
            } else { // showColumn === 'last'
                if (deltaRank === 'NEW' || deltaRank === 'RE') return '—';
                if (typeof deltaRank === 'number') {
                    const prev = row.rank + deltaRank;
                    return prev > 0 ? prev.toString() : '—';
                }
                return '—';
            }
        })();

        const rowClass = index === 0 ? 'row top' : 'row';

        html += `
      <div class="${rowClass}">
        <div class="rankCell"><div class="rank">${row.rank}</div></div>
        ${showAlbumCovers ? `<div class="thumb">
          ${imageUrl ? `<img src="${imageUrl}" alt="${escapeHtml(row.name)}" crossorigin="anonymous" onerror="this.style.display='none'" />` : `<div style="width:100%;height:100%;background:var(--stories-fallback-bg);display:flex;align-items:center;justify-content:center;color:var(--stories-fallback-text);font-size:12px;">IMG</div>`}
        </div>` : ''}
        <div class="trendCell">
          <div class="trendIcon ${trendClass}">${trendIcon}</div>
        </div>
        <div class="albumInfo">
          <div class="albumName">${escapeHtml(truncateText(row.name, showAlbumCovers ? 30 : 36))}</div>
          ${row.artistName ? `<div class="albumArtist">${escapeHtml(truncateText(row.artistName, 50))}</div>` : ''}
        </div>
        <div class="last">${lastPosition}</div>
      </div>
    `;
    });

    html += `
        </div>
      </section>

      <footer class="footer">
        <p>zerocharts.com.br • ${username ? `@${username}` : new Date().getFullYear()}</p>
      </footer>
    </main>
  `;

    return html;
};