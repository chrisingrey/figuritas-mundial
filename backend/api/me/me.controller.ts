import type { Request, Response, NextFunction } from "express";
import { asyncHandler } from "@api/common/middleware/asyncHandler";
import {
  getAuthenticatedUserId,
  toAuthenticatedRequest,
} from "@api/common/filters/AuthenticatedRequest";
import { services } from "@api/config/services.config";
import { mapAuthUserResponse } from "@api/auth/AuthUserResponse";
import { mapUserResponse } from "./UserResponse";
import type { UpdateUserProfileArgs } from "@auth/users";
import type {
  ChangePasswordArgs,
  CreatePasswordArgs,
} from "@auth/passwordManager";
import type {
  CreateNotificationArgs,
  GetPagedNotificationsArgs,
  PatchNotificationArgs,
} from "@businessLogic/notifications";
import { mapNotificationResponse } from "./NotificationResponse";
import { mapNotificationPageResponse } from "./NotificationResponse";
import { mapMyAlbumMembershipResponse } from "./MyAlbumMembershipResponse";

export const getCurrentUser = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const user = toAuthenticatedRequest(req).authenticatedUser;
  res.status(200).json(mapAuthUserResponse(user));
});

export const updateUserProfile = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const id = getAuthenticatedUserId(req);
  const request: UpdateUserProfileArgs = req.body;
  const user = await services.userService.updateUserProfile(id, request);

  res.status(200).json(mapUserResponse(user));
});

export const createPassword = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const id = getAuthenticatedUserId(req);
  const request: CreatePasswordArgs = req.body;

  await services.passwordManagerService.createPassword(id, request);

  res.status(204).send();
});

export const changePassword = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const id = getAuthenticatedUserId(req);
  const request: ChangePasswordArgs = req.body;

  await services.passwordManagerService.changePassword(id, request);

  res.status(204).send();
});

export const createNotification = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const userId = getAuthenticatedUserId(req);
  const request = req.body as CreateNotificationArgs;

  const notification = await services.notificationService.createNotification({
    ...request,
    targetUserId: userId,
  });

  res.status(201).json(mapNotificationResponse(notification));
});

export const patchNotification = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const userId = getAuthenticatedUserId(req);
  const { id } = req.params;
  const request = req.body as PatchNotificationArgs;

  const notification = await services.notificationService.patchNotificationForUser(
    userId,
    id,
    request,
  );

  res.status(200).json(mapNotificationResponse(notification));
});

export const getNotificationById = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const userId = getAuthenticatedUserId(req);
  const { id } = req.params;

  const notification =
    await services.notificationService.getNotificationByIdForUser(userId, id);

  res.status(200).json(mapNotificationResponse(notification));
});

export const getMyAlbums = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const userId = getAuthenticatedUserId(req);
  const memberships = await services.memberService.getMyMemberships(userId);
  res.status(200).json(memberships.map(mapMyAlbumMembershipResponse));
});

export const getPagedNotifications = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const userId = getAuthenticatedUserId(req);

  const page =
    typeof req.query.page === "string"
      ? Number.parseInt(req.query.page, 10)
      : undefined;
  const pageSize =
    typeof req.query.pageSize === "string"
      ? Number.parseInt(req.query.pageSize, 10)
      : undefined;
  const orderBy =
    typeof req.query.orderBy === "string"
      ? req.query.orderBy
      : undefined;

  const request: GetPagedNotificationsArgs = {
    page,
    pageSize,
    orderBy: orderBy as GetPagedNotificationsArgs["orderBy"],
  };

  const notificationsPage =
    await services.notificationService.getPagedNotificationsForUser(
      userId,
      request,
    );

  res.status(200).json(mapNotificationPageResponse(notificationsPage));
});
