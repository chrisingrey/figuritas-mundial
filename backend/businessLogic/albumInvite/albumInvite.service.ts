import type { IRepository } from "@dataAccess/IRepository";
import { AppError, ErrorCode } from "@errors";
import type { IAlbumInviteService, AlbumInvitationWithAlbumName } from "./IAlbumInviteService";
import type { AlbumInvitation } from "./AlbumInvitation";
import { InvitationStatus } from "./InvitationStatus";
import type { InviteMemberArgs } from "./InviteMemberArgs";
import { validateInviteMemberArgs } from "./InviteMemberArgsValidator";
import { buildMemberInvitationEmail } from "./MemberInvitationPage";
import type { Album } from "@businessLogic/albums";
import type { AlbumRole } from "@businessLogic/albumRole";
import type { Member } from "@businessLogic/members";
import { MemberStatus } from "@businessLogic/members";
import type { User } from "@auth/users";
import type { IMessagingService } from "@businessLogic/messaging";
import type { Email } from "@businessLogic/messaging";
import type { INotificationService } from "@businessLogic/notifications";
import {
  NotificationActionType,
  NotificationTargetPages,
} from "@businessLogic/notifications";

const INVITATION_EXPIRY_DAYS = 7;

export class AlbumInviteService implements IAlbumInviteService {
  constructor(
    private readonly invitationRepository: IRepository<AlbumInvitation>,
    private readonly albumRepository: IRepository<Album>,
    private readonly albumRoleRepository: IRepository<AlbumRole>,
    private readonly memberRepository: IRepository<Member>,
    private readonly userRepository: IRepository<User>,
    private readonly messagingService: IMessagingService<Email>,
    private readonly notificationService: INotificationService,
  ) {}

  async inviteMember(args: InviteMemberArgs): Promise<AlbumInvitation> {
    const validation = validateInviteMemberArgs(args);
    if (!validation.success) {
      throw new AppError(400, ErrorCode.INVALID_INVITATION_DATA, `Validation failed: ${validation.errors.join(", ")}`);
    }

    const album = await this.albumRepository.getOrDefaultAsync(
      (h: Album) => h.id === validation.data.albumId,
    );
    if (!album) {
      throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, "Album not found.");
    }

    const roleExists = await this.albumRoleRepository.existsAsync(
      (r: AlbumRole) => r.id === validation.data.roleId && r.albumId === validation.data.albumId,
    );
    if (!roleExists) {
      throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, "Role not found in this album.");
    }

    const invitedUser = await this.userRepository.getOrDefaultAsync(
      (u: User) => u.email.toLowerCase() === validation.data.invitedEmail.toLowerCase(),
    );

    if (invitedUser) {
      const isAlreadyMember = await this.memberRepository.existsAsync(
        (m: Member) => m.albumId === validation.data.albumId &&
          m.userId === invitedUser.id &&
          m.status === MemberStatus.ACTIVE,
      );
      if (isAlreadyMember) {
        throw new AppError(409, ErrorCode.MEMBER_ALREADY_EXISTS, "This user is already an active member of the album.");
      }
    }

    const hasPendingInvitation = await this.invitationRepository.existsAsync(
      (i: AlbumInvitation) => i.albumId === validation.data.albumId &&
        i.invitedEmail.toLowerCase() === validation.data.invitedEmail.toLowerCase() &&
        i.status === InvitationStatus.PENDING,
    );
    if (hasPendingInvitation) {
      throw new AppError(409, ErrorCode.INVITATION_ALREADY_PENDING, "A pending invitation already exists for this email in this album.");
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

    const invitation = await this.invitationRepository.createAndSaveAsync({
      id: crypto.randomUUID(),
      albumId: validation.data.albumId,
      invitedByUserId: validation.data.invitedByUserId,
      invitedEmail: validation.data.invitedEmail,
      roleId: validation.data.roleId,
      status: InvitationStatus.PENDING,
      expiresAt,
    });

    await this.messagingService.send({
      from: process.env.MAIL_FROM!,
      to: invitation.invitedEmail,
      subject: `You have been invited to join ${album.name}`,
      html: buildMemberInvitationEmail({
        albumId: album.id,
        albumName: album.name,
        invitedEmail: invitation.invitedEmail,
        invitationId: invitation.id,
        appBaseUrl: resolveFrontendBaseUrl(),
      }),
    });

    if (invitedUser) {
      await this.notificationService.createNotification({
        title: `Invitation to ${album.name}`,
        description: `You have been invited to join the album "${album.name}".`,
        targetUserId: invitedUser.id,
        action: {
          type: NotificationActionType.TAKE_ME_THERE,
          targetPage: NotificationTargetPages.ALBUM_INVITE,
          metadata: {
            albumId: album.id,
            invitationId: invitation.id,
          },
        },
      });
    }

    return invitation;
  }

  async getInvitationById(albumId: string, invitationId: string): Promise<AlbumInvitation> {
    const invitation = await this.invitationRepository.getOrDefaultAsync(
      (i: AlbumInvitation) => i.id === invitationId && i.albumId === albumId,
    );
    if (!invitation) {
      throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, "Invitation not found.");
    }
    return invitation;
  }

  async acceptInvitation(albumId: string, invitationId: string, userId: string, userEmail: string): Promise<void> {
    const invitation = await this.invitationRepository.getOrDefaultAsync(
      (i: AlbumInvitation) => i.id === invitationId && i.albumId === albumId,
    );
    if (!invitation) {
      throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, "Invitation not found.");
    }

    if (invitation.invitedEmail.toLowerCase() !== userEmail.toLowerCase()) {
      throw new AppError(403, ErrorCode.UNAUTHORIZED, "This invitation was not sent to your email address.");
    }

    if (invitation.status !== InvitationStatus.PENDING || new Date(invitation.expiresAt) < new Date()) {
      throw new AppError(400, ErrorCode.INVITATION_NOT_PENDING, "This invitation is no longer valid.");
    }

    const isAlreadyMember = await this.memberRepository.existsAsync(
      (m: Member) => m.albumId === albumId && m.userId === userId && m.status === MemberStatus.ACTIVE,
    );
    if (isAlreadyMember) {
      throw new AppError(409, ErrorCode.MEMBER_ALREADY_EXISTS, "You are already a member of this album.");
    }

    await this.memberRepository.createAndSaveAsync({
      id: crypto.randomUUID(),
      albumId,
      userId,
      roleId: invitation.roleId,
      status: MemberStatus.ACTIVE,
      joinedAt: new Date(),
    });

    await this.invitationRepository.patchByIdAndSaveAsync(invitationId, {
      status: InvitationStatus.ACCEPTED,
    });
  }

  async getMyInvitations(userEmail: string): Promise<AlbumInvitationWithAlbumName[]> {
    const now = new Date();
    const invitations = await this.invitationRepository.getAllAsync(
      (i: AlbumInvitation) =>
        i.invitedEmail.toLowerCase() === userEmail.toLowerCase() &&
        i.status === InvitationStatus.PENDING &&
        new Date(i.expiresAt) > now,
    );

    const results: AlbumInvitationWithAlbumName[] = [];
    for (const invitation of invitations) {
      const album = await this.albumRepository.getOrDefaultAsync(
        (a: Album) => a.id === invitation.albumId,
      );
      results.push({ ...invitation, albumName: album?.name ?? "Album" });
    }
    return results;
  }

  async getInvitations(albumId: string): Promise<AlbumInvitation[]> {
    const now = new Date();

    const invitations = await this.invitationRepository.getAllAsync(
      (i: AlbumInvitation) => i.albumId === albumId,
    );

    // Lazy expiration: mark pending invitations past their expiry
    const updated: AlbumInvitation[] = [];
    for (const invitation of invitations) {
      if (invitation.status === InvitationStatus.PENDING && new Date(invitation.expiresAt) < now) {
        updated.push(
          await this.invitationRepository.patchByIdAndSaveAsync(invitation.id, {
            status: InvitationStatus.EXPIRED,
          }),
        );
      } else {
        updated.push(invitation);
      }
    }

    return updated;
  }
}

function resolveFrontendBaseUrl(): string {
  return (
    process.env.FRONTEND_BASE_URL ??
    process.env.APP_BASE_URL ??
    "http://localhost:5173"
  ).replace(/\/+$/, "");
}
