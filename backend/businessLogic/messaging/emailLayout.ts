interface EmailAction {
  label: string;
  url: string;
}

interface EmailStat {
  label: string;
  value: string;
}

interface BrandedEmailArgs {
  title: string;
  eyebrow?: string;
  intro: string;
  body?: string;
  action?: EmailAction;
  stats?: EmailStat[];
  code?: string;
  footerNote?: string;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function buildBrandedEmail(args: BrandedEmailArgs): string {
  const title = escapeHtml(args.title);
  const eyebrow = escapeHtml(args.eyebrow ?? "Official Sticker Collection");
  const intro = escapeHtml(args.intro);
  const body = args.body ? escapeHtml(args.body) : "";
  const footerNote = args.footerNote ? escapeHtml(args.footerNote) : "";

  const actionHtml = args.action
    ? `<table cellpadding="0" cellspacing="0" role="presentation" style="margin:26px 0 22px;">
        <tr>
          <td style="background:#2368c4;border:3px solid #101214;border-radius:8px;box-shadow:5px 5px 0 #101214;">
            <a href="${escapeHtml(args.action.url)}" style="display:inline-block;padding:14px 24px;color:#ffffff;font-size:15px;font-weight:900;text-decoration:none;">${escapeHtml(args.action.label)}</a>
          </td>
        </tr>
      </table>`
    : "";

  const statsHtml = args.stats?.length
    ? `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:20px 0;">
        <tr>
          ${args.stats.map((stat) => `
            <td width="${Math.floor(100 / args.stats!.length)}%" style="padding:0 4px 8px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="background:#b9e461;border:3px solid #101214;border-radius:8px;padding:12px;text-align:center;">
                    <div style="font-size:10px;color:#101214;font-weight:900;text-transform:uppercase;">${escapeHtml(stat.label)}</div>
                    <div style="font-size:16px;color:#101214;font-weight:900;margin-top:4px;">${escapeHtml(stat.value)}</div>
                  </td>
                </tr>
              </table>
            </td>
          `).join("")}
        </tr>
      </table>`
    : "";

  const codeHtml = args.code
    ? `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:22px 0;">
        <tr>
          <td style="background:#f7d719;border:3px solid #101214;border-radius:8px;padding:18px;text-align:center;">
            <div style="font-size:10px;color:#101214;font-weight:900;text-transform:uppercase;margin-bottom:8px;">Verification code</div>
            <div style="font-size:34px;line-height:1;color:#101214;font-weight:900;letter-spacing:0.22em;">${escapeHtml(args.code)}</div>
          </td>
        </tr>
      </table>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f8f7f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f8f7f1;padding:18px 10px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;background:#ffffff;border:3px solid #101214;border-radius:8px;box-shadow:8px 8px 0 rgba(16,18,20,0.18);overflow:hidden;">
          <tr>
            <td style="padding:0;background:#ffffff;border-bottom:3px solid #101214;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td width="28" style="background:#29b7b8;">
                    <table width="28" height="168" cellpadding="0" cellspacing="0" role="presentation">
                      <tr><td style="height:28px;background:#29b7b8;"></td></tr>
                      <tr><td style="height:28px;background:#ff6d00;"></td></tr>
                      <tr><td style="height:28px;background:#b9e461;"></td></tr>
                      <tr><td style="height:28px;background:#475cce;"></td></tr>
                      <tr><td style="height:28px;background:#ee2027;"></td></tr>
                      <tr><td style="height:28px;background:#f7d719;"></td></tr>
                    </table>
                  </td>
                  <td style="padding:22px 18px;">
                    <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                      <tr>
                        <td>
                          <div style="font-size:11px;color:#101214;font-weight:900;text-transform:uppercase;">${eyebrow}</div>
                          <div style="font-size:38px;line-height:0.9;color:#101214;font-weight:900;text-transform:uppercase;margin-top:6px;">Figuritas</div>
                          <div style="font-size:22px;line-height:1;color:#101214;font-weight:900;text-transform:uppercase;">Mundial 2026</div>
                        </td>
                        <td width="76" align="right" valign="middle">
                          <table width="66" height="84" cellpadding="0" cellspacing="0" role="presentation" style="border:3px solid #101214;border-radius:6px;background:#ffffff;">
                            <tr><td style="height:20px;background:#ff6d00;"></td><td style="height:20px;background:#475cce;"></td></tr>
                            <tr><td style="height:20px;background:#b9e461;"></td><td style="height:20px;background:#29b7b8;"></td></tr>
                            <tr><td colspan="2" align="center" style="font-size:24px;line-height:1;color:#101214;font-weight:900;">26</td></tr>
                            <tr><td colspan="2" align="center" style="font-size:10px;color:#101214;font-weight:900;">FIFA</td></tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td width="28" style="background:#ff6d00;">
                    <table width="28" height="168" cellpadding="0" cellspacing="0" role="presentation">
                      <tr><td style="height:28px;background:#b1172d;"></td></tr>
                      <tr><td style="height:28px;background:#f7d719;"></td></tr>
                      <tr><td style="height:28px;background:#475cce;"></td></tr>
                      <tr><td style="height:28px;background:#29b7b8;"></td></tr>
                      <tr><td style="height:28px;background:#ff6d00;"></td></tr>
                      <tr><td style="height:28px;background:#ee2027;"></td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 20px 24px;background:#ffffff;">
              <p style="margin:0 0 12px;color:#101214;font-size:26px;line-height:1.05;font-weight:900;text-transform:uppercase;">${title}</p>
              <p style="margin:0;color:#5a5d63;font-size:15px;line-height:1.6;font-weight:700;">${intro}</p>
              ${body ? `<p style="margin:16px 0 0;color:#5a5d63;font-size:14px;line-height:1.6;font-weight:700;">${body}</p>` : ""}
              ${actionHtml}
              ${codeHtml}
              ${statsHtml}
              ${footerNote ? `<p style="margin:18px 0 0;color:#6c7077;font-size:13px;line-height:1.55;font-weight:700;">${footerNote}</p>` : ""}
            </td>
          </tr>
          <tr>
            <td style="padding:16px 20px;background:#101214;border-top:3px solid #101214;">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="font-size:12px;color:#ffffff;font-weight:800;">© ${new Date().getFullYear()} Figuritas Mundial</td>
                  <td align="right" style="font-size:12px;color:#f7d719;font-weight:900;">FWC 2026</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}
