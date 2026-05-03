import { NotificationActionType } from "./NotificationActionType";
import type { NotificationTargetPage } from "./NotificationTargetPage";

export interface TakeMeThereNotificationAction {
  type: typeof NotificationActionType.TAKE_ME_THERE;
  targetPage: NotificationTargetPage;
  metadata?: Record<string, string>;
}

export type NotificationAction =
  | TakeMeThereNotificationAction;
