import { z } from "zod";
import { NotificationActionType } from "./NotificationActionType";
import { NotificationTargetPage } from "./NotificationTargetPage";

const takeMeThereActionSchema = z.object({
  type: z.literal(NotificationActionType.TAKE_ME_THERE),
  targetPage: z.enum([NotificationTargetPage.PROFILE, NotificationTargetPage.NOTIFICATIONS]),
  metadata: z.record(z.string()).optional(),
});

export const notificationActionSchema = z.discriminatedUnion("type", [
  takeMeThereActionSchema,
]);
