import type { Predicate } from "@dataAccess/IRepository";
import type { AlbumRole } from "./AlbumRole";
import type { CreateAlbumRoleArgs } from "./CreateAlbumRoleArgs";
import type { PatchAlbumRoleArgs } from "./PatchAlbumRoleArgs";
import type { Permission } from "@businessLogic/permissions";

export interface IAlbumRoleService {
  getOrDefaultAsync(predicate: Predicate<AlbumRole>): Promise<AlbumRole | null>;
  getAlbumPermissions(): Promise<Permission[]>;
  getRoles(albumId: string): Promise<AlbumRole[]>;
  createRole(albumId: string, args: CreateAlbumRoleArgs): Promise<AlbumRole>;
  patchRole(albumId: string, roleId: string, args: PatchAlbumRoleArgs): Promise<AlbumRole>;
  deleteRole(albumId: string, roleId: string): Promise<void>;
}
