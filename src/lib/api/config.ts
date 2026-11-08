/**
 * Independent API client configuration.
 *
 * Reads VITE_API_URL and an opt-in flag VITE_USE_INDEPENDENT_API.
 * The flag lets the app keep using Base44 in the live preview while the
 * independent backend is being deployed; flip it to "true" once the
 * backend is live to route the frontend through this layer.
 */

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") || "/api";

export const INDEPENDENT_API_ENABLED =
  String(import.meta.env.VITE_USE_INDEPENDENT_API || "false") === "true";

const TOKEN_KEY = "dau_access_token";
const REFRESH_KEY = "dau_refresh_token";

export const tokenStore = {
  get access() {
    try { return localStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; }
  },
  get refresh() {
    try { return localStorage.getItem(REFRESH_KEY) || ""; } catch { return ""; }
  },
  set(access: string, refresh?: string) {
    try {
      localStorage.setItem(TOKEN_KEY, access);
      if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
    } catch {}
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
    } catch {}
  },
};

export { BASE_URL };