import type { AlbumInvitation } from "@businessLogic/albumInvite";

export interface AlbumInvitationResponse {
  id: string;
  albumId: string;
  invitedByUserId: string;
  invitedEmail: string;
  roleId: string;
  status: string;
  expiresAt: string;
}

export const mapAlbumInvitationResponse = (invitation: AlbumInvitation): AlbumInvitationResponse => ({
  id: invitation.id,
  albumId: invitation.albumId,
  invitedByUserId: invitation.invitedByUserId,
  invitedEmail: invitation.invitedEmail,
  roleId: invitation.roleId,
  status: invitation.status,
  expiresAt: new Date(invitation.expiresAt).toISOString(),
});
