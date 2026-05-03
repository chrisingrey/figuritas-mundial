import type { AlbumRole } from "@businessLogic/albumRole";
import type { Permission } from "@businessLogic/permissions";

export interface PermissionResponse {
  id: string;
  name: string;
  code: string;
  type: string;
}

export interface AlbumRoleResponse {
  id: string;
  albumId: string;
  name: string;
  permissions: PermissionResponse[];
}

export const mapPermissionResponse = (permission: Permission): PermissionResponse => ({
  id: permission.id,
  name: permission.name,
  code: permission.code,
  type: permission.type,
});

export const mapAlbumRoleResponse = (role: AlbumRole): AlbumRoleResponse => ({
  id: role.id,
  albumId: role.albumId,
  name: role.name,
  permissions: role.permissions.map(mapPermissionResponse),
});
