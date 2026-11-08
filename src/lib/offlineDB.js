/**
 * offlineDB — IndexedDB wrapper for Dar Al-Uloom offline storage
 *
 * Stores:
 * - books:       book metadata (key = book.id)
 * - pdfs:        PDF ArrayBuffers (key = pdfUrl)
 * - images:      cover/book image blobs (key = imageUrl)
 * - favorites:   local favorites (key = bookId)
 * - pending:     pending sync operations (key = opId)
 * - meta:        key-value metadata (lastSync, offlineEnabled, etc.)
 * - videos:      video metadata (key = video.id)
 * - channels:    video channel metadata (key = channel.id)
 * - social:      social channel metadata (key = channel.id)
 * - settings:    app settings cache (key = setting_key)
 */

import initialBooks from "../../data-export/Books.json";
import initialVideos from "../../data-export/Videos.json";
import initialVideoChannels from "../../data-export/VideoChannels.json";
import initialSocialChannels from "../../data-export/SocialChannels.json";
import initialSettings from "../../data-export/AppSettings.json";

const DB_NAME = "dar_al_ulum_offline";
const DB_VERSION = 2;

let _db = null;
let _dbReady = null; // in-flight open promise to avoid duplicate opens

function _wireLifecycle(db) {
  db.onclose = () => { _db = null; };
  db.onversionchange = () => { db.close(); _db = null; };
}

function openDB() {
  // Still valid connection
  if (_db) return Promise.resolve(_db);
  // Open already in-flight
  if (_dbReady) return _dbReady;

  _dbReady = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("books"))     db.createObjectStore("books",     { keyPath: "id" });
      if (!db.objectStoreNames.contains("pdfs"))      db.createObjectStore("pdfs",      { keyPath: "url" });
      if (!db.objectStoreNames.contains("images"))    db.createObjectStore("images",    { keyPath: "url" });
      if (!db.objectStoreNames.contains("favorites")) db.createObjectStore("favorites", { keyPath: "bookId" });
      if (!db.objectStoreNames.contains("pending"))   db.createObjectStore("pending",   { keyPath: "id", autoIncrement: true });
      if (!db.objectStoreNames.contains("meta"))      db.createObjectStore("meta",      { keyPath: "key" });
      if (!db.objectStoreNames.contains("videos"))    db.createObjectStore("videos",    { keyPath: "id" });
      if (!db.objectStoreNames.contains("channels"))  db.createObjectStore("channels",  { keyPath: "id" });
      if (!db.objectStoreNames.contains("social"))    db.createObjectStore("social",    { keyPath: "id" });
      if (!db.objectStoreNames.contains("settings"))  db.createObjectStore("settings",  { keyPath: "setting_key" });
    };
    req.onsuccess = (e) => {
      _db = e.target.result;
      _wireLifecycle(_db);
      _dbReady = null;
      resolve(_db);
    };
    req.onerror = (e) => { _dbReady = null; reject(e.target.error); };
    req.onblocked = () => { _dbReady = null; reject(new Error("IndexedDB open blocked")); };
  });

  return _dbReady;
}

async function tx(store, mode = "readonly") {
  // If cached connection is dead, drop it so openDB() re-opens
  if (_db) {
    try {
      // A dead/closing connection throws on transaction() — detect & recover
      return _db.transaction(store, mode).objectStore(store);
    } catch (e) {
      _db = null;
    }
  }
  const db = await openDB();
  return db.transaction(store, mode).objectStore(store);
}

function reqAsPromise(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror   = () => reject(request.error);
  });
}

// Wait for a transaction to finish. `transaction.done` is not supported in all
// browsers (e.g. older Safari), so we listen to events instead.
function txDone(store) {
  const tx = store.transaction;
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
    tx.onabort    = () => reject(tx.error || new Error("Transaction aborted"));
  });
}

// ─── Books ────────────────────────────────────────────────────────────────────
export async function cacheBooks(books) {
  const store = await tx("books", "readwrite");
  for (const book of books) {
    store.put({ ...book, _cached_at: Date.now() });
  }
  await txDone(store);
}

export async function getCachedBooks() {
  const store = await tx("books");
  const items = await reqAsPromise(store.getAll());
  if (items && items.length > 0) return items;
  if (Array.isArray(initialBooks) && initialBooks.length > 0) {
    await cacheBooks(initialBooks);
    return initialBooks;
  }
  return [];
}

export async function getCachedBook(id) {
  const store = await tx("books");
  let book = await reqAsPromise(store.get(id));
  if (!book && Array.isArray(initialBooks)) {
    book = initialBooks.find((b) => b.id === id) || null;
    if (book) {
      await cacheBooks([book]);
    }
  }
  return book;
}

export async function deleteCachedBook(id) {
  const store = await tx("books", "readwrite");
  store.delete(id);
  await txDone(store);
}

// ─── PDFs ─────────────────────────────────────────────────────────────────────
export async function cachePdf(url, buffer, bookId, title) {
  const store = await tx("pdfs", "readwrite");
  store.put({ url, buffer, bookId, title, size: buffer.byteLength, date: Date.now() });
  await txDone(store);
}

export async function getCachedPdf(url) {
  const store = await tx("pdfs");
  return reqAsPromise(store.get(url));
}

export async function getAllCachedPdfs() {
  const store = await tx("pdfs");
  return reqAsPromise(store.getAll());
}

export async function deleteCachedPdf(url) {
  const store = await tx("pdfs", "readwrite");
  store.delete(url);
  await txDone(store);
}

// ─── Images ───────────────────────────────────────────────────────────────────
export async function cacheImage(url, blob) {
  if (!url || !blob) return;
  const store = await tx("images", "readwrite");
  store.put({ url, blob, size: blob.size, date: Date.now() });
  await txDone(store);
}

export async function getCachedImage(url) {
  if (!url) return null;
  const store = await tx("images");
  return reqAsPromise(store.get(url));
}

export async function getAllCachedImages() {
  const store = await tx("images");
  return reqAsPromise(store.getAll());
}

export async function getCachedImageBlobUrl(url) {
  const rec = await getCachedImage(url);
  return rec ? URL.createObjectURL(rec.blob) : null;
}

// ─── Favorites (offline) ──────────────────────────────────────────────────────
export async function saveLocalFavorite(bookId, userEmail) {
  const store = await tx("favorites", "readwrite");
  store.put({ bookId, userEmail, date: Date.now() });
  await txDone(store);
}

export async function removeLocalFavorite(bookId) {
  const store = await tx("favorites", "readwrite");
  store.delete(bookId);
  await txDone(store);
}

export async function getLocalFavorites() {
  const store = await tx("favorites");
  return reqAsPromise(store.getAll());
}

export async function getLocalFavoriteIds() {
  const favs = await getLocalFavorites();
  return favs.map(f => f.bookId);
}

// ─── Pending sync queue ───────────────────────────────────────────────────────
export async function addPendingOp(op) {
  const store = await tx("pending", "readwrite");
  store.put({ ...op, date: Date.now() });
  await txDone(store);
}

export async function getPendingOps() {
  const store = await tx("pending");
  return reqAsPromise(store.getAll());
}

export async function deletePendingOp(id) {
  const store = await tx("pending", "readwrite");
  store.delete(id);
  await txDone(store);
}

// ─── Videos ───────────────────────────────────────────────────────────────────
export async function cacheVideos(videos) {
  const store = await tx("videos", "readwrite");
  for (const v of videos) {
    store.put({ ...v, _cached_at: Date.now() });
  }
  await txDone(store);
}

export async function getCachedVideos() {
  const store = await tx("videos");
  const items = await reqAsPromise(store.getAll());
  if (items && items.length > 0) return items;
  if (Array.isArray(initialVideos) && initialVideos.length > 0) {
    await cacheVideos(initialVideos);
    return initialVideos;
  }
  return [];
}

export async function deleteCachedVideo(id) {
  const store = await tx("videos", "readwrite");
  store.delete(id);
  await txDone(store);
}

// ─── Video Channels ───────────────────────────────────────────────────────────
export async function cacheVideoChannels(channels) {
  const store = await tx("channels", "readwrite");
  for (const c of channels) {
    store.put({ ...c, _cached_at: Date.now() });
  }
  await txDone(store);
}

export async function getCachedVideoChannels() {
  const store = await tx("channels");
  const items = await reqAsPromise(store.getAll());
  if (items && items.length > 0) return items;
  if (Array.isArray(initialVideoChannels) && initialVideoChannels.length > 0) {
    await cacheVideoChannels(initialVideoChannels);
    return initialVideoChannels;
  }
  return [];
}

export async function deleteCachedVideoChannel(id) {
  const store = await tx("channels", "readwrite");
  store.delete(id);
  await txDone(store);
}

// ─── Social Channels ──────────────────────────────────────────────────────────
export async function cacheSocialChannels(channels) {
  const store = await tx("social", "readwrite");
  for (const c of channels) {
    store.put({ ...c, _cached_at: Date.now() });
  }
  await txDone(store);
}

export async function getCachedSocialChannels() {
  const store = await tx("social");
  const items = await reqAsPromise(store.getAll());
  if (items && items.length > 0) return items;
  if (Array.isArray(initialSocialChannels) && initialSocialChannels.length > 0) {
    await cacheSocialChannels(initialSocialChannels);
    return initialSocialChannels;
  }
  return [];
}

export async function deleteCachedSocialChannel(id) {
  const store = await tx("social", "readwrite");
  store.delete(id);
  await txDone(store);
}

// ─── Settings ─────────────────────────────────────────────────────────────────
export async function cacheSettings(settings) {
  const store = await tx("settings", "readwrite");
  for (const s of settings) {
    store.put({ ...s, _cached_at: Date.now() });
  }
  await txDone(store);
}

export async function getCachedSettings() {
  const store = await tx("settings");
  const items = await reqAsPromise(store.getAll());
  if (items && items.length > 0) return items;
  const map = new Map();
  for (const s of (initialSettings || [])) {
    if (s.setting_key && !map.has(s.setting_key)) {
      map.set(s.setting_key, s);
    }
  }
  const deduped = Array.from(map.values());
  if (deduped.length > 0) {
    await cacheSettings(deduped);
    return deduped;
  }
  return [];
}

export async function deleteCachedSetting(key) {
  const store = await tx("settings", "readwrite");
  store.delete(key);
  await txDone(store);
}

export async function getCachedSetting(key) {
  const store = await tx("settings");
  const rec = await reqAsPromise(store.get(key));
  if (rec) return rec.setting_value;
  const match = (initialSettings || []).find((s) => s.setting_key === key);
  return match ? match.setting_value : null;
}

// ─── Meta ─────────────────────────────────────────────────────────────────────
export async function getMeta(key) {
  const store = await tx("meta");
  const rec = await reqAsPromise(store.get(key));
  return rec ? rec.value : null;
}

export async function setMeta(key, value) {
  const store = await tx("meta", "readwrite");
  store.put({ key, value });
  await txDone(store);
}

// ─── Storage management ───────────────────────────────────────────────────────
export async function clearAllCache() {
  const stores = ["books", "pdfs", "images", "pending", "videos", "channels", "social", "settings"];
  for (const s of stores) {
    const store = await tx(s, "readwrite");
    store.clear();
    await txDone(store);
  }
}

export async function getStorageEstimate() {
  let booksCount = 0, pdfsCount = 0, imagesCount = 0, pdfsSize = 0, imagesSize = 0, videosCount = 0;

  const books = await getCachedBooks();
  booksCount = books.length;

  const pdfs = await getAllCachedPdfs();
  pdfsCount = pdfs.length;
  pdfsSize = pdfs.reduce((sum, p) => sum + (p.size || 0), 0);

  const images = await getAllCachedImages();
  imagesCount = images.length;
  imagesSize = images.reduce((sum, i) => sum + (i.size || 0), 0);

  const videos = await getCachedVideos();
  videosCount = videos.length;

  const totalSize = pdfsSize + imagesSize;
  const navEstimate = navigator.storage?.estimate ? await navigator.storage.estimate() : {};

  return {
    booksCount,
    pdfsCount,
    imagesCount,
    videosCount,
    pdfsSize,
    imagesSize,
    totalSize,
    quota: navEstimate.quota || 0,
    usage: navEstimate.usage || 0,
  };
}

export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}