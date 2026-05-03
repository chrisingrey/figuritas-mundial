import type { RegisterArgs } from "@auth/users";
import type { IVerificationService } from "@auth/verifications/IVerificationService";
import type { PendingEmailVerification } from "./PendingEmailVerification";
import type { VerifyEmailVerificationArgs } from "./VerifyEmailVerificationArgs";

export type IEmailVerificationService =
  IVerificationService<RegisterArgs, VerifyEmailVerificationArgs, PendingEmailVerification>;
