import admin from "firebase-admin";
import type { DecodedIdToken } from "firebase-admin/auth";
import type { IFirebaseService } from "./IFirebaseService";

export class FirebaseService implements IFirebaseService {
  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    return admin.auth().verifyIdToken(idToken);
  }
}
