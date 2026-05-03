import type { NotificationAction } from "./NotificationAction";

export interface CreateNotificationArgs {
  title: string;
  description: string;
  targetUserId: string;
  action?: NotificationAction;
}
