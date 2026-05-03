import { z } from "zod";
import type { VerifyResetPasswordVerificationArgs } from "./VerifyResetPasswordVerificationArgs";

const verifyResetPasswordVerificationSchema = z
  .object({
    token: z.string().min(1, "token is required"),
    password: z
      .string()
      .min(8, "password must have at least 8 characters")
      .max(100, "password must have at most 100 characters"),
    repeatPassword: z
      .string()
      .min(8, "repeatPassword must have at least 8 characters")
      .max(100, "repeatPassword must have at most 100 characters"),
  })
  .refine((value) => value.password === value.repeatPassword, {
    message: "password and repeatPassword must match",
    path: ["repeatPassword"],
  });

export type VerifyResetPasswordVerificationValidationResult =
  | { success: true; data: VerifyResetPasswordVerificationArgs }
  | { success: false; errors: string[] };

export const validateVerifyResetPasswordVerificationArgs = (
  input: unknown,
): VerifyResetPasswordVerificationValidationResult => {
  const result = verifyResetPasswordVerificationSchema.safeParse(input);
  if (!result.success) {
    return { success: false, errors: result.error.errors.map((error) => error.message) };
  }

  return { success: true, data: result.data as VerifyResetPasswordVerificationArgs };
};
