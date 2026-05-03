import type { LoginResult } from "@auth/sessions";
import type { EnableTwoFactorArgs } from "./EnableTwoFactorArgs";
import type { VerifyTwoFactorArgs } from "./VerifyTwoFactorArgs";
import type { SetupTwoFactorResult } from "./SetupTwoFactorResult";

export interface ITwoFactorService {
  createTempToken(userId: string): string;
  verifyTwoFactor(args: VerifyTwoFactorArgs): Promise<LoginResult>;
  setupTwoFactor(sessionToken: string): Promise<SetupTwoFactorResult>;
  enableTwoFactor(args: EnableTwoFactorArgs): Promise<{ recoveryCodes: string[] }>;
}
