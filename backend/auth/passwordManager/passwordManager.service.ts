import bcrypt from "bcryptjs";
import type { IRepository } from "@dataAccess/IRepository";
import { AppError, ErrorCode } from "@errors";
import type { User } from "@auth/users";
import type {
  CreateResetPasswordVerificationArgs,
  IResetPasswordVerificationService,
  VerifyResetPasswordVerificationArgs,
} from "@auth/verifications";
import type { ChangePasswordArgs } from "./ChangePasswordArgs";
import { validateChangePasswordArgs } from "./ChangePasswordArgsValidator";
import type { CreatePasswordArgs } from "./CreatePasswordArgs";
import { validateCreatePasswordArgs } from "./CreatePasswordArgsValidator";
import type { IPasswordManagerService } from "./IPasswordManagerService";

const SALT_ROUNDS = 12;

export class PasswordManagerService implements IPasswordManagerService {
  constructor(
    private readonly userRepository: IRepository<User>,
    private readonly resetPasswordVerificationService: IResetPasswordVerificationService,
  ) {}

  async createPassword(id: string, args: CreatePasswordArgs): Promise<void> {
    const result = validateCreatePasswordArgs(args);
    if (!result.success) {
      throw new AppError(400, ErrorCode.INVALID_PASSWORD_UPDATE, result.errors.join(", "));
    }

    const currentUser = await this.userRepository.getAsync((u) => u.id === id);
    if (currentUser.passwordHash) {
      throw new AppError(409, ErrorCode.PASSWORD_ALREADY_SET, "This account already has a password set.");
    }

    const passwordHash = await bcrypt.hash(
      result.data.newPassword,
      SALT_ROUNDS,
    );
    await this.userRepository.patchByIdAndSaveAsync(currentUser.id, {
      passwordHash,
    });
  }

  async changePassword(id: string, args: ChangePasswordArgs): Promise<void> {
    const result = validateChangePasswordArgs(args);
    if (!result.success) {
      throw new AppError(400, ErrorCode.INVALID_PASSWORD_UPDATE, result.errors.join(", "));
    }

    const currentUser = await this.userRepository.getAsync((u) => u.id === id);
    if (!currentUser.passwordHash) {
      throw new AppError(400, ErrorCode.NO_PASSWORD_SET, "This account does not have a password set.");
    }

    const isCurrentPasswordValid = await bcrypt.compare(
      result.data.currentPassword,
      currentUser.passwordHash,
    );
    if (!isCurrentPasswordValid) {
      throw new AppError(401, ErrorCode.INVALID_CURRENT_PASSWORD, "Current password is incorrect.");
    }

    const passwordHash = await bcrypt.hash(
      result.data.newPassword,
      SALT_ROUNDS,
    );
    await this.userRepository.patchByIdAndSaveAsync(currentUser.id, {
      passwordHash,
    });
  }

  async forgotPassword(args: CreateResetPasswordVerificationArgs): Promise<void> {
    await this.resetPasswordVerificationService.create(args);
  }

  async resetPassword(args: VerifyResetPasswordVerificationArgs): Promise<void> {
    await this.resetPasswordVerificationService.verify(args);
  }
}
