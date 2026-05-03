import { z } from "zod";
import type { UpdateMemberRoleArgs } from "./UpdateMemberRoleArgs";

const schema = z.object({
  roleId: z.string().min(1, "roleId is required"),
});

export type ValidationResult =
  | { success: true; data: UpdateMemberRoleArgs }
  | { success: false; errors: string[] };

export const validateUpdateMemberRoleArgs = (input: unknown): ValidationResult => {
  const result = schema.safeParse(input);
  if (!result.success) {
    return { success: false, errors: result.error.errors.map((e) => e.message) };
  }
  return { success: true, data: result.data as UpdateMemberRoleArgs };
};
