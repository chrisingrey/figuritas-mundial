import type { IRepository } from "@dataAccess/IRepository";
import type { IIncludeBuilder } from "@dataAccess/models";
import { AppError, ErrorCode } from "@errors";
import type { Album } from "@businessLogic/albums";
import type { Member } from "@businessLogic/members";
import { MemberStatus } from "@businessLogic/members";
import { PermissionName } from "@businessLogic/permissions";
import type { User } from "@auth/users";
import { AlbumRequestStatus, type AlbumRequest } from "./AlbumRequest";
import type { IAlbumRequestService, ManagedAlbumForRequest } from "./IAlbumRequestService";

export class AlbumRequestService implements IAlbumRequestService {
  constructor(
    private readonly requestRepository: IRepository<AlbumRequest>,
    private readonly albumRepository: IRepository<Album>,
    private readonly memberRepository: IRepository<Member>,
    private readonly userRepository: IRepository<User>,
  ) {}

  async createRequest(albumId: string, requesterUserId: string): Promise<AlbumRequest> {
    const albumExists = await this.albumRepository.existsAsync((a: Album) => a.id === albumId);
    if (!albumExists) {
      throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, "Album not found.");
    }

    const isAlreadyMember = await this.memberRepository.existsAsync(
      (m: Member) => m.albumId === albumId &&
        m.userId === requesterUserId &&
        m.status === MemberStatus.ACTIVE,
    );
    if (isAlreadyMember) {
      throw new AppError(409, ErrorCode.MEMBER_ALREADY_EXISTS, "You are already a member of this album.");
    }

    const pendingRequest = await this.requestRepository.getOrDefaultAsync(
      (r: AlbumRequest) => r.albumId === albumId &&
        r.requesterUserId === requesterUserId &&
        r.status === AlbumRequestStatus.PENDING,
    );
    if (pendingRequest) return pendingRequest;

    return this.requestRepository.createAndSaveAsync({
      id: crypto.randomUUID(),
      albumId,
      requesterUserId,
      status: AlbumRequestStatus.PENDING,
      createdAt: new Date(),
    });
  }

  async getRequests(albumId: string): Promise<AlbumRequest[]> {
    const requests = await this.requestRepository.getAllAsync(
      (r: AlbumRequest) => r.albumId === albumId && r.status === AlbumRequestStatus.PENDING,
    );

    const withUsers: AlbumRequest[] = [];
    for (const request of requests) {
      const requesterUser = await this.userRepository.getOrDefaultAsync(
        (u: User) => u.id === request.requesterUserId,
      );
      withUsers.push({ ...request, ...(requesterUser ? { requesterUser } : {}) });
    }
    return withUsers;
  }

  async acceptRequest(albumId: string, requestId: string, resolvedByUserId: string, viewerRoleId: string): Promise<AlbumRequest> {
    const request = await this.getPendingRequest(albumId, requestId);

    const isAlreadyMember = await this.memberRepository.existsAsync(
      (m: Member) => m.albumId === albumId &&
        m.userId === request.requesterUserId &&
        m.status === MemberStatus.ACTIVE,
    );
    if (!isAlreadyMember) {
      await this.memberRepository.createAndSaveAsync({
        id: crypto.randomUUID(),
        albumId,
        userId: request.requesterUserId,
        roleId: viewerRoleId,
        status: MemberStatus.ACTIVE,
        joinedAt: new Date(),
      });
    }

    return this.requestRepository.patchByIdAndSaveAsync(requestId, {
      status: AlbumRequestStatus.ACCEPTED,
      resolvedAt: new Date(),
      resolvedByUserId,
    });
  }

  async rejectRequest(albumId: string, requestId: string, resolvedByUserId: string): Promise<AlbumRequest> {
    await this.getPendingRequest(albumId, requestId);
    return this.requestRepository.patchByIdAndSaveAsync(requestId, {
      status: AlbumRequestStatus.REJECTED,
      resolvedAt: new Date(),
      resolvedByUserId,
    });
  }

  async getManagedAlbumsForUser(targetUserId: string, currentUserId: string): Promise<ManagedAlbumForRequest[]> {
    const memberships = await this.memberRepository.getAllAsync(
      (m: Member) => m.userId === targetUserId && m.status === MemberStatus.ACTIVE,
      (c: IIncludeBuilder<Member>) => c.Include((m: Member) => m.album!),
      (c: IIncludeBuilder<Member>) => c.Include((m: Member) => m.role!),
    );

    const managedMemberships = memberships.filter((membership) => {
      const roleName = membership.role?.name.toLowerCase();
      const hasInvitePermission = membership.role?.permissions.some(
        (permission) => permission.name === PermissionName.CREATE_ALBUM_INVITATION,
      );
      return Boolean(membership.album && membership.role) &&
        (roleName === "admin" || roleName === "owner" || hasInvitePermission);
    });

    const results: ManagedAlbumForRequest[] = [];
    for (const membership of managedMemberships) {
      const currentUserMembership = await this.memberRepository.getOrDefaultAsync(
        (m: Member) => m.albumId === membership.albumId &&
          m.userId === currentUserId &&
          m.status === MemberStatus.ACTIVE,
      );
      const pendingRequest = await this.requestRepository.getOrDefaultAsync(
        (r: AlbumRequest) => r.albumId === membership.albumId &&
          r.requesterUserId === currentUserId &&
          r.status === AlbumRequestStatus.PENDING,
      );

      results.push({
        id: membership.albumId,
        name: membership.album?.name ?? "Album",
        roleName: membership.role?.name ?? "Admin",
        isCurrentUserMember: Boolean(currentUserMembership),
        ...(pendingRequest ? { pendingRequestId: pendingRequest.id } : {}),
      });
    }

    return results;
  }

  private async getPendingRequest(albumId: string, requestId: string): Promise<AlbumRequest> {
    const request = await this.requestRepository.getOrDefaultAsync(
      (r: AlbumRequest) => r.id === requestId && r.albumId === albumId,
    );
    if (!request) {
      throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, "Album request not found.");
    }
    if (request.status !== AlbumRequestStatus.PENDING) {
      throw new AppError(400, ErrorCode.INVITATION_NOT_PENDING, "This request is no longer pending.");
    }
    return request;
  }
}
