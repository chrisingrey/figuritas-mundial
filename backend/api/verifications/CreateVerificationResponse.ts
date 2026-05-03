import type { PendingEmailVerification } from "@auth/verifications";

export interface CreateVerificationResponse {
  emailValidationId: string;
}

export const mapCreateVerificationResponse = (
  verification: PendingEmailVerification,
): CreateVerificationResponse => ({
  emailValidationId: verification.id,
});