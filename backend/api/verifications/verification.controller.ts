import { asyncHandler } from "@api/common/middleware/asyncHandler";
import { services } from "@api/config/services.config";
import { AppError, ErrorCode } from "@errors";
import { RegisterArgs } from "@auth/users";
import type {
  CreateResetPasswordVerificationArgs,
  VerifyEmailVerificationArgs,
  VerifyResetPasswordVerificationArgs,
} from "@auth/verifications";
import type { Request, Response, NextFunction } from "express";
import { mapCreateVerificationResponse } from "./CreateVerificationResponse";

export const createVerification = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const request: RegisterArgs = req.body;
  const verification = await services.emailVerificationService.create(request);
  res.status(201).json(mapCreateVerificationResponse(verification));
});

export const verifyEmailValidation = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const { id } = req.params ?? {};
  if (!id) {
    throw new AppError(400, ErrorCode.INVALID_EMAIL_VERIFICATION_DATA, "Email validation id is required.");
  }

  const request = req.body as VerifyEmailVerificationArgs;
  await services.emailVerificationService.verify({
    id,
    code: request.code,
  });

  res.status(204).send();
});

export const createResetPasswordVerification = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const request: CreateResetPasswordVerificationArgs = req.body;
  await services.passwordManagerService.forgotPassword(request);
  res.status(204).send();
});

export const verifyResetPassword = asyncHandler(async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const { token } = req.params ?? {};
  if (!token) {
    throw new AppError(400, ErrorCode.VALIDATION_ERROR, "Reset password token is required.");
  }

  const request = req.body as Omit<VerifyResetPasswordVerificationArgs, "token">;
  await services.passwordManagerService.resetPassword({
    token,
    password: request.password,
    repeatPassword: request.repeatPassword,
  });
  res.status(204).send();
});