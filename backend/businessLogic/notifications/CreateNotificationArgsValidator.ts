import { z } from "zod";
import type { CreateNotificationArgs } from "./CreateNotificationArgs";
import { notificationActionSchema } from "./NotificationActionValidator";

const createNotificationSchema = z.object({
  title: z.string().min(1, "title is required"),
  description: z.string().min(1, "description is required"),
  targetUserId: z.string().min(1, "targetUserId is required"),
  action: notificationActionSchema.optional(),
});

export type ValidationResult =
  | { success: true; data: CreateNotificationArgs }
  | { success: false; errors: string[] };

export const validateCreateNotificationArgs = (input: unknown): ValidationResult => {
  const result = createNotificationSchema.safeParse(input);
  if (!result.success) {
    return { success: false, errors: result.error.errors.map((e) => e.message) };
  }

  return { success: true, data: result.data as CreateNotificationArgs };
};
