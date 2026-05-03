import type { NotificationAction } from "./NotificationAction";
import type { NotificationViewed } from "./NotificationViewed";

export interface Notification {
  id: string;
  title: string;
  description: string;
  targetUserId: string;
  createdAt: Date;
  viewed: NotificationViewed;
  action?: NotificationAction;
}
