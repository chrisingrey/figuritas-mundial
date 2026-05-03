import { buildBrandedEmail } from "@businessLogic/messaging";

export const buildResetPasswordEmail = (
  username: string,
  resetUrl: string,
  expiresInText: string,
): string =>
  buildBrandedEmail({
    eyebrow: "Security · Figuritas Mundial",
    title: "Reset your password",
    intro: `Hi ${username}, we received a request to reset your Figuritas Mundial password.`,
    body: "Use the button below to choose a new password and get back to your album.",
    action: {
      label: "Reset password",
      url: resetUrl,
    },
    stats: [
      { label: "Expires in", value: expiresInText },
      { label: "Account", value: username },
    ],
    footerNote: `If you did not request this reset, you can ignore this email. If the button does not work, copy this URL into your browser: ${resetUrl}`,
  });

export const buildResetPasswordSuccessEmail = (username: string): string =>
  buildBrandedEmail({
    eyebrow: "Security notice",
    title: "Your password was updated",
    intro: `Hi ${username}, your Figuritas Mundial password was changed successfully.`,
    body: "If this was not you, reset your password again immediately and contact support.",
  });
