export const buildVerificationEmail = (
  username: string,
  code: string,
  validationUrl: string,
  expiresInText: string,
): string => {
  const headerLogo = `<div style="font-size:22px;line-height:1.2;font-weight:700;color:#ffffff;">Home<span style="color:#9f9bfb;">Ops</span></div>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Verify your Figuritas Mundial email</title>
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

              <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9ca3af;margin:0 0 16px;">Email verification</p>
              <p style="font-size:22px;font-weight:700;color:#111827;line-height:1.2;margin:0 0 12px;">Confirm your email address</p>
              <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 28px;">Hi ${username}, thanks for signing up! To activate your Figuritas Mundial account and start organizing your album, please verify your email address.</p>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td>
                    <a href="${validationUrl}" style="display:inline-block;background:#6d66f8;color:#ffffff;font-size:14px;font-weight:600;padding:14px 32px;border-radius:10px;text-decoration:none;letter-spacing:0.01em;">Verify my email</a>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td style="border-bottom:1px solid #e5e7eb;width:40%;"></td>
                  <td align="center" style="font-size:11px;color:#9ca3af;padding:0 12px;white-space:nowrap;">or use your verification code</td>
                  <td style="border-bottom:1px solid #e5e7eb;width:40%;"></td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
                <tr>
                  <td style="background:#f4f5f7;border:1px solid #EEEDFE;border-radius:10px;padding:20px;text-align:center;">
                    <div style="font-size:11px;color:#9ca3af;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px;">Verification code</div>
                    <div style="font-size:32px;font-weight:700;color:#1a1740;letter-spacing:0.2em;">${code}</div>
                  </td>
                </tr>
              </table>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td width="48%" style="background:#EEEDFE;border-radius:10px;padding:14px 16px;text-align:center;">
                    <div style="font-size:11px;color:#9f9bfb;letter-spacing:0.04em;text-transform:uppercase;margin-bottom:4px;">Expires in</div>
                    <div style="font-size:16px;font-weight:700;color:#1a1740;">${expiresInText}</div>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="background:#EEEDFE;border-radius:10px;padding:14px 16px;text-align:center;">
                    <div style="font-size:11px;color:#9f9bfb;letter-spacing:0.04em;text-transform:uppercase;margin-bottom:4px;">Account</div>
                    <div style="font-size:13px;font-weight:600;color:#1a1740;">${username}</div>
                  </td>
                </tr>
              </table>

              <p style="font-size:13px;color:#9ca3af;line-height:1.65;margin:0;">If you didn't create a Figuritas Mundial account, you can safely ignore this email. No changes will be made.</p>
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

export const buildEmailVerificationSuccessEmail = (username: string): string => {
  const headerLogo = `<div style="font-size:22px;line-height:1.2;font-weight:700;color:#ffffff;">Home<span style="color:#9f9bfb;">Ops</span></div>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Email verified successfully</title>
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
              <p style="font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9ca3af;margin:0 0 16px;">Account update</p>
              <p style="font-size:22px;font-weight:700;color:#111827;line-height:1.2;margin:0 0 12px;">Your email is now verified</p>
              <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0;">Hi ${username}, your Figuritas Mundial email was verified successfully. You can now continue using your account normally.</p>
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
