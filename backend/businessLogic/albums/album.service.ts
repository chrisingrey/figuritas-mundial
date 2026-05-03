import type { IRepository } from "@dataAccess/IRepository";
import { AppError, ErrorCode } from "@errors";
import type { IAlbumService } from "./IAlbumService";
import type { Album } from "./Album";
import type { CreateAlbumArgs } from "./CreateAlbumArgs";
import { validateCreateAlbumArgs } from "./CreateAlbumArgsValidator";
import type { UpdateAlbumArgs } from "./UpdateAlbumArgs";
import { validateUpdateAlbumArgs } from "./UpdateAlbumArgsValidator";
import type { AlbumRole } from "@businessLogic/albumRole";
import type { Member } from "@businessLogic/members";
import { PermissionName, type Permission } from "@businessLogic/permissions";
import { MemberStatus } from "@businessLogic/members";
import { generateAlbumStickers, ALL_STICKER_CODES } from "./stickerTemplate";
import { STICKER_STATUSES, type StickerStatus } from "./AlbumSticker";

export class AlbumService implements IAlbumService {
  constructor(
    private readonly albumRepository: IRepository<Album>,
    private readonly albumRoleRepository: IRepository<AlbumRole>,
    private readonly memberRepository: IRepository<Member>,
    private readonly permissionRepository: IRepository<Permission>,
  ) {}

  async getAlbum(id: string): Promise<Album> {
    return this.albumRepository.getAsync((a: Album) => a.id === id);
  }

  async getMyAlbum(userId: string): Promise<Album | null> {
    return this.albumRepository.getOrDefaultAsync(
      (a: Album) => a.ownerId === userId,
    );
  }

  async getAlbumByShareToken(token: string): Promise<Album | null> {
    return this.albumRepository.getOrDefaultAsync(
      (a: Album) => a.shareToken === token,
    );
  }

  async bulkSetStickerStatus(albumId: string, codes: string[], status: StickerStatus): Promise<Album> {
    if (!STICKER_STATUSES.includes(status)) {
      throw new AppError(400, ErrorCode.INVALID_STICKER_CODE, `Sticker status '${status}' does not exist.`);
    }

    const normalizedCodes = [...new Set(codes.map(code => code.trim()).filter(Boolean))];
    if (normalizedCodes.length === 0) {
      throw new AppError(400, ErrorCode.INVALID_STICKER_CODE, "No codes provided.");
    }

    const codeSet = new Set(normalizedCodes);
    for (const code of normalizedCodes) {
      if (!ALL_STICKER_CODES.has(code)) {
        throw new AppError(400, ErrorCode.INVALID_STICKER_CODE, `Sticker code '${code}' does not exist.`);
      }
    }

    const album = await this.albumRepository.getAsync((a: Album) => a.id === albumId);
    const updatedStickers = album.stickers.map(s =>
      codeSet.has(s.code) ? { ...s, status, owned: status !== "no_tengo" } : s,
    );

    return this.albumRepository.patchByIdAndSaveAsync(albumId, {
      stickers: updatedStickers,
      updatedAt: new Date(),
    });
  }

  async createAlbum(args: CreateAlbumArgs): Promise<Album> {
    const validation = validateCreateAlbumArgs(args);
    if (!validation.success) {
      throw new AppError(400, ErrorCode.INVALID_ALBUM_DATA, `Validation failed: ${validation.errors.join(", ")}`);
    }

    const now = new Date();
    const album = await this.albumRepository.createAndSaveAsync({
      id: crypto.randomUUID(),
      name: validation.data.name,
      ownerId: validation.data.userId,
      stickers: generateAlbumStickers(),
      createdAt: now,
      updatedAt: now,
    });

    const allPermissions = await this.permissionRepository.getAllAsync(
      (p: Permission) => p.type === "album",
    );

    const adminRole = await this.albumRoleRepository.createAndSaveAsync({
      id: crypto.randomUUID(),
      albumId: album.id,
      name: "Admin",
      permissions: allPermissions,
    });

    const viewAlbumPermission = allPermissions.find(
      (permission) => permission.name === PermissionName.GET_BY_ID_ALBUM,
    );
    if (!viewAlbumPermission) {
      throw new AppError(500, ErrorCode.INTERNAL_ERROR, "View album permission is not configured.");
    }

    await this.albumRoleRepository.createAndSaveAsync({
      id: crypto.randomUUID(),
      albumId: album.id,
      name: "Viewer",
      permissions: [viewAlbumPermission],
    });

    await this.memberRepository.createAndSaveAsync({
      id: crypto.randomUUID(),
      albumId: album.id,
      userId: validation.data.userId,
      roleId: adminRole.id,
      status: MemberStatus.ACTIVE,
      joinedAt: now,
    });

    return album;
  }

  async updateAlbum(id: string, args: UpdateAlbumArgs): Promise<Album> {
    const validation = validateUpdateAlbumArgs(args);
    if (!validation.success) {
      throw new AppError(400, ErrorCode.INVALID_ALBUM_DATA, `Validation failed: ${validation.errors.join(", ")}`);
    }

    return this.albumRepository.patchByIdAndSaveAsync(id, {
      name: validation.data.name,
      updatedAt: new Date(),
    });
  }
}
