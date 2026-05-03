import { RegisterArgs } from "./RegisterArgs";
import type { User } from "./User";
import type { UpdateUserProfileArgs } from "./UpdateUserProfileArgs";

export interface IUserService {
  register(args: RegisterArgs): Promise<void>;
  getByEmail(email: string): Promise<User | null>;
  updateUserProfile(id: string, args: UpdateUserProfileArgs): Promise<User>;
}
