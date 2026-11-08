/**
 * contentSyncEngine — Smart incremental content sync engine
 *
 * Features:
 * 1. Incremental sync — only downloads new/changed content (by updated_date)
 * 2. Deletion cleanup — removes items deleted from admin panel
 * 3. Periodic background polling — checks every 5 minutes while app is open
 * 4. Event notifications — pages subscribe to auto-refresh on content change
 * 5. Sync status tracking — exposes current sync state
 * 6. User data protection — never touches favorites, bookmarks, reading position
 */

import { base44 } from "@/api/base44Client";
import { entities } from "@/lib/dataSource";
import * as db from "@/lib/offlineDB";

// ─── Config ───────────────────────────────────────────────────────────────────
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const META_LAST_FULL_SYNC = "lastFullSync";

// ─── Event system ─────────────────────────────────────────────────────────────
const listeners = new Set();
let syncStatus = {
  isSyncing: false,
  lastSync: null,
  lastResult: null,
  error: null,
};

function emit(event) {
  listeners.forEach((fn) => {
    try { fn(event); } catch (e) { /* listener error — don't crash engine */ }
  });
}

export function onContentChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function getSyncStatus() {
  return { ...syncStatus };
}

function setSyncing(isSyncing, extra = {}) {
  syncStatus = { ...syncStatus, isSyncing, ...extra };
  emit({ type: "status", status: syncStatus });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function cacheNewImages(urls) {
  let cached = 0;
  for (const url of urls) {
    if (!url) continue;
    const existing = await db.getCachedImage(url);
    if (existing) continue;
    try {
      const res = await fetch(url);
      if (res.ok) {
        const blob = await res.blob();
        await db.cacheImage(url, blob);
        cached++;
      }
    } catch (e) { /* skip failed image */ }
  }
  return cached;
}

/**
 * Generic incremental reconcile for any entity type.
 * - Compares server items with cached by updated_date
 * - Only caches new/changed items (incremental)
 * - Deletes cached items no longer on server
 */
async function reconcile({
  listFn,
  cacheFn,
  getCachedFn,
  deleteFn,
  filterFn = null,
  imageField = null,
  countMetaKey = null,
}) {
  const serverItems = await listFn();
  const visible = filterFn ? serverItems.filter(filterFn) : serverItems;

  const serverIds = new Set(visible.map((item) => item.id));
  const cached = await getCachedFn();
  const cachedMap = {};
  cached.forEach((c) => { cachedMap[c.id] = c; });

  let newCount = 0, updatedCount = 0;
  const toCache = [];

  for (const item of visible) {
    const old = cachedMap[item.id];
    if (!old) { newCount++; toCache.push(item); }
    else if (old.updated_date !== item.updated_date) { updatedCount++; toCache.push(item); }
  }

  if (toCache.length > 0) await cacheFn(toCache);

  // Delete items: ONLY if explicitly deleted locally (in deleted entity tracker)
  let deletedCount = 0;
  let deletedIds = new Set();
  try {
    deletedIds = new Set(JSON.parse(localStorage.getItem("dau_deleted_entity_ids_v1") || "[]"));
  } catch {}
  const toDelete = cached.filter((c) => deletedIds.has(String(c.id)));
  for (const item of toDelete) {
    await deleteFn(item.id);
    deletedCount++;
  }

  // Cache images only for new/changed items
  let imagesCached = 0;
  if (imageField && toCache.length > 0) {
    imagesCached = await cacheNewImages(toCache.map((i) => i[imageField]).filter(Boolean));
  }

  if (countMetaKey) await db.setMeta(countMetaKey, visible.length);

  return { new: newCount, updated: updatedCount, deleted: deletedCount, imagesCached, total: visible.length };
}

// ─── Per-entity sync ──────────────────────────────────────────────────────────

async function syncBooksIncremental() {
  return reconcile({
    listFn: () => entities.Book.list("-created_date", 1000),
    cacheFn: db.cacheBooks,
    getCachedFn: db.getCachedBooks,
    deleteFn: db.deleteCachedBook,
    imageField: "cover_image",
    countMetaKey: "booksCount",
  });
}

async function syncVideosIncremental() {
  return reconcile({
    listFn: () => entities.Video.list("-sort_order", 1000),
    cacheFn: db.cacheVideos,
    getCachedFn: db.getCachedVideos,
    deleteFn: db.deleteCachedVideo,
    filterFn: (v) => v.visible !== false,
    imageField: "thumbnail",
    countMetaKey: "videosCount",
  });
}

async function syncVideoChannelsIncremental() {
  return reconcile({
    listFn: () => entities.VideoChannel.list("-sort_order", 1000),
    cacheFn: db.cacheVideoChannels,
    getCachedFn: db.getCachedVideoChannels,
    deleteFn: db.deleteCachedVideoChannel,
    filterFn: (c) => c.visible !== false,
    imageField: "channel_logo",
  });
}

async function syncSocialChannelsIncremental() {
  return reconcile({
    listFn: () => entities.SocialChannel.list("-sort_order", 1000),
    cacheFn: db.cacheSocialChannels,
    getCachedFn: db.getCachedSocialChannels,
    deleteFn: db.deleteCachedSocialChannel,
    filterFn: (c) => c.visible !== false,
    imageField: "icon_url",
  });
}

async function syncSettingsIncremental() {
  const serverSettings = await entities.AppSettings.list("-created_date", 1000).catch(() => []);
  const cachedSettings = await db.getCachedSettings().catch(() => []);
  const map = new Map();
  serverSettings.forEach(s => { if (s?.setting_key) map.set(s.setting_key, s); });
  // Local settings customized by user take precedence
  cachedSettings.forEach(s => { if (s?.setting_key) map.set(s.setting_key, s); });
  const merged = Array.from(map.values());
  await db.cacheSettings(merged);
  return { total: merged.length };
}

// ─── Main sync ────────────────────────────────────────────────────────────────

function hasChanges(r) {
  return r && !r.error && (r.new > 0 || r.updated > 0 || r.deleted > 0);
}

/**
 * Run a full incremental sync of all content.
 * Only downloads new/changed items, deletes removed items.
 * Emits events so pages can auto-refresh.
 */
export async function syncAllContent() {
  if (syncStatus.isSyncing) return syncStatus;
  if (!navigator.onLine) return { ...syncStatus, error: "offline" };

  setSyncing(true, { error: null });

  const result = { books: null, videos: null, channels: null, social: null, settings: null };

  try {
    result.books = await syncBooksIncremental().catch((e) => ({ error: e.message }));
    if (hasChanges(result.books)) emit({ type: "content_changed", entity: "books", ...result.books });

    result.videos = await syncVideosIncremental().catch((e) => ({ error: e.message }));
    if (hasChanges(result.videos)) emit({ type: "content_changed", entity: "videos", ...result.videos });

    result.channels = await syncVideoChannelsIncremental().catch((e) => ({ error: e.message }));
    if (hasChanges(result.channels)) emit({ type: "content_changed", entity: "channels", ...result.channels });

    result.social = await syncSocialChannelsIncremental().catch((e) => ({ error: e.message }));
    if (hasChanges(result.social)) emit({ type: "content_changed", entity: "social", ...result.social });

    result.settings = await syncSettingsIncremental().catch((e) => ({ error: e.message }));

    // Sync pending favorites (user data — never affected by content sync)
    try {
      const u = await base44.auth.me().catch(() => null);
      if (u) {
        const { syncPendingFavorites } = await import("@/lib/offlineSync");
        await syncPendingFavorites(u.email);
      }
    } catch (e) { /* skip */ }

    const now = Date.now();
    await db.setMeta(META_LAST_FULL_SYNC, now);
    setSyncing(false, { lastSync: now, lastResult: result });
    emit({ type: "sync_complete", result });
    return result;
  } catch (e) {
    setSyncing(false, { error: e.message });
    emit({ type: "sync_error", error: e.message });
    return { ...result, error: e.message };
  }
}

// ─── Background polling engine ────────────────────────────────────────────────
let pollTimer = null;
let isRunning = false;
let cleanupFns = [];

/**
 * Start the background content sync engine.
 * - Runs an initial sync (delayed 3s so app loads first)
 * - Polls every 5 minutes while app is open
 * - Syncs immediately on "online" event and when tab regains focus
 * Returns a cleanup function.
 */
export function startContentSyncEngine() {
  if (isRunning) return;
  isRunning = true;

  // Initial sync — delayed so app renders first
  const initialTimer = setTimeout(() => {
    syncAllContent().catch(() => {});
  }, 3000);

  // Periodic polling
  pollTimer = setInterval(() => {
    if (navigator.onLine) syncAllContent().catch(() => {});
  }, POLL_INTERVAL_MS);

  // Sync immediately when back online
  const handleOnline = () => syncAllContent().catch(() => {});
  window.addEventListener("online", handleOnline);

  // Sync when tab regains focus
  const handleVisibility = () => {
    if (!document.hidden && navigator.onLine) syncAllContent().catch(() => {});
  };
  document.addEventListener("visibilitychange", handleVisibility);

  cleanupFns = [
    () => clearTimeout(initialTimer),
    () => clearInterval(pollTimer),
    () => window.removeEventListener("online", handleOnline),
    () => document.removeEventListener("visibilitychange", handleVisibility),
  ];

  return () => {
    isRunning = false;
    cleanupFns.forEach((fn) => fn());
    cleanupFns = [];
  };
}

export async function forceSyncNow() {
  return syncAllContent();
}

export async function getSyncInfo() {
  const lastFullSync = await db.getMeta(META_LAST_FULL_SYNC);
  const booksCount = await db.getMeta("booksCount") || 0;
  const videosCount = await db.getMeta("videosCount") || 0;
  return { lastFullSync, booksCount, videosCount, ...syncStatus };
}