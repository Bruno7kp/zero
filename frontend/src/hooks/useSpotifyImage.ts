// src/hooks/useSpotifyImage.ts
import { useEffect, useState, useRef } from 'react';
import { spotifyImagesDb } from '../db/spotifyImagesDb';
import { SpotifyApiManager } from '../services/SpotifyApi';


interface UseSpotifyImageOptions {
  entityId: string;
  name: string;
  type: 'track' | 'artist' | 'album';
  clientId: string;
  clientSecret: string;
}

export function useSpotifyImage({ entityId, name, type, clientId, clientSecret }: UseSpotifyImageOptions) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Mantém a última imagem válida até a nova ser carregada
  const lastValidImage = useRef<string | null>(null);

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
        lastValidImage.current = cached.imageUrl;
        setLoading(false);
        return;
      }
      // 2. Busca na API do Spotify usando o manager
      try {
        const apiManager = new SpotifyApiManager({ clientId, clientSecret });
        const result = await apiManager.search({ q: name, type, limit: 2 });
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
          lastValidImage.current = url;
          await spotifyImagesDb.images.put({ entityId, imageUrl: url, updatedAt: Date.now() });
        } else {
          setImageUrl(null);
        }
      } catch (e) {
        // fallback: não faz nada
      }
      setLoading(false);
    }
    if (entityId && name && clientId && clientSecret) fetchImage();
    return () => { cancelled = true; };
  }, [entityId, name, type, clientId, clientSecret]);

  // Retorna a última imagem válida enquanto está carregando
  return { imageUrl: imageUrl || lastValidImage.current, loading };
}
