import type { NotificationAction } from "./NotificationAction";

export interface PatchNotificationViewedArgs {
  seen: boolean;
  at?: string;
}

export interface PatchNotificationArgs {
  title?: string;
  description?: string;
  viewed?: PatchNotificationViewedArgs;
  action?: NotificationAction;
}
