import { apiClient } from "./apiClient";
import type { PaginatedResult } from "./apiClient";

export interface VideoChannel {
  id: string;
  name: string;
  channelLogo?: string;
  description?: string;
  youtubeUrl?: string;
  category?: string;
  sortOrder: number;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VideoChannelQuery {
  page?: number;
  limit?: number;
  search?: string;
  visible?: boolean;
  category?: string;
}

export const videoChannelsApi = {
  list: (q: VideoChannelQuery = {}) => {
    const params = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") params.append(k, String(v));
    });
    return apiClient.get<PaginatedResult<VideoChannel>>(`/video-channels?${params.toString()}`);
  },
  get: (id: string) => apiClient.get<VideoChannel>(`/video-channels/${id}`),
  create: (data: Partial<VideoChannel>) => apiClient.post<VideoChannel>("/video-channels", data),
  update: (id: string, data: Partial<VideoChannel>) => apiClient.put<VideoChannel>(`/video-channels/${id}`, data),
  remove: (id: string) => apiClient.del<{ ok: boolean }>(`/video-channels/${id}`),
};