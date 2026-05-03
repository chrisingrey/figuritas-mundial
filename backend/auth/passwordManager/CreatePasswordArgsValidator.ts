import { z } from "zod";
import type { CreatePasswordArgs } from "./CreatePasswordArgs";

const createPasswordSchema = z.object({
  newPassword: z.string().min(8, "newPassword must have at least 8 characters"),
});

export type ValidationResult =
  | { success: true; data: CreatePasswordArgs }
  | { success: false; errors: string[] };

export const validateCreatePasswordArgs = (input: unknown): ValidationResult => {
  const result = createPasswordSchema.safeParse(input);
  if (!result.success) {
    return { success: false, errors: result.error.errors.map((e) => e.message) };
  }

  return { success: true, data: result.data as CreatePasswordArgs };
};
