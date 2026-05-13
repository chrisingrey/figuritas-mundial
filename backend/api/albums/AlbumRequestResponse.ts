import type { ManagedAlbumForRequest } from "@businessLogic/albumRequest";
import type { AlbumRequest } from "@businessLogic/albumRequest";

export interface AlbumRequestResponse {
  id: string;
  albumId: string;
  requesterUserId: string;
  requesterEmail: string;
  requesterUsername?: string;
  requesterFullname?: string;
  requesterSurname?: string;
  status: string;
  createdAt: string;
}

export interface ManagedAlbumForRequestResponse {
  id: string;
  name: string;
  roleName: string;
  isCurrentUserMember: boolean;
  pendingRequestId?: string;
}

export const mapAlbumRequestResponse = (request: AlbumRequest): AlbumRequestResponse => ({
  id: request.id,
  albumId: request.albumId,
  requesterUserId: request.requesterUserId,
  requesterEmail: request.requesterUser?.email ?? "",
  requesterUsername: request.requesterUser?.username,
  requesterFullname: request.requesterUser?.fullname,
  requesterSurname: request.requesterUser?.surname,
  status: request.status,
  createdAt: new Date(request.createdAt).toISOString(),
});

export const mapManagedAlbumForRequestResponse = (
  album: ManagedAlbumForRequest,
): ManagedAlbumForRequestResponse => ({
  id: album.id,
  name: album.name,
  roleName: album.roleName,
  isCurrentUserMember: album.isCurrentUserMember,
  ...(album.pendingRequestId ? { pendingRequestId: album.pendingRequestId } : {}),
});
