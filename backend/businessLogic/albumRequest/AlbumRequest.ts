import type { User } from "@auth/users";

export const AlbumRequestStatus = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
} as const;

export type AlbumRequestStatus = (typeof AlbumRequestStatus)[keyof typeof AlbumRequestStatus];

export interface AlbumRequest {
  id: string;
  albumId: string;
  requesterUserId: string;
  status: AlbumRequestStatus;
  createdAt: Date;
  resolvedAt?: Date;
  resolvedByUserId?: string;
  requesterUser?: User;
}
