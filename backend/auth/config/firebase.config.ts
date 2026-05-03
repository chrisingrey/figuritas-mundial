import admin from "firebase-admin";
import fs from "fs";
import path from "path";

export function initializeFirebase(): void {
  if (admin.apps.length) return;

  const serviceAccount = resolveServiceAccount();

  if (!serviceAccount) {
    throw new Error("Firebase service account is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or provide api/config/env/serviceAccount.json.");
  }

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

function resolveServiceAccount(): admin.ServiceAccount | null {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (serviceAccountJson) {
    return parseServiceAccountJson(serviceAccountJson);
  }

  const serviceAccountPath = resolveServiceAccountPath();
  if (!serviceAccountPath) return null;

  return JSON.parse(fs.readFileSync(serviceAccountPath, "utf8")) as admin.ServiceAccount;
}

function parseServiceAccountJson(value: string): admin.ServiceAccount {
  const trimmedValue = value.trim();

  try {
    return JSON.parse(trimmedValue) as admin.ServiceAccount;
  } catch {
    const parsedString = JSON.parse(`"${trimmedValue
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")}"`);

    return JSON.parse(parsedString) as admin.ServiceAccount;
  }
}
