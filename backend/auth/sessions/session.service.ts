import bcrypt from "bcryptjs";
import type { IRepository } from "@dataAccess/IRepository";
import type { IFirebaseService } from "@auth/firebase";
import type { User } from "@auth/users";
import type { ISessionService } from "./ISessionService";
import type { LoginResult } from "./LoginResult";
import type { CredentialsArgs } from "./CredentialsArgs";
import type { Session } from "./Session";
import { AppError, ErrorCode } from "@errors";
import { caseInsensitiveCompare } from "@utils";
import type { ITwoFactorService } from "@auth/twoFactor";

const DAYS_IN_MS_7 = 7 * 86400 * 1000;

export class SessionService implements ISessionService {
  constructor(
    private readonly userRepository: IRepository<User>,
    private readonly sessionRepository: IRepository<Session>,
    private readonly firebaseService: IFirebaseService,
    private readonly twoFactorService: ITwoFactorService,
  ) {}

  async login(args: CredentialsArgs): Promise<LoginResult> {
    const firebaseIdToken = args.firebaseIdToken ?? args.googleIdToken;
    const user = firebaseIdToken
      ? await this.resolveFirebaseUser(firebaseIdToken)
      : await this.resolvePasswordUser(args);

    if (user.twoFactorEnabled) {
      if (!user.twoFactorSecret) {
        throw new AppError(400, ErrorCode.TWO_FACTOR_SETUP_REQUIRED, "Two-factor authentication is not configured for this account.");
      }

      return {
        requires2FA: true,
        tempToken: this.twoFactorService.createTempToken(user.id),
      };
    }

    const session = await this.createOrUpdateSession(user.id);

    return { requires2FA: false, session, user };
  }

  async getUserBySessionToken(sessionToken: string): Promise<User> {
    const session = await this.sessionRepository.getOrDefaultAsync(
      (s) => s.token === sessionToken,
    );

    const expiresAt = session
      ? session.expiresAt instanceof Date
        ? session.expiresAt
        : new Date(session.expiresAt)
      : null;

    if (!session || !expiresAt || expiresAt.getTime() <= Date.now()) {
      throw new AppError(401, ErrorCode.UNAUTHORIZED, "Authentication required.");
    }

    return this.userRepository.getAsync((u) => u.id === session.userId);
  }

  private async createOrUpdateSession(userId: string): Promise<Session> {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + DAYS_IN_MS_7);
    const existingSession = await this.sessionRepository.getOrDefaultAsync(
      (s) => s.userId === userId,
    );

    return existingSession
      ? this.sessionRepository.patchByIdAndSaveAsync(existingSession.id, {
          token,
          expiresAt,
        })
      : this.sessionRepository.createAndSaveAsync({
          id: crypto.randomUUID(),
          userId,
          token,
          expiresAt,
        });
  }

  private async resolveFirebaseUser(firebaseIdToken: string): Promise<User> {
    const decoded = await this.firebaseService.verifyIdToken(firebaseIdToken);
    const email = decoded.email;
    if (!email) {
      throw new AppError(401, ErrorCode.INVALID_CREDENTIALS, "Invalid credentials.");
    }

    const user = await this.userRepository.getOrDefaultAsync((u) =>
      caseInsensitiveCompare(u.email, email),
    );
    if (!user) {
      throw new AppError(401, ErrorCode.INVALID_CREDENTIALS, "Invalid credentials.");
    }

    return user;
  }

  private async resolvePasswordUser(args: CredentialsArgs): Promise<User> {
    if ((!args.email && !args.username) || !args.password) {
      throw new AppError(401, ErrorCode.INVALID_CREDENTIALS, "Invalid credentials.");
    }

    const user = await this.userRepository.getOrDefaultAsync(
      (u) =>
        (args.email && caseInsensitiveCompare(u.email, args.email!)) ||
        (!!args.username && caseInsensitiveCompare(u.username, args.username!)),
    );
    if (!user) {
      throw new AppError(401, ErrorCode.INVALID_CREDENTIALS, "Invalid credentials.");
    }

    if (!user.passwordHash) {
      throw new AppError(401, ErrorCode.INVALID_CREDENTIALS, "Invalid credentials.");
    }

    const match = await bcrypt.compare(args.password!, user.passwordHash);
    if (!match) {
      throw new AppError(401, ErrorCode.INVALID_CREDENTIALS, "Invalid credentials.");
    }
    return user;
  }
}
