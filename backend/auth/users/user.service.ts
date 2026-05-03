import bcrypt from "bcryptjs";
import type { IRepository } from "@dataAccess/IRepository";
import type { IFirebaseService } from "@auth/firebase";
import type { User } from "./User";
import type { IUserService } from "./IUserService";
import { AppError, ErrorCode } from "@errors";
import { caseInsensitiveCompare } from "@utils";
import { RegisterArgs } from "./RegisterArgs";
import { validateRegisterArgs } from "./RegisterArgsValidator";
import type { UpdateUserProfileArgs } from "./UpdateUserProfileArgs";
import { validateUpdateUserProfileArgs } from "./UpdateUserProfileArgsValidator";
import type { PendingEmailVerification } from "@auth/verifications";
import {
  NotificationActionType,
  NotificationTargetPages,
  type INotificationService,
} from "@businessLogic/notifications";

const SALT_ROUNDS = 12;

export class UserService implements IUserService {
  constructor(
    private readonly userRepository: IRepository<User>,
    private readonly pendingUserVerificationRepository: IRepository<PendingEmailVerification>,
    private readonly firebaseService: IFirebaseService,
    private readonly notificationService?: INotificationService,
  ) {}

  async register(args: RegisterArgs): Promise<void> {
    const firebaseIdToken = args.firebaseIdToken ?? args.googleIdToken;
    args = firebaseIdToken
      ? await this.obtainFromFirebase(firebaseIdToken)
      : args;

    if (firebaseIdToken) {
      const existingUser = await this.userRepository.getOrDefaultAsync((u) =>
        (!!args.firebaseId && u.firebaseId === args.firebaseId) ||
        (!!args.email && caseInsensitiveCompare(u.email, args.email)),
      );

      if (existingUser) {
        const patch: Partial<Omit<User, "id">> = {};
        if (!existingUser.firebaseId && args.firebaseId) patch.firebaseId = args.firebaseId;
        if (!existingUser.imageUrl && args.imageUrl) patch.imageUrl = args.imageUrl;

        if (Object.keys(patch).length > 0) {
          await this.userRepository.patchByIdAndSaveAsync(existingUser.id, patch);
        }
        return;
      }
    }

    await this.assertCreateUser(args);

    const passwordHash = firebaseIdToken
      ? ""
      : await bcrypt.hash(args.password!, SALT_ROUNDS);

    const createdUserId = crypto.randomUUID();

    const createdUser = await this.userRepository.createAndSaveAsync({
      id: createdUserId,
      email: args.email,
      username: args.username,
      fullname: args.fullname,
      surname: args.surname,
      dateOfBirth: args.dateOfBirth,
      imageUrl: args.imageUrl ?? "",
      passwordHash,
      firebaseId: args.firebaseId,
      twoFactorEnabled: false,
    });

    const persistedUserId =
      typeof createdUser?.id === "string" && createdUser.id.length > 0
        ? createdUser.id
        : createdUserId;

    if (firebaseIdToken) {
      await this.createGoogleOnboardingNotifications(persistedUserId);
      return;
    }

    await this.createTwoFactorOnboardingNotification(persistedUserId);
  }

  private async createGoogleOnboardingNotifications(userId: string): Promise<void> {
    if (!this.notificationService) return;

    await this.notificationService.createNotification({
      title: "Completa tu perfil",
      description: "Agrega la informacion faltante de tu perfil para mejorar tu experiencia.",
      targetUserId: userId,
      action: {
        type: NotificationActionType.TAKE_ME_THERE,
        targetPage: NotificationTargetPages.PROFILE,
        metadata: {
          section: "profile",
        },
      },
    });

    await this.createTwoFactorOnboardingNotification(userId);
  }

  private async createTwoFactorOnboardingNotification(userId: string): Promise<void> {
    if (!this.notificationService) return;

    await this.notificationService.createNotification({
      title: "Activa la autenticacion en dos pasos",
      description: "Configura 2FA para proteger mejor tu cuenta.",
      targetUserId: userId,
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

  private async assertCreateUser(args: RegisterArgs): Promise<void> {
    const result = args.firebaseIdToken || args.googleIdToken
      ? { success: true, errors: [] }
      : validateRegisterArgs(args);
    if (!result.success) {
      throw new AppError(400, ErrorCode.INVALID_REGISTRATION_DATA, result.errors.join(", "));
    }

    const existingUser = await this.userRepository.getOrDefaultAsync(
      (u) =>
        (!!args.email && caseInsensitiveCompare(u.email, args.email)) ||
        (!!args.username && caseInsensitiveCompare(u.username, args.username)),
    );
    if (existingUser) {
      throw new AppError(409, args.email && caseInsensitiveCompare(args.email, existingUser.email) ? ErrorCode.EMAIL_ALREADY_EXISTS : ErrorCode.USERNAME_ALREADY_EXISTS, args.email && caseInsensitiveCompare(args.email, existingUser.email) ? "An account with this email already exists." : "An account with this username already exists.");
    }

    const existingPendingVerification =
      await this.pendingUserVerificationRepository.getOrDefaultAsync(
        (p) =>
          (!!args.email && caseInsensitiveCompare(p.email, args.email)) ||
          (!!args.username &&
            caseInsensitiveCompare(p.username, args.username)),
      );
    if (existingPendingVerification) {
      throw new AppError(409, args.email && caseInsensitiveCompare(args.email, existingPendingVerification.email) ? ErrorCode.EMAIL_ALREADY_EXISTS : ErrorCode.USERNAME_ALREADY_EXISTS, args.email && caseInsensitiveCompare(args.email, existingPendingVerification.email) ? "An account with this email already exists." : "An account with this username already exists.");
    }
  }

  private async obtainFromFirebase(firebaseIdToken: string): Promise<RegisterArgs> {
    const decoded = await this.firebaseService.verifyIdToken(firebaseIdToken);
    const email = decoded.email;
    if (!email) {
      throw new AppError(401, ErrorCode.INVALID_CREDENTIALS, "Invalid credentials.");
    }
    const name = decoded.name || "";
    const [fullname, ...surnameParts] = name.split(" ");
    const surname = surnameParts.join(" ");

    return {
      firebaseIdToken,
      firebaseId: decoded.uid,
      email,
      username: buildFirebaseUsername(decoded.uid),
      fullname: fullname || email.split("@")[0],
      surname,
      dateOfBirth: "",
      imageUrl: decoded.picture ?? "",
    };
  }

  async updateUserProfile(
    id: string,
    args: UpdateUserProfileArgs,
  ): Promise<User> {
    await this.assertUpdateUserProfile(id, args);

    const patch: Partial<Omit<User, "id">> = {};
    if (args.username !== undefined) patch.username = args.username;
    if (args.fullname !== undefined) patch.fullname = args.fullname;
    if (args.surname !== undefined) patch.surname = args.surname;
    if (args.dateOfBirth !== undefined) patch.dateOfBirth = args.dateOfBirth;
    if (args.imageUrl !== undefined) patch.imageUrl = args.imageUrl;

    return this.userRepository.patchByIdAndSaveAsync(id, patch);
  }

  private async assertUpdateUserProfile(
    id: string,
    args: UpdateUserProfileArgs,
  ): Promise<void> {
    const result = validateUpdateUserProfileArgs(args);

    if (!result.success) {
      throw new AppError(400, ErrorCode.INVALID_PROFILE_UPDATE, result.errors.join(", "));
    }

    if (Object.keys(args).length === 0) {
      throw new AppError(400, ErrorCode.EMPTY_PROFILE_UPDATE, "At least one field is required for profile update.");
    }

    if (args.username) {
      const duplicatedUsername = await this.userRepository.existsAsync(
        (u) =>
          u.id !== id &&
          caseInsensitiveCompare(u.username, args.username!),
      );
      if (duplicatedUsername) {
        throw new AppError(409, ErrorCode.USERNAME_ALREADY_EXISTS, "An account with this username already exists.");
      }
    }
  }
}

function buildFirebaseUsername(firebaseUid: string): string {
  return `google-${firebaseUid.slice(0, 16)}`;
}
