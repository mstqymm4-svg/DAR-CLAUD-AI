import { apiClient } from "./apiClient";
import type { PaginatedResult } from "./apiClient";

export interface Book {
  id: string;
  title: string;
  authorId?: string;
  authorName?: string;
  categoryId?: string;
  categoryName?: string;
  description?: string;
  coverImage?: string;
  pagesCount?: number;
  language: string;
  pdfUrl?: string;
  isFeatured: boolean;
  rating: number;
  status: "published" | "draft" | "hidden";
  createdAt: string;
  updatedAt: string;
  author?: { id: string; name: string } | null;
  category?: { id: string; name: string } | null;
}

export interface BookQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  authorId?: string;
  status?: string;
  language?: string;
  isFeatured?: boolean;
  sort?: string;
}

export const booksApi = {
  list: (q: BookQuery = {}) => {
    const params = new URLSearchParams();
    Object.entries(q).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") params.append(k, String(v));
    });
    return apiClient.get<PaginatedResult<Book>>(`/books?${params.toString()}`);
  },
  get: (id: string) => apiClient.get<Book>(`/books/${id}`),
  create: (data: Partial<Book>) => apiClient.post<Book>("/books", data),
  update: (id: string, data: Partial<Book>) => apiClient.put<Book>(`/books/${id}`, data),
  remove: (id: string) => apiClient.del<{ ok: boolean }>(`/books/${id}`),
};