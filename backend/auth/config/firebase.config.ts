import admin from "firebase-admin";
import fs from "fs";
import path from "path";

export function initializeFirebase(): void {
  if (admin.apps.length) return;

  const serviceAccountPath = resolveServiceAccountPath();

  if (!serviceAccountPath) {
    throw new Error("Firebase service account file not found at api/config/env/serviceAccount.json.");
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}

export function getFirebaseAuth(): admin.auth.Auth {
  return admin.auth();
}

function resolveServiceAccountPath(): string | null {
  const candidates = [
    path.resolve(process.cwd(), "api/config/env/serviceAccount.json"),
    path.resolve(__dirname, "../../api/config/env/serviceAccount.json"),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? null;
}
