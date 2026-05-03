export interface AuthUser {
  id: string;
  email: string;
  username: string;
  fullname: string;
  surname: string;
  imageUrl?: string;
}

export interface LoginResponse {
  token?: string;
  user?: AuthUser;
  requires2FA: boolean;
  tempToken?: string;
}
