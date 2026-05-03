import type { Notification } from "./Notification";

export interface NotificationPage {
  items: Notification[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}
