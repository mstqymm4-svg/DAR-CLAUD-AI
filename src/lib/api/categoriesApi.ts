import { apiClient } from "./apiClient";
import type { PaginatedResult } from "./apiClient";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sortOrder: number;
}

export const categoriesApi = {
  list: (q: { page?: number; limit?: number; search?: string } = {}) => {
    const params = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => v && params.append(k, String(v)));
    return apiClient.get<PaginatedResult<Category>>(`/categories?${params.toString()}`);
  },
  get: (id: string) => apiClient.get<Category>(`/categories/${id}`),
  create: (data: Partial<Category>) => apiClient.post<Category>("/categories", data),
  update: (id: string, data: Partial<Category>) => apiClient.put<Category>(`/categories/${id}`, data),
  remove: (id: string) => apiClient.del<{ ok: boolean }>(`/categories/${id}`),
};