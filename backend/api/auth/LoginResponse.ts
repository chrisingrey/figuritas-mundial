import type { LoginResult } from "@auth/sessions";
import { mapAuthUserResponse, type AuthUserResponse } from "./AuthUserResponse";

export interface LoginResponse {
  token?: string;
  user?: AuthUserResponse;
  requires2FA: boolean;
  tempToken?: string;
}

export const mapLoginResponse = (result: LoginResult): LoginResponse => {
  if (result.requires2FA) {
    return {
      requires2FA: true,
      tempToken: result.tempToken,
    };
  }

  return {
    requires2FA: false,
    token: result.session.token,
    user: mapAuthUserResponse(result.user),
  };
};