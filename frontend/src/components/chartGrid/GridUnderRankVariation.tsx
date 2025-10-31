import React from 'react';
import { useMantineTheme } from '@mantine/core';
import {
  IconCaretUpFilled,
  IconCaretDownFilled,
  IconStarFilled,
  IconArrowBackUp,
} from '@tabler/icons-react';

type DeltaValue = number | 'NEW' | 'RE' | '=' | 0 | null | undefined;

interface GridUnderRankVariationProps {
  value: DeltaValue;
  badgeStylesRank: any;
}

export const GridUnderRankVariation: React.FC<GridUnderRankVariationProps> = ({
  value,
  badgeStylesRank,
}) => {
  const theme = useMantineTheme();

  // Loading placeholder while delta not ready
  if (value === undefined || value === null) {
    return (
      <span
        aria-label="loading-delta"
        style={{
          marginTop: 4,
          width: 8,
          height: 8,
          borderRadius: 8,
          backgroundColor: theme.white,
          opacity: 0.7,
          display: 'inline-block',
        }}
      />
    );
  }
  if (!value && value !== 0) return null;

  // Respect badge style rules (no split under-rank)
  let cfg = badgeStylesRank as any;
  if (cfg.iconPosition === 'split') cfg = { ...cfg, iconPosition: 'before' };
  const showIcon = cfg.iconPosition !== 'hidden';
  const hideLabel = !!cfg.hideLabel;
  const color = undefined;
  const baseSize = 12;

  const label = (() => {
    if (typeof value === 'number') {
      if (value > 0) return `+${value}`;
      if (value < 0) return `${value}`;
      return '=';
    }
    if (value === 'NEW' || value === 'RE' || value === '=') return value as string;
    return '';
  })();

  const isIconOnly = showIcon && hideLabel && label !== '=';
  const iconEl = (() => {
    const upDownSize = baseSize + (isIconOnly ? 4 : 0);
    const reSize = baseSize + (isIconOnly ? 2 : 0);
    if (value === 'NEW')
      return <IconStarFilled size={baseSize} color={color} style={{ marginTop: 2 }} />;
    if (value === 'RE')
      return (
        <IconArrowBackUp
          size={reSize}
          stroke={3}
          color={color}
          style={{ marginTop: 2, transform: 'scaleX(-1)' }}
        />
      );
    if (typeof value === 'number') {
      if (value > 0)
        return <IconCaretUpFilled size={upDownSize} color={color} style={{ marginTop: 2 }} />;
      if (value < 0)
        return <IconCaretDownFilled size={upDownSize} color={color} style={{ marginTop: 2 }} />;
    }
    if (value === '=' || value === 0) return null;
    return null;
  })();

  // Label to display considering hideLabel; keep '=' even in icon mode
  let displayLabel = hideLabel ? (label === '=' ? label : '') : label;
  // With icon+text, hide text for NEW/RE (icon only)
  if (!hideLabel && showIcon && (value === 'NEW' || value === 'RE')) {
    displayLabel = '';
  }
  if (!showIcon && !displayLabel) return null;

  return (
    <span style={{ marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 4, color }}>
      {showIcon && cfg.iconPosition === 'before' && iconEl}
      {displayLabel && <span style={{ fontSize: baseSize, lineHeight: 1 }}>{displayLabel}</span>}
      {showIcon && cfg.iconPosition === 'after' && iconEl}
    </span>
  );
};

export default GridUnderRankVariation;
