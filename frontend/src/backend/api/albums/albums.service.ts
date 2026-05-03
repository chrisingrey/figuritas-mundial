import { ApiRepository } from "../api-repository";
import type { AlbumResponse, CreateAlbumRequest, MemberResponse, InviteMemberRequest, InvitationResponse } from "./models";

const BASE_URI = "/api/albums";
const api = new ApiRepository(BASE_URI);

export const albumsService = {
  async getMyAlbum(): Promise<AlbumResponse | null> {
    return api.get<AlbumResponse | null>("/my");
  },

  async createAlbum(request: CreateAlbumRequest): Promise<AlbumResponse> {
    return api.post<CreateAlbumRequest, AlbumResponse>(request);
  },

  async getMembers(albumId: string): Promise<MemberResponse[]> {
    return api.get<MemberResponse[]>(`/${albumId}/members`);
  },

  async inviteMember(albumId: string, request: InviteMemberRequest): Promise<void> {
    await api.post<InviteMemberRequest, unknown>(request, `/${albumId}/member-invites`);
  },

  async toggleSticker(albumId: string, code: string): Promise<AlbumResponse> {
    return api.patch<Record<string, never>, AlbumResponse>({}, `/${albumId}/stickers/${encodeURIComponent(code)}`);
  },

  async getInvitation(albumId: string, invitationId: string): Promise<InvitationResponse> {
    return api.get<InvitationResponse>(`/${albumId}/invitations/${invitationId}`);
  },

  async acceptInvitation(albumId: string, invitationId: string): Promise<void> {
    await api.post<Record<string, never>, unknown>({}, `/${albumId}/invitations/${invitationId}/accept`);
  },
};
