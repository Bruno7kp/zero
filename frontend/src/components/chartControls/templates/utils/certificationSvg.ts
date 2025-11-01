import type { DiscLevel } from '../../../MetalVinylDisc';

export function generateCertificationSvg(
  level: DiscLevel,
  multiplier?: number,
  size: number = 24
): string {
  const stops =
    level === 'gold'
      ? [
          { o: 0, c: '#7a5c00' },
          { o: 0.12, c: '#f3dc77' },
          { o: 0.3, c: '#b58900' },
          { o: 0.6, c: '#fdeca6' },
          { o: 1, c: '#7a5c00' },
        ]
      : level === 'platinum'
      ? [
          { o: 0, c: '#7d7d7d' },
          { o: 0.15, c: '#e8e8e8' },
          { o: 0.35, c: '#b9b9b9' },
          { o: 0.65, c: '#f5f5f5' },
          { o: 1, c: '#7d7d7d' },
        ]
      : level === 'diamond'
      ? [
          { o: 0, c: '#1fb7ff' },
          { o: 0.18, c: '#e3f7ff' },
          { o: 0.4, c: '#7cd6ff' },
          { o: 0.7, c: '#f3fdff' },
          { o: 1, c: '#1fb7ff' },
        ]
      : [
          { o: 0, c: '#0b0b0b' },
          { o: 0.2, c: '#3a3a3a' },
          { o: 0.45, c: '#1a1a1a' },
          { o: 0.75, c: '#4a4a4a' },
          { o: 1, c: '#0b0b0b' },
        ];

  const s = Math.max(12, size);
  const r = s / 2;
  const holeR = Math.max(1.2, Math.round(r * 0.22 * 10) / 10);
  const grooveCount = 4;

  const gradId = `cert-grad-${level}-${size}`;
  const shineId = `cert-shine-${level}-${size}`;
  const maskId = `cert-mask-${level}-${size}`;

  let svg = `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg">`;

  // Defs
  svg += '<defs>';
  svg += `<linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">`;
  stops.forEach(st => {
    svg += `<stop offset="${st.o * 100}%" stop-color="${st.c}"/>`;
  });
  svg += '</linearGradient>';

  svg += `<radialGradient id="${shineId}" cx="30%" cy="25%" r="70%">`;
  svg += '<stop offset="0%" stop-color="#ffffff" stop-opacity="0.65"/>';
  svg += '<stop offset="35%" stop-color="#ffffff" stop-opacity="0.15"/>';
  svg += '<stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>';
  svg += '</radialGradient>';

  svg += `<mask id="${maskId}" maskUnits="userSpaceOnUse">`;
  svg += `<rect x="0" y="0" width="${s}" height="${s}" fill="black"/>`;
  svg += `<circle cx="${r}" cy="${r}" r="${r - 0.5}" fill="white"/>`;
  svg += `<circle cx="${r}" cy="${r}" r="${holeR}" fill="black"/>`;
  svg += '</mask>';
  svg += '</defs>';

  // Main disc
  svg += `<circle cx="${r}" cy="${r}" r="${
    r - 0.5
  }" fill="url(#${gradId})" mask="url(#${maskId})"/>`;
  svg += `<circle cx="${r}" cy="${r}" r="${
    r - 0.5
  }" fill="url(#${shineId})" mask="url(#${maskId})"/>`;

  // Grooves
  svg += `<g mask="url(#${maskId})">`;
  for (let i = 0; i < grooveCount; i++) {
    const step = (r - holeR - 1.8) / (grooveCount + 1);
    const gr = holeR + 0.9 + (i + 1) * step;
    const t = (i + 1) / (grooveCount + 1);
    const baseDark = level === 'none' ? 0.1 : 0.08;
    const darkOpacity = baseDark + 0.02 * Math.sin(t * Math.PI);
    const lightBase = level === 'none' ? 0.04 : 0.03;
    const lightOpacity = lightBase * (0.9 + 0.1 * Math.cos(t * Math.PI));

    svg += `<circle cx="${r}" cy="${r}" r="${gr}" fill="none" stroke="rgba(0,0,0,0.8)" stroke-opacity="${darkOpacity}" stroke-width="0.45"/>`;
    svg += `<circle cx="${r}" cy="${r}" r="${
      gr + 0.5
    }" fill="none" stroke="#ffffff" stroke-opacity="${lightOpacity}" stroke-width="0.35"/>`;
  }
  svg += '</g>';

  // Outer ring and hole ring
  svg += `<circle cx="${r}" cy="${r}" r="${
    r - 0.75
  }" fill="none" stroke="rgba(0,0,0,0.25)" stroke-width="0.75"/>`;
  svg += `<circle cx="${r}" cy="${r}" r="${
    holeR + 0.4
  }" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="0.6"/>`;

  // Add multiplier badge if > 1
  if (multiplier && multiplier > 1) {
    const badgeSize = s * 0.35;
    const badgeX = s - badgeSize * 0.55;
    const badgeY = badgeSize * 0.55;
    const badgeR = badgeSize / 2;
    const fontSize = badgeSize * 0.55;

    svg += `<circle cx="${badgeX}" cy="${badgeY}" r="${badgeR}" fill="#000000" stroke="#ffffff" stroke-width="1.5"/>`;
    svg += `<text x="${badgeX}" y="${badgeY}" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="#ffffff">${multiplier}×</text>`;
  }

  svg += '</svg>';

  // Convert to data URL
  const encodedSvg = encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22');

  return `data:image/svg+xml,${encodedSvg}`;
}
