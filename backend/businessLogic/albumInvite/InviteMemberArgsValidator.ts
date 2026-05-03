import { z } from "zod";
import type { InviteMemberArgs } from "./InviteMemberArgs";

const schema = z.object({
  albumId: z.string().min(1, "albumId is required"),
  invitedByUserId: z.string().min(1, "invitedByUserId is required"),
  invitedEmail: z.string().email("invitedEmail must be a valid email address"),
  roleId: z.string().min(1, "roleId is required"),
});

export type ValidationResult =
  | { success: true; data: InviteMemberArgs }
  | { success: false; errors: string[] };

export const validateInviteMemberArgs = (input: unknown): ValidationResult => {
  const result = schema.safeParse(input);
  if (!result.success) {
    return { success: false, errors: result.error.errors.map((e) => e.message) };
  }
  return { success: true, data: result.data as InviteMemberArgs };
};
