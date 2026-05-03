import { z } from "zod";
import type { UpdateAlbumArgs } from "./UpdateAlbumArgs";

const schema = z.object({
  name: z.string().min(1, "name is required").max(100, "name must not exceed 100 characters"),
});

export type ValidationResult =
  | { success: true; data: UpdateAlbumArgs }
  | { success: false; errors: string[] };

export const validateUpdateAlbumArgs = (input: unknown): ValidationResult => {
  const result = schema.safeParse(input);
  if (!result.success) {
    return { success: false, errors: result.error.errors.map((e) => e.message) };
  }
  return { success: true, data: result.data as UpdateAlbumArgs };
};
