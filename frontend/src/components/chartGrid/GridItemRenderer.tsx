import React from 'react';
import { Grid } from '@mantine/core';
import type { ChartData } from '../../db/indexedDb';
import GridCard from './GridCard';

interface GridItemRendererProps {
  row: ChartData;
  idx: number;
  type: 'artist' | 'album' | 'track';
  clientId: string;
  clientSecret: string;
  rankVariationLocation: 'under' | 'corner' | 'hidden' | 'column';
  showImage: boolean;
  showPeak: boolean;
  showPlays: boolean;
  showTotalWeeks: boolean;
  scaleSize: (s: 'xs'|'sm'|'md'|'lg'|'xl') => 'xs'|'sm'|'md'|'lg'|'xl';
  onOpenModal: (row: ChartData) => void;
  imageForceUpdate: number | undefined;
  lastImageUrl?: string | null;
  onImageChange: () => void;
  onImageLoad: (url: string) => void;
  renderUnderRankVariation: (deltaValue: any) => React.ReactNode;
  cornerOverlay?: React.ReactNode;
  stats: {
    peak?: { position?: number | null; weeksAtPeak?: number | null } | null;
    totals?: { withinCutoff?: number | null } | null;
  } | undefined;
  showPeakCount: boolean;
  colSpan?: { base: number; xs?: number; sm?: number; md?: number; lg?: number };
  isDropped?: boolean;
}

export const GridItemRenderer: React.FC<GridItemRendererProps> = ({
  row,
  type,
  clientId,
  clientSecret,
  rankVariationLocation,
  showImage,
  showPeak,
  showPlays,
  showTotalWeeks,
  scaleSize,
  onOpenModal,
  imageForceUpdate,
  lastImageUrl,
  onImageChange,
  onImageLoad,
  renderUnderRankVariation,
  cornerOverlay,
  stats,
  showPeakCount,
  colSpan = { base: 15, md: 10, lg: 6 },
  isDropped = false,
}) => {
  return (
    <Grid.Col key={row.id} span={colSpan}>
      <GridCard
        row={row}
        type={type}
        clientId={clientId}
        clientSecret={clientSecret}
        rankVariationLocation={isDropped ? 'hidden' : rankVariationLocation}
        showImage={showImage}
        showPeak={showPeak}
        showPlays={showPlays}
        showTotalWeeks={showTotalWeeks}
        scaleSize={scaleSize}
        onOpenModal={onOpenModal}
        imageForceUpdate={imageForceUpdate}
        lastImageUrl={lastImageUrl}
        onImageChange={onImageChange}
        onImageLoad={onImageLoad}
        renderUnderRankVariation={isDropped ? () => null : renderUnderRankVariation}
        cornerOverlay={cornerOverlay}
        stats={stats}
        showPeakCount={showPeakCount}
        isDropped={isDropped}
      />
    </Grid.Col>
  );
};

export default GridItemRenderer;
