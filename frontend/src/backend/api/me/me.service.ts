import { ApiRepository } from "../api-repository";

export interface MyAlbumMembershipResponse {
  albumId: string;
  albumName: string;
  ownerId: string;
  roleId: string;
  roleName: string;
  joinedAt: string;
  isOwner: boolean;
  permissions: { id: string; name: string; code: string }[];
}

export interface MyInvitationResponse {
  id: string;
  albumId: string;
  albumName: string;
  invitedEmail: string;
  status: string;
  expiresAt: string;
}

const api = new ApiRepository("/api/me");

export const meService = {
  async getMyAlbums(): Promise<MyAlbumMembershipResponse[]> {
    return api.get<MyAlbumMembershipResponse[]>("/albums");
  },

  async getMyInvitations(): Promise<MyInvitationResponse[]> {
    return api.get<MyInvitationResponse[]>("/invitations");
  },
};
