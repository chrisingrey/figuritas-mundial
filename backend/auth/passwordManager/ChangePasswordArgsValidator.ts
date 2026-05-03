import { z } from "zod";
import type { ChangePasswordArgs } from "./ChangePasswordArgs";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "currentPassword is required"),
  newPassword: z.string().min(8, "newPassword must have at least 8 characters"),
}).superRefine((data, ctx) => {
  if (data.currentPassword === data.newPassword) {
    ctx.addIssue({
      code: "custom",
      path: ["newPassword"],
      message: "newPassword must be different from currentPassword",
    });
  }
});

export type ValidationResult =
  | { success: true; data: ChangePasswordArgs }
  | { success: false; errors: string[] };

export const validateChangePasswordArgs = (input: unknown): ValidationResult => {
  const result = changePasswordSchema.safeParse(input);
  if (!result.success) {
    return { success: false, errors: result.error.errors.map((e) => e.message) };
  }

  return { success: true, data: result.data as ChangePasswordArgs };
};
