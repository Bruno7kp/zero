// src/services/SpotifyTokenManager.ts
// Gerencia o access_token do Spotify (client credentials flow)

export interface SpotifyTokenConfig {
  clientId: string;
  clientSecret: string;
}

interface TokenData {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at: number; // timestamp em ms
}

export class SpotifyTokenManager {
  private clientId: string;
  private clientSecret: string;
  private tokenData: TokenData | null = null;

  constructor(config: SpotifyTokenConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
  }

  async getAccessToken(): Promise<string> {
    if (this.tokenData && Date.now() < this.tokenData.expires_at) {
      return this.tokenData.access_token;
    }
    await this.fetchToken();
    if (!this.tokenData) throw new Error('Spotify token fetch failed');
    return this.tokenData.access_token;
  }

  private async fetchToken() {
    const body = new URLSearchParams();
    body.append('grant_type', 'client_credentials');
    body.append('client_id', this.clientId);
    body.append('client_secret', this.clientSecret);
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!res.ok) throw new Error('Spotify token request failed');
    const json = await res.json();
    this.tokenData = {
      ...json,
      expires_at: Date.now() + (json.expires_in - 30) * 1000, // 30s de margem
    };
  }
}
