import { apiClient } from "./apiClient";
import type { PaginatedResult } from "./apiClient";

export interface Author {
  id: string;
  name: string;
  bio?: string;
  image?: string;
}

export const authorsApi = {
  list: (q: { page?: number; limit?: number; search?: string } = {}) => {
    const params = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => v && params.append(k, String(v)));
    return apiClient.get<PaginatedResult<Author>>(`/authors?${params.toString()}`);
  },
  get: (id: string) => apiClient.get<Author>(`/authors/${id}`),
  create: (data: Partial<Author>) => apiClient.post<Author>("/authors", data),
  update: (id: string, data: Partial<Author>) => apiClient.put<Author>(`/authors/${id}`, data),
  remove: (id: string) => apiClient.del<{ ok: boolean }>(`/authors/${id}`),
};