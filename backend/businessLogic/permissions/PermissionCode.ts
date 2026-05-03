import type { Permission } from "./Permission";

export const PermissionName = {
  CREATE_ALBUM: "create-album",
  GET_BY_ID_ALBUM: "getById-album",
  UPDATE_BY_ID_ALBUM: "updateById-album",

  GET_ALL_ALBUM_ROLE: "getAll-albumRole",
  CREATE_ALBUM_ROLE: "create-albumRole",
  UPDATE_BY_ID_ALBUM_ROLE: "updateById-albumRole",
  DELETE_BY_ID_ALBUM_ROLE: "deleteById-albumRole",

  GET_ALL_MEMBER: "getAll-member",
  UPDATE_BY_ID_MEMBER: "updateById-member",
  DELETE_BY_ID_MEMBER: "deleteById-member",

  GET_ALL_ALBUM_INVITATION: "getAll-albumInvitation",
  CREATE_ALBUM_INVITATION: "create-albumInvitation",

  GET_BY_ID_USER_PROFILE: "getById-userProfile",
  UPDATE_BY_ID_USER_PROFILE: "updateById-userProfile",
  GET_PAGED_NOTIFICATION: "getPaged-notification",
  GET_BY_ID_NOTIFICATION: "getById-notification",
  CREATE_NOTIFICATION: "create-notification",
  UPDATE_BY_ID_NOTIFICATION: "updateById-notification",
  CREATE_PASSWORD: "create-password",
  UPDATE_BY_ID_PASSWORD: "updateById-password",
} as const;

export type PermissionName = (typeof PermissionName)[keyof typeof PermissionName];

export const PermissionCode = {
  CREATE_ALBUM: "Create Album",
  GET_BY_ID_ALBUM: "View Album",
  UPDATE_BY_ID_ALBUM: "Edit Album",

  GET_ALL_ALBUM_ROLE: "View Album Role",
  CREATE_ALBUM_ROLE: "Create Album Role",
  UPDATE_BY_ID_ALBUM_ROLE: "Edit Album Role",
  DELETE_BY_ID_ALBUM_ROLE: "Remove Album Role",

  GET_ALL_MEMBER: "View Member",
  UPDATE_BY_ID_MEMBER: "Edit Member",
  DELETE_BY_ID_MEMBER: "Remove Member",

  GET_ALL_ALBUM_INVITATION: "View Album Invitation",
  CREATE_ALBUM_INVITATION: "Create Album Invitation",

  GET_BY_ID_USER_PROFILE: "View User Profile",
  UPDATE_BY_ID_USER_PROFILE: "Edit User Profile",
  GET_PAGED_NOTIFICATION: "View Notification",
  GET_BY_ID_NOTIFICATION: "View Notification",
  CREATE_NOTIFICATION: "Create Notification",
  UPDATE_BY_ID_NOTIFICATION: "Edit Notification",
  CREATE_PASSWORD: "Create Password",
  UPDATE_BY_ID_PASSWORD: "Edit Password",
} as const;

export type PermissionCode = (typeof PermissionCode)[keyof typeof PermissionCode];

export interface PermissionDefinition {
  name: PermissionName;
  code: PermissionCode;
  type: Permission["type"];
  legacyNames?: string[];
}

export const ALBUM_PERMISSIONS: PermissionDefinition[] = [
  {
    name: PermissionName.GET_BY_ID_ALBUM,
    code: PermissionCode.GET_BY_ID_ALBUM,
    type: "album",
    legacyNames: ["view-album"],
  },
  {
    name: PermissionName.UPDATE_BY_ID_ALBUM,
    code: PermissionCode.UPDATE_BY_ID_ALBUM,
    type: "album",
    legacyNames: ["manage-album"],
  },
  {
    name: PermissionName.GET_ALL_ALBUM_ROLE,
    code: PermissionCode.GET_ALL_ALBUM_ROLE,
    type: "album",
    legacyNames: ["view-roles", "view-album-roles"],
  },
  {
    name: PermissionName.CREATE_ALBUM_ROLE,
    code: PermissionCode.CREATE_ALBUM_ROLE,
    type: "album",
    legacyNames: ["manage-roles", "create-album-role"],
  },
  {
    name: PermissionName.UPDATE_BY_ID_ALBUM_ROLE,
    code: PermissionCode.UPDATE_BY_ID_ALBUM_ROLE,
    type: "album",
    legacyNames: ["manage-roles", "update-album-role"],
  },
  {
    name: PermissionName.DELETE_BY_ID_ALBUM_ROLE,
    code: PermissionCode.DELETE_BY_ID_ALBUM_ROLE,
    type: "album",
    legacyNames: ["manage-roles", "delete-album-role"],
  },
  {
    name: PermissionName.GET_ALL_MEMBER,
    code: PermissionCode.GET_ALL_MEMBER,
    type: "album",
    legacyNames: ["view-members", "view-album-members"],
  },
  {
    name: PermissionName.UPDATE_BY_ID_MEMBER,
    code: PermissionCode.UPDATE_BY_ID_MEMBER,
    type: "album",
    legacyNames: ["manage-members", "update-album-member-role"],
  },
  {
    name: PermissionName.DELETE_BY_ID_MEMBER,
    code: PermissionCode.DELETE_BY_ID_MEMBER,
    type: "album",
    legacyNames: ["manage-members", "delete-album-member"],
  },
  {
    name: PermissionName.GET_ALL_ALBUM_INVITATION,
    code: PermissionCode.GET_ALL_ALBUM_INVITATION,
    type: "album",
    legacyNames: ["view-member-invitations", "view-album-invitations"],
  },
  {
    name: PermissionName.CREATE_ALBUM_INVITATION,
    code: PermissionCode.CREATE_ALBUM_INVITATION,
    type: "album",
    legacyNames: ["create-member-invitation"],
  },
];

export const BACK_OFFICE_PERMISSIONS: PermissionDefinition[] = [
  {
    name: PermissionName.CREATE_ALBUM,
    code: PermissionCode.CREATE_ALBUM,
    type: "back-office",
  },
  {
    name: PermissionName.GET_BY_ID_USER_PROFILE,
    code: PermissionCode.GET_BY_ID_USER_PROFILE,
    type: "back-office",
  },
  {
    name: PermissionName.UPDATE_BY_ID_USER_PROFILE,
    code: PermissionCode.UPDATE_BY_ID_USER_PROFILE,
    type: "back-office",
  },
  {
    name: PermissionName.GET_PAGED_NOTIFICATION,
    code: PermissionCode.GET_PAGED_NOTIFICATION,
    type: "back-office",
  },
  {
    name: PermissionName.GET_BY_ID_NOTIFICATION,
    code: PermissionCode.GET_BY_ID_NOTIFICATION,
    type: "back-office",
  },
  {
    name: PermissionName.CREATE_NOTIFICATION,
    code: PermissionCode.CREATE_NOTIFICATION,
    type: "back-office",
  },
  {
    name: PermissionName.UPDATE_BY_ID_NOTIFICATION,
    code: PermissionCode.UPDATE_BY_ID_NOTIFICATION,
    type: "back-office",
  },
  {
    name: PermissionName.CREATE_PASSWORD,
    code: PermissionCode.CREATE_PASSWORD,
    type: "back-office",
  },
  {
    name: PermissionName.UPDATE_BY_ID_PASSWORD,
    code: PermissionCode.UPDATE_BY_ID_PASSWORD,
    type: "back-office",
  },
];

export const ALL_PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  ...ALBUM_PERMISSIONS,
  ...BACK_OFFICE_PERMISSIONS,
];
