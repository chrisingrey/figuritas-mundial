export interface InvitationResponse {
  id: string;
  albumId: string;
  invitedByUserId: string;
  invitedEmail: string;
  roleId: string;
  status: string;
  expiresAt: string;
}
