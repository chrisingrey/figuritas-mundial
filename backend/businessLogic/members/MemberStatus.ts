export const MemberStatus = {
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export type MemberStatus = (typeof MemberStatus)[keyof typeof MemberStatus];
