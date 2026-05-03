import type { IRepository } from "@dataAccess/IRepository";
import type { IPermissionService } from "./IPermissionService";
import type { Permission } from "./Permission";
import { ALL_PERMISSION_DEFINITIONS } from "./PermissionCode";

export class PermissionService implements IPermissionService {
  constructor(
    private readonly permissionRepository: IRepository<Permission>,
  ) {}

  async seedPermissions(): Promise<void> {
    for (const definition of ALL_PERMISSION_DEFINITIONS) {
      const existingPermission = await this.permissionRepository.getOrDefaultAsync(
        (permission) =>
          permission.code === definition.code ||
          permission.name === definition.name ||
          (definition.legacyNames?.includes(permission.name) ?? false),
      );

      if (!existingPermission) {
        await this.permissionRepository.createAndSaveAsync({
          id: crypto.randomUUID(),
          name: definition.name,
          code: definition.code,
          type: definition.type,
        });
        continue;
      }

      if (
        existingPermission.name !== definition.name ||
        existingPermission.code !== definition.code ||
        existingPermission.type !== definition.type
      ) {
        await this.permissionRepository.patchByIdAndSaveAsync(existingPermission.id, {
          name: definition.name,
          code: definition.code,
          type: definition.type,
        });
      }
    }
  }

  async getAlbumPermissions(): Promise<Permission[]> {
    return this.permissionRepository.getAllAsync((p) => p.type === "album");
  }

  async getBackOfficePermissions(): Promise<Permission[]> {
    return this.permissionRepository.getAllAsync((p) => p.type === "back-office");
  }
}
