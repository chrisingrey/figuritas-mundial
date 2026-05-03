import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";
import speakeasy from "speakeasy";
import type { IRepository } from "@dataAccess/IRepository";
import type { User } from "@auth/users";
import type { Session, LoginResult } from "@auth/sessions";
import { AppError, ErrorCode } from "@errors";
import { decryptTwoFactorSecret, encryptTwoFactorSecret } from "./twoFactorCrypto";
import type { ITwoFactorService } from "./ITwoFactorService";
import type { EnableTwoFactorArgs } from "./EnableTwoFactorArgs";
import type { VerifyTwoFactorArgs } from "./VerifyTwoFactorArgs";
import type { SetupTwoFactorResult } from "./SetupTwoFactorResult";

const DAYS_IN_MS_7 = 7 * 86400 * 1000;
const TWO_FACTOR_TEMP_EXPIRES = "5m";
const TWO_FACTOR_TEMP_SECRET =
  process.env.TWO_FACTOR_TEMP_SECRET ??
  process.env.JWT_SECRET ??
  "figuritas-mundial-dev-2fa-secret";
const TWO_FACTOR_APP_NAME = process.env.TWO_FACTOR_APP_NAME ?? "Figuritas Mundial";
const TWO_FACTOR_RECOVERY_CODES_COUNT = 8;
const TWO_FACTOR_RECOVERY_CODE_SEPARATOR = "-";

export class TwoFactorService implements ITwoFactorService {
  constructor(
    private readonly userRepository: IRepository<User>,
    private readonly sessionRepository: IRepository<Session>,
  ) {}

  createTempToken(userId: string): string {
    return jwt.sign(
      {
        sub: userId,
        type: "2fa",
      },
      TWO_FACTOR_TEMP_SECRET,
      {
        expiresIn: TWO_FACTOR_TEMP_EXPIRES,
      },
    );
  }

  async verifyTwoFactor(args: VerifyTwoFactorArgs): Promise<LoginResult> {
    const userId = this.getUserIdFromTempToken(args.tempToken);
    const user = await this.userRepository.getAsync((u) => u.id === userId);

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new AppError(400, ErrorCode.TWO_FACTOR_NOT_ENABLED, "Two-factor authentication is not enabled for this account.");
    }

    const decryptedSecret = decryptTwoFactorSecret(user.twoFactorSecret);
    const normalizedCode = this.normalizeCode(args.code);
    const isValidCode = speakeasy.totp.verify({
      secret: decryptedSecret,
      encoding: "base32",
      token: normalizedCode,
      window: 1,
    });

    if (!isValidCode) {
      const recoveryCodeWasUsed = await this.tryUseRecoveryCode(user, normalizedCode);
      if (!recoveryCodeWasUsed) {
        throw new AppError(401, ErrorCode.INVALID_TWO_FACTOR_CODE, "Invalid two-factor authentication code.");
      }
    }

    const session = await this.createOrUpdateSession(user.id);

    return { requires2FA: false, session, user };
  }

  async setupTwoFactor(sessionToken: string): Promise<SetupTwoFactorResult> {
    const user = await this.getUserBySessionToken(sessionToken);

    if (user.twoFactorEnabled) {
      throw new AppError(409, ErrorCode.TWO_FACTOR_ALREADY_ENABLED, "Two-factor authentication is already enabled.");
    }

    const secret = speakeasy.generateSecret({
      name: `${TWO_FACTOR_APP_NAME} (${user.email})`,
    });

    if (!secret.base32 || !secret.otpauth_url) {
      throw new AppError(500, ErrorCode.INTERNAL_ERROR, "Unable to create two-factor setup credentials.");
    }

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    await this.userRepository.patchByIdAndSaveAsync(user.id, {
      twoFactorPendingSecret: encryptTwoFactorSecret(secret.base32),
    });

    return {
      qrCode,
      secret: secret.base32,
    };
  }

  async enableTwoFactor(args: EnableTwoFactorArgs): Promise<{ recoveryCodes: string[] }> {
    const user = await this.getUserBySessionToken(args.sessionToken);

    if (user.twoFactorEnabled) {
      throw new AppError(409, ErrorCode.TWO_FACTOR_ALREADY_ENABLED, "Two-factor authentication is already enabled.");
    }

    if (!user.twoFactorPendingSecret) {
      throw new AppError(400, ErrorCode.TWO_FACTOR_SETUP_REQUIRED, "Two-factor setup must be generated before enabling.");
    }

    const decryptedPendingSecret = decryptTwoFactorSecret(user.twoFactorPendingSecret);
    const isValidCode = speakeasy.totp.verify({
      secret: decryptedPendingSecret,
      encoding: "base32",
      token: this.normalizeCode(args.code),
      window: 1,
    });

    if (!isValidCode) {
      throw new AppError(401, ErrorCode.INVALID_TWO_FACTOR_CODE, "Invalid two-factor authentication code.");
    }

    const recoveryCodes = this.generateRecoveryCodes();
    const recoveryCodeHashes = await Promise.all(
      recoveryCodes.map((code) => bcrypt.hash(this.normalizeRecoveryCode(code), 10)),
    );

    await this.userRepository.patchByIdAndSaveAsync(user.id, {
      twoFactorEnabled: true,
      twoFactorSecret: encryptTwoFactorSecret(decryptedPendingSecret),
      twoFactorPendingSecret: undefined,
      twoFactorRecoveryCodeHashes: recoveryCodeHashes,
    });

    return { recoveryCodes };
  }

  private async createOrUpdateSession(userId: string): Promise<Session> {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + DAYS_IN_MS_7);
    const existingSession = await this.sessionRepository.getOrDefaultAsync(
      (s) => s.userId === userId,
    );

    return existingSession
      ? this.sessionRepository.patchByIdAndSaveAsync(existingSession.id, {
          token,
          expiresAt,
        })
      : this.sessionRepository.createAndSaveAsync({
          id: crypto.randomUUID(),
          userId,
          token,
          expiresAt,
        });
  }

  private async getUserBySessionToken(sessionToken: string): Promise<User> {
    const session = await this.sessionRepository.getOrDefaultAsync(
      (s) => s.token === sessionToken,
    );

    const expiresAt = session
      ? session.expiresAt instanceof Date
        ? session.expiresAt
        : new Date(session.expiresAt)
      : null;

    if (!session || !expiresAt || expiresAt.getTime() <= Date.now()) {
      throw new AppError(401, ErrorCode.UNAUTHORIZED, "Authentication required.");
    }

    return this.userRepository.getAsync((u) => u.id === session.userId);
  }

  private getUserIdFromTempToken(tempToken: string): string {
    try {
      const payload = jwt.verify(tempToken, TWO_FACTOR_TEMP_SECRET) as {
        sub?: string;
        type?: string;
      };

      if (!payload.sub || payload.type !== "2fa") {
        throw new AppError(401, ErrorCode.INVALID_TWO_FACTOR_TEMP_TOKEN, "Invalid two-factor temporary token.");
      }

      return payload.sub;
    } catch {
      throw new AppError(401, ErrorCode.INVALID_TWO_FACTOR_TEMP_TOKEN, "Invalid two-factor temporary token.");
    }
  }

  private normalizeCode(code: string): string {
    return code.replace(/\s/g, "").trim();
  }

  private normalizeRecoveryCode(code: string): string {
    return this.normalizeCode(code).replace(/-/g, "").toUpperCase();
  }

  private generateRecoveryCodes(): string[] {
    return Array.from({ length: TWO_FACTOR_RECOVERY_CODES_COUNT }, () => {
      const left = crypto.randomUUID().replace(/-/g, "").slice(0, 4).toUpperCase();
      const right = crypto.randomUUID().replace(/-/g, "").slice(0, 4).toUpperCase();
      return `${left}${TWO_FACTOR_RECOVERY_CODE_SEPARATOR}${right}`;
    });
  }

  private async tryUseRecoveryCode(user: User, providedCode: string): Promise<boolean> {
    if (!user.twoFactorRecoveryCodeHashes?.length) {
      return false;
    }

    const normalized = this.normalizeRecoveryCode(providedCode);
    for (let index = 0; index < user.twoFactorRecoveryCodeHashes.length; index += 1) {
      const hash = user.twoFactorRecoveryCodeHashes[index];
      const isMatch = await bcrypt.compare(normalized, hash);
      if (isMatch) {
        const remaining = user.twoFactorRecoveryCodeHashes.filter((_, i) => i !== index);
        await this.userRepository.patchByIdAndSaveAsync(user.id, {
          twoFactorRecoveryCodeHashes: remaining,
        });
        return true;
      }
    }

    return false;
  }
}
