import React from 'react';

export type DiscLevel = 'none' | 'gold' | 'platinum' | 'diamond';

export interface MetalVinylDiscProps {
  level: DiscLevel;
  size: number; // pixel size of the disc drawing area
}

export const MetalVinylDisc: React.FC<MetalVinylDiscProps> = ({ level, size }) => {
  const idBase = React.useId();
  const gradId = `${idBase}-${level}-grad`;
  const shineId = `${idBase}-${level}-shine`;
  const maskId = `${idBase}-${level}-mask`;

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
  // Grooves: exactly 4 subtle rings
  const grooveCount = 4;

  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} aria-hidden>
      <defs>
        <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
          {stops.map(st => (
            <stop key={st.o} offset={`${st.o * 100}%`} stopColor={st.c} />
          ))}
        </linearGradient>
        <radialGradient id={shineId} cx="30%" cy="25%" r="70%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.65" />
          <stop offset="35%" stopColor="#ffffff" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect x="0" y="0" width={s} height={s} fill="black" />
          <circle cx={r} cy={r} r={r - 0.5} fill="white" />
          <circle cx={r} cy={r} r={holeR} fill="black" />
        </mask>
      </defs>
      <circle cx={r} cy={r} r={r - 0.5} fill={`url(#${gradId})`} mask={`url(#${maskId})`} />
      <circle cx={r} cy={r} r={r - 0.5} fill={`url(#${shineId})`} mask={`url(#${maskId})`} />
      {/* Vinyl grooves: dark ring + subtle highlight ring just outside */}
      <g mask={`url(#${maskId})`}>
        {Array.from({ length: grooveCount }).map((_, i) => {
          const step = (r - holeR - 1.8) / (grooveCount + 1);
          const gr = holeR + 0.9 + (i + 1) * step;
          const t = (i + 1) / (grooveCount + 1);
          const baseDark = level === 'none' ? 0.1 : 0.08;
          const darkOpacity = baseDark + 0.02 * Math.sin(t * Math.PI);
          const lightBase = level === 'none' ? 0.04 : 0.03;
          const lightOpacity = lightBase * (0.9 + 0.1 * Math.cos(t * Math.PI));
          return (
            <g key={i}>
              <circle
                cx={r}
                cy={r}
                r={gr}
                fill="none"
                stroke="rgba(0,0,0,0.8)"
                strokeOpacity={darkOpacity}
                strokeWidth={0.45}
              />
              <circle
                cx={r}
                cy={r}
                r={gr + 0.5}
                fill="none"
                stroke="#ffffff"
                strokeOpacity={lightOpacity}
                strokeWidth={0.35}
              />
            </g>
          );
        })}
      </g>
      <circle cx={r} cy={r} r={r - 0.75} fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth={0.75} />
      <circle
        cx={r}
        cy={r}
        r={holeR + 0.4}
        fill="none"
        stroke="rgba(0,0,0,0.35)"
        strokeWidth={0.6}
      />
    </svg>
  );
};

export default MetalVinylDisc;
