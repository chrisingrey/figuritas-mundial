import type { Request, Response, NextFunction } from "express";
import { services } from "@api/config/services.config";
import { CredentialsArgs } from "@auth/sessions";
import { RegisterArgs } from "@auth/users";
import {
  getAuthenticatedSessionToken,
} from "@api/common/filters/AuthenticatedRequest";
import { AppError, ErrorCode } from "@errors";
import { asyncHandler } from "../common/middleware/asyncHandler";
import { mapLoginResponse } from "./LoginResponse";
import { mapRegisterResponse } from "./RegisterResponse";

export const login = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const request: CredentialsArgs = req.body;
  const loginResult = await services.sessionService.login(request);
  res.status(200).json(mapLoginResponse(loginResult));
});

export const register = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const request: RegisterArgs = req.body;
  await services.userService.register(request);
  res.status(201).json(mapRegisterResponse());
});

export const verifyTwoFactor = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const request = req.body as { tempToken?: string; code?: string };

  if (!request.tempToken || !request.code) {
    throw new AppError(400, ErrorCode.VALIDATION_ERROR, "tempToken and code are required.");
  }

  const loginResult = await services.twoFactorService.verifyTwoFactor({
    tempToken: request.tempToken,
    code: request.code,
  });

  res.status(200).json(mapLoginResponse(loginResult));
});

export const setupTwoFactor = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const setupResult = await services.twoFactorService.setupTwoFactor(
    getAuthenticatedSessionToken(req),
  );
  res.status(200).json(setupResult);
});

export const enableTwoFactor = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const request = req.body as { code?: string };

  if (!request.code) {
    throw new AppError(400, ErrorCode.VALIDATION_ERROR, "code is required.");
  }

  const result = await services.twoFactorService.enableTwoFactor({
    sessionToken: getAuthenticatedSessionToken(req),
    code: request.code,
  });

  res.status(200).json(result);
});
