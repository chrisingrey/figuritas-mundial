import type { User } from "@auth/users";

export interface AuthUserResponse {
  id: string;
  email: string;
  username: string;
  fullname: string;
  surname: string;
  dateOfBirth: string;
  imageUrl?: string;
  firebaseId?: string;
  complete: boolean;
  hasPassword: boolean;
  twoFactorEnabled: boolean;
}

export const mapAuthUserResponse = (user: User): AuthUserResponse => ({
  id: user.id,
  email: user.email,
  username: user.username,
  fullname: user.fullname,
  surname: user.surname,
  dateOfBirth: user.dateOfBirth,
  imageUrl: user.imageUrl,
  firebaseId: user.firebaseId,
  complete: isProfileComplete(user),
  hasPassword: !!user.passwordHash,
  twoFactorEnabled: !!user.twoFactorEnabled,
});

const isProfileComplete = (user: User): boolean => {
  return Boolean(
    user.email &&
    user.username &&
    user.fullname &&
    user.surname &&
    user.dateOfBirth
  );
};
