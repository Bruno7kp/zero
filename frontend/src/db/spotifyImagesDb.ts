// src/db/spotifyImagesDb.ts
import Dexie from 'dexie';
import type { Table } from 'dexie';

export interface SpotifyImageCache {
  entityId: string; // pode ser trackId, artistId, albumId, etc
  imageUrl: string;
  updatedAt: number;
}

class SpotifyImagesDb extends Dexie {
  images!: Table<SpotifyImageCache, string>;

  constructor() {
    super('SpotifyImagesDb');
    this.version(1).stores({
      images: 'entityId',
    });
  }
}

export const spotifyImagesDb = new SpotifyImagesDb();
