import React from 'react';
import { ThemeIcon, Tooltip } from '@mantine/core';
import { IconDiscFilled } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { computeCertification, type CertificationResult } from '../utils/certification';
import { useOfflineStatus } from '../hooks/useOfflineStatus';

export interface CertificationIconProps {
  chart: any;
  chartType: 'album' | 'track';
  totals: { totalPoints?: number; totalPlays?: number } | undefined;
  entity: { name: string; artistName: string };
  username?: string;
  dayOfWeek?: number;
  size?: number; // icon size
  deferMs?: number; // lazy start delay
}

const colorMap: Record<string, string> = {
  none: 'gray',
  gold: 'yellow',
  platinum: 'cyan',
  diamond: 'grape'
};

export const CertificationIcon: React.FC<CertificationIconProps> = ({ chart, chartType, totals, entity, username, dayOfWeek, size = 24, deferMs = 600 }) => {
  const { t } = useTranslation();
  const { isOnline: online } = useOfflineStatus();
  const [result, setResult] = React.useState<CertificationResult | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    if (!totals) return;
    setLoading(true);
    // start after small delay to avoid impacting initial paint
    const timer = window.setTimeout(() => {
      computeCertification({
        chart,
        chartType,
        totals: totals || {},
        entity,
        username,
        offline: !online,
        nextWeekDay: dayOfWeek,
      })
        .then(r => { if (mounted) setResult(r); })
        .finally(() => { if (mounted) setLoading(false); });
    }, deferMs);
    return () => { mounted = false; clearTimeout(timer); };
  }, [chart, chartType, totals, entity, username, online, dayOfWeek, deferMs]);

  // Hide entirely when chart thresholds are not configured (handled in CertificationBadge too)
  const gold = chartType === 'track' ? (chart?.music_gold_value || 0) : (chart?.album_gold_value || 0);
  const platinum = chartType === 'track' ? (chart?.music_platinum_value || 0) : (chart?.album_platinum_value || 0);
  const diamond = chartType === 'track' ? (chart?.music_diamond_value || 0) : (chart?.album_diamond_value || 0);
  if (gold === 0 && platinum === 0 && diamond === 0) return null;

  if (!result) {
    // keep cell subtle during loading
    return <span style={{ fontSize: 12, color: 'var(--mantine-color-dimmed)' }}>{loading ? '…' : '-'}</span>;
  }

  // Do not render when there is no certification
  if (result.level === 'none') return null;

  const color = colorMap[result.level];
  const label = `${result.multiplier > 1 ? result.multiplier + 'x ' : ''}${t('values.' + result.level)}`;

  return (
    <Tooltip label={label} withArrow>
      <ThemeIcon size={size} radius="xl" color={color} variant="transparent">
        <IconDiscFilled size={Math.max(14, size - 6)} />
      </ThemeIcon>
    </Tooltip>
  );
};

export default CertificationIcon;
