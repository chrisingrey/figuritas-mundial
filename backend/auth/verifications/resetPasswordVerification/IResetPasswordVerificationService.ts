import type { IVerificationService } from "@auth/verifications/IVerificationService";
import type { CreateResetPasswordVerificationArgs } from "./CreateResetPasswordVerificationArgs";
import type { VerifyResetPasswordVerificationArgs } from "./VerifyResetPasswordVerificationArgs";

export type IResetPasswordVerificationService =
  IVerificationService<CreateResetPasswordVerificationArgs, VerifyResetPasswordVerificationArgs>;
