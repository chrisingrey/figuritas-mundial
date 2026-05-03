import { z } from "zod";
import type { CreateResetPasswordVerificationArgs } from "./CreateResetPasswordVerificationArgs";

const createResetPasswordVerificationSchema = z.object({
  email: z.string().email("email must be a valid email address"),
});

export type CreateResetPasswordVerificationValidationResult =
  | { success: true; data: CreateResetPasswordVerificationArgs }
  | { success: false; errors: string[] };

export const validateCreateResetPasswordVerificationArgs = (
  input: unknown,
): CreateResetPasswordVerificationValidationResult => {
  const result = createResetPasswordVerificationSchema.safeParse(input);
  if (!result.success) {
    return { success: false, errors: result.error.errors.map((error) => error.message) };
  }

  return { success: true, data: result.data as CreateResetPasswordVerificationArgs };
};
