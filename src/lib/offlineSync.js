/**
 * offlineSync — Sync manager for Dar Al-Uloom offline mode
 *
 * Responsibilities:
 * 1. Sync book metadata + cover images from API → IndexedDB
 * 2. Download individual PDFs for offline reading
 * 3. Check for updates when online
 * 4. Sync pending favorite operations
 * 5. Provide offline-aware data access for pages
 */

import { base44 } from "@/api/base44Client";
import { entities } from "@/lib/dataSource";
import * as db from "@/lib/offlineDB";
import { getSetting } from "@/lib/settingsStore";
import { getAccountEmail } from "@/lib/activeUser";

// ─── Online status ────────────────────────────────────────────────────────────
export function isOnline() {
  return navigator.onLine;
}

export function isOfflineModeEnabled() {
  return getSetting("offline_mode") === "true";
}

// ─── Book metadata sync ───────────────────────────────────────────────────────
/**
 * Sync all books from API to local IndexedDB.
 * Also caches cover images.
 * Returns { total, new, updated, imagesCached }
 */
export async function syncBooks(onProgress) {
  const allBooks = await entities.Book.list('-created_date', 1000);
  const cached = await db.getCachedBooks();
  const cachedMap = {};
  cached.forEach(b => { cachedMap[b.id] = b; });

  let newCount = 0, updatedCount = 0;
  const toCache = [];

  for (const book of allBooks) {
    const old = cachedMap[book.id];
    if (!old) {
      newCount++;
      toCache.push(book);
    } else if (old.updated_date !== book.updated_date) {
      updatedCount++;
      toCache.push(book);
    } else {
      // unchanged — still update in cache to keep it fresh
      toCache.push(book);
    }
  }

  await db.cacheBooks(toCache);

  // Cache cover images in background
  let imagesCached = 0;
  for (const book of allBooks) {
    if (!book.cover_image) continue;
    const existing = await db.getCachedImage(book.cover_image);
    if (!existing) {
      try {
        const res = await fetch(book.cover_image);
        if (res.ok) {
          const blob = await res.blob();
          await db.cacheImage(book.cover_image, blob);
          imagesCached++;
          onProgress?.({ imagesCached, total: allBooks.length });
        }
      } catch(e) { /* skip failed image */ }
    }
  }

  await db.setMeta("lastSync", Date.now());
  await db.setMeta("booksCount", allBooks.length);

  return { total: allBooks.length, new: newCount, updated: updatedCount, imagesCached };
}

// ─── PDF download ─────────────────────────────────────────────────────────────
/**
 * Download a book's PDF for offline reading.
 * Fetches as ArrayBuffer and stores in IndexedDB.
 */
export async function downloadBookPdf(book, onProgress) {
  if (!book.pdf_url) throw new Error("لا يوجد ملف PDF لهذا الكتاب");

  // Check if already downloaded
  const existing = await db.getCachedPdf(book.pdf_url);
  if (existing) return { alreadyCached: true, size: existing.size };

  const res = await fetch(book.pdf_url);
  if (!res.ok) throw new Error("فشل تنزيل الملف");

  const reader = res.body?.getReader();
  const contentLength = +res.headers.get('Content-Length') || 0;
  let received = 0;
  const chunks = [];

  if (reader && contentLength > 0) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      onProgress?.({ received, total: contentLength, percent: Math.round(received / contentLength * 100) });
    }
    const buffer = new Uint8Array(received);
    let pos = 0;
    for (const chunk of chunks) { buffer.set(chunk, pos); pos += chunk.length; }
    await db.cachePdf(book.pdf_url, buffer.buffer, book.id, book.title);
  } else {
    // Fallback: no streaming support
    const buffer = await res.arrayBuffer();
    await db.cachePdf(book.pdf_url, buffer, book.id, book.title);
    onProgress?.({ received: buffer.byteLength, total: buffer.byteLength, percent: 100 });
  }

  return { alreadyCached: false, size: received || contentLength };
}

/**
 * Download multiple book PDFs.
 */
export async function downloadMultiplePdfs(books, onProgress) {
  let done = 0, failed = 0;
  for (const book of books) {
    try {
      await downloadBookPdf(book);
      done++;
    } catch(e) {
      failed++;
    }
    onProgress?.({ done, failed, total: books.length });
  }
  return { done, failed };
}

// ─── Videos sync ──────────────────────────────────────────────────────────────
export async function syncVideos(onProgress) {
  const allVideos = await entities.Video.list('-created_date', 1000);
  const visibleVideos = allVideos.filter(v => v.visible !== false);
  await db.cacheVideos(visibleVideos);

  // Cache thumbnails
  for (const v of visibleVideos) {
    if (!v.thumbnail) continue;
    const existing = await db.getCachedImage(v.thumbnail);
    if (!existing) {
      try {
        const res = await fetch(v.thumbnail);
        if (res.ok) {
          const blob = await res.blob();
          await db.cacheImage(v.thumbnail, blob);
        }
      } catch(e) {}
    }
  }

  await db.setMeta("videosCount", visibleVideos.length);
  return { total: visibleVideos.length };
}

/**
 * Get all videos — from API if online, from cache if offline.
 */
export async function getVideos() {
  if (isOnline()) {
    try {
      const videos = await entities.Video.list('-sort_order', 1000);
      const visible = videos.filter(v => v.visible !== false);
      db.cacheVideos(visible).catch(() => {});
      return visible;
    } catch(e) {
      return db.getCachedVideos();
    }
  }
  return db.getCachedVideos();
}

// ─── Video Channels sync ──────────────────────────────────────────────────────
export async function syncVideoChannels(onProgress) {
  const allChannels = await entities.VideoChannel.list('-sort_order', 1000);
  const visibleChannels = allChannels.filter(c => c.visible !== false);
  await db.cacheVideoChannels(visibleChannels);

  // Cache channel logos
  for (const c of visibleChannels) {
    if (!c.channel_logo) continue;
    const existing = await db.getCachedImage(c.channel_logo);
    if (!existing) {
      try {
        const res = await fetch(c.channel_logo);
        if (res.ok) {
          const blob = await res.blob();
          await db.cacheImage(c.channel_logo, blob);
        }
      } catch(e) {}
    }
  }

  await db.setMeta("channelsCount", visibleChannels.length);
  return { total: visibleChannels.length };
}

/**
 * Get video channels — from API if online, from cache if offline.
 */
export async function getVideoChannels() {
  if (isOnline()) {
    try {
      const channels = await entities.VideoChannel.list('-sort_order', 1000);
      const visible = channels.filter(c => c.visible !== false);
      db.cacheVideoChannels(visible).catch(() => {});
      return visible;
    } catch(e) {
      return db.getCachedVideoChannels();
    }
  }
  return db.getCachedVideoChannels();
}

// ─── Social Channels sync ─────────────────────────────────────────────────────
export async function syncSocialChannels() {
  const allChannels = await entities.SocialChannel.list('-sort_order', 1000);
  const visibleChannels = allChannels.filter(c => c.visible !== false);
  await db.cacheSocialChannels(visibleChannels);

  // Cache icons
  for (const c of visibleChannels) {
    if (!c.icon_url) continue;
    const existing = await db.getCachedImage(c.icon_url);
    if (!existing) {
      try {
        const res = await fetch(c.icon_url);
        if (res.ok) {
          const blob = await res.blob();
          await db.cacheImage(c.icon_url, blob);
        }
      } catch(e) {}
    }
  }

  return { total: visibleChannels.length };
}

/**
 * Get social channels — from API if online, from cache if offline.
 */
export async function getSocialChannels() {
  if (isOnline()) {
    try {
      const channels = await entities.SocialChannel.list('-sort_order', 1000);
      const visible = channels.filter(c => c.visible !== false);
      db.cacheSocialChannels(visible).catch(() => {});
      return visible;
    } catch(e) {
      return db.getCachedSocialChannels();
    }
  }
  return db.getCachedSocialChannels();
}

// ─── Settings sync ────────────────────────────────────────────────────────────
export async function syncSettings() {
  const allSettings = await entities.AppSettings.list('-created_date', 1000);
  await db.cacheSettings(allSettings);
  return { total: allSettings.length };
}

/**
 * Get setting value — from API if online, from cache if offline.
 */
export async function getSettingValue(key) {
  if (isOnline()) {
    try {
      const settings = await entities.AppSettings.filter({ setting_key: key });
      if (settings.length > 0) {
        db.cacheSettings(settings).catch(() => {});
        return settings[0].setting_value;
      }
    } catch(e) {
      return db.getCachedSetting(key);
    }
  }
  return db.getCachedSetting(key);
}

// ─── Image helper ─────────────────────────────────────────────────────────────
/**
 * Get an image URL — returns blob URL if cached offline, or original URL if online.
 */
export async function getImageUrl(originalUrl) {
  if (!originalUrl) return null;
  const cached = await db.getCachedImage(originalUrl);
  if (cached) return URL.createObjectURL(cached.blob);
  return originalUrl;
}

// ─── Check for updates ────────────────────────────────────────────────────────
export async function checkForUpdates() {
  const lastSync = await db.getMeta("lastSync");
  const cachedCount = await db.getMeta("booksCount") || 0;

  try {
    const serverBooks = await entities.Book.list('-created_date', 1);
    const serverCount = serverBooks.length; // This returns array, not total count — approximation
    const cached = await db.getCachedBooks();

    // Compare: any book with newer updated_date than lastSync?
    const newBooks = cached.length > 0
      ? []
      : [];

    // Fetch a fresh list to compare
    const freshBooks = await entities.Book.list('-created_date', 1000);
    const cachedMap = {};
    cached.forEach(b => { cachedMap[b.id] = b; });

    let newCount = 0, updatedCount = 0;
    for (const book of freshBooks) {
      const old = cachedMap[book.id];
      if (!old) newCount++;
      else if (old.updated_date !== book.updated_date) updatedCount++;
    }

    return {
      hasUpdates: newCount > 0 || updatedCount > 0,
      newCount,
      updatedCount,
      serverTotal: freshBooks.length,
      cachedTotal: cached.length,
      lastSync,
    };
  } catch(e) {
    return { hasUpdates: false, error: e.message, lastSync };
  }
}

// ─── Pending favorites sync ───────────────────────────────────────────────────
export async function syncPendingFavorites(userEmail) {
  if (!userEmail) return;
  const ops = await db.getPendingOps();
  for (const op of ops) {
    if (op.type === "favorite_add") {
      try {
        const existing = await entities.Favorite.filter({ book_id: op.bookId, user_email: userEmail });
        if (existing.length === 0) {
          await entities.Favorite.create({ book_id: op.bookId, user_email: userEmail });
        }
        await db.deletePendingOp(op.id);
      } catch(e) { /* retry next time */ }
    } else if (op.type === "favorite_remove") {
      try {
        const existing = await entities.Favorite.filter({ book_id: op.bookId, user_email: userEmail });
        for (const f of existing) await entities.Favorite.delete(f.id);
        await db.deletePendingOp(op.id);
      } catch(e) { /* retry next time */ }
    }
  }
}

// ─── Offline-aware data access ────────────────────────────────────────────────

/**
 * Get all books — from API if online, from cache if offline.
 */
export async function getBooks() {
  if (isOnline()) {
    try {
      const books = await entities.Book.list('-created_date', 1000);
      // Cache in background
      db.cacheBooks(books).catch(() => {});
      return books;
    } catch(e) {
      // Network failed — fall back to cache
      return db.getCachedBooks();
    }
  }
  return db.getCachedBooks();
}

/**
 * Get featured books — from API if online, from cache if offline.
 */
export async function getFeaturedBooks() {
  const books = await getBooks();
  return books.filter(b => b.is_featured).slice(0, 6);
}

/**
 * Get recent books — from API if online, from cache if offline.
 */
export async function getRecentBooks() {
  const books = await getBooks();
  return books.slice(0, 8);
}

/**
 * Get a single book by id.
 */
export async function getBook(id) {
  if (isOnline()) {
    try {
      const books = await entities.Book.filter({ id });
      if (books.length > 0) {
        db.cacheBooks([books[0]]).catch(() => {});
        return books[0];
      }
    } catch(e) {
      // fall through to cache
    }
  }
  return db.getCachedBook(id);
}

/**
 * Get user's favorite book IDs — from API if online, from local cache if offline.
 */
export async function getFavoriteIds(userEmail) {
  if (!userEmail) return [];

  if (isOnline()) {
    try {
      const favs = await entities.Favorite.filter({ user_email: userEmail });
      const ids = favs.map(f => f.book_id);
      // Sync to local cache
      const localFavs = await db.getLocalFavorites();
      const localIds = localFavs.map(f => f.bookId);
      // Reconcile: add missing, remove extra
      for (const id of ids) {
        if (!localIds.includes(id)) await db.saveLocalFavorite(id, userEmail);
      }
      for (const id of localIds) {
        if (!ids.includes(id)) await db.removeLocalFavorite(id);
      }
      return ids;
    } catch(e) {
      return db.getLocalFavoriteIds();
    }
  }
  return db.getLocalFavoriteIds();
}

/**
 * Toggle favorite — works both online and offline.
 */
export async function toggleFavorite(bookId, userEmail) {
  if (!userEmail) return null;

  if (isOnline()) {
    try {
      const existing = await entities.Favorite.filter({ book_id: bookId, user_email: userEmail });
      if (existing.length > 0) {
        await entities.Favorite.delete(existing[0].id);
        await db.removeLocalFavorite(bookId);
        return false; // removed
      } else {
        await entities.Favorite.create({ book_id: bookId, user_email: userEmail });
        await db.saveLocalFavorite(bookId, userEmail);
        return true; // added
      }
    } catch(e) {
      // Network failed — do locally + queue
      const localFavs = await db.getLocalFavoriteIds();
      if (localFavs.includes(bookId)) {
        await db.removeLocalFavorite(bookId);
        await db.addPendingOp({ type: "favorite_remove", bookId });
      } else {
        await db.saveLocalFavorite(bookId, userEmail);
        await db.addPendingOp({ type: "favorite_add", bookId });
      }
      return !localFavs.includes(bookId);
    }
  }

  // Offline — local + queue
  const localFavs = await db.getLocalFavoriteIds();
  if (localFavs.includes(bookId)) {
    await db.removeLocalFavorite(bookId);
    await db.addPendingOp({ type: "favorite_remove", bookId });
    return false;
  } else {
    await db.saveLocalFavorite(bookId, userEmail);
    await db.addPendingOp({ type: "favorite_add", bookId });
    return true;
  }
}

/**
 * Check if a PDF is downloaded for offline reading.
 */
export async function isPdfDownloaded(pdfUrl) {
  const cached = await db.getCachedPdf(pdfUrl);
  return !!cached;
}

/**
 * Get list of downloaded books (books whose PDFs are cached).
 */
export async function getDownloadedBooks() {
  const pdfs = await db.getAllCachedPdfs();
  const bookIds = pdfs.map(p => p.bookId);
  const cachedBooks = await db.getCachedBooks();
  return cachedBooks.filter(b => bookIds.includes(b.id));
}

// ─── Full sync ────────────────────────────────────────────────────────────────
export async function fullSync(onProgress) {
  onProgress?.({ step: "books", status: "started" });
  const booksResult = await syncBooks(onProgress);
  onProgress?.({ step: "books", status: "done", result: booksResult });

  onProgress?.({ step: "videos", status: "started" });
  const videosResult = await syncVideos().catch(() => ({ total: 0 }));
  onProgress?.({ step: "videos", status: "done", result: videosResult });

  onProgress?.({ step: "channels", status: "started" });
  const channelsResult = await syncVideoChannels().catch(() => ({ total: 0 }));
  onProgress?.({ step: "channels", status: "done", result: channelsResult });

  onProgress?.({ step: "social", status: "started" });
  const socialResult = await syncSocialChannels().catch(() => ({ total: 0 }));
  onProgress?.({ step: "social", status: "done", result: socialResult });

  onProgress?.({ step: "settings", status: "started" });
  await syncSettings().catch(() => {});
  onProgress?.({ step: "settings", status: "done" });

  // Sync pending favorites
  try {
    const u = await base44.auth.me().catch(() => null);
    if (u) {
      onProgress?.({ step: "favorites", status: "started" });
      await syncPendingFavorites(getAccountEmail(u));
      onProgress?.({ step: "favorites", status: "done" });
    }
  } catch(e) {}

  return { ...booksResult, videos: videosResult.total, channels: channelsResult.total };
}