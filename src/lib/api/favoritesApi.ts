import { apiClient } from "./apiClient";

export interface FavoriteItem {
  id: string;
  bookId: string;
  createdAt: string;
  book?: any;
}

export const favoritesApi = {
  list: () => apiClient.get<FavoriteItem[]>("/favorites"),
  ids: () => apiClient.get<string[]>("/favorites/ids"),
  add: (bookId: string) => apiClient.post<FavoriteItem>(`/favorites/${bookId}`),
  remove: (bookId: string) => apiClient.del<{ ok: boolean }>(`/favorites/${bookId}`),
};