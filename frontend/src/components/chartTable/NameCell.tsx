import React from 'react';
import { Flex, Text } from '@mantine/core';
import { SpotifyImageWithModal } from '../SpotifyImageWithModal';
import type { ChartData } from '../../db/indexedDb';

interface NameCellProps {
  row: ChartData;
  showImage: boolean;
  artistMode: 'under' | 'column';
  type: 'artist' | 'album' | 'track';
  clientId: string;
  clientSecret: string;
  imageForceUpdate?: number;
  lastImageUrl?: string | null;
  onImageChange: () => void;
  onImageLoad: (url: string) => void;
  scaleSize: (s: 'xs'|'sm'|'md'|'lg'|'xl') => 'xs'|'sm'|'md'|'lg'|'xl';
}

export const NameCell: React.FC<NameCellProps> = ({
  row,
  showImage,
  artistMode,
  type,
  clientId,
  clientSecret,
  imageForceUpdate,
  lastImageUrl,
  onImageChange,
  onImageLoad,
  scaleSize,
}) => {
  return (
    <Flex>
      {showImage && (
        <Flex
          mr="sm"
          justify="center"
          align="center"
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
        >
          <SpotifyImageWithModal
            entityId={row.entityId}
            name={row.name}
            artistName={row.artistName}
            type={type}
            clientId={clientId}
            clientSecret={clientSecret}
            forceUpdate={imageForceUpdate}
            width={40}
            height={40}
            borderRadius={0}
            style={{ minWidth: 40, maxWidth: 40 }}
            lastImageUrl={lastImageUrl}
            onImageChange={onImageChange}
            onImageLoad={onImageLoad}
          />
        </Flex>
      )}
      <Flex direction="column" justify="center" align="flex-start">
        <Text fw={700} size={scaleSize('md')}>{row.name}</Text>
        {artistMode === 'under' && row.artistName && <Text size={scaleSize('sm')}>{row.artistName}</Text>}
      </Flex>
    </Flex>
  );
};

export default NameCell;
