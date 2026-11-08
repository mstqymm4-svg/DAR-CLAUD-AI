import { apiClient } from "./apiClient";
import { tokenStore } from "./config";

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string;
  role: "USER" | "ADMIN" | "SUPER_ADMIN";
  isActive: boolean;
  preferredLanguage: string;
  notificationsEnabled: boolean;
}

export interface AuthResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export const authApi = {
  async register(email: string, password: string, fullName?: string): Promise<AuthResult> {
    const data = await apiClient.post<AuthResult>("/auth/register", { email, password, fullName });
    tokenStore.set(data.accessToken, data.refreshToken);
    return data;
  },

  async login(email: string, password: string): Promise<AuthResult> {
    const data = await apiClient.post<AuthResult>("/auth/login", { email, password });
    tokenStore.set(data.accessToken, data.refreshToken);
    return data;
  },

  async refresh(): Promise<AuthResult> {
    const data = await apiClient.post<AuthResult>("/auth/refresh", { refreshToken: tokenStore.refresh });
    tokenStore.set(data.accessToken, data.refreshToken);
    return data;
  },

  async logout(): Promise<void> {
    try { await apiClient.post("/auth/logout", { refreshToken: tokenStore.refresh }); }
    finally { tokenStore.clear(); }
  },

  async me(): Promise<AuthUser> {
    return apiClient.get<AuthUser>("/auth/me");
  },
};