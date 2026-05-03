import axios from "axios";
import { ApiRepository } from "../api-repository";
import type { LoginRequest, LoginResponse, RegisterRequest, MeResponse } from "./models";

const BASE_URI = "/api/auth";
const api = new ApiRepository(BASE_URI);
const meApi = new ApiRepository("/api/me");

type FirebaseTokenPayload = {
  firebaseIdToken: string;
  googleIdToken: string;
};

function isAxiosUnauthorized(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 401;
}

function isAxiosNotFound(err: unknown): boolean {
  return axios.isAxiosError(err) && err.response?.status === 404;
}

function createFirebaseTokenPayload(firebaseIdToken: string): FirebaseTokenPayload {
  return {
    firebaseIdToken,
    googleIdToken: firebaseIdToken,
  };
}

export const authService = {
  async login(request: LoginRequest): Promise<LoginResponse> {
    const response = await api.post<LoginRequest, LoginResponse>(request, "/login");
    if (response.token) {
      localStorage.setItem("fwc_token", response.token);
    }
    return response;
  },

  async register(request: RegisterRequest): Promise<void> {
    await api.post<RegisterRequest, void>(request, "/register");
  },

  async loginWithFirebaseToken(firebaseIdToken: string): Promise<LoginResponse> {
    let response: LoginResponse;
    const payload = createFirebaseTokenPayload(firebaseIdToken);

    try {
      response = await api.post<FirebaseTokenPayload, LoginResponse>(payload, "/login");
    } catch (err) {
      if (!isAxiosUnauthorized(err) && !isAxiosNotFound(err)) throw err;
      await api.post<FirebaseTokenPayload, void>(payload, "/register");
      response = await api.post<FirebaseTokenPayload, LoginResponse>(payload, "/login");
    }

    if (response.token) {
      localStorage.setItem("fwc_token", response.token);
    }
    return response;
  },

  async loginWithGoogle(firebaseIdToken: string): Promise<LoginResponse> {
    return this.loginWithFirebaseToken(firebaseIdToken);
  },

  async me(): Promise<MeResponse> {
    return meApi.get<MeResponse>();
  },

  logout(): void {
    localStorage.removeItem("fwc_token");
  },

  isAuthenticated(): boolean {
    return Boolean(localStorage.getItem("fwc_token"));
  },
};
