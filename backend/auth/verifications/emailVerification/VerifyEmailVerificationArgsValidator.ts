import { z } from "zod";
import type { VerifyEmailVerificationArgs } from "./VerifyEmailVerificationArgs";

const verifyEmailVerificationSchema = z.object({
  id: z.string().min(1, "id is required"),
  code: z
    .string()
    .length(6, "code must be exactly 6 characters")
    .regex(/^\d{6}$/, "code must contain only digits"),
});

export type VerifyEmailVerificationValidationResult =
  | { success: true; data: VerifyEmailVerificationArgs }
  | { success: false; errors: string[] };

export const validateVerifyEmailVerificationArgs = (
  input: unknown,
): VerifyEmailVerificationValidationResult => {
  const result = verifyEmailVerificationSchema.safeParse(input);
  if (!result.success) {
    return { success: false, errors: result.error.errors.map((error) => error.message) };
  }

  return { success: true, data: result.data as VerifyEmailVerificationArgs };
};
