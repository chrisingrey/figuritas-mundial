import { z } from "zod";
import type { UpdateUserProfileArgs } from "./UpdateUserProfileArgs";

const updateUserProfileSchema = z.object({
  username: z.string().min(1, "username must not be empty").optional(),
  fullname: z.string().min(1, "fullname is required").optional(),
  surname: z.string().min(1, "surname is required").optional(),
  dateOfBirth: z.string().optional(),
  imageUrl: z.union([
    z.literal(""),
    z.string().url("imageUrl must be a valid URL"),
  ]).optional(),
})
  .superRefine((data, ctx) => {
    if (data.dateOfBirth && Number.isNaN(Date.parse(data.dateOfBirth))) {
      ctx.addIssue({ code: "custom", path: ["dateOfBirth"], message: "dateOfBirth must be a valid date" });
    }
  });

export type ValidationResult =
  | { success: true; data: UpdateUserProfileArgs }
  | { success: false; errors: string[] };

export const validateUpdateUserProfileArgs = (input: unknown): ValidationResult => {
  const result = updateUserProfileSchema.safeParse(input);
  if (!result.success) {
    return { success: false, errors: result.error.errors.map((e) => e.message) };
  }

  return { success: true, data: result.data as UpdateUserProfileArgs };
};
