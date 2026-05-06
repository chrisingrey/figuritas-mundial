import { ApiRepository } from "../api-repository";
import type { AlbumResponse, CreateAlbumRequest, MemberResponse, InviteMemberRequest, InvitationResponse, AlbumRoleResponse } from "./models";

const BASE_URI = "/api/albums";
const api = new ApiRepository(BASE_URI);

export const albumsService = {
  async getMyAlbum(): Promise<AlbumResponse | null> {
    return api.get<AlbumResponse | null>("/my");
  },

  async getAlbum(albumId: string): Promise<AlbumResponse> {
    return api.get<AlbumResponse>(`/${albumId}`);
  },

  async getSharedAlbum(shareToken: string): Promise<AlbumResponse> {
    return api.get<AlbumResponse>(`/shared/${shareToken}`);
  },

  async getRoles(albumId: string): Promise<AlbumRoleResponse[]> {
    return api.get<AlbumRoleResponse[]>(`/${albumId}/roles`);
  },

  async createAlbum(request: CreateAlbumRequest): Promise<AlbumResponse> {
    return api.post<CreateAlbumRequest, AlbumResponse>(request);
  },

  async getMembers(albumId: string): Promise<MemberResponse[]> {
    return api.get<MemberResponse[]>(`/${albumId}/members`);
  },

  async updateMemberRole(albumId: string, memberId: string, roleId: string): Promise<MemberResponse> {
    return api.patch<{ roleId: string }, MemberResponse>({ roleId }, `/${albumId}/members/${memberId}`);
  },

  async removeMember(albumId: string, memberId: string): Promise<void> {
    await api.delete(`/${albumId}/members/${memberId}`);
  },

  async inviteMember(albumId: string, request: InviteMemberRequest): Promise<void> {
    await api.post<InviteMemberRequest, unknown>(request, `/${albumId}/member-invites`);
  },

  async bulkUpdateStickers(albumId: string, codes: string[], status: import("./models").StickerStatus): Promise<AlbumResponse> {
    return api.patch<{ codes: string[]; status: string }, AlbumResponse>({ codes, status }, `/${albumId}/stickers`);
  },

  async updateStickerRepeated(albumId: string, code: string, repeated: number): Promise<AlbumResponse> {
    return api.patch<{ repeated: number }, AlbumResponse>(
      { repeated },
      `/${albumId}/stickers/${encodeURIComponent(code)}/repeated`,
    );
  },

  async shareAlbum(albumId: string, invitedEmail: string): Promise<InvitationResponse> {
    return api.post<{ invitedEmail: string }, InvitationResponse>({ invitedEmail }, `/${albumId}/share`);
  },

  async getInvitation(albumId: string, invitationId: string): Promise<InvitationResponse> {
    return api.get<InvitationResponse>(`/${albumId}/invitations/${invitationId}`);
  },

  async acceptInvitation(albumId: string, invitationId: string): Promise<void> {
    await api.post<Record<string, never>, unknown>({}, `/${albumId}/invitations/${invitationId}/accept`);
  },
};
