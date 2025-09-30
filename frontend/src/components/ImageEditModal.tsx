import React, { useState } from 'react';
import { Modal, Box, Text, Group, useMantineTheme } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { spotifyImagesDb } from '../db/spotifyImagesDb';

// Lista de domínios populares de música permitidos para imagens
const ALLOWED_IMAGE_DOMAINS = [
  // Música
  'i.scdn.co', // Spotify
  'open.spotify.com',
  'last.fm', 'lastfm-img2.akamaized.net',
  'e-cdns-images.dzcdn.net', // Deezer
  'is5-ssl.mzstatic.com', 'is4-ssl.mzstatic.com', // Apple Music
  'img.discogs.com',
  'coverartarchive.org', // MusicBrainz
  'f4.bcbits.com', // Bandcamp
  'resources.tidal.com',
  'i1.sndcdn.com', // SoundCloud
  'images-na.ssl-images-amazon.com', // Amazon
  'yt3.ggpht.com', 'i.ytimg.com', // YouTube
  // Provedores de imagens populares
  'i.imgur.com', 'imgur.com', // Imgur
  'res.cloudinary.com', // Cloudinary
  'images.unsplash.com', // Unsplash
  'live.staticflickr.com', // Flickr
  'lh3.googleusercontent.com', // Googleusercontent
  'raw.githubusercontent.com', 'user-images.githubusercontent.com', // GitHubusercontent
];

function isAllowedImageDomain(url: string): boolean {
  try {
    const u = new URL(url);
    return ALLOWED_IMAGE_DOMAINS.some(domain => u.hostname.endsWith(domain));
  } catch {
    return false;
  }
}

interface ImageEditModalProps {
  opened: boolean;
  onClose: () => void;
  entityId: string;
  name: string;
  artistName?: string;
  imageUrl: string;
  type: 'artist' | 'album' | 'track';
  clientId: string;
  clientSecret: string;
  onImageChange?: (url: string) => void;
}

export const ImageEditModal: React.FC<ImageEditModalProps> = ({
  opened,
  onClose,
  entityId,
  name,
  artistName,
  imageUrl,
  type,
  clientId,
  clientSecret,
  onImageChange,
}) => {
  const theme = useMantineTheme();
  const { t } = useTranslation();
  const [inputUrl, setInputUrl] = useState(imageUrl);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imgPreview, setImgPreview] = useState(imageUrl);
  const [isSquare, setIsSquare] = useState(true);
  const [domainError, setDomainError] = useState<string | null>(null);

  React.useEffect(() => {
    setInputUrl(imageUrl);
    setImgPreview(imageUrl);
    setError(null);
  }, [imageUrl, opened]);

  // Atualiza preview ao digitar novo link
  React.useEffect(() => {
    if (!inputUrl) return;
    const img = new window.Image();
    img.onload = function () {
      setImgPreview(inputUrl);
      setIsSquare(img.naturalWidth === img.naturalHeight);
    };
    img.onerror = function () {
      setImgPreview('');
      setIsSquare(true);
    };
    img.src = inputUrl;
  }, [inputUrl]);

  async function handleSave() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(inputUrl, { method: 'HEAD' });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.startsWith('image/')) {
        setError('URL não é uma imagem válida.');
        setLoading(false);
        return;
  setDomainError(null);
    if (!isAllowedImageDomain(inputUrl)) {
      setDomainError('Apenas imagens de sites populares de música são permitidas.');
    } else {
      setDomainError(null);
    }
      }
      await spotifyImagesDb.images.put({ entityId, imageUrl: inputUrl, updatedAt: Date.now() });
      setImgPreview(inputUrl);
      if (onImageChange) onImageChange(inputUrl);
      setLoading(false);
      onClose();
    } catch {
      setError('Não foi possível carregar a imagem.');
      setLoading(false);
    }
  }

  async function handleFetchSpotify() {
    setError(null);
    setLoading(true);
    try {
      // Remove do cache antes de buscar
      await spotifyImagesDb.images.delete(entityId);
      // Busca do SpotifyApiManager
      const { SpotifyApiManager } = await import('../services/SpotifyApi');
      const apiManager = new SpotifyApiManager({ clientId, clientSecret });
      let searchName = name;
      if (type === 'artist') {
        searchName = name;
      } else if ((type === 'track' || type === 'album') && artistName) {
        searchName = name + ' ' + artistName;
      }
      const result = await apiManager.search({ q: searchName, type, limit: 2 });
      let url = '';
      if (type === 'artist' && result.artists?.items?.[0]?.images?.[0]?.url) {
        url = result.artists.items[0].images[0].url;
      } else if (type === 'album' && result.albums?.items?.[0]?.images?.[0]?.url) {
        url = result.albums.items[0].images[0].url;
      } else if (type === 'track' && result.tracks?.items?.[0]?.album?.images?.[0]?.url) {
        url = result.tracks.items[0].album.images[0].url;
      }
      if (url) {
        setInputUrl(url);
        setImgPreview(url);
        // Não salva no IndexedDB automaticamente, só atualiza visualmente
        if (onImageChange) onImageChange(url);
      } else {
        setError('Não foi possível buscar imagem do Spotify.');
      }
    } catch {
      setError('Erro ao buscar imagem do Spotify.');
    }
    setLoading(false);
  }

  return (
  <Modal
    opened={opened}
    onClose={onClose}
    title={name || t('imageEditModal.title', 'Imagem')}
    size="lg"
    onMouseDown={e => e.stopPropagation()}
    onClick={e => e.stopPropagation()}
  >
      {imgPreview && (
        <Box mb="md" style={{ display: 'flex', justifyContent: 'center' }}>
          <img src={imgPreview} alt={name} style={{ maxWidth: 320, maxHeight: 320, borderRadius: 8, border: isSquare ? undefined : '2px solid red' }} />
        </Box>
      )}
  {!isSquare && <Text color="red" size="sm" mb="sm">{t('imageEditModal.squareWarning', 'A imagem deve ser quadrada!')}</Text>}
      <Box mb="xs">
        <Text color="gray" size="xs" style={{ marginBottom: 4 }}>{t('imageEditModal.domainNotice', 'Por segurança, só é possível usar imagens de sites confiáveis como Last.fm, Spotify, Imgur, Unsplash, etc. Caso queira usar uma imagem própria, faça upload em um serviço como Imgur ou Cloudinary e cole o link aqui.')}</Text>
      </Box>
      <Box mb="sm">
        <input
          type="text"
          value={inputUrl}
          onChange={e => { setInputUrl(e.target.value); setError(null); }}
          style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc', fontSize: 16 }}
          placeholder={t('imageEditModal.urlPlaceholder', 'URL da imagem')}
        />
      </Box>
      {error && <Text color="red" size="sm" mb="sm">{error}</Text>}
      <Group>
        <button
          style={{ padding: '6px 16px', borderRadius: 4, background: theme.colors.blue[6], color: 'white', border: 'none', fontWeight: 600, cursor: loading || !imgPreview || !isSquare ? 'not-allowed' : 'pointer' }}
          disabled={loading || !imgPreview || !isSquare || !!domainError}
          onClick={handleSave}
        >{t('imageEditModal.save', 'Salvar')}</button>
        <button
          style={{ padding: '6px 16px', borderRadius: 4, background: theme.colors.gray[7], color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer' }}
          disabled={loading}
          onClick={handleFetchSpotify}
        >{t('imageEditModal.fetchSpotify', 'Buscar do Spotify')}</button>
      </Group>
      {domainError ? (
        <div style={{ color: theme.colors.red[6], fontSize: 13, marginTop: 8 }}>
          {domainError}
        </div>
      ) : null}
    </Modal>
  );
};
