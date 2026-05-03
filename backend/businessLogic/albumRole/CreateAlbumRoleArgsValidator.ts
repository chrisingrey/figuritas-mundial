import { z } from "zod";
import type { CreateAlbumRoleArgs } from "./CreateAlbumRoleArgs";

const schema = z.object({
  name: z.string().min(1, "name is required"),
  permissionIds: z.array(z.string().uuid("each permissionId must be a valid UUID")).min(1, "at least one permission is required"),
});

export type ValidationResult =
  | { success: true; data: CreateAlbumRoleArgs }
  | { success: false; errors: string[] };

export const validateCreateAlbumRoleArgs = (input: unknown): ValidationResult => {
  const result = schema.safeParse(input);
  if (!result.success) {
    return { success: false, errors: result.error.errors.map((e) => e.message) };
  }
  return { success: true, data: result.data as CreateAlbumRoleArgs };
};
