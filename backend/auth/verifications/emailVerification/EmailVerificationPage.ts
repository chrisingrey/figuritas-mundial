import { buildBrandedEmail } from "@businessLogic/messaging";

export const buildVerificationEmail = (
  username: string,
  code: string,
  validationUrl: string,
  expiresInText: string,
): string =>
  buildBrandedEmail({
    eyebrow: "Email verification",
    title: "Confirm your email address",
    intro: `Hi ${username}, thanks for signing up. Verify your email to activate your Figuritas Mundial account.`,
    body: "Once verified, you can start organizing your album and tracking the figuritas you have and the ones you are missing.",
    action: {
      label: "Verify my email",
      url: validationUrl,
    },
    code,
    stats: [
      { label: "Expires in", value: expiresInText },
      { label: "Account", value: username },
    ],
    footerNote: "If you did not create a Figuritas Mundial account, you can safely ignore this email.",
  });

export const buildEmailVerificationSuccessEmail = (username: string): string =>
  buildBrandedEmail({
    eyebrow: "Account update",
    title: "Your email is verified",
    intro: `Hi ${username}, your Figuritas Mundial email was verified successfully.`,
    body: "You can now continue using your account normally.",
  });
