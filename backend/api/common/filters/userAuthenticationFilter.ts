import type { NextFunction, Request, Response } from "express";
import { services } from "@api/config/services.config";
import type { AuthenticatedRequest } from "./AuthenticatedRequest";
import { AppError, ErrorCode } from "@errors";

export const userAuthenticationFilter = async (
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization || !authorization.startsWith("Bearer ")) {
      throw new AppError(401, ErrorCode.UNAUTHORIZED, "Authentication required.");
    }

    const token = authorization.slice("Bearer ".length).trim();
    if (!token) {
      throw new AppError(401, ErrorCode.UNAUTHORIZED, "Authentication required.");
    }

    const authenticatedUser = await services.sessionService.getUserBySessionToken(token);
    const typedRequest = req as AuthenticatedRequest;
    typedRequest.authenticatedUser = authenticatedUser;
    typedRequest.authenticatedSessionToken = token;

    next();
  } catch (error) {
    next(error);
  }
};