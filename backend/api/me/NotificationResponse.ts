import {
  NotificationActionType,
  type Notification,
  type NotificationPage,
  type NotificationAction,
} from "@businessLogic/notifications";
import { Pagination } from "@models";

export interface NotificationActionResponse {
  type: string;
  targetPage: string;
  metadata?: Record<string, string>;
}

export interface NotificationResponse {
  id: string;
  title: string;
  description: string;
  targetUserId: string;
  createdAt: string;
  viewed: {
    seen: boolean;
    at?: string;
  };
  action?: NotificationActionResponse;
}

export const mapNotificationResponse = (
  notification: Notification,
): NotificationResponse => ({
  id: notification.id,
  title: notification.title,
  description: notification.description,
  targetUserId: notification.targetUserId,
  createdAt: new Date(notification.createdAt).toISOString(),
  viewed: {
    seen: notification.viewed.seen,
    at: notification.viewed.at
      ? new Date(notification.viewed.at).toISOString()
      : undefined,
  },
  action: mapNotificationActionResponse(notification.action),
});

export const mapNotificationPageResponse = (
  page: NotificationPage,
): Pagination<NotificationResponse> => ({
  items: page.items.map(mapNotificationResponse),
  page: page.page,
  pageSize: page.pageSize,
  total: page.total,
  totalPages: page.totalPages,
});

const mapNotificationActionResponse = (
  action?: NotificationAction,
): NotificationActionResponse | undefined => {
  if (!action) return undefined;

  switch (action.type) {
    case NotificationActionType.TAKE_ME_THERE:
      return {
        type: action.type,
        targetPage: action.targetPage,
        metadata: action.metadata,
      };
    default:
      return undefined;
  }
};
