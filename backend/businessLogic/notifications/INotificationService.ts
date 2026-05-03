import type { CreateNotificationArgs } from "./CreateNotificationArgs";
import type { GetPagedNotificationsArgs } from "./GetPagedNotificationsArgs";
import type { Notification } from "./Notification";
import type { NotificationPage } from "./NotificationPage";
import type { PatchNotificationArgs } from "./PatchNotificationArgs";

export interface INotificationService {
  createNotification(args: CreateNotificationArgs): Promise<Notification>;
  patchNotificationForUser(userId: string, id: string, args: PatchNotificationArgs): Promise<Notification>;
  getNotificationByIdForUser(userId: string, id: string): Promise<Notification>;
  getPagedNotificationsForUser(userId: string, args: GetPagedNotificationsArgs): Promise<NotificationPage>;
}
