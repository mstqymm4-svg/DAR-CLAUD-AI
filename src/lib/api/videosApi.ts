import { apiClient } from "./apiClient";
import type { PaginatedResult } from "./apiClient";

export interface Video {
  id: string;
  title: string;
  description?: string;
  youtubeUrl?: string;
  videoUrl?: string;
  videoType: "normal" | "short" | "live";
  videoChannelId?: string;
  channelName?: string;
  category?: string;
  thumbnail?: string;
  duration?: string;
  isFeatured: boolean;
  visible: boolean;
  sortOrder: number;
}

export interface VideoQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  videoType?: string;
  isFeatured?: boolean;
  visible?: boolean;
  sort?: string;
}

export const videosApi = {
  list: (q: VideoQuery = {}) => {
    const params = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") params.append(k, String(v));
    });
    return apiClient.get<PaginatedResult<Video>>(`/videos?${params.toString()}`);
  },
  get: (id: string) => apiClient.get<Video>(`/videos/${id}`),
  create: (data: Partial<Video>) => apiClient.post<Video>("/videos", data),
  update: (id: string, data: Partial<Video>) => apiClient.put<Video>(`/videos/${id}`, data),
  remove: (id: string) => apiClient.del<{ ok: boolean }>(`/videos/${id}`),
};