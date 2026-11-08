import { BASE_URL, tokenStore } from "./config";

export interface ApiError extends Error {
  status: number;
  data?: any;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

let refreshing: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  const refresh = tokenStore.refresh;
  if (!refresh) return false;
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) return false;
    const json = await res.json();
    if (!json?.success) return false;
    tokenStore.set(json.data.accessToken, json.data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  const token = tokenStore.access;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });

  if (res.status === 401 && retry) {
    // Single-flight refresh, then replay the original request once.
    refreshing = refreshing || doRefresh();
    const ok = await refreshing;
    refreshing = null;
    if (ok) return request<T>(path, init, false);
    tokenStore.clear();
    const err: ApiError = new Error("Unauthorized") as ApiError;
    err.status = 401;
    throw err;
  }

  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const body = isJson ? await res.json() : null;

  if (!res.ok || body?.success === false) {
    const message = body?.message || res.statusText || "Request failed";
    const err: ApiError = new Error(message) as ApiError;
    err.status = res.status;
    err.data = body;
    throw err;
  }

  return body?.data as T;
}

export const apiClient = {
  get: <T>(path: string, init?: RequestInit) => request<T>(path, { ...init, method: "GET" }),
  post: <T>(path: string, data?: any) =>
    request<T>(path, { method: "POST", body: JSON.stringify(data ?? {}) }),
  put: <T>(path: string, data?: any) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(data ?? {}) }),
  del: <T>(path: string) => request<T>(path, { method: "DELETE" }),

  /** Upload a file (multipart). Bypasses JSON content-type. */
  upload: async <T>(path: string, file: File, kind = "misc"): Promise<T> => {
    const fd = new FormData();
    fd.append("file", file);
    const headers: Record<string, string> = {};
    const token = tokenStore.access;
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${BASE_URL}${path}/${kind}`, {
      method: "POST",
      headers,
      body: fd,
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || body?.success === false) {
      const err: ApiError = new Error(body?.message || "Upload failed") as ApiError;
      err.status = res.status;
      throw err;
    }
    return body.data as T;
  },
};