import type { Member } from "@businessLogic/members";
import type { PermissionResponse } from "@api/albums/AlbumRoleResponse";
import { mapPermissionResponse } from "@api/albums/AlbumRoleResponse";
import { AppError, ErrorCode } from "@errors";

export interface MyAlbumMembershipResponse {
  albumId: string;
  albumName: string;
  ownerId: string;
  roleId: string;
  roleName: string;
  joinedAt: string;
  isOwner: boolean;
  permissions: PermissionResponse[];
}

export const mapMyAlbumMembershipResponse = (member: Member): MyAlbumMembershipResponse => {
  if (!member.album || !member.role) {
    throw new AppError(
      500,
      ErrorCode.INTERNAL_ERROR,
      "Member relation data is incomplete. album and role must be populated.",
    );
  }

  return {
    albumId: member.albumId,
    albumName: member.album.name,
    ownerId: member.album.ownerId,
    roleId: member.roleId,
    roleName: member.role.name,
    joinedAt: new Date(member.joinedAt).toISOString(),
    isOwner: member.album.ownerId === member.userId,
    permissions: member.role.permissions.map(mapPermissionResponse),
  };
};
