export interface RegisterResponse {
  message: string;
  requiresEmailVerification: boolean;
}

export const mapRegisterResponse = (
  requiresEmailVerification = false,
): RegisterResponse => {
  if (requiresEmailVerification) {
    return {
      message: "Verification email sent. Please verify your email to complete account creation.",
      requiresEmailVerification: true,
    };
  }

  return {
    message: "Account created successfully.",
    requiresEmailVerification: false,
  };
};
