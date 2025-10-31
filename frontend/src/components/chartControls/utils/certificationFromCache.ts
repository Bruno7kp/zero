import type { DiscLevel } from '../../MetalVinylDisc';
import { getUserPlaycountFromCache } from '../../../utils/certification';

export interface CertificationFromCacheResult {
  level: DiscLevel;
  multiplier: number;
  totalFormula: number;
}

/**
 * Compute certification using ONLY cached playcount data (no API requests).
 * This function reads from the same cache used by certification.ts (memory + IndexedDB).
 * If no cache exists, returns null instead of making an API request.
 */
export async function computeCertificationFromCache(params: {
  chart: any;
  chartType: 'album' | 'track';
  totalPoints: number;
  entityName: string;
  artistName: string;
  username?: string;
}): Promise<CertificationFromCacheResult | null> {
  const { chart, chartType, totalPoints, entityName, artistName, username } = params;

  if (!chart) {
    return null;
  }

  const pointsWeight =
    chartType === 'track'
      ? Number(chart.music_points_weight || 0)
      : Number(chart.album_points_weight || 0);
  const playsWeight =
    chartType === 'track'
      ? Number(chart.music_plays_weight || 0)
      : Number(chart.album_plays_weight || 0);
  const gold =
    chartType === 'track'
      ? Number(chart.music_gold_value || 0)
      : Number(chart.album_gold_value || 0);
  const platinum =
    chartType === 'track'
      ? Number(chart.music_platinum_value || 0)
      : Number(chart.album_platinum_value || 0);
  const diamond =
    chartType === 'track'
      ? Number(chart.music_diamond_value || 0)
      : Number(chart.album_diamond_value || 0);

  const stabilityPoints = totalPoints || 0;

  // Buscar playcount usando o mesmo cache que a tabela (memory + IndexedDB)
  // getUserPlaycountFromCache nunca faz requisição à API - apenas lê o cache
  let userPlaycount = 0;
  if (playsWeight > 0 && username) {
    const cached = await getUserPlaycountFromCache({
      username,
      artistName,
      entityName,
      chartType,
    });

    if (cached !== null) {
      userPlaycount = cached;
    } else if (playsWeight > 0) {
      // Se não tem playcount no cache e playsWeight > 0, não mostra certificação
      return null;
    }
  }

  const totalFormula = stabilityPoints * pointsWeight + userPlaycount * playsWeight;

  const thresholds = [
    { type: 'gold' as const, value: gold },
    { type: 'platinum' as const, value: platinum },
    { type: 'diamond' as const, value: diamond },
  ]
    .filter(t => t.value > 0)
    .sort((a, b) => a.value - b.value);

  if (!thresholds.length) {
    return null;
  }

  // Encontrar certificação atual
  const achieved = thresholds.filter(t => totalFormula >= t.value);
  if (!achieved.length) {
    return null;
  }

  const current = achieved[achieved.length - 1];
  const multiplier = Math.floor(totalFormula / current.value);

  return {
    level: current.type,
    multiplier,
    totalFormula,
  };
}
