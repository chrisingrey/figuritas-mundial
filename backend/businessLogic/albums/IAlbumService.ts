import type { Album } from "./Album";
import type { CreateAlbumArgs } from "./CreateAlbumArgs";
import type { UpdateAlbumArgs } from "./UpdateAlbumArgs";
import type { StickerStatus } from "./AlbumSticker";

export interface IAlbumService {
  getAlbum(id: string): Promise<Album>;
  getMyAlbum(userId: string): Promise<Album | null>;
  getAlbumByShareToken(token: string): Promise<Album | null>;
  createAlbum(args: CreateAlbumArgs): Promise<Album>;
  updateAlbum(id: string, args: UpdateAlbumArgs): Promise<Album>;
  bulkSetStickerStatus(albumId: string, codes: string[], status: StickerStatus): Promise<Album>;
  setStickerRepeated(albumId: string, code: string, repeated: number): Promise<Album>;
  bulkSetStickerRepeated(albumId: string, updates: { code: string; repeated: number }[]): Promise<Album>;
}
