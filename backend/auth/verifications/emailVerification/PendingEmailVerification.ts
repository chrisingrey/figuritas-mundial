export interface PendingEmailVerification {
  id: string;
  email: string;
  username: string;
  fullname: string;
  surname: string;
  dateOfBirth: string;
  passwordHash: string;
  code: string;
  expiresAt: Date;
  createdAt: Date;
  verifiedAt?: Date;
}
