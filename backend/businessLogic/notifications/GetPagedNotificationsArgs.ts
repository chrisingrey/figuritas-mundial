import type { NotificationOrderBy } from "./NotificationOrderBy";

export interface GetPagedNotificationsArgs {
  page?: number;
  pageSize?: number;
  orderBy?: NotificationOrderBy;
}

export interface NormalizedPagedNotificationsArgs {
  page: number;
  pageSize: number;
  orderBy: NotificationOrderBy;
}
