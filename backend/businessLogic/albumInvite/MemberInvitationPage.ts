import { buildBrandedEmail } from "@businessLogic/messaging";

export interface MemberInvitationPageArgs {
  albumId: string;
  albumName: string;
  invitedEmail: string;
  invitationId: string;
  appBaseUrl: string;
}

export const buildMemberInvitationEmail = (args: MemberInvitationPageArgs): string => {
  const inviteUrl = `${args.appBaseUrl}/album/${encodeURIComponent(args.albumId)}?invitationId=${encodeURIComponent(args.invitationId)}`;

  return buildBrandedEmail({
    eyebrow: "Album invitation",
    title: "You have an album invite",
    intro: `Hi ${args.invitedEmail}, you have been invited to join ${args.albumName}.`,
    body: "Join the shared album to coordinate duplicates, missing stickers, and group progress.",
    action: {
      label: "Join album",
      url: inviteUrl,
    },
    stats: [
      { label: "Album", value: args.albumName },
      { label: "Expires", value: "7 days" },
    ],
    footerNote: "If you did not expect this invitation, you can safely ignore this email.",
  });
};
