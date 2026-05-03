import type { Album, AlbumSticker } from "@businessLogic/albums";
import { resolveStickerStatus } from "@businessLogic/albums/AlbumSticker";
import type { Permission } from "@businessLogic/permissions";
import { mapPermissionResponse, type PermissionResponse } from "./AlbumRoleResponse";

export type StickerStatusResponse = "no_tengo" | "tengo" | "pegado";

export interface AlbumStickerResponse {
  code: string;
  status: StickerStatusResponse;
  owned: boolean;
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
  permissions?: PermissionResponse[];
}

const mapStickerResponse = (s: AlbumSticker): AlbumStickerResponse => {
  const status = resolveStickerStatus(s);
  return {
    code: s.code,
    status,
    owned: status !== "no_tengo",
  };
};

export const mapAlbumResponse = (
  album: Album,
  permissions?: Permission[],
): AlbumResponse => ({
  id: album.id,
  name: album.name,
  ownerId: album.ownerId,
  stickers: album.stickers.map(mapStickerResponse),
  ownedCount: album.stickers.filter(s => resolveStickerStatus(s) !== "no_tengo").length,
  totalCount: album.stickers.length,
  ...(album.shareToken ? { shareToken: album.shareToken } : {}),
  createdAt: new Date(album.createdAt).toISOString(),
  updatedAt: new Date(album.updatedAt).toISOString(),
  ...(permissions ? { permissions: permissions.map(mapPermissionResponse) } : {}),
});
