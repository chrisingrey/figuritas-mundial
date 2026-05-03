export const buildResetPasswordEmail = (
  username: string,
  resetUrl: string,
  expiresInText: string,
): string => {
  const headerLogo = `<div style="font-size:22px;line-height:1.2;font-weight:700;color:#ffffff;">Home<span style="color:#9f9bfb;">Ops</span></div>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reset your Figuritas Mundial password</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 24px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
          <tr>
            <td style="background:#111827;padding:28px 40px;">
              ${headerLogo}
            </td>
          </tr>

          <tr>
            <td style="padding:36px 40px 28px;">
              <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9ca3af;margin:0 0 16px;">Password reset</p>
              <p style="font-size:22px;font-weight:700;color:#111827;line-height:1.2;margin:0 0 12px;">Reset your password</p>
              <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 28px;">Hi ${username}, we received a request to reset your Figuritas Mundial password. Use the button below to continue.</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td>
                    <a href="${resetUrl}" style="display:inline-block;background:#6d66f8;color:#ffffff;font-size:14px;font-weight:600;padding:14px 32px;border-radius:10px;text-decoration:none;letter-spacing:0.01em;">Reset password</a>
                  </td>
                </tr>
              </table>

              <p style="font-size:13px;color:#9ca3af;line-height:1.65;margin:0 0 16px;">This link expires in ${expiresInText}. If you did not request this reset, you can ignore this email.</p>
              <p style="font-size:12px;color:#9ca3af;line-height:1.65;margin:0;">If the button does not work, copy and paste this URL into your browser:</p>
              <p style="font-size:12px;word-break:break-all;color:#4f46e5;line-height:1.55;margin:8px 0 0;">${resetUrl}</p>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 40px;background:#f4f5f7;border-top:1px solid #e5e7eb;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Figuritas Mundial</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};

export const buildResetPasswordSuccessEmail = (username: string): string => {
  const headerLogo = `<div style="font-size:22px;line-height:1.2;font-weight:700;color:#ffffff;">Home<span style="color:#9f9bfb;">Ops</span></div>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Password updated successfully</title>
</head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 24px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);overflow:hidden;">
          <tr>
            <td style="background:#111827;padding:28px 40px;">
              ${headerLogo}
            </td>
          </tr>

          <tr>
            <td style="padding:36px 40px 28px;">
              <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9ca3af;margin:0 0 16px;">Security notice</p>
              <p style="font-size:22px;font-weight:700;color:#111827;line-height:1.2;margin:0 0 12px;">Your password was updated</p>
              <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0;">Hi ${username}, your Figuritas Mundial password was changed successfully. If this was not you, please reset your password again immediately and contact support.</p>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 40px;background:#f4f5f7;border-top:1px solid #e5e7eb;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="font-size:12px;color:#9ca3af;">© ${new Date().getFullYear()} Figuritas Mundial</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
};
