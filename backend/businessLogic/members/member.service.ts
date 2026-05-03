import type { IRepository } from "@dataAccess/IRepository";
import type { IIncludeBuilder } from "@dataAccess/models";
import { AppError, ErrorCode } from "@errors";
import type { IMemberService } from "./IMemberService";
import type { Member } from "./Member";
import { MemberStatus } from "./MemberStatus";
import type { UpdateMemberRoleArgs } from "./UpdateMemberRoleArgs";
import { validateUpdateMemberRoleArgs } from "./UpdateMemberRoleArgsValidator";
import type { AlbumRole } from "@businessLogic/albumRole";

export class MemberService implements IMemberService {
  constructor(
    private readonly memberRepository: IRepository<Member>,
    private readonly albumRoleRepository: IRepository<AlbumRole>,
  ) {}

  /**
   * Returns the active member with role populated — optimized single query using includes.
   * Used by memberAuthorizationFilter to eliminate the separate role lookup.
   */
  async getMemberWithRole(albumId: string, userId: string): Promise<Member | null> {
    return this.memberRepository.getOrDefaultAsync(
      (m: Member) => m.albumId === albumId && m.userId === userId && m.status === MemberStatus.ACTIVE,
      (c: IIncludeBuilder<Member>) => c.Include((m: Member) => m.role!),
    );
  }

  async getOrDefaultAsync(albumId: string, userId: string): Promise<Member | null> {
    return this.memberRepository.getOrDefaultAsync(
      (m: Member) => m.albumId === albumId && m.userId === userId && m.status === MemberStatus.ACTIVE,
    );
  }

  /**
   * Returns all active members with user info populated — single query via includes.
   * Eliminates N+1 user lookups when building AlbumMemberResponse[].
   */
  async getMembers(albumId: string): Promise<Member[]> {
    return this.memberRepository.getAllAsync(
      (m: Member) => m.albumId === albumId && m.status === MemberStatus.ACTIVE,
      (c: IIncludeBuilder<Member>) => c.Include((m: Member) => m.user!),
    );
  }

  /**
   * Returns all active memberships for a user with album and role populated — single query via includes.
   * Eliminates N*2 lookups when building MyAlbumMembershipResponse[].
   */
  async getMyMemberships(userId: string): Promise<Member[]> {
    const memberships = await this.memberRepository.getAllAsync(
      (m: Member) => m.userId === userId && m.status === MemberStatus.ACTIVE,
      (c: IIncludeBuilder<Member>) => c.Include((m: Member) => m.album!),
      (c: IIncludeBuilder<Member>) => c.Include((m: Member) => m.role!),
    );

    // Exclude orphan memberships where related album/role no longer exists.
    return memberships.filter((membership) => Boolean(membership.album && membership.role));
  }

  async updateMemberRole(albumId: string, memberId: string, args: UpdateMemberRoleArgs): Promise<Member> {
    const validation = validateUpdateMemberRoleArgs(args);
    if (!validation.success) {
      throw new AppError(400, ErrorCode.VALIDATION_ERROR, `Validation failed: ${validation.errors.join(", ")}`);
    }

    const member = await this.memberRepository.getOrDefaultAsync(
      (m: Member) => m.id === memberId && m.albumId === albumId && m.status === MemberStatus.ACTIVE,
    );
    if (!member) {
      throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, "Member not found.");
    }

    const roleExists = await this.albumRoleRepository.existsAsync(
      (r: AlbumRole) => r.id === validation.data.roleId && r.albumId === albumId,
    );
    if (!roleExists) {
      throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, "Role not found in this album.");
    }

    return this.memberRepository.patchByIdAndSaveAsync(memberId, {
      roleId: validation.data.roleId,
    });
  }

  async removeMember(albumId: string, memberId: string): Promise<void> {
    const member = await this.memberRepository.getOrDefaultAsync(
      (m: Member) => m.id === memberId && m.albumId === albumId && m.status === MemberStatus.ACTIVE,
    );
    if (!member) {
      throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, "Member not found.");
    }

    await this.memberRepository.patchByIdAndSaveAsync(memberId, {
      status: MemberStatus.INACTIVE,
    });
  }
}
