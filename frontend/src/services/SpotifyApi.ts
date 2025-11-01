// src/services/SpotifyApi.ts
// Classe para buscas na API do Spotify (endpoint /v1/search)

import { SpotifyTokenManager } from './SpotifyTokenManager';
import type { SpotifyTokenConfig } from './SpotifyTokenManager';

export const SPOTIFY_TOKEN = 'd686abb030b34dc2b3446b06507ded9b';
export const SPOTIFY_SECRET = '7611153438b2440fa4a7e22c3311f2d6';

export interface SpotifySearchOptions {
  q: string;
  type: string; // e.g. 'track', 'artist', 'album', 'playlist'
  market?: string;
  limit?: number;
  offset?: number;
}

export interface SpotifyApiConfig {
  accessToken: string;
}

export class SpotifyApi {
  private accessToken: string;
  private readonly baseUrl = 'https://api.spotify.com/v1';

  constructor(config: SpotifyApiConfig) {
    this.accessToken = config.accessToken;
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  async search(options: SpotifySearchOptions) {
    const params = new URLSearchParams();
    params.append('q', options.q);
    params.append('type', options.type);
    if (options.market) params.append('market', options.market);
    if (options.limit) params.append('limit', String(options.limit));
    if (options.offset) params.append('offset', String(options.offset));

    const url = `${this.baseUrl}/search?${params.toString()}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) {
      throw new Error(`Spotify API error: ${res.status} ${res.statusText}`);
    }
    return res.json();
  }
}

export class SpotifyApiManager {
  private tokenManager: SpotifyTokenManager;
  private api: SpotifyApi;

  constructor(config: SpotifyTokenConfig) {
    this.tokenManager = new SpotifyTokenManager(config);
    this.api = new SpotifyApi({ accessToken: '' }); // será ajustado pelo setAccessToken
  }

  async search(options: SpotifySearchOptions) {
    const accessToken = await this.tokenManager.getAccessToken();
    this.api.setAccessToken(accessToken);
    return this.api.search(options);
  }
}
