import bcrypt from "bcryptjs";
import type { IRepository } from "@dataAccess/IRepository";
import type { Email, IMessagingService } from "@businessLogic/messaging";
import type { RegisterArgs, User } from "@auth/users";
import {
  NotificationActionType,
  NotificationTargetPages,
  type INotificationService,
} from "@businessLogic/notifications";
import { validateRegisterArgs } from "@auth/users/RegisterArgsValidator";
import { AppError, ErrorCode } from "@errors";
import { caseInsensitiveCompare } from "@utils";
import type { IEmailVerificationService } from "./IEmailVerificationService";
import type { PendingEmailVerification } from "./PendingEmailVerification";
import type { VerifyEmailVerificationArgs } from "./VerifyEmailVerificationArgs";
import { validateVerifyEmailVerificationArgs } from "./VerifyEmailVerificationArgsValidator";
import {
  buildVerificationEmail,
  buildEmailVerificationSuccessEmail,
} from "./EmailVerificationPage";

const SALT_ROUNDS = 12;
const EMAIL_VERIFICATION_TTL_MS = 10 * 60 * 1000;
const RESEND_COOLDOWN_MS = 60 * 1000;

export class EmailVerificationService implements IEmailVerificationService {
  constructor(
    private readonly verificationRepository: IRepository<PendingEmailVerification>,
    private readonly userRepository: IRepository<User>,
    private readonly messagingService: IMessagingService<Email>,
    private readonly notificationService?: INotificationService,
  ) {}

  async create(args: RegisterArgs): Promise<PendingEmailVerification> {
    await this.assertCreateVerification(args);

    const existingVerification = await this.verificationRepository.getOrDefaultAsync(
      (verification) => !!args.email && caseInsensitiveCompare(verification.email, args.email),
    );

    if (
      existingVerification
      && !existingVerification.verifiedAt
      && existingVerification.expiresAt > new Date()
      && existingVerification.createdAt > new Date(Date.now() - RESEND_COOLDOWN_MS)
    ) {
      throw new AppError(409, ErrorCode.EMAIL_VERIFICATION_ALREADY_SENT, "A verification email has already been sent for this account.");
    }

    const pendingVerification: PendingEmailVerification = {
      id: existingVerification?.id ?? crypto.randomUUID(),
      email: args.email,
      username: args.username,
      fullname: args.fullname,
      surname: args.surname,
      dateOfBirth: args.dateOfBirth,
      passwordHash: await bcrypt.hash(args.password!, SALT_ROUNDS),
      code: this.generateVerificationCode(),
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
      createdAt: new Date(),
      verifiedAt: undefined,
    };

    const verification = existingVerification
      ? await this.verificationRepository.patchByIdAndSaveAsync(existingVerification.id, pendingVerification)
      : await this.verificationRepository.createAndSaveAsync(pendingVerification);

    await this.messagingService.send({
      from: this.getFromAddress(),
      to: args.email,
      subject: "Verify your Figuritas Mundial email address",
      html: buildVerificationEmail(
        args.username,
        verification.code,
        this.createEmailValidationUrl(verification.id),
        `${EMAIL_VERIFICATION_TTL_MS / 60_000} minutes`,
      ),
    });

    return verification;
  }

  async verify(args: VerifyEmailVerificationArgs): Promise<void> {
    const result = validateVerifyEmailVerificationArgs(args);
    if (!result.success) {
      throw new AppError(400, ErrorCode.INVALID_EMAIL_VERIFICATION_DATA, result.errors.join(", "));
    }

    const verification = await this.verificationRepository.getAsync(
      (entity) => entity.id === result.data.id,
    );

    if (!verification) {
      throw new AppError(400, ErrorCode.INVALID_EMAIL_VERIFICATION_CODE, "Invalid verification code.");
    }

    if (verification.verifiedAt) {
      throw new AppError(409, ErrorCode.EMAIL_ALREADY_VERIFIED, "This email has already been verified.");
    }

    if (verification.expiresAt <= new Date()) {
      throw new AppError(400, ErrorCode.EMAIL_VERIFICATION_EXPIRED, "Verification code has expired.");
    }

    if (verification.code !== result.data.code) {
      throw new AppError(400, ErrorCode.INVALID_EMAIL_VERIFICATION_CODE, "Invalid verification code.");
    }

    const createdUserId = crypto.randomUUID();

    const createdUser = await this.userRepository.createAndSaveAsync({
      id: createdUserId,
      email: verification.email,
      username: verification.username,
      fullname: verification.fullname,
      surname: verification.surname,
      dateOfBirth: verification.dateOfBirth,
      imageUrl: "",
      passwordHash: verification.passwordHash,
      twoFactorEnabled: false,
    });

    const persistedUserId =
      typeof createdUser?.id === "string" && createdUser.id.length > 0
        ? createdUser.id
        : createdUserId;

    if (this.notificationService) {
      await this.notificationService.createNotification({
        title: "Activa la autenticacion en dos pasos",
        description: "Configura 2FA para proteger mejor tu cuenta.",
        targetUserId: persistedUserId,
        action: {
          type: NotificationActionType.TAKE_ME_THERE,
          targetPage: NotificationTargetPages.PROFILE,
          metadata: {
            section: "security",
            focus: "two-factor",
          },
        },
      });
    }

    await this.verificationRepository.patchByIdAndSaveAsync(verification.id, {
      verifiedAt: new Date(),
    });

    await this.messagingService.send({
      from: this.getFromAddress(),
      to: verification.email,
      subject: "Your Figuritas Mundial email is verified",
      html: buildEmailVerificationSuccessEmail(
        verification.fullname || verification.username || "Figuritas Mundial user",
      ),
    });
  }

  private async assertCreateVerification(args: RegisterArgs): Promise<void> {
    const result = validateRegisterArgs(args);
    if (!result.success) {
      throw new AppError(400, ErrorCode.INVALID_REGISTRATION_DATA, result.errors.join(", "));
    }

    const existingUser = await this.userRepository.getOrDefaultAsync(
      (user) =>
        (!!args.email && caseInsensitiveCompare(user.email, args.email))
        || (!!args.username && caseInsensitiveCompare(user.username, args.username)),
    );
    if (existingUser) {
      throw new AppError(409, caseInsensitiveCompare(args.email, existingUser.email) ? ErrorCode.EMAIL_ALREADY_EXISTS : ErrorCode.USERNAME_ALREADY_EXISTS, caseInsensitiveCompare(args.email, existingUser.email) ? "An account with this email already exists." : "An account with this username already exists.");
    }

    const existingUsername = await this.verificationRepository.getOrDefaultAsync(
      (verification) =>
        !caseInsensitiveCompare(verification.email, args.email)
        && caseInsensitiveCompare(verification.username, args.username),
    );
    if (existingUsername) {
      throw new AppError(409, ErrorCode.USERNAME_ALREADY_EXISTS, "An account with this username already exists.");
    }
  }

  private generateVerificationCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private getFromAddress(): string {
    const gmailUser = process.env.GMAIL_USER?.trim();
    return gmailUser
      ? `"Figuritas Mundial" <${gmailUser}>`
      : "Figuritas Mundial <no-reply@figuritas-mundial.local>";
  }

  private createEmailValidationUrl(id: string): string {
    const configuredBaseUrl = process.env.EMAIL_VALIDATION_BASE_URL!;

    try {
      const parsedUrl = new URL(configuredBaseUrl);
      parsedUrl.pathname = `${parsedUrl.pathname.replace(/\/+$/, "")}/${encodeURIComponent(id)}`;
      return parsedUrl.toString();
    } catch {
      const fallbackBaseUrl = configuredBaseUrl.replace(/\/+$/, "");
      return `${fallbackBaseUrl}/${encodeURIComponent(id)}`;
    }
  }
}
