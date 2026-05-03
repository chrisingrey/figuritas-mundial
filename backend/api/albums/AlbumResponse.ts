import type { Album, AlbumSticker } from "@businessLogic/albums";
import type { Permission } from "@businessLogic/permissions";
import { mapPermissionResponse, type PermissionResponse } from "./AlbumRoleResponse";

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
  permissions?: PermissionResponse[];
}

const mapStickerResponse = (s: AlbumSticker): AlbumStickerResponse => ({
  code: s.code,
  owned: s.owned,
});

export const mapAlbumResponse = (
  album: Album,
  permissions?: Permission[],
): AlbumResponse => ({
  id: album.id,
  name: album.name,
  ownerId: album.ownerId,
  stickers: album.stickers.map(mapStickerResponse),
  ownedCount: album.stickers.filter(s => s.owned).length,
  totalCount: album.stickers.length,
  createdAt: new Date(album.createdAt).toISOString(),
  updatedAt: new Date(album.updatedAt).toISOString(),
  ...(permissions ? { permissions: permissions.map(mapPermissionResponse) } : {}),
});
