import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const CIPHER_ALGORITHM = "aes-256-gcm";
const ENCRYPTED_PREFIX = "enc:v1";

const resolveEncryptionKey = (): Buffer => {
  const source =
    process.env.TWO_FACTOR_ENCRYPTION_KEY ??
    process.env.JWT_SECRET ??
    "figuritas-mundial-dev-2fa-encryption-key";

  return createHash("sha256").update(source).digest();
};

const ENCRYPTION_KEY = resolveEncryptionKey();

export const encryptTwoFactorSecret = (plainTextSecret: string): string => {
  const iv = randomBytes(12);
  const cipher = createCipheriv(CIPHER_ALGORITHM, ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainTextSecret, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${ENCRYPTED_PREFIX}:${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
};

export const decryptTwoFactorSecret = (storedSecret: string): string => {
  if (!storedSecret.startsWith(`${ENCRYPTED_PREFIX}:`)) {
    // Backward compatibility with previously stored plain base32 secrets.
    return storedSecret;
  }

  const parts = storedSecret.split(":");
  if (parts.length !== 5) {
    throw new Error("Invalid encrypted two-factor secret format.");
  }

  const [, , ivB64, authTagB64, encryptedB64] = parts;
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const encrypted = Buffer.from(encryptedB64, "base64");

  const decipher = createDecipheriv(CIPHER_ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
};
