import type { Album } from "./Album";
import type { CreateAlbumArgs } from "./CreateAlbumArgs";
import type { UpdateAlbumArgs } from "./UpdateAlbumArgs";
import type { ToggleStickerArgs } from "./ToggleStickerArgs";

export interface IAlbumService {
  getAlbum(id: string): Promise<Album>;
  getMyAlbum(userId: string): Promise<Album | null>;
  createAlbum(args: CreateAlbumArgs): Promise<Album>;
  updateAlbum(id: string, args: UpdateAlbumArgs): Promise<Album>;
  toggleSticker(args: ToggleStickerArgs): Promise<Album>;
}
