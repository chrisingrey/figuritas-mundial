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
