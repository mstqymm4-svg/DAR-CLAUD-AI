// Base URL of the backend that serves /api/send-otp and /api/verify-otp.
//
// - In the browser (same origin as the server) leave VITE_API_BASE_URL empty
//   and requests stay relative, e.g. "/api/send-otp".
// - Inside the Android app (Capacitor) the page is served from the device
//   itself, so relative URLs would never reach your server. Set
//   VITE_API_BASE_URL to the full address of your deployed server,
//   e.g. https://your-server.onrender.com (no trailing slash).
const raw = import.meta.env.VITE_API_BASE_URL || "";

export const API_BASE = raw.replace(/\/+$/, "");

export const apiUrl = (path) => `${API_BASE}${path}`;
