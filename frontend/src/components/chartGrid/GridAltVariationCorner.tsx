import React from 'react';
import { Box } from '@mantine/core';
import type { ChartData } from '../../db/indexedDb';
import { DeltaBadge } from '../DeltaBadge';

interface GridAltVariationCornerProps {
  row: ChartData;
  idx: number;
  badgeStylesRank: any;
  altVariation?: (row: ChartData, index: number) => string | number | false | null | undefined;
}

export const GridAltVariationCorner: React.FC<GridAltVariationCornerProps> = ({ row, idx, badgeStylesRank, altVariation }) => {
  const raw: any = altVariation ? altVariation(row, idx) : undefined;
  const value: any = (raw || raw === 0) ? (raw === '-' ? undefined : raw) : undefined;
  let cfg: any = badgeStylesRank;
  if (cfg?.iconPosition === 'split') {
    // grid overlay stays compact; disable tall split
    cfg = { ...cfg, iconPosition: 'split', splitTall: false };
  } else if (cfg?.iconPosition === 'hidden') {
    cfg = { ...cfg, iconPosition: 'hidden', splitTall: false };
  } else {
    cfg = { ...cfg, splitTall: false };
  }
  return (
    <Box style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
      <DeltaBadge delta={value} cfg={cfg} kind="rank" textSize="md" contextView="grid" />
    </Box>
  );
};

export default GridAltVariationCorner;
