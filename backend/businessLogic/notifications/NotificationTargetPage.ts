export const NotificationTargetPage = {
  PROFILE: "PROFILE",
  NOTIFICATIONS: "NOTIFICATIONS",
  ALBUM_INVITE: "ALBUM_INVITE",
} as const;

export type NotificationTargetPage =
  (typeof NotificationTargetPage)[keyof typeof NotificationTargetPage];
