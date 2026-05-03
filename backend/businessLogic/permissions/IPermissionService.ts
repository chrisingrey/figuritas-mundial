import type { Permission } from "./Permission";

export interface IPermissionService {
  seedPermissions(): Promise<void>;
  getAlbumPermissions(): Promise<Permission[]>;
  getBackOfficePermissions(): Promise<Permission[]>;
}
