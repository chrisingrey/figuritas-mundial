import axios, { type AxiosInstance } from "axios";

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim();

function createAxiosInstance(): AxiosInstance {
  if (!BASE_URL) {
    throw new Error("Missing VITE_API_URL. Configure it with the backend URL.");
  }

  const instance = axios.create({
    baseURL: BASE_URL,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem("fwc_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  return instance;
}

const axiosInstance = createAxiosInstance();

export class ApiRepository {
  constructor(private readonly baseUri: string) {}

  async get<TResponse>(extraUri = ""): Promise<TResponse> {
    const { data } = await axiosInstance.get<TResponse>(`${this.baseUri}${extraUri}`);
    return data;
  }

  async post<TPayload, TResponse>(payload: TPayload, extraUri = ""): Promise<TResponse> {
    const { data } = await axiosInstance.post<TResponse>(`${this.baseUri}${extraUri}`, payload);
    return data;
  }

  async patch<TPayload, TResponse>(payload: TPayload, extraUri = ""): Promise<TResponse> {
    const { data } = await axiosInstance.patch<TResponse>(`${this.baseUri}${extraUri}`, payload);
    return data;
  }

  async delete(extraUri = ""): Promise<void> {
    await axiosInstance.delete(`${this.baseUri}${extraUri}`);
  }
}
