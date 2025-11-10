import React from 'react';
import { Flex, Text } from '@mantine/core';
import { Link } from 'react-router-dom';
import { SpotifyImageWithModal } from '../SpotifyImageWithModal';
import type { ChartData } from '../../db/indexedDb';
import { encodeLastFmSlug } from '../../utils/urlEncoding';

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
  scaleSize: (s: 'xs' | 'sm' | 'md' | 'lg' | 'xl') => 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  imageSize?: number;
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
  imageSize = 40,
}) => {
  // Build detail page link
  const artistSlug = encodeLastFmSlug(row.artistName || row.name);
  const nameSlug = encodeLastFmSlug(row.name);
  let detailLink = '';
  if (type === 'artist') {
    detailLink = `/library/music/${artistSlug}`;
  } else if (type === 'album') {
    detailLink = `/library/music/${artistSlug}/${nameSlug}`;
  } else if (type === 'track') {
    detailLink = `/library/music/${artistSlug}/_/${nameSlug}`;
  }

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
            width={imageSize}
            height={imageSize}
            borderRadius={6}
            style={{ minWidth: imageSize, maxWidth: imageSize }}
            lastImageUrl={lastImageUrl}
            onImageChange={onImageChange}
            onImageLoad={onImageLoad}
          />
        </Flex>
      )}
      <Flex direction="column" justify="center" align="flex-start">
        <Text
          component={Link}
          to={detailLink}
          fw={600}
          size={scaleSize('md')}
          className="entity-name mantine-Link-root"
          style={{ color: 'inherit', cursor: 'pointer' }}
        >
          {row.name}
        </Text>
        {artistMode === 'under' && row.artistName && (
          <Text
            component={Link}
            to={`/library/music/${artistSlug}`}
            size={scaleSize('sm')}
            className="mantine-Link-root"
            style={{ color: 'inherit', cursor: 'pointer' }}
          >
            {row.artistName}
          </Text>
        )}
      </Flex>
    </Flex>
  );
};

export default NameCell;
