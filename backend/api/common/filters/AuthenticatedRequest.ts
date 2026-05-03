import type { Request } from "express";
import type { User } from "@auth/users";
import { AppError, ErrorCode } from "@errors";

export interface AuthenticatedRequest extends Request {
  authenticatedUser: User;
  authenticatedSessionToken: string;
}

export const toAuthenticatedRequest = (req: Request): AuthenticatedRequest => {
  const typedRequest = req as Partial<AuthenticatedRequest>;
  if (!typedRequest.authenticatedUser || !typedRequest.authenticatedSessionToken) {
    throw new AppError(400, ErrorCode.MISSING_USER_FILTER, "Authenticated user filter is required.");
  }

  return typedRequest as AuthenticatedRequest;
};

export const getAuthenticatedSessionToken = (req: Request): string =>
  toAuthenticatedRequest(req).authenticatedSessionToken;

export const getAuthenticatedUserId = (
  req: Request,
  routeUserId?: string,
): string => {
  const authenticatedRequest = toAuthenticatedRequest(req);

  if (routeUserId && routeUserId !== authenticatedRequest.authenticatedUser.id) {
    throw new AppError(401, ErrorCode.UNAUTHORIZED, "Authenticated user does not match route user id.");
  }

  return authenticatedRequest.authenticatedUser.id;
};