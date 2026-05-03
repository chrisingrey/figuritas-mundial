import type { InvitationStatus } from "./InvitationStatus";

export interface AlbumInvitation {
  id: string;
  albumId: string;
  invitedByUserId: string;
  invitedEmail: string;
  roleId: string;
  status: InvitationStatus;
  expiresAt: Date;
}
