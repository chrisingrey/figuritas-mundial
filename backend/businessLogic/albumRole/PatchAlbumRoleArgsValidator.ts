import { z } from "zod";
import type { PatchAlbumRoleArgs } from "./PatchAlbumRoleArgs";

const schema = z.object({
  name: z.string().min(1, "name must not be empty").optional(),
  permissionIds: z
    .array(z.string().min(1, "each permissionId is required"))
    .min(1, "permissionIds must not be empty")
    .optional(),
});

export type ValidationResult =
  | { success: true; data: PatchAlbumRoleArgs }
  | { success: false; errors: string[] };

export const validatePatchAlbumRoleArgs = (input: unknown): ValidationResult => {
  const result = schema.safeParse(input);
  if (!result.success) {
    return { success: false, errors: result.error.errors.map((e) => e.message) };
  }
  return { success: true, data: result.data as PatchAlbumRoleArgs };
};
