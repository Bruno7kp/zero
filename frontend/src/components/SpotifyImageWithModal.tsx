import React, { useState, useEffect } from 'react';
import { IconPhotoOff } from '@tabler/icons-react';
import { useSpotifyImage } from '../hooks/useSpotifyImage';
import { ImageEditModal } from './ImageEditModal';

// Cache global em memória: evita flicker quando componente desmonta/remonta rápido (troca de semana/tipo/view)
const _globalImageMemory: Record<string, string> = {};

interface SpotifyImageWithModalProps {
  entityId: string;
  name: string;
  artistName?: string;
  type: 'artist' | 'album' | 'track';
  clientId: string;
  clientSecret: string;
  forceUpdate?: number;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: React.CSSProperties;
  onImageChange?: (url: string) => void;
  lastImageUrl?: string | null;
  onImageLoad?: (url: string) => void;
}

export const SpotifyImageWithModal: React.FC<SpotifyImageWithModalProps> = ({
  entityId,
  name,
  artistName,
  type,
  clientId,
  clientSecret,
  forceUpdate = 0,
  width = 72,
  height = 72,
  borderRadius = 8,
  style = {},
  onImageChange,
  lastImageUrl,
  onImageLoad,
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUrl, setModalUrl] = useState<string | null>(null);


  const baseEntityId = entityId; // sem sufixo de bust para cache consistente
  const { imageUrl } = useSpotifyImage({
    entityId: baseEntityId + (forceUpdate ? `_${forceUpdate}` : ''),
    name,
    type,
    clientId,
    clientSecret,
  });
  // Recupera do cache global primeiro
  const memoryUrl = _globalImageMemory[baseEntityId];
  const fallbackImage = imageUrl || lastImageUrl || memoryUrl || null;
  useEffect(() => {
    if (imageUrl) {
      _globalImageMemory[baseEntityId] = imageUrl;
      if (onImageLoad) onImageLoad(imageUrl);
    }
  }, [imageUrl, onImageLoad, baseEntityId]);

  return (
    <>
      <div
        style={{
          width,
          height,
          minWidth: width,
          minHeight: height,
          maxWidth: width,
          maxHeight: height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#e0e0e0',
          borderRadius,
          overflow: 'hidden',
          ...style,
        }}
      >
        {fallbackImage ? (
          <img
            src={fallbackImage}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius, cursor: 'pointer' }}
            onClick={e => {
              e.stopPropagation();
              setModalOpen(true);
              setModalUrl(fallbackImage);
            }}
            onMouseDown={e => e.stopPropagation()}
            onLoad={() => {
              if (fallbackImage) {
                _globalImageMemory[baseEntityId] = fallbackImage;
                if (onImageLoad) onImageLoad(fallbackImage);
              }
            }}
          />
        ) : (
          <IconPhotoOff size={typeof width === 'number' ? width - 8 : 32} color="#bbb" />
        )}
      </div>
      <ImageEditModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        entityId={entityId}
        name={name}
        artistName={artistName}
        imageUrl={modalUrl || ''}
        type={type}
        clientId={clientId}
        clientSecret={clientSecret}
        onImageChange={url => {
          if (onImageChange) onImageChange(url);
          setModalUrl(url);
        }}
      />
    </>
  );
};
