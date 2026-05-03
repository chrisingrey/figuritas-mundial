import { User } from "@auth/users";
import { Session } from "./Session";

export type LoginResult =
  | {
      requires2FA: true;
      tempToken: string;
    }
  | {
      requires2FA: false;
      session: Session;
      user: User;
    };