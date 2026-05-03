export interface User {
  id: string;
  email: string;
  username: string;
  fullname: string;
  surname: string;
  dateOfBirth: string;
  imageUrl?: string;
  passwordHash: string;
  /** Firebase UID — present for Google-authenticated accounts. */
  firebaseId?: string;
  /** Whether login requires a TOTP code. */
  twoFactorEnabled?: boolean;
  /** Base32 secret used to verify TOTP codes. */
  twoFactorSecret?: string;
  /** Temporary secret generated during setup before enable confirmation. */
  twoFactorPendingSecret?: string;
  /** One-time recovery code hashes used when authenticator access is lost. */
  twoFactorRecoveryCodeHashes?: string[];
}
