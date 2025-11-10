import React from 'react';
import { Box } from '@mantine/core';
import MetalVinylDisc, { type DiscLevel } from './MetalVinylDisc';

export interface StackedMetalVinylDiscProps {
  level: DiscLevel;
  size: number;
  multiplier?: number;
}

/**
 * Renders stacked vinyl discs based on the multiplier:
 * - multiplier 1: single disc
 * - multiplier 2: two discs (one slightly behind)
 * - multiplier 3+: three discs (two slightly behind)
 */
export const StackedMetalVinylDisc: React.FC<StackedMetalVinylDiscProps> = ({
  level,
  size,
  multiplier = 1,
}) => {
  const stackCount = multiplier === 1 ? 1 : multiplier === 2 ? 2 : 3;

  // Offset for each disc (in pixels)
  const offset = size * 0.12; // 12% of disc size

  if (stackCount === 1) {
    return <MetalVinylDisc level={level} size={size} />;
  }

  const totalWidth = size + offset * (stackCount - 1);
  const totalHeight = size;

  return (
    <Box
      style={{
        position: 'relative',
        width: totalWidth,
        height: totalHeight,
        minWidth: totalWidth,
        flexShrink: 0,
      }}
    >
      {Array.from({ length: stackCount }).map((_, index) => {
        const reverseIndex = stackCount - 1 - index;
        const x = reverseIndex * offset;
        const zIndex = index;

        return (
          <Box
            key={index}
            style={{
              position: 'absolute',
              left: x,
              top: 0,
              zIndex,
            }}
          >
            <MetalVinylDisc level={level} size={size} />
          </Box>
        );
      })}
    </Box>
  );
};

export default StackedMetalVinylDisc;
