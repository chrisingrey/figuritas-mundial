import type { CreateResetPasswordVerificationArgs, VerifyResetPasswordVerificationArgs } from "@auth/verifications";
import type { ChangePasswordArgs } from "./ChangePasswordArgs";
import type { CreatePasswordArgs } from "./CreatePasswordArgs";

export interface IPasswordManagerService {
  createPassword(id: string, args: CreatePasswordArgs): Promise<void>;
  changePassword(id: string, args: ChangePasswordArgs): Promise<void>;
  forgotPassword(args: CreateResetPasswordVerificationArgs): Promise<void>;
  resetPassword(args: VerifyResetPasswordVerificationArgs): Promise<void>;
}
