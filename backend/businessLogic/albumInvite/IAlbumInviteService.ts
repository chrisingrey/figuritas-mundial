import type { AlbumInvitation } from "./AlbumInvitation";
import type { InviteMemberArgs } from "./InviteMemberArgs";

export interface AlbumInvitationWithAlbumName extends AlbumInvitation {
  albumName: string;
}

export interface IAlbumInviteService {
  inviteMember(args: InviteMemberArgs): Promise<AlbumInvitation>;
  getInvitations(albumId: string): Promise<AlbumInvitation[]>;
  getInvitationById(albumId: string, invitationId: string): Promise<AlbumInvitation>;
  acceptInvitation(albumId: string, invitationId: string, userId: string, userEmail: string): Promise<void>;
  getMyInvitations(userEmail: string): Promise<AlbumInvitationWithAlbumName[]>;
}
