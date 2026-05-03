import bcrypt from "bcryptjs";
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import type { Email, IMessagingService } from "@businessLogic/messaging";
import type { IRepository } from "@dataAccess/IRepository";
import type { User } from "@auth/users";
import { caseInsensitiveCompare } from "@utils";
import { AppError, ErrorCode } from "@errors";
import type { IResetPasswordVerificationService } from "./IResetPasswordVerificationService";
import type { CreateResetPasswordVerificationArgs } from "./CreateResetPasswordVerificationArgs";
import type { VerifyResetPasswordVerificationArgs } from "./VerifyResetPasswordVerificationArgs";
import { validateCreateResetPasswordVerificationArgs } from "./CreateResetPasswordVerificationArgsValidator";
import { validateVerifyResetPasswordVerificationArgs } from "./VerifyResetPasswordVerificationArgsValidator";
import {
  buildResetPasswordEmail,
  buildResetPasswordSuccessEmail,
} from "./ResetPasswordPage";

const PASSWORD_RESET_TTL_MINUTES = 5;

type ResetPasswordTokenPayload = {
  sub?: string;
  type?: string;
};

export class ResetPasswordVerificationService implements IResetPasswordVerificationService {
  constructor(
    private readonly userRepository: IRepository<User>,
    private readonly messagingService: IMessagingService<Email>,
  ) {}

  async create(args: CreateResetPasswordVerificationArgs): Promise<void> {
    const result = validateCreateResetPasswordVerificationArgs(args);
    if (!result.success) {
      throw new AppError(400, ErrorCode.VALIDATION_ERROR, result.errors.join(", "));
    }

    const user = await this.userRepository.getOrDefaultAsync(
      (entity) => caseInsensitiveCompare(entity.email, result.data.email),
    );

    if (!user) {
      return;
    }

    const token = this.createPasswordResetToken(user.email);
    await this.messagingService.send({
      from: this.getFromAddress(),
      to: user.email,
      subject: "Reset your Figuritas Mundial password",
      html: buildResetPasswordEmail(
        user.username || user.fullname || "Figuritas Mundial user",
        this.createPasswordResetUrl(token),
        `${PASSWORD_RESET_TTL_MINUTES} minutes`,
      ),
    });
  }

  async verify(args: VerifyResetPasswordVerificationArgs): Promise<void> {
    const result = validateVerifyResetPasswordVerificationArgs(args);
    if (!result.success) {
      throw new AppError(400, ErrorCode.INVALID_PASSWORD_UPDATE, result.errors.join(", "));
    }

    const email = this.resolveEmailFromToken(result.data.token);
    const user = await this.userRepository.getOrDefaultAsync(
      (entity) => caseInsensitiveCompare(entity.email, email),
    );

    if (!user) {
      throw new AppError(404, ErrorCode.RESOURCE_NOT_FOUND, "User not found.");
    }

    const passwordHash = await bcrypt.hash(result.data.password, 12);
    await this.userRepository.patchByIdAndSaveAsync(user.id, { passwordHash });

    await this.messagingService.send({
      from: this.getFromAddress(),
      to: user.email,
      subject: "Your Figuritas Mundial password was changed",
      html: buildResetPasswordSuccessEmail(
        user.fullname || user.username || "Figuritas Mundial user",
      ),
    });
  }

  private resolveEmailFromToken(token: string): string {
    try {
      const payload = jwt.verify(token, this.getPasswordResetSecret()) as ResetPasswordTokenPayload;

      if (!payload.sub || payload.type !== "password-reset") {
        throw new AppError(401, ErrorCode.INVALID_RESET_PASSWORD_TOKEN, "Invalid password reset token.");
      }

      return payload.sub;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (error instanceof TokenExpiredError) {
        throw new AppError(401, ErrorCode.RESET_PASSWORD_TOKEN_EXPIRED, "Password reset token has expired.");
      }

      if (error instanceof JsonWebTokenError) {
        throw new AppError(401, ErrorCode.INVALID_RESET_PASSWORD_TOKEN, "Invalid password reset token.");
      }

      throw new AppError(500, ErrorCode.INTERNAL_ERROR, "Could not verify password reset token.");
    }
  }

  private createPasswordResetToken(email: string): string {
    return jwt.sign(
      { sub: email, type: "password-reset" },
      this.getPasswordResetSecret(),
      { expiresIn: `${PASSWORD_RESET_TTL_MINUTES}m` },
    );
  }

  private createPasswordResetUrl(token: string): string {
    const configuredBaseUrl = process.env.PASSWORD_RESET_BASE_URL!;

    try {
      const parsedUrl = new URL(configuredBaseUrl);
      parsedUrl.pathname = `${parsedUrl.pathname.replace(/\/+$/, "")}/${encodeURIComponent(token)}`;
      return parsedUrl.toString();
    } catch {
      const [basePath, query] = configuredBaseUrl.split("?");
      const tokenPath = `${basePath.replace(/\/+$/, "")}/${encodeURIComponent(token)}`;
      return query ? `${tokenPath}?${query}` : tokenPath;
    }
  }

  private getFromAddress(): string {
    const gmailUser = process.env.GMAIL_USER?.trim();
    return gmailUser
      ? `"Figuritas Mundial" <${gmailUser}>`
      : "Figuritas Mundial <no-reply@figuritas-mundial.local>";
  }

  private getPasswordResetSecret(): string {
    return process.env.RESET_PASSWORD_TOKEN_SECRET!;
  }
}
