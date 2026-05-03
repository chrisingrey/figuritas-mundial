import type { AlbumSticker } from "./AlbumSticker";

export interface Album {
  id: string;
  name: string;
  ownerId: string;
  stickers: AlbumSticker[];
  shareToken?: string;
  createdAt: Date;
  updatedAt: Date;
}
