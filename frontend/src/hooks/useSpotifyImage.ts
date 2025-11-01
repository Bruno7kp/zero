// src/hooks/useSpotifyImage.ts
import { useEffect, useState } from 'react';
import { spotifyImagesDb } from '../db/spotifyImagesDb';
import { SpotifyApiManager } from '../services/SpotifyApi';

interface UseSpotifyImageOptions {
  entityId: string;
  name: string;
  artist?: string;
  type: 'track' | 'artist' | 'album';
  clientId: string;
  clientSecret: string;
}

export function useSpotifyImage({
  entityId,
  name,
  artist,
  type,
  clientId,
  clientSecret,
}: UseSpotifyImageOptions) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Mantém a última imagem válida até a nova ser carregada (em estado, para não acessar refs no render)
  const [lastValidImageUrl, setLastValidImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchImage() {
      setLoading(true);
      // Não limpa a imagem anterior imediatamente
      // 1. Tenta pegar do cache
      const cached = await spotifyImagesDb.images.get(entityId);
      if (cancelled) return;
      if (cached && cached.imageUrl) {
        setImageUrl(cached.imageUrl);
        setLastValidImageUrl(cached.imageUrl);
        setLoading(false);
        return;
      }
      // 2. Busca na API do Spotify usando o manager
      try {
        let searchName = name;
        if (type === 'artist') {
          searchName = name;
        } else if ((type === 'track' || type === 'album') && artist) {
          searchName = name + ' ' + artist;
        }
        const apiManager = new SpotifyApiManager({ clientId, clientSecret });
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
          setImageUrl(url);
          setLastValidImageUrl(url);
          await spotifyImagesDb.images.put({ entityId, imageUrl: url, updatedAt: Date.now() });
        } else {
          setImageUrl(null);
        }
      } catch {
        // fallback silencioso
      }
      setLoading(false);
    }
    if (entityId && name && clientId && clientSecret) fetchImage();
    return () => {
      cancelled = true;
    };
  }, [entityId, name, artist, type, clientId, clientSecret]);

  // Retorna a última imagem válida enquanto está carregando (evita flicker)
  const effectiveUrl = loading ? imageUrl ?? lastValidImageUrl : imageUrl;
  return { imageUrl: effectiveUrl, loading };
}
