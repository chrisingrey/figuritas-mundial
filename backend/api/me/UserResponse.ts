import type { User } from "@auth/users";

export interface UserResponse {
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
}

export const mapUserResponse = (user: User): UserResponse => ({
  id: user.id,
  email: user.email,
  username: user.username,
  fullname: user.fullname,
  surname: user.surname,
  dateOfBirth: user.dateOfBirth,
  imageUrl: user.imageUrl,
  firebaseId: user.firebaseId,
  complete: isProfileComplete(user),
  hasPassword: Boolean(user.passwordHash),
});

const isProfileComplete = (user: User): boolean => Boolean(
  user.email &&
  user.username &&
  user.fullname &&
  user.surname &&
  user.dateOfBirth
);
