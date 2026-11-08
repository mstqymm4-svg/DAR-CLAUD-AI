import { apiClient } from "./apiClient";
import type { PaginatedResult } from "./apiClient";

export interface SocialChannel {
  id: string;
  name: string;
  channelType: string;
  url: string;
  iconUrl?: string;
  description?: string;
  sortOrder: number;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SocialChannelQuery {
  page?: number;
  limit?: number;
  search?: string;
  visible?: boolean;
  channelType?: string;
}

export const socialChannelsApi = {
  list: (q: SocialChannelQuery = {}) => {
    const params = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") params.append(k, String(v));
    });
    return apiClient.get<PaginatedResult<SocialChannel>>(`/social-channels?${params.toString()}`);
  },
  get: (id: string) => apiClient.get<SocialChannel>(`/social-channels/${id}`),
  create: (data: Partial<SocialChannel>) => apiClient.post<SocialChannel>("/social-channels", data),
  update: (id: string, data: Partial<SocialChannel>) => apiClient.put<SocialChannel>(`/social-channels/${id}`, data),
  remove: (id: string) => apiClient.del<{ ok: boolean }>(`/social-channels/${id}`),
};