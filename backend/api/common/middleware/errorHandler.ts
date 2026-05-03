import type { Request, Response, NextFunction } from "express";
import { AppError } from "@errors";

interface ErrorResponse {
  error_code: string;
  code: string;
  message: string;
}

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  console.error(err);

  if (err instanceof AppError) {
    const body: ErrorResponse = {
      error_code: err.code,
      code: err.code,
      message: err.message,
    };
    res.status(err.statusCode).json(body);
    return;
  }

  res.status(500).json({
    error_code: "INTERNAL_ERROR",
    code: "INTERNAL_ERROR",
    message: "An unexpected internal error occurred.",
  } satisfies ErrorResponse);
};