export const NotificationActionType = {
  TAKE_ME_THERE: "TAKE_ME_THERE",
} as const;

export type NotificationActionType =
  (typeof NotificationActionType)[keyof typeof NotificationActionType];
