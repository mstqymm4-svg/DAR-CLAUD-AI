/**
 * activeUser — the single account email that ties together everything
 * user-related: book favorites, video favorites and offline downloads.
 * Defaults to the signed-in platform user's email until changed in Settings.
 */
const EMAIL_KEY = "dau_account_email";

export function getAccountEmail(user = null) {
  try {
    return localStorage.getItem(EMAIL_KEY) || (user?.email || "");
  } catch {
    return user?.email || "";
  }
}

export function setAccountEmail(email) {
  try { localStorage.setItem(EMAIL_KEY, email || ""); } catch {}
}

// ── Offline downloads registry (per account email) ──
const DL_KEY = (email) => `dau_downloads_${email}`;

export function getDownloadedBookIds(email) {
  if (!email) return [];
  try { return JSON.parse(localStorage.getItem(DL_KEY(email)) || "[]"); } catch { return []; }
}

export function addDownloadedBookId(email, bookId) {
  if (!email || !bookId) return;
  try {
    const ids = getDownloadedBookIds(email);
    if (!ids.includes(bookId)) {
      localStorage.setItem(DL_KEY(email), JSON.stringify([...ids, bookId]));
    }
  } catch {}
}

// ── Video favorites (per account email, falls back to legacy key) ──
const VF_KEY = (email) => `video_favorites_${email}`;

export function getVideoFavIds(email) {
  if (!email) return [];
  try {
    const raw = localStorage.getItem(VF_KEY(email));
    if (raw !== null) return JSON.parse(raw);
    return JSON.parse(localStorage.getItem("video_favorites") || "[]");
  } catch { return []; }
}

export function setVideoFavIds(email, ids) {
  if (!email) return;
  try { localStorage.setItem(VF_KEY(email), JSON.stringify(ids)); } catch {}
}

// ── Profile avatar (per account email) ──
const AVATAR_KEY = (email) => `dau_avatar_${email}`;

export function getAvatarUrl(email) {
  if (!email) return "";
  try { return localStorage.getItem(AVATAR_KEY(email)) || ""; } catch { return ""; }
}

export function setAvatarUrl(email, url) {
  if (!email || !url) return;
  try { localStorage.setItem(AVATAR_KEY(email), url); } catch {}
}

// ── Watched videos history (per account email) ──
const WATCHED_KEY = (email) => `dau_watched_${email}`;

export function getWatchedVideoIds(email) {
  if (!email) return [];
  try { return JSON.parse(localStorage.getItem(WATCHED_KEY(email))) || []; } catch { return []; }
}

export function markVideoWatched(email, videoId) {
  if (!email || !videoId) return;
  try {
    const ids = getWatchedVideoIds(email);
    if (!ids.includes(videoId)) {
      localStorage.setItem(WATCHED_KEY(email), JSON.stringify([...ids, videoId]));
    }
  } catch {}
}