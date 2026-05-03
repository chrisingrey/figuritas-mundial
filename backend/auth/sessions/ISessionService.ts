import type { CredentialsArgs } from "./CredentialsArgs";
import { LoginResult } from "./LoginResult";
import type { User } from "@auth/users";

export interface ISessionService {
  login(args: CredentialsArgs): Promise<LoginResult>;
  getUserBySessionToken(sessionToken: string): Promise<User>;
}
