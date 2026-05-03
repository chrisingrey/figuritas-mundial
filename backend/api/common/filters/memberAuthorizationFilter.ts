import { NextFunction, Request, Response } from "express";
import { getAuthenticatedUserId } from "./AuthenticatedRequest";
import { services } from "@api/config/services.config";
import { AppError, ErrorCode } from "@errors";
import type { AuthorizedMemberRequest } from "./AuthorizedMemberRequest";

const normalizeRouteParamKey = (routeParam: string): string => {
  const trimmed = routeParam.trim();
  const withoutLeadingSlash = trimmed.startsWith("/")
    ? trimmed.slice(1)
    : trimmed;

  return withoutLeadingSlash.startsWith(":")
    ? withoutLeadingSlash.slice(1)
    : withoutLeadingSlash;
};

export const memberAuthorizationFilter = (
  albumIdRouteParam: string,
  permissionName: string,
) =>
  async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = getAuthenticatedUserId(req);
      const routeParamKey = normalizeRouteParamKey(albumIdRouteParam);

      const albumId = req.params[routeParamKey];
      if (!albumId) {
        throw new AppError(
          400,
          ErrorCode.VALIDATION_ERROR,
          `Missing '${routeParamKey}' route parameter.`,
        );
      }

      // Single query: fetch album to verify it exists and get ownerId.
      const album = await services.albumService.getAlbum(albumId);

      // Single query with include: fetch member + role in one round-trip,
      // eliminating the previous separate albumRoleService.getOrDefaultAsync call.
      const member = await services.memberService.getMemberWithRole(albumId, userId);
      if (!member) {
        throw new AppError(
          401,
          ErrorCode.UNAUTHORIZED,
          "Authenticated user is not an active member of this album.",
        );
      }

      if (!member.role) {
        throw new AppError(
          401,
          ErrorCode.UNAUTHORIZED,
          "Authenticated user role is not available in this album.",
        );
      }

      const isOwner = album.ownerId === userId;
      let effectiveRole = member.role;
      let permissions = [...member.role.permissions];

      if (isOwner) {
        const albumPermissions = await services.albumRoleService.getAlbumPermissions();
        const missingPermissions = albumPermissions.filter(
          (permission) =>
            !permissions.some((assignedPermission) => assignedPermission.id === permission.id),
        );

        if (missingPermissions.length > 0) {
          effectiveRole = await services.albumRoleService.patchRole(
            albumId,
            member.role.id,
            {
              permissionIds: albumPermissions.map((permission) => permission.id),
            },
          );
          permissions = [...effectiveRole.permissions];
        }
      }

      if (!permissions.some((permission) => permission.name === permissionName)) {
        throw new AppError(
          401,
          ErrorCode.UNAUTHORIZED,
          `Missing required album permission '${permissionName}'.`,
        );
      }

      const typedRequest = req as AuthorizedMemberRequest;
      typedRequest.authorizedMember = {
        albumId,
        member,
        role: effectiveRole,
        permissions,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
