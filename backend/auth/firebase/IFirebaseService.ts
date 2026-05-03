import type { DecodedIdToken } from "firebase-admin/auth";

export interface IFirebaseService {
  /**
   * Verifies a Firebase ID token using the Admin SDK.
   * Returns the decoded token claims.
   */
  verifyIdToken(idToken: string): Promise<DecodedIdToken>;
}
