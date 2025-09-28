// src/services/lastfm.ts

const LASTFM_API_KEY = 'e35699481c9c3134d856e99792a2b6de';
const LASTFM_API_URL = 'https://ws.audioscrobbler.com/2.0/';

// Interfaces para os dados formatados
export interface FormattedChartItem {
    rank: number;
    name: string;
    artist?: string; // Opcional para tracks e albums
    playcount: number;
}

// Interfaces para a resposta bruta da API
interface LastFmResponse {
    weeklyartistchart?: {
        artist: {
            name: string;
            playcount: string;
            '@attr': { rank: string };
        }[];
    };
    weeklytrackchart?: {
        track: {
            name: string;
            playcount: string;
            artist: { '#text': string };
            '@attr': { rank: string };
        }[];
    };
    weeklyalbumchart?: {
        album: {
            name: string;
            playcount: string;
            artist: { '#text': string };
            '@attr': { rank: string };
        }[];
    };
    track?: any;
    album?: any;
}

// Generic fetch. For methods that need 'username' (track.getInfo / album.getInfo) we pass a flag.
class LastFmApiError extends Error {
        code?: number;
        httpStatus?: number;
        constructor(message: string, opts: { code?: number; httpStatus?: number } = {}) {
                super(message);
                this.name = 'LastFmApiError';
                this.code = opts.code;
                this.httpStatus = opts.httpStatus;
        }
}

const fetchLastFmApi = async (
    method: string,
    user: string,
    from?: string,
    to?: string,
    extra: Record<string, string> = {},
    useUsernameParam: boolean = false
): Promise<LastFmResponse> => {
    try {
        const base: Record<string, string> = {
            method,
            api_key: LASTFM_API_KEY,
            format: 'json',
            ...(from ? { from } : {}),
            ...(to ? { to } : {}),
            ...extra,
        };
        if (user) {
            if (useUsernameParam) base.username = user;
            else base.user = user;
        }
        const params = new URLSearchParams(base);
        const lurl = `${LASTFM_API_URL}?${params.toString()}`;
        const response = await fetch(lurl);
        if (!response.ok) {
            throw new LastFmApiError(`[LASTFM][HTTP:${response.status}] ${response.statusText}`, { httpStatus: response.status });
        }
        const json = await response.json();
        if ((json as any)?.error) {
            // Last.fm error codes (e.g., 6 user not found, 29 rate limit, etc.)
            const code = (json as any).error;
            const msg = (json as any).message || 'Error';
            throw new LastFmApiError(`[LASTFM][CODE:${code}] ${msg}`, { code });
        }
        return json;
    } catch (error) {
        console.error(`Erro ao buscar ${method}:`, error);
        throw error;
    }
};


export const getWeeklyArtistChart = async (user: string, from: string, to: string, limit: number): Promise<FormattedChartItem[]> => {
    const data = await fetchLastFmApi('user.getweeklyartistchart', user, from, to, { limit: String(limit) });
    const artists = data?.weeklyartistchart?.artist;
    if (!artists) {
        return [];
    }
    return artists.map(artist => ({
        rank: parseInt(artist['@attr'].rank, 10),
        name: artist.name,
        playcount: parseInt(artist.playcount, 10),
    }));
};


export const getWeeklyTrackChart = async (user: string, from: string, to: string, limit: number): Promise<FormattedChartItem[]> => {
    const data = await fetchLastFmApi('user.getweeklytrackchart', user, from, to, { limit: String(limit) });
    const tracks = data?.weeklytrackchart?.track;
    if (!tracks) {
        return [];
    }
    return tracks.map(track => ({
        rank: parseInt(track['@attr'].rank, 10),
        name: track.name,
        artist: track.artist['#text'],
        playcount: parseInt(track.playcount, 10),
    }));
};


export const getWeeklyAlbumChart = async (user: string, from: string, to: string, limit: number): Promise<FormattedChartItem[]> => {
    const data = await fetchLastFmApi('user.getweeklyalbumchart', user, from, to, { limit: String(limit) });
    const albums = data?.weeklyalbumchart?.album;
    if (!albums) {
        return [];
    }
    return albums.map(album => ({
        rank: parseInt(album['@attr'].rank, 10),
        name: album.name,
        artist: album.artist['#text'],
        playcount: parseInt(album.playcount, 10),
    }));
};

export const getTrackInfo = async (user: string, artist: string, track: string) => {
    // Primeiro tenta sem autocorrect para manter consistência; se não vier userplaycount tenta com autocorrect=1
    let data = await fetchLastFmApi('track.getInfo', user, undefined, undefined, { artist, track, autocorrect: '0' }, true);
    if (!data?.track?.userplaycount) {
        try {
            data = await fetchLastFmApi('track.getInfo', user, undefined, undefined, { artist, track, autocorrect: '1' }, true);
        } catch {/* ignore fallback error */}
    }
    return data?.track;
};

export const getAlbumInfo = async (user: string, artist: string, album: string) => {
    let data = await fetchLastFmApi('album.getInfo', user, undefined, undefined, { artist, album }, true);
    if (!data?.album?.userplaycount) {
        try {
            data = await fetchLastFmApi('album.getInfo', user, undefined, undefined, { artist, album, autocorrect: '1' }, true);
        } catch {/* ignore */}
    }
    return data?.album;
};