import { z } from "zod";
import type { PatchNotificationArgs } from "./PatchNotificationArgs";
import { notificationActionSchema } from "./NotificationActionValidator";

const patchNotificationSchema = z.object({
  title: z.string().min(1, "title must not be empty").optional(),
  description: z.string().min(1, "description must not be empty").optional(),
  viewed: z
    .object({
      seen: z.boolean(),
      at: z.string().optional(),
    })
    .optional()
    .superRefine((value, ctx) => {
      if (!value?.at) return;
      if (Number.isNaN(Date.parse(value.at))) {
        ctx.addIssue({ code: "custom", path: ["at"], message: "viewed.at must be a valid date" });
      }
    }),
  action: notificationActionSchema.optional(),
});

export type ValidationResult =
  | { success: true; data: PatchNotificationArgs }
  | { success: false; errors: string[] };

export const validatePatchNotificationArgs = (input: unknown): ValidationResult => {
  const result = patchNotificationSchema.safeParse(input);
  if (!result.success) {
    return { success: false, errors: result.error.errors.map((e) => e.message) };
  }

  return { success: true, data: result.data as PatchNotificationArgs };
};
