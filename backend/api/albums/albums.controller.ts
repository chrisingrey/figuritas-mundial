import type { Request, Response, NextFunction } from "express";
import { asyncHandler } from "@api/common/middleware/asyncHandler";
import { getAuthenticatedUserId, toAuthenticatedRequest } from "@api/common/filters/AuthenticatedRequest";
import { toAuthorizedMemberRequest } from "@api/common/filters/AuthorizedMemberRequest";
import { services } from "@api/config/services.config";
import { mapAlbumResponse } from "./AlbumResponse";
import { mapAlbumRoleResponse } from "./AlbumRoleResponse";
import { mapAlbumMemberResponse } from "./AlbumMemberResponse";
import { mapAlbumInvitationResponse } from "./AlbumInvitationResponse";
import { mapAlbumRequestResponse, mapManagedAlbumForRequestResponse } from "./AlbumRequestResponse";
import type { CreateAlbumArgs } from "@businessLogic/albums";
import type { CreateAlbumRoleArgs, PatchAlbumRoleArgs } from "@businessLogic/albumRole";
import type { UpdateMemberRoleArgs } from "@businessLogic/members";
import { PermissionName } from "@businessLogic/permissions";
import { AppError, ErrorCode } from "@errors";

const VIEWER_ROLE_NAME = "Viewer";

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

export const leaveViewerAlbum = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const { albumId } = req.params;
  const userId = getAuthenticatedUserId(req);
  const member = await services.memberService.getMemberWithRole(albumId, userId);

  if (!member) {
    throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, "Member not found.");
  }

  if (member.role?.name.toLowerCase() !== VIEWER_ROLE_NAME.toLowerCase()) {
    throw new AppError(403, ErrorCode.UNAUTHORIZED, "Only viewers can leave an album from this action.");
  }

  await services.memberService.removeMember(albumId, member.id);
  res.status(204).send();
});

// ─── Share ───────────────────────────────────────────────────────────────────

export const shareAlbumWithViewer = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const { albumId } = toAuthorizedMemberRequest(req).authorizedMember;
  const invitedByUserId = getAuthenticatedUserId(req);
  const { invitedEmail } = req.body as { invitedEmail?: string };

  if (typeof invitedEmail !== "string" || invitedEmail.trim().length === 0) {
    throw new AppError(400, ErrorCode.INVALID_INVITATION_DATA, "invitedEmail is required.");
  }

  const normalizedEmail = invitedEmail.trim().toLowerCase();
  const invitedUser = await services.userService.getByEmail(normalizedEmail);
  if (!invitedUser) {
    throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, "User not found in the platform.");
  }

  const role = await getOrCreateViewerRole(albumId);
  const invitation = await services.albumInviteService.inviteMember({
    albumId,
    invitedByUserId,
    invitedEmail: normalizedEmail,
    roleId: role.id,
  });

  res.status(201).json(mapAlbumInvitationResponse(invitation));
});

export const getSharedAlbum = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const { shareToken } = req.params;
  const album = await services.albumService.getAlbumByShareToken(shareToken);
  if (!album) {
    res.status(404).json({ message: "Album no encontrado." });
    return;
  }
  res.status(200).json(mapAlbumResponse(album));
});

async function getOrCreateViewerRole(albumId: string) {
  const roles = await services.albumRoleService.getRoles(albumId);
  const existingViewerRole = roles.find((role) =>
    role.name.toLowerCase() === VIEWER_ROLE_NAME.toLowerCase() &&
    role.permissions.length === 1 &&
    role.permissions[0]?.name === PermissionName.GET_BY_ID_ALBUM,
  );

  if (existingViewerRole) return existingViewerRole;

  const permissions = await services.albumRoleService.getAlbumPermissions();
  const viewAlbumPermission = permissions.find((permission) =>
    permission.name === PermissionName.GET_BY_ID_ALBUM,
  );

  if (!viewAlbumPermission) {
    throw new AppError(500, ErrorCode.INTERNAL_ERROR, "View album permission is not configured.");
  }

  return services.albumRoleService.createRole(albumId, {
    name: VIEWER_ROLE_NAME,
    permissionIds: [viewAlbumPermission.id],
  });
}

// ─── Stickers ────────────────────────────────────────────────────────────────

export const bulkUpdateStickers = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const { albumId, permissions } = toAuthorizedMemberRequest(req).authorizedMember;
  const { codes, status } = req.body as { codes: string[]; status: string };
  if (!Array.isArray(codes) || codes.some(code => typeof code !== "string") || typeof status !== "string") {
    res.status(400).json({ message: "Invalid body: codes (string array) and status (string) required." });
    return;
  }
  const album = await services.albumService.bulkSetStickerStatus(albumId, codes, status as import("@businessLogic/albums/AlbumSticker").StickerStatus);
  res.status(200).json(mapAlbumResponse(album, permissions));
});

export const updateStickerRepeated = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const { albumId, permissions } = toAuthorizedMemberRequest(req).authorizedMember;
  const { stickerCode } = req.params;
  const { repeated } = req.body as { repeated?: unknown };

  if (typeof repeated !== "number") {
    res.status(400).json({ message: "Invalid body: repeated (number) required." });
    return;
  }

  const album = await services.albumService.setStickerRepeated(albumId, stickerCode, repeated);
  res.status(200).json(mapAlbumResponse(album, permissions));
});

export const bulkUpdateStickerRepeated = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const { albumId, permissions } = toAuthorizedMemberRequest(req).authorizedMember;
  const { updates } = req.body as { updates?: unknown };

  if (!Array.isArray(updates) || updates.length === 0) {
    res.status(400).json({ message: "Invalid body: updates (non-empty array) required." });
    return;
  }

  for (const item of updates) {
    if (typeof (item as { code?: unknown }).code !== "string" || typeof (item as { repeated?: unknown }).repeated !== "number") {
      res.status(400).json({ message: "Each update must have code (string) and repeated (number)." });
      return;
    }
  }

  const album = await services.albumService.bulkSetStickerRepeated(albumId, updates as { code: string; repeated: number }[]);
  res.status(200).json(mapAlbumResponse(album, permissions));
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

export const getInvitationById = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const { albumId, invitationId } = req.params;
  const invitation = await services.albumInviteService.getInvitationById(albumId, invitationId);
  res.status(200).json(mapAlbumInvitationResponse(invitation));
});

export const acceptInvitation = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const { albumId, invitationId } = req.params;
  const { authenticatedUser } = toAuthenticatedRequest(req);
  await services.albumInviteService.acceptInvitation(albumId, invitationId, authenticatedUser.id, authenticatedUser.email);
  res.status(204).send();
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

// ─── Access requests ─────────────────────────────────────────────────────────

export const createAccessRequest = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const { albumId } = req.params;
  const requesterUserId = getAuthenticatedUserId(req);
  const request = await services.albumRequestService.createRequest(albumId, requesterUserId);
  res.status(201).json(mapAlbumRequestResponse(request));
});

export const getAccessRequests = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const { albumId } = toAuthorizedMemberRequest(req).authorizedMember;
  const requests = await services.albumRequestService.getRequests(albumId);
  res.status(200).json(requests.map(mapAlbumRequestResponse));
});

export const acceptAccessRequest = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const { albumId } = toAuthorizedMemberRequest(req).authorizedMember;
  const { requestId } = req.params;
  const resolvedByUserId = getAuthenticatedUserId(req);
  const viewerRole = await getOrCreateViewerRole(albumId);
  const request = await services.albumRequestService.acceptRequest(albumId, requestId, resolvedByUserId, viewerRole.id);
  res.status(200).json(mapAlbumRequestResponse(request));
});

export const rejectAccessRequest = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const { albumId } = toAuthorizedMemberRequest(req).authorizedMember;
  const { requestId } = req.params;
  const resolvedByUserId = getAuthenticatedUserId(req);
  const request = await services.albumRequestService.rejectRequest(albumId, requestId, resolvedByUserId);
  res.status(200).json(mapAlbumRequestResponse(request));
});

export const getMemberManagedAlbums = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const { memberId } = req.params;
  const currentUserId = getAuthenticatedUserId(req);
  const { albumId } = toAuthorizedMemberRequest(req).authorizedMember;
  const members = await services.memberService.getMembers(albumId);
  const member = members.find((m) => m.id === memberId);

  if (!member) {
    throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, "Member not found.");
  }

  const albums = await services.albumRequestService.getManagedAlbumsForUser(member.userId, currentUserId);
  res.status(200).json(albums.map(mapManagedAlbumForRequestResponse));
});
