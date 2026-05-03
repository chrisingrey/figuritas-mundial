export interface CredentialsArgs {
  /** Firebase ID token — when present, the Firebase path is used. */
  firebaseIdToken?: string;
  /** @deprecated Use firebaseIdToken. Kept for older clients. */
  googleIdToken?: string;
  /** Used in the email/password path. */
  email?: string;
  /** Used in the email/password path. */
  username?: string;
  /** Required for the email/password path. */
  password?: string;
}
