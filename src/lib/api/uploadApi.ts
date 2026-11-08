import { apiClient } from "./apiClient";

export interface UploadResult {
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  mediaId: string | null;
}

export const uploadApi = {
  upload: (file: File, kind: "covers" | "pdfs" | "videos" | "avatars" | "misc" = "misc") =>
    apiClient.upload<UploadResult>("/uploads", file, kind),
  remove: (mediaId: string) => apiClient.del<{ ok: boolean }>(`/uploads/${mediaId}`),
};