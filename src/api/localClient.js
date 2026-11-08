/**
 * Local-first client used when Firebase is not configured (offline preview,
 * first run in AI Studio before a Firebase project is attached).
 * Data lives in localStorage; accounts are mock accounts. Same surface as
 * firebaseClient so the rest of the app never needs to know which is active.
 */
// Completely safe local-first auth module for preview environments
const safeAuth = {
  hasToken() {
    try {
      return Boolean(
        localStorage.getItem("base44_access_token") ||
        localStorage.getItem("token") ||
        localStorage.getItem("dau_access_token") ||
        localStorage.getItem("dar_mock_user")
      );
    } catch {
      return false;
    }
  },
  async me() {
    try {
      const storedUser = localStorage.getItem("dar_mock_user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  },
  async register({ email, password }) {
    localStorage.setItem("dau_pending_register", JSON.stringify({ email, password }));
    return { success: true };
  },
  async verifyOtp({ email, otpCode }) {
    const token = "mock_token_" + Date.now();
    localStorage.setItem("base44_access_token", token);
    const user = { id: "user_" + Date.now(), email, role: "user" };
    localStorage.setItem("dar_mock_user", JSON.stringify(user));
    return { access_token: token, is_new_user: true, user };
  },
  async resendOtp(email) {
    return { success: true };
  },
  async loginViaEmailPassword(email, password) {
    const token = "mock_token_" + Date.now();
    localStorage.setItem("base44_access_token", token);
    const user = { id: "user_" + Date.now(), email, role: "admin" };
    localStorage.setItem("dar_mock_user", JSON.stringify(user));
    return { access_token: token, user };
  },
  setToken(token) {
    try {
      if (token) {
        localStorage.setItem("base44_access_token", token);
      } else {
        localStorage.removeItem("base44_access_token");
      }
    } catch {}
  },
  logout(url) {
    try {
      localStorage.removeItem("base44_access_token");
      localStorage.removeItem("token");
      localStorage.removeItem("dau_access_token");
      localStorage.removeItem("dar_mock_user");
    } catch {}
    if (url && typeof window !== "undefined") {
      window.location.href = url;
    }
  },
  redirectToLogin(nextUrl) {
    if (typeof window !== "undefined") {
      const redirectUrl = nextUrl || window.location.href;
      window.location.href = `/login?from_url=${encodeURIComponent(redirectUrl)}`;
    }
  },
  loginWithProvider(provider, fromUrl = "/") {
    const token = "mock_token_" + Date.now();
    localStorage.setItem("base44_access_token", token);
    const user = { id: "google_user_" + Date.now(), email: "user@gmail.com", role: "user" };
    localStorage.setItem("dar_mock_user", JSON.stringify(user));
    if (typeof window !== "undefined") {
      window.location.href = fromUrl;
    }
  },
  async updateMe(data) {
    try {
      const stored = localStorage.getItem("dar_mock_user");
      const user = stored ? JSON.parse(stored) : { id: "user_1", email: "user@gmail.com" };
      const updated = { ...user, ...data };
      localStorage.setItem("dar_mock_user", JSON.stringify(updated));
      return updated;
    } catch {
      return data;
    }
  },
  async resetPasswordRequest() {
    return { success: true };
  },
  async resetPassword() {
    return { success: true };
  }
};

// Safe entities module:
const safeEntities = new Proxy({}, {
  get(target, entityName) {
    if (typeof entityName !== "string" || entityName === "then" || entityName.startsWith("_")) {
      return undefined;
    }
    const storageKey = `dau_entity_${entityName}`;
    return {
      list: async () => {
        try { return JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch { return []; }
      },
      filter: async (q) => {
        try {
          const all = JSON.parse(localStorage.getItem(storageKey) || "[]");
          if (!q) return all;
          return all.filter((item) =>
            Object.entries(q).every(([k, v]) => item[k] === v)
          );
        } catch { return []; }
      },
      get: async (id) => {
        try {
          const all = JSON.parse(localStorage.getItem(storageKey) || "[]");
          return all.find((item) => item.id === id) || null;
        } catch { return null; }
      },
      create: async (data) => {
        try {
          const all = JSON.parse(localStorage.getItem(storageKey) || "[]");
          const record = { id: `${entityName}_${Date.now()}`, ...data, created_date: new Date().toISOString() };
          all.push(record);
          localStorage.setItem(storageKey, JSON.stringify(all));
          return record;
        } catch { return data; }
      },
      update: async (id, data) => {
        try {
          const all = JSON.parse(localStorage.getItem(storageKey) || "[]");
          const idx = all.findIndex((item) => item.id === id);
          if (idx !== -1) {
            all[idx] = { ...all[idx], ...data, updated_date: new Date().toISOString() };
            localStorage.setItem(storageKey, JSON.stringify(all));
            return all[idx];
          }
          return data;
        } catch { return data; }
      },
      delete: async (id) => {
        try {
          const all = JSON.parse(localStorage.getItem(storageKey) || "[]");
          localStorage.setItem(storageKey, JSON.stringify(all.filter((item) => item.id !== id)));
        } catch {}
      },
      count: async () => 0,
      bulkCreate: async (arr) => arr,
      updateMany: async () => ({ modifiedCount: 0 }),
      deleteMany: async () => ({ deletedCount: 0 }),
    };
  },
});

const safeFunctions = {
  invoke: async (fnName, args) => {
    return { success: true };
  },
};

const safeIntegrations = {
  Core: {
    InvokeLLM: async () => ({ text: "بحث ذكي" }),
    UploadPublicFile: async ({ file }) => {
      if (typeof window !== "undefined" && file) {
        return { file_url: URL.createObjectURL(file) };
      }
      return { file_url: "" };
    },
  },
};


export const localClient = {
  auth: safeAuth,
  entities: safeEntities,
  functions: safeFunctions,
  integrations: safeIntegrations,
  analytics: { track: () => {}, cleanup: () => {} },
  appLogs: { log: () => {} },
  users: { inviteUser: async () => ({ success: true }) },
};
