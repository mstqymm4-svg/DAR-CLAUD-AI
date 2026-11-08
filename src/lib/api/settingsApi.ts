import { apiClient } from "./apiClient";

export type SettingType = "color" | "font" | "text" | "boolean" | "url" | "json";

export interface AppSetting {
  key: string;
  value?: string;
  type: SettingType;
  description?: string;
}

export type SettingsMap = Record<string, { value?: string; type: SettingType; description?: string }>;

export const settingsApi = {
  all: () => apiClient.get<SettingsMap>("/settings"),
  get: (key: string) => apiClient.get<AppSetting>(`/settings/${key}`),
  upsert: (data: AppSetting) => apiClient.put<AppSetting>("/settings", data),
  remove: (key: string) => apiClient.del<{ ok: boolean }>(`/settings/${key}`),
};