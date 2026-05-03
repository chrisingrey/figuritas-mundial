import type { Member } from "@businessLogic/members";

export interface AlbumMemberResponse {
  id: string;
  albumId: string;
  userId: string;
  roleId: string;
  status: string;
  joinedAt: string;
  email: string;
  username?: string;
  fullname?: string;
  surname?: string;
}

export const mapAlbumMemberResponse = (member: Member): AlbumMemberResponse => ({
  id: member.id,
  albumId: member.albumId,
  userId: member.userId,
  roleId: member.roleId,
  status: member.status,
  joinedAt: new Date(member.joinedAt).toISOString(),
  email: member.user?.email ?? "",
  username: member.user?.username,
  fullname: member.user?.fullname,
  surname: member.user?.surname,
});
