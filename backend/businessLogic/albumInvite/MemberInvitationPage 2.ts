export interface MemberInvitationPageArgs {
  albumId: string;
  albumName: string;
  invitedEmail: string;
  invitationId: string;
  appBaseUrl: string;
}

export const buildMemberInvitationEmail = (args: MemberInvitationPageArgs): string => {
  const inviteUrl = `${args.appBaseUrl}/albums/${args.albumId}/invitations/${args.invitationId}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You have been invited to ${args.albumName}</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #fff; border-radius: 8px; padding: 40px; }
    h1 { font-size: 22px; color: #1a1a1a; }
    p { color: #555; line-height: 1.6; }
    .btn { display: inline-block; margin-top: 24px; padding: 14px 28px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; }
    .expiry { margin-top: 24px; font-size: 13px; color: #999; }
  </style>
</head>
<body>
  <div class="container">
    <h1>You have been invited to join <strong>${args.albumName}</strong></h1>
    <p>Hi <strong>${args.invitedEmail}</strong>,</p>
    <p>
      You have been invited to become a member of the album
      <strong>${args.albumName}</strong> on Figuritas Mundial.
    </p>
    <a href="${inviteUrl}" class="btn">Join album</a>
    <p class="expiry">This invitation expires in 7 days. If you did not expect this email, you can safely ignore it.</p>
  </div>
</body>
</html>`;
};
