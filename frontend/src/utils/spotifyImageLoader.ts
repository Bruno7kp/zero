import { spotifyImagesDb } from '../db/spotifyImagesDb';
import { SpotifyApiManager, SPOTIFY_TOKEN, SPOTIFY_SECRET } from '../services/SpotifyApi';

export type SpotifyEntityType = 'track' | 'album' | 'artist';

interface FetchImageParams {
  entityId: string;
  name: string;
  artistName?: string;
  type: SpotifyEntityType;
}

let spotifyManager: SpotifyApiManager | null = null;

async function getSpotifyManager() {
  if (!spotifyManager) {
    spotifyManager = new SpotifyApiManager({
      clientId: SPOTIFY_TOKEN,
      clientSecret: SPOTIFY_SECRET,
    });
  }
  return spotifyManager;
}

function buildSearchQuery({ name, artistName, type }: FetchImageParams) {
  if (type === 'artist') return name;
  if ((type === 'track' || type === 'album') && artistName) {
    return `${name} ${artistName}`;
  }
  return name;
}

export async function fetchSpotifyImageUrl(params: FetchImageParams): Promise<string | null> {
  if (!params.entityId || !params.name) {
    return null;
  }

  const cached = await spotifyImagesDb.images.get(params.entityId);
  if (cached?.imageUrl) {
    return cached.imageUrl;
  }

  try {
    const manager = await getSpotifyManager();
    const query = buildSearchQuery(params);
    const result = await manager.search({ q: query, type: params.type, limit: 2 });

    let imageUrl: string | undefined;
    if (params.type === 'artist') {
      imageUrl = result.artists?.items?.[0]?.images?.[0]?.url;
    } else if (params.type === 'album') {
      imageUrl = result.albums?.items?.[0]?.images?.[0]?.url;
    } else if (params.type === 'track') {
      imageUrl = result.tracks?.items?.[0]?.album?.images?.[0]?.url;
    }

    if (imageUrl) {
      await spotifyImagesDb.images.put({
        entityId: params.entityId,
        imageUrl,
        updatedAt: Date.now(),
      });
      return imageUrl;
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('[spotifyImageLoader] failed to fetch image', error);
    }
  }

  return null;
}

export async function fetchSpotifyImagesBatch(
  entities: FetchImageParams[]
): Promise<Record<string, string>> {
  if (!entities.length) return {};

  const results: Record<string, string> = {};

  for (const entity of entities) {
    const url = await fetchSpotifyImageUrl(entity);
    if (url) {
      results[entity.entityId] = url;
    }
  }

  return results;
}
