export type StickerStatus = "no_tengo" | "tengo" | "pegado";

export interface AlbumStickerResponse {
  code: string;
  status: StickerStatus;
  owned: boolean;
  repeated: number;
}

export interface AlbumResponse {
  id: string;
  name: string;
  ownerId: string;
  stickers: AlbumStickerResponse[];
  ownedCount: number;
  totalCount: number;
  shareToken?: string;
  createdAt: string;
  updatedAt: string;
  permissions?: { id: string; name: string; code: string }[];
}
