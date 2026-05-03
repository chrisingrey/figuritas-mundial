export const NotificationOrderBy = {
  RECENT: "recent",
  OLDEST: "oldest",
} as const;

export type NotificationOrderBy =
  (typeof NotificationOrderBy)[keyof typeof NotificationOrderBy];
