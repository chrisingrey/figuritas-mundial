export interface AlbumStickerResponse {
  code: string;
  owned: boolean;
}

export interface AlbumResponse {
  id: string;
  name: string;
  ownerId: string;
  stickers: AlbumStickerResponse[];
  ownedCount: number;
  totalCount: number;
  createdAt: string;
  updatedAt: string;
  permissions?: { id: string; name: string; code: string }[];
}
