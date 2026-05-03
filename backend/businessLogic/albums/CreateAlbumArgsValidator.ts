import { z } from "zod";
import type { CreateAlbumArgs } from "./CreateAlbumArgs";

const schema = z.object({
  name: z.string().min(1, "name is required").max(100, "name must not exceed 100 characters"),
  userId: z.string().min(1, "userId is required"),
});

export type ValidationResult =
  | { success: true; data: CreateAlbumArgs }
  | { success: false; errors: string[] };

export const validateCreateAlbumArgs = (input: unknown): ValidationResult => {
  const result = schema.safeParse(input);
  if (!result.success) {
    return { success: false, errors: result.error.errors.map((e) => e.message) };
  }
  return { success: true, data: result.data as CreateAlbumArgs };
};
