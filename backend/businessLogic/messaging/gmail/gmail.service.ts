import nodemailer from "nodemailer";
import { AppError, ErrorCode } from "@errors";
import type { Email } from "./Email";
import { IMessagingService } from "../IMessagingService";


export class GmailService implements IMessagingService<Email> {
  private readonly transporter: nodemailer.Transporter;

  constructor(
    private readonly gmailUser: string,
    private readonly gmailAppPassword: string,
  ) {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailAppPassword,
      },
    });
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch {
      throw new AppError(
        500,
        ErrorCode.EMAIL_DELIVERY_FAILED,
        "Messaging service connection failed.",
      );
    }
  }

  async send(entity: Email): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: entity.from,
        to: entity.to,
        subject: entity.subject,
        html: entity.html,
      });
    } catch {
      throw new AppError(
        500,
        ErrorCode.EMAIL_DELIVERY_FAILED,
        `Unable to send validation email`,
      );
    }
  }
}

export async function connectMessagingService(): Promise<GmailService> {
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.trim();

  if (!gmailUser || !gmailAppPassword) {
    throw new AppError(500, ErrorCode.EMAIL_DELIVERY_FAILED, "Messaging service is not configured. Missing GMAIL_USER or GMAIL_APP_PASSWORD.");
  }

  const messagingService = new GmailService(gmailUser, gmailAppPassword);
  await messagingService.verifyConnection();
  console.log("✅ Connected to Gmail messaging service");
  return messagingService;
}