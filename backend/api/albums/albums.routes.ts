import { Router } from "express";
import { userAuthenticationFilter } from "@api/common/filters/userAuthenticationFilter";
import { memberAuthorizationFilter } from "@api/common/filters/memberAuthorizationFilter";
import { PermissionName } from "@businessLogic/permissions";
import {
  createAlbum,
  getMyAlbum,
  getAlbum,
  updateAlbum,
  toggleSticker,
  getRoles,
  createRole,
  patchRole,
  deleteRole,
  getMembers,
  updateMemberRole,
  removeMember,
  getInvitations,
  createInvitation,
  getInvitationById,
  acceptInvitation,
} from "./albums.controller";

const router = Router();

// ─── Public album endpoints (auth only, no member scope) ─────────────────
router.post("/", userAuthenticationFilter, createAlbum);
router.get("/my", userAuthenticationFilter, getMyAlbum);

// ─── Member-scoped endpoints ─────────────────────────────────────────────────
router.get("/:albumId", userAuthenticationFilter, memberAuthorizationFilter(":albumId", PermissionName.GET_BY_ID_ALBUM), getAlbum);
router.patch("/:albumId", userAuthenticationFilter, memberAuthorizationFilter(":albumId", PermissionName.UPDATE_BY_ID_ALBUM), updateAlbum);

// Stickers
router.patch("/:albumId/stickers/:code", userAuthenticationFilter, memberAuthorizationFilter(":albumId", PermissionName.GET_BY_ID_ALBUM), toggleSticker);

// Roles
router.get("/:albumId/roles", userAuthenticationFilter, memberAuthorizationFilter(":albumId", PermissionName.GET_ALL_ALBUM_ROLE), getRoles);
router.post("/:albumId/roles", userAuthenticationFilter, memberAuthorizationFilter(":albumId", PermissionName.CREATE_ALBUM_ROLE), createRole);
router.patch("/:albumId/roles/:roleId", userAuthenticationFilter, memberAuthorizationFilter(":albumId", PermissionName.UPDATE_BY_ID_ALBUM_ROLE), patchRole);
router.delete("/:albumId/roles/:roleId", userAuthenticationFilter, memberAuthorizationFilter(":albumId", PermissionName.DELETE_BY_ID_ALBUM_ROLE), deleteRole);

// Members
router.get("/:albumId/members", userAuthenticationFilter, memberAuthorizationFilter(":albumId", PermissionName.GET_ALL_MEMBER), getMembers);
router.patch("/:albumId/members/:memberId", userAuthenticationFilter, memberAuthorizationFilter(":albumId", PermissionName.UPDATE_BY_ID_MEMBER), updateMemberRole);
router.delete("/:albumId/members/:memberId", userAuthenticationFilter, memberAuthorizationFilter(":albumId", PermissionName.DELETE_BY_ID_MEMBER), removeMember);

// Invitations (member-scoped management)
router.get("/:albumId/member-invites", userAuthenticationFilter, memberAuthorizationFilter(":albumId", PermissionName.GET_ALL_ALBUM_INVITATION), getInvitations);
router.post("/:albumId/member-invites", userAuthenticationFilter, memberAuthorizationFilter(":albumId", PermissionName.CREATE_ALBUM_INVITATION), createInvitation);

// Invitation accept flow (auth only — user is not yet a member)
router.get("/:albumId/invitations/:invitationId", userAuthenticationFilter, getInvitationById);
router.post("/:albumId/invitations/:invitationId/accept", userAuthenticationFilter, acceptInvitation);

export { router as albumsRouter };
