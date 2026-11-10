/**
 * Drop-in replacement for the old Base44 SDK client.
 *
 * Exposes the same surface the app already uses —
 *   base44.auth.*, base44.entities.<Name>.list/filter/get/create/update/delete,
 *   base44.functions.invoke, base44.integrations.Core.*, base44.users.inviteUser
 * — backed by Firebase Auth + Firestore + Storage. When Firebase is not
 * configured it falls back to ./localClient (localStorage).
 *
 * Firestore layout: one collection per entity (collection name = entity name,
 * `users` for User). Every record carries created_date, updated_date,
 * created_by_id and created_by, exactly like Base44 records did.
 */
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  sendEmailVerification, sendPasswordResetEmail, confirmPasswordReset,
  GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  onAuthStateChanged, updateProfile, deleteUser,
} from "firebase/auth";
import {
  collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc, query, where, serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { isFirebaseConfigured, auth, db, storage } from "@/lib/firebase";
import { localClient } from "./localClient";
import { apiUrl, API_BASE } from "@/lib/apiBase";

export const hasBackend = isFirebaseConfigured;

// ── helpers ──────────────────────────────────────────────────────────────────
const nowIso = () => new Date().toISOString();
const OWNED = new Set(["Favorite", "AccountData"]); // per-user collections
const colName = (entity) => (entity === "User" ? "users" : entity);

const authReady = () =>
  new Promise((resolve) => {
    const off = onAuthStateChanged(auth, (u) => { off(); resolve(u); });
  });

const fromSnap = (s) => ({ id: s.id, ...s.data() });

function sortAndLimit(rows, sort, limit) {
  let out = rows;
  if (typeof sort === "string" && sort) {
    const desc = sort.startsWith("-");
    const key = desc ? sort.slice(1) : sort;
    out = [...rows].sort((a, b) => {
      const av = a[key], bv = b[key];
      if (av === bv) return 0;
      if (av === undefined || av === null) return 1;
      if (bv === undefined || bv === null) return -1;
      return (av > bv ? 1 : -1) * (desc ? -1 : 1);
    });
  }
  return typeof limit === "number" ? out.slice(0, limit) : out;
}

const matches = (row, q) =>
  !q || Object.entries(q).every(([k, v]) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      if ("$in" in v) return v.$in.includes(row[k]);
      if ("$ne" in v) return row[k] !== v.$ne;
      return true;
    }
    return row[k] === v;
  });

async function currentUid() {
  const u = auth.currentUser || (await authReady());
  return u?.uid || null;
}

async function fetchAll(entity) {
  const c = collection(db, colName(entity));
  if (OWNED.has(entity)) {
    const uid = await currentUid();
    if (!uid) return [];
    return (await getDocs(query(c, where("created_by_id", "==", uid)))).docs.map(fromSnap);
  }
  return (await getDocs(c)).docs.map(fromSnap);
}

function entityApi(entity) {
  return {
    list: async (sort, limit) => sortAndLimit(await fetchAll(entity), sort, limit),
    filter: async (q, sort, limit) => sortAndLimit((await fetchAll(entity)).filter((r) => matches(r, q)), sort, limit),
    get: async (id) => {
      const s = await getDoc(doc(db, colName(entity), String(id)));
      return s.exists() ? fromSnap(s) : null;
    },
    create: async (data) => {
      const u = auth.currentUser || (await authReady());
      const rec = {
        ...data,
        created_date: nowIso(),
        updated_date: nowIso(),
        created_by_id: u?.uid || null,
        created_by: u?.email || null,
      };
      const id = data?.id ? String(data.id) : null;
      if (id) { await setDoc(doc(db, colName(entity), id), rec); return { id, ...rec }; }
      const r = await addDoc(collection(db, colName(entity)), rec);
      return { id: r.id, ...rec };
    },
    update: async (id, data) => {
      const patch = { ...data, updated_date: nowIso() };
      delete patch.id;
      await updateDoc(doc(db, colName(entity), String(id)), patch);
      return { id, ...patch };
    },
    delete: async (id) => { await deleteDoc(doc(db, colName(entity), String(id))); },
    bulkCreate: async (arr) => Promise.all(arr.map((d) => entityApi(entity).create(d))),
    count: async () => (await fetchAll(entity)).length,
  };
}

const entities = new Proxy({}, {
  get(_t, name) {
    if (typeof name !== "string" || name === "then" || name.startsWith("_")) return undefined;
    return entityApi(name);
  },
});

// ── users / auth ─────────────────────────────────────────────────────────────
const BOOTSTRAP_ADMIN_EMAIL = "mstqymm4@gmail.com";

async function ensureUserDoc(fbUser, extra = {}) {
  const r = doc(db, "users", fbUser.uid);
  const s = await getDoc(r);
  const isAdminEmail = fbUser.email && fbUser.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
  if (s.exists()) {
    const data = fromSnap(s);
    if (isAdminEmail && data.role !== "admin") {
      try {
        await updateDoc(r, { role: "admin", updated_date: nowIso() });
        data.role = "admin";
      } catch { /* offline or permission error: continue */ }
    }
    return data;
  }
  const rec = {
    email: fbUser.email,
    full_name: fbUser.displayName || (fbUser.email || "").split("@")[0],
    role: "user",
    created_date: nowIso(),
    updated_date: nowIso(),
    ...extra,
  };
  await setDoc(r, rec);
  if (isAdminEmail) {
    try {
      await updateDoc(r, { role: "admin", updated_date: nowIso() });
      rec.role = "admin";
    } catch { /* offline or permission error: continue */ }
  }
  return { id: fbUser.uid, ...rec };
}

const toAppUser = async (fbUser) => {
  if (!fbUser) return null;
  let profile = {};
  try { profile = await ensureUserDoc(fbUser); } catch { /* offline: fall through */ }
  const isAdminEmail = fbUser.email && fbUser.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
  return {
    ...profile,
    id: fbUser.uid,
    email: fbUser.email,
    full_name: profile.full_name || fbUser.displayName || "",
    role: isAdminEmail ? "admin" : (profile.role || "user"),
    email_verified: fbUser.emailVerified,
    photo_url: fbUser.photoURL || profile.photo_url || null,
  };
};

const friendly = (e) => {
  const map = {
    "auth/invalid-credential": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
    "auth/wrong-password": "كلمة المرور غير صحيحة",
    "auth/user-not-found": "لا يوجد حساب بهذا البريد",
    "auth/email-already-in-use": "هذا البريد مسجّل مسبقاً",
    "auth/weak-password": "كلمة المرور ضعيفة (6 أحرف على الأقل)",
    "auth/invalid-email": "صيغة البريد الإلكتروني غير صحيحة",
    "auth/too-many-requests": "محاولات كثيرة، حاول لاحقاً",
    "auth/network-request-failed": "تعذر الاتصال بالشبكة",
    "auth/expired-action-code": "انتهت صلاحية الرابط",
    "auth/invalid-action-code": "الرابط غير صالح أو مستخدم مسبقاً",
  };
  const err = new Error(map[e?.code] || e?.message || "حدث خطأ غير متوقع");
  err.code = e?.code;
  return err;
};
const wrap = (fn) => async (...a) => { try { return await fn(...a); } catch (e) { throw friendly(e); } };

const redirectTo = (url) => { if (url && typeof window !== "undefined") window.location.href = url; };

const fbAuth = {
  hasToken: () => Boolean(auth.currentUser),
  isAuthenticated: async () => Boolean(auth.currentUser || (await authReady())),
  me: async () => toAppUser(auth.currentUser || (await authReady())),
  setToken: () => {}, // Firebase manages its own session
  register: wrap(async ({ email, password }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await ensureUserDoc(cred.user);
    await sendEmailVerification(cred.user);
    return { success: true };
  }),
  // If a real OTP server is configured (VITE_API_BASE_URL) use it; otherwise
  // confirm Firebase's own email-verification link was clicked.
  verifyOtp: wrap(async ({ email, otpCode }) => {
    if (API_BASE) {
      const r = await fetch(apiUrl("/api/verify-otp"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.success) throw new Error(j.error || "رمز التحقق غير صحيح");
    } else if (auth.currentUser) {
      await auth.currentUser.reload();
      if (!auth.currentUser.emailVerified) {
        throw new Error("افتح رابط التفعيل المرسل إلى بريدك ثم اضغط تحقق مرة أخرى");
      }
    }
    const user = await toAppUser(auth.currentUser);
    return { access_token: null, is_new_user: true, user };
  }),
  resendOtp: wrap(async (email) => {
    if (API_BASE) {
      await fetch(apiUrl("/api/send-otp"), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } else if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
    return { success: true };
  }),
  loginViaEmailPassword: wrap(async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return { access_token: null, user: await toAppUser(cred.user) };
  }),
  loginWithProvider: async (_provider, fromUrl = "/") => {
    const p = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, p);
      redirectTo(fromUrl);
    } catch (e) {
      if (e?.code === "auth/popup-blocked" || e?.code === "auth/operation-not-supported-in-this-environment") {
        sessionStorage.setItem("dau_after_login", fromUrl);
        return signInWithRedirect(auth, p);
      }
      if (e?.code !== "auth/popup-closed-by-user") throw friendly(e);
    }
  },
  logout: async (url) => {
    try { await signOut(auth); } catch { /* ignore */ }
    redirectTo(url);
  },
  redirectToLogin: (nextUrl) => {
    if (typeof window === "undefined") return;
    const to = nextUrl || window.location.href;
    window.location.href = `/login?from_url=${encodeURIComponent(to)}`;
  },
  updateMe: wrap(async (data) => {
    const u = auth.currentUser || (await authReady());
    if (!u) throw new Error("غير مسجّل الدخول");
    const patch = { ...data, updated_date: nowIso() };
    delete patch.role; // roles are admin-managed (also enforced by Firestore rules)
    await setDoc(doc(db, "users", u.uid), patch, { merge: true });
    if (data.full_name) await updateProfile(u, { displayName: data.full_name });
    return toAppUser(u);
  }),
  resetPasswordRequest: wrap(async (email) => { await sendPasswordResetEmail(auth, email); return { success: true }; }),
  // `resetToken` is Firebase's oobCode (see ResetPassword page).
  resetPassword: wrap(async ({ resetToken, newPassword }) => {
    await confirmPasswordReset(auth, resetToken, newPassword);
    return { success: true };
  }),
};

// finish a redirect-based Google sign-in, if any
if (isFirebaseConfigured && typeof window !== "undefined") {
  getRedirectResult(auth)
    .then((r) => {
      if (!r) return;
      const to = sessionStorage.getItem("dau_after_login");
      sessionStorage.removeItem("dau_after_login");
      if (to) window.location.href = to;
    })
    .catch(() => {});
}

// ── server-side functions that Base44 hosted, re-implemented client-side ────
const functions = {
  invoke: async (name, args = {}) => {
    if (name === "deleteAccountRequest") {
      const u = auth.currentUser || (await authReady());
      if (!u) throw new Error("غير مسجّل الدخول");
      for (const ent of OWNED) {
        const snap = await getDocs(query(collection(db, ent), where("created_by_id", "==", u.uid)));
        await Promise.allSettled(snap.docs.map((d) => deleteDoc(d.ref)));
      }
      await deleteDoc(doc(db, "users", u.uid)).catch(() => {});
      try { await deleteUser(u); } catch (e) {
        if (e?.code === "auth/requires-recent-login") {
          throw new Error("لأسباب أمنية سجّل الدخول من جديد ثم أعد حذف الحساب");
        }
        throw friendly(e);
      }
      return { success: true };
    }
    if (name === "sendContactMessage") {
      await addDoc(collection(db, "ContactMessages"), { ...args, created_date: nowIso(), ts: serverTimestamp() });
      return { success: true };
    }
    throw new Error(`Unknown function: ${name}`);
  },
};

// ── integrations ─────────────────────────────────────────────────────────────
async function upload({ file }) {
  if (!file) return { file_url: "" };
  if (!storage) throw new Error("Firebase Storage غير مفعّل في هذا المشروع");
  const u = auth.currentUser || (await authReady());
  const safe = String(file.name || "file").replace(/[^\w.\-]+/g, "_");
  const r = ref(storage, `uploads/${u?.uid || "anon"}/${Date.now()}_${safe}`);
  await uploadBytes(r, file, { contentType: file.type || undefined });
  return { file_url: await getDownloadURL(r) };
}

// Gemini REST call. Needs VITE_GEMINI_API_KEY (client-visible — restrict the
// key by HTTP referrer, or move this behind your own server).
async function invokeLLM({ prompt, response_json_schema }) {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) throw new Error("لم يتم ضبط VITE_GEMINI_API_KEY");
  const model = import.meta.env.VITE_GEMINI_MODEL || "gemini-2.5-flash";
  const body = { contents: [{ parts: [{ text: prompt }] }] };
  if (response_json_schema) body.generationConfig = { responseMimeType: "application/json" };
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`Gemini error ${r.status}`);
  const j = await r.json();
  const text = j?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";
  if (!response_json_schema) return text;
  try { return JSON.parse(text); } catch { return { matching_ids: [], explanation: text }; }
}

const integrations = { Core: { UploadPublicFile: upload, UploadFile: upload, InvokeLLM: invokeLLM } };

const users = {
  // Firebase can't create accounts for others from the client; record an
  // invitation the admin can act on and tell the caller it was queued.
  inviteUser: async (email, role = "user") => {
    await addDoc(collection(db, "Invitations"), { email, role, created_date: nowIso() });
    return { success: true };
  },
};

const firebaseClient = {
  auth: fbAuth,
  entities,
  functions,
  integrations,
  users,
  analytics: { track: () => {}, cleanup: () => {} },
  appLogs: { log: () => {} },
};

export const base44 = isFirebaseConfigured ? firebaseClient : localClient;
export default base44;
