/**
 * accountSync — cloud backup for everything tied to the account email.
 *
 * Pushes the user's account data (avatar, favorites, reading progress,
 * bookmarks, watched videos, verification status…) to the AccountData
 * entity, and restores it on fresh installs — so if the user deletes the
 * app and reinstalls it, signing in with the same email brings everything
 * back automatically.
 */
import { base44 } from "@/api/base44Client";

// localStorage keys that make up the user's account data
const KEY_PREFIXES = [
  "dau_avatar_",
  "dau_watched_",
  "dau_downloads_",
  "video_favorites_",
  "dau_bm_",
  "lastpage_",
  "lastts_",
  "video_pos_",
  "email_verified_",
];
const EXACT_KEYS = ["dau_account_email", "dau_reader_theme", "video_favorites"];

const LAST_SYNC_KEY = "dau_last_cloud_sync";

function collectLocalData() {
  const out = {};
  try {
    for (const key of Object.keys(localStorage)) {
      if (EXACT_KEYS.includes(key) || KEY_PREFIXES.some((p) => key.startsWith(p))) {
        const v = localStorage.getItem(key);
        if (v !== null) out[key] = v;
      }
    }
  } catch {}
  return out;
}

export function getLastSyncAt() {
  try { return Number(localStorage.getItem(LAST_SYNC_KEY)) || 0; } catch { return 0; }
}

/**
 * Upload the current local account data to the user's cloud record.
 * Returns true on success.
 */
export async function pushAccountData(user) {
  if (!user?.email || !navigator.onLine) return false;
  try {
    const records = await base44.entities.AccountData.filter({ account_email: user.email });
    const payload = JSON.stringify({ keys: collectLocalData() });
    if (records.length > 0) {
      await base44.entities.AccountData.update(records[0].id, { data: payload });
    } else {
      await base44.entities.AccountData.create({ account_email: user.email, data: payload });
    }
    try { localStorage.setItem(LAST_SYNC_KEY, String(Date.now())); } catch {}
    return true;
  } catch {
    return false;
  }
}

/**
 * Restore the user's cloud data into localStorage — only fills keys that
 * don't exist locally, so it never overwrites data on an active device.
 * Returns true when anything was restored (fresh install).
 */
export async function restoreAccountData(user) {
  if (!user?.email || !navigator.onLine) return false;
  try {
    const records = await base44.entities.AccountData.filter({ account_email: user.email });
    if (!records.length) return false;
    const keys = JSON.parse(records[0].data || "{}").keys || {};
    let restored = 0;
    for (const [k, v] of Object.entries(keys)) {
      try {
        if (typeof v === "string" && localStorage.getItem(k) === null) {
          localStorage.setItem(k, v);
          restored++;
        }
      } catch {}
    }
    if (restored > 0) {
      try { localStorage.setItem(LAST_SYNC_KEY, String(records[0].updated_date ? Date.parse(records[0].updated_date) : Date.now())); } catch {}
      // let the UI pick up the restored avatar / account email
      try { window.dispatchEvent(new Event("dau-avatar-change")); } catch {}
    }
    return restored > 0;
  } catch {
    return false;
  }
}

/**
 * Background engine: restore on app open (fresh install), then keep the
 * cloud copy fresh — on open, every 2 minutes and when the app is hidden.
 */
export function startAccountSyncEngine() {
  let user = null;
  let pushing = false;

  const push = async () => {
    if (!user || pushing) return;
    pushing = true;
    try { await pushAccountData(user); } finally { pushing = false; }
  };

  base44.auth.me()
    .then(async (u) => {
      if (!u) return;
      user = u;
      await restoreAccountData(u);
      push();
    })
    .catch(() => {});

  const interval = setInterval(push, 120 * 1000);
  const onHide = () => { if (document.visibilityState === "hidden") push(); };
  document.addEventListener("visibilitychange", onHide);
  window.addEventListener("pagehide", push);

  return () => {
    clearInterval(interval);
    document.removeEventListener("visibilitychange", onHide);
    window.removeEventListener("pagehide", push);
  };
}