import type { AlbumRequest } from "./AlbumRequest";

export interface ManagedAlbumForRequest {
  id: string;
  name: string;
  roleName: string;
  isCurrentUserMember: boolean;
  pendingRequestId?: string;
}

export interface IAlbumRequestService {
  createRequest(albumId: string, requesterUserId: string): Promise<AlbumRequest>;
  getRequests(albumId: string): Promise<AlbumRequest[]>;
  acceptRequest(albumId: string, requestId: string, resolvedByUserId: string, viewerRoleId: string): Promise<AlbumRequest>;
  rejectRequest(albumId: string, requestId: string, resolvedByUserId: string): Promise<AlbumRequest>;
  getManagedAlbumsForUser(targetUserId: string, currentUserId: string): Promise<ManagedAlbumForRequest[]>;
}
