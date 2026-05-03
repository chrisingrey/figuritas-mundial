import type { Request, Response, NextFunction } from "express";
import { asyncHandler } from "@api/common/middleware/asyncHandler";
import { getAuthenticatedUserId } from "@api/common/filters/AuthenticatedRequest";
import { toAuthorizedMemberRequest } from "@api/common/filters/AuthorizedMemberRequest";
import { services } from "@api/config/services.config";
import { mapAlbumResponse } from "./AlbumResponse";
import { mapAlbumRoleResponse } from "./AlbumRoleResponse";
import { mapAlbumMemberResponse } from "./AlbumMemberResponse";
import { mapAlbumInvitationResponse } from "./AlbumInvitationResponse";
import type { CreateAlbumArgs } from "@businessLogic/albums";
import type { CreateAlbumRoleArgs, PatchAlbumRoleArgs } from "@businessLogic/albumRole";
import type { UpdateMemberRoleArgs } from "@businessLogic/members";

// ─── Album CRUD ──────────────────────────────────────────────────────────

export const createAlbum = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const userId = getAuthenticatedUserId(req);
  const args: CreateAlbumArgs = { ...req.body, userId };
  const album = await services.albumService.createAlbum(args);
  res.status(201).json(mapAlbumResponse(album));
});

export const getMyAlbum = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const userId = getAuthenticatedUserId(req);
  const album = await services.albumService.getMyAlbum(userId);

  if (!album) {
    res.status(200).json(null);
    return;
  }

  const memberWithRole = await services.memberService.getMemberWithRole(album.id, userId);
  const permissions = memberWithRole?.role?.permissions;
  res.status(200).json(mapAlbumResponse(album, permissions));
});

export const getAlbum = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const { albumId, permissions } = toAuthorizedMemberRequest(req).authorizedMember;
  const album = await services.albumService.getAlbum(albumId);
  res.status(200).json(mapAlbumResponse(album, permissions));
});

export const updateAlbum = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const { albumId, permissions } = toAuthorizedMemberRequest(req).authorizedMember;
  const album = await services.albumService.updateAlbum(albumId, req.body);
  res.status(200).json(mapAlbumResponse(album, permissions));
});

// ─── Roles ───────────────────────────────────────────────────────────────────

export const getRoles = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const { albumId } = toAuthorizedMemberRequest(req).authorizedMember;
  const roles = await services.albumRoleService.getRoles(albumId);
  res.status(200).json(roles.map(mapAlbumRoleResponse));
});

export const createRole = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const { albumId } = toAuthorizedMemberRequest(req).authorizedMember;
  const args: CreateAlbumRoleArgs = req.body;
  const role = await services.albumRoleService.createRole(albumId, args);
  res.status(201).json(mapAlbumRoleResponse(role));
});

export const patchRole = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const { albumId } = toAuthorizedMemberRequest(req).authorizedMember;
  const { roleId } = req.params;
  const args: PatchAlbumRoleArgs = req.body;
  const role = await services.albumRoleService.patchRole(albumId, roleId, args);
  res.status(200).json(mapAlbumRoleResponse(role));
});

export const deleteRole = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const { albumId } = toAuthorizedMemberRequest(req).authorizedMember;
  const { roleId } = req.params;
  await services.albumRoleService.deleteRole(albumId, roleId);
  res.status(204).send();
});

// ─── Members ─────────────────────────────────────────────────────────────────

export const getMembers = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const { albumId } = toAuthorizedMemberRequest(req).authorizedMember;
  const members = await services.memberService.getMembers(albumId);
  res.status(200).json(members.map(mapAlbumMemberResponse));
});

export const updateMemberRole = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const { albumId } = toAuthorizedMemberRequest(req).authorizedMember;
  const { memberId } = req.params;
  const args: UpdateMemberRoleArgs = req.body;
  const member = await services.memberService.updateMemberRole(albumId, memberId, args);
  res.status(200).json(mapAlbumMemberResponse(member));
});

export const removeMember = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const { albumId } = toAuthorizedMemberRequest(req).authorizedMember;
  const { memberId } = req.params;
  await services.memberService.removeMember(albumId, memberId);
  res.status(204).send();
});

// ─── Stickers ────────────────────────────────────────────────────────────────

export const toggleSticker = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const { albumId } = toAuthorizedMemberRequest(req).authorizedMember;
  const { code } = req.params;
  const album = await services.albumService.toggleSticker({ albumId, code });
  res.status(200).json(mapAlbumResponse(album));
});

// ─── Invitations ─────────────────────────────────────────────────────────────

export const getInvitations = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const { albumId } = toAuthorizedMemberRequest(req).authorizedMember;
  const invitations = await services.albumInviteService.getInvitations(albumId);
  res.status(200).json(invitations.map(mapAlbumInvitationResponse));
});

export const createInvitation = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const { albumId } = toAuthorizedMemberRequest(req).authorizedMember;
  const invitedByUserId = getAuthenticatedUserId(req);
  const invitation = await services.albumInviteService.inviteMember({
    ...req.body,
    albumId,
    invitedByUserId,
  });
  res.status(201).json(mapAlbumInvitationResponse(invitation));
});
