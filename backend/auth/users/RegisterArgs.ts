export interface RegisterArgs {
  /** Firebase ID token — when present, all other fields are obtained from Firebase. */
  firebaseIdToken?: string;
  /** @deprecated Use firebaseIdToken. Kept for older clients. */
  googleIdToken?: string;
  /** Required for the email+password path. */
  email: string;
  username: string;
  fullname: string;
  surname: string;
  dateOfBirth: string;
  /** Required for the email+password path. Omitted for Google registration. */
  password?: string;
}
