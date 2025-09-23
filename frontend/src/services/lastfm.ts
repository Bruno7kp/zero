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
}

const fetchLastFmApi = async (method: string, user: string, from: string, to: string): Promise<LastFmResponse> => {
    try {
        const lurl = `${LASTFM_API_URL}?method=${method}&user=${user}&api_key=${LASTFM_API_KEY}&format=json&from=${from}&to=${to}`;
        const response = await fetch(lurl);
        if (!response.ok) {
            throw new Error(`Erro na requisição à API: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Erro ao buscar ${method}:`, error);
        throw error;
    }
};

export const getWeeklyArtistChart = async (user: string, from: string, to: string): Promise<FormattedChartItem[]> => {
    const data = await fetchLastFmApi('user.getweeklyartistchart', user, from, to);
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

export const getWeeklyTrackChart = async (user: string, from: string, to: string): Promise<FormattedChartItem[]> => {
    const data = await fetchLastFmApi('user.getweeklytrackchart', user, from, to);
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

export const getWeeklyAlbumChart = async (user: string, from: string, to: string): Promise<FormattedChartItem[]> => {
    const data = await fetchLastFmApi('user.getweeklyalbumchart', user, from, to);
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