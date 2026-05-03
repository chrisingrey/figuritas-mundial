import type { IRepository } from "@dataAccess/IRepository";
import { AppError, ErrorCode } from "@errors";
import type { IAlbumService } from "./IAlbumService";
import type { Album } from "./Album";
import type { CreateAlbumArgs } from "./CreateAlbumArgs";
import { validateCreateAlbumArgs } from "./CreateAlbumArgsValidator";
import type { UpdateAlbumArgs } from "./UpdateAlbumArgs";
import { validateUpdateAlbumArgs } from "./UpdateAlbumArgsValidator";
import type { ToggleStickerArgs } from "./ToggleStickerArgs";
import { validateToggleStickerArgs } from "./ToggleStickerArgsValidator";
import type { AlbumRole } from "@businessLogic/albumRole";
import type { Member } from "@businessLogic/members";
import type { Permission } from "@businessLogic/permissions";
import { MemberStatus } from "@businessLogic/members";
import { generateAlbumStickers, ALL_STICKER_CODES } from "./stickerTemplate";

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

  async toggleSticker(args: ToggleStickerArgs): Promise<Album> {
    const validation = validateToggleStickerArgs(args);
    if (!validation.success) {
      throw new AppError(400, ErrorCode.INVALID_STICKER_CODE, `Validation failed: ${validation.errors.join(", ")}`);
    }

    if (!ALL_STICKER_CODES.has(args.code)) {
      throw new AppError(400, ErrorCode.INVALID_STICKER_CODE, `Sticker code '${args.code}' does not exist.`);
    }

    const album = await this.albumRepository.getAsync((a: Album) => a.id === args.albumId);

    const updatedStickers = album.stickers.map(s =>
      s.code === args.code ? { ...s, owned: !s.owned } : s,
    );

    return this.albumRepository.patchByIdAndSaveAsync(args.albumId, {
      stickers: updatedStickers,
      updatedAt: new Date(),
    });
  }
}
