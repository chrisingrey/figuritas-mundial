import type { Permission } from "@businessLogic/permissions";

export interface AlbumRole {
  id: string;
  albumId: string;
  name: string;
  permissions: Permission[];
}
