import type { IRepository, Predicate } from "@dataAccess/IRepository";
import { AppError, ErrorCode } from "@errors";
import type { IAlbumRoleService } from "./IAlbumRoleService";
import type { AlbumRole } from "./AlbumRole";
import type { CreateAlbumRoleArgs } from "./CreateAlbumRoleArgs";
import { validateCreateAlbumRoleArgs } from "./CreateAlbumRoleArgsValidator";
import type { PatchAlbumRoleArgs } from "./PatchAlbumRoleArgs";
import { validatePatchAlbumRoleArgs } from "./PatchAlbumRoleArgsValidator";
import type { Permission, IPermissionService } from "@businessLogic/permissions";

export class AlbumRoleService implements IAlbumRoleService {
  constructor(
    private readonly albumRoleRepository: IRepository<AlbumRole>,
    private readonly permissionService: IPermissionService,
  ) {}

  async getOrDefaultAsync(predicate: Predicate<AlbumRole>): Promise<AlbumRole | null> {
    return this.albumRoleRepository.getOrDefaultAsync(predicate);
  }

  async getAlbumPermissions(): Promise<Permission[]> {
    return this.permissionService.getAlbumPermissions();
  }

  async getRoles(albumId: string): Promise<AlbumRole[]> {
    return this.albumRoleRepository.getAllAsync(
      (role: AlbumRole) => role.albumId === albumId,
    );
  }

  async createRole(albumId: string, args: CreateAlbumRoleArgs): Promise<AlbumRole> {
    const validation = validateCreateAlbumRoleArgs(args);
    if (!validation.success) {
      throw new AppError(400, ErrorCode.INVALID_ALBUM_ROLE_DATA, `Validation failed: ${validation.errors.join(", ")}`);
    }

    const permissions = await this.resolvePermissions(validation.data.permissionIds);

    return this.albumRoleRepository.createAndSaveAsync({
      id: crypto.randomUUID(),
      albumId,
      name: validation.data.name,
      permissions,
    });
  }

  async patchRole(albumId: string, roleId: string, args: PatchAlbumRoleArgs): Promise<AlbumRole> {
    const validation = validatePatchAlbumRoleArgs(args);
    if (!validation.success) {
      throw new AppError(400, ErrorCode.INVALID_ALBUM_ROLE_DATA, `Validation failed: ${validation.errors.join(", ")}`);
    }

    const existing = await this.albumRoleRepository.getOrDefaultAsync(
      (role: AlbumRole) => role.id === roleId && role.albumId === albumId,
    );
    if (!existing) {
      throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, "Album role not found.");
    }

    const patch: Partial<Omit<AlbumRole, "id">> = {};
    if (validation.data.name !== undefined) {
      patch.name = validation.data.name;
    }
    if (validation.data.permissionIds !== undefined) {
      patch.permissions = await this.resolvePermissions(validation.data.permissionIds);
    }

    return this.albumRoleRepository.patchByIdAndSaveAsync(roleId, patch);
  }

  async deleteRole(albumId: string, roleId: string): Promise<void> {
    const existing = await this.albumRoleRepository.getOrDefaultAsync(
      (role: AlbumRole) => role.id === roleId && role.albumId === albumId,
    );
    if (!existing) {
      throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, "Album role not found.");
    }

    await this.albumRoleRepository.deleteByIdAsync(roleId);
  }

  private async resolvePermissions(permissionIds: string[]): Promise<Permission[]> {
    const allAlbumPermissions = await this.permissionService.getAlbumPermissions();
    const resolved = permissionIds
      .map((id) => allAlbumPermissions.find((p: Permission) => p.id === id))
      .filter((p): p is Permission => p !== undefined);

    if (resolved.length !== permissionIds.length) {
      throw new AppError(400, ErrorCode.INVALID_ALBUM_ROLE_DATA, "One or more permission IDs are invalid or not album permissions.");
    }

    return resolved;
  }
}
