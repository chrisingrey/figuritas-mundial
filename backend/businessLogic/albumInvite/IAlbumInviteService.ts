import type { AlbumInvitation } from "./AlbumInvitation";
import type { InviteMemberArgs } from "./InviteMemberArgs";

export interface IAlbumInviteService {
  inviteMember(args: InviteMemberArgs): Promise<AlbumInvitation>;
  getInvitations(albumId: string): Promise<AlbumInvitation[]>;
}
