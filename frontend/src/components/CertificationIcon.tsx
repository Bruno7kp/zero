import React from 'react';
import { ThemeIcon, Tooltip } from '@mantine/core';
import MetalVinylDisc from './MetalVinylDisc';
import { useTranslation } from 'react-i18next';
import { computeCertification, type CertificationResult } from '../utils/certification';
import { db } from '../db/indexedDb';
import { useOfflineStatus } from '../hooks/useOfflineStatus';

export interface CertificationIconProps {
  chart: any;
  chartType: 'album' | 'track';
  totals: { totalPoints?: number; totalPlays?: number } | undefined;
  entity: { name: string; artistName: string };
  entityId: string;
  username?: string;
  size?: number; // icon size
  deferMs?: number; // lazy start delay
}


export const CertificationIcon: React.FC<CertificationIconProps> = ({ chart, chartType, totals, entity, entityId, username, size = 24, deferMs = 600 }) => {
  const { t } = useTranslation();
  const { isOnline: online } = useOfflineStatus();
  const [result, setResult] = React.useState<CertificationResult | null>(null);
  const sigRef = React.useRef<string>("");

  const pointsWeight = chartType === 'track' ? (chart?.music_points_weight || 0) : (chart?.album_points_weight || 0);
  const playsWeight = chartType === 'track' ? (chart?.music_plays_weight || 0) : (chart?.album_plays_weight || 0);
  const requirePoints = pointsWeight > 0;
  const totalPointsVal = (totals && typeof (totals as any).totalPoints === 'number') ? (totals as any).totalPoints as number : undefined;
  const hasPoints = typeof totalPointsVal === 'number';

  React.useEffect(() => {
    let mounted = true;
    if (!totals) return;

    // If certification depends on points but points are not loaded yet (minimal stats), try fallback to IndexedDB enriched totals
    if (requirePoints && !hasPoints) {
      const chartIdStr = String(chart?.id || '');
      const sigDb = ['db', chartIdStr, chartType, entityId, username || ''].join('|');
      sigRef.current = sigDb;
      (async () => {
        try {
          const s: any = await db.charts_stats.get([chartIdStr, chartType, entityId]);
          if (!mounted || sigRef.current !== sigDb) return;
          const enrichedTotals = s?.totals;
          if (enrichedTotals && typeof enrichedTotals.totalPoints === 'number') {
            const r = await computeCertification({
              chart,
              chartType,
              totals: enrichedTotals,
              entity,
              username,
              offline: !online,
              nextWeekDay: chart?.day_of_week,
            });
            if (mounted && sigRef.current === sigDb) setResult(r);
          }
        } catch { /* ignore */ }
      })();
      return () => { mounted = false; };
    }

    // mark loading implicitly via null result; we don't render a placeholder
    setResult(null);
    // Build a signature for the current inputs to avoid stale updates
    const sig = [
      entityId,
      chart?.id,
      chartType,
      entity.name,
      entity.artistName,
      username || '',
      pointsWeight,
      playsWeight,
      hasPoints ? totalPointsVal : 'nopoints',
    ].join('|');
    sigRef.current = sig;
    const timer = window.setTimeout(() => {
      computeCertification({
        chart,
        chartType,
        totals: totals || {},
        entity,
        username,
        offline: !online,
        nextWeekDay: chart?.day_of_week,
      })
        .then(r => { if (mounted && sigRef.current === sig) setResult(r); })
        .finally(() => { /* noop */ });
    }, deferMs);
    return () => { mounted = false; clearTimeout(timer); };
  }, [chart, chartType, totals, totalPointsVal, entity, entityId, username, online, deferMs, requirePoints, hasPoints, pointsWeight, playsWeight]);

  // Hide entirely when chart thresholds are not configured (handled in CertificationBadge too)
  const gold = chartType === 'track' ? (chart?.music_gold_value || 0) : (chart?.album_gold_value || 0);
  const platinum = chartType === 'track' ? (chart?.music_platinum_value || 0) : (chart?.album_platinum_value || 0);
  const diamond = chartType === 'track' ? (chart?.music_diamond_value || 0) : (chart?.album_diamond_value || 0);
  if (gold === 0 && platinum === 0 && diamond === 0) return null;

  if (!result) {
    // During loading or initial compute, render nothing to avoid flicker in table cells
    return null;
  }

  // Hide entirely when there is no certification in the column/icon
  if (result.level === 'none') return null;
  const label = `${result.multiplier > 1 ? result.multiplier + 'x ' : ''}${t('values.' + result.level)}`;

  return (
    <Tooltip label={label} withArrow>
      <ThemeIcon size={size} radius="xl" variant="transparent">
        <MetalVinylDisc level={result.level} size={Math.max(14, size - 6)} />
      </ThemeIcon>
    </Tooltip>
  );
};

export default CertificationIcon;
