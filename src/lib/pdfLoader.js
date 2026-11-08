/**
 * pdfLoader — PDF.js setup and helper functions
 * Optimized for Arabic/Urdu PDFs with embedded fonts.
 * Canvas rendering preserves the original layout exactly.
 */
import * as pdfjsLib from "pdfjs-dist";
import { getCachedPdf, cachePdf } from "@/lib/offlineDB";

pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(
  new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url),
  { type: "module" }
);

// Cache loaded PDF documents (url -> pdf proxy)
const _docCache = new Map();

// Rendered page cache (pageKey -> dataURL) for instant re-display
const _pageCache = new Map();
const MAX_PAGE_CACHE = 12;

/**
 * Load a PDF document. Cached per URL.
 * Offline-aware: uses IndexedDB cache when offline, URL when online.
 */
export async function loadPdfDocument(url, metadata = {}) {
  if (_docCache.has(url)) return _docCache.get(url);

  // Check cache first (works both online and offline)
  try {
    const cachedPdf = await getCachedPdf(url);
    if (cachedPdf && cachedPdf.buffer) {
      const pdfData = new Uint8Array(cachedPdf.buffer);
      const loadingTask = pdfjsLib.getDocument({
        data: pdfData,
        cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/",
        cMapPacked: true,
        useSystemFonts: true,
        disableFontFace: false,
        standardFontDataUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/standard_fonts/",
      });
      const pdf = await loadingTask.promise;
      _docCache.set(url, pdf);
      return pdf;
    }
  } catch(e) { /* fall through to URL */ }

  // Load from URL (online)
  const loadingTask = pdfjsLib.getDocument({
    url,
    rangeChunkSize: 131072,
    disableAutoFetch: true, // fetch only the ranges needed for the first pages
    disableStream: false,
    useSystemFonts: true,
    disableFontFace: false,
    cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/standard_fonts/",
  });
  const pdf = await loadingTask.promise;
  _docCache.set(url, pdf);

  // Auto-cache PDF in background for offline reading (no duplicate download — uses pdfjs internal data)
  // Deferred so it never competes with rendering the first pages
  if (metadata.bookId) {
    setTimeout(() => {
      pdf.getData().then(data => {
        cachePdf(url, data.buffer, metadata.bookId, metadata.title || "").catch(() => {});
      }).catch(() => {});
    }, 4000);
  }

  return pdf;
}

/** Get total page count without loading all pages. */
export async function getPdfPageCount(url) {
  const pdf = await loadPdfDocument(url);
  return pdf.numPages;
}

/**
 * Extract text from a single PDF page using the text layer.
 * Fast — no API calls, runs entirely client-side.
 */
export async function extractPageText(pdf, pageNumber) {
  const page = await pdf.getPage(pageNumber);
  const content = await page.getTextContent();
  return content.items.map((item) => item.str).join(" ");
}

/**
 * Render a PDF page to a canvas with devicePixelRatio for crisp text.
 * Returns the canvas element. Uses cache for re-renders.
 */
export async function renderPageToCanvas(pdf, pageNumber, canvas, scale = 1.5) {
  const page = await pdf.getPage(pageNumber);
  const dpr = window.devicePixelRatio || 1;
  const renderScale = scale * dpr;
  const viewport = page.getViewport({ scale: renderScale });
  const ctx = canvas.getContext("2d", { alpha: false });
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const renderTask = page.render({ canvasContext: ctx, viewport });
  await renderTask.promise;
  return renderTask;
}

/**
 * Render a PDF page to an image Blob (for OCR upload).
 */
export async function renderPageToImageBlob(pdf, pageNumber, scale = 2) {
  const canvas = document.createElement("canvas");
  await renderPageToCanvas(pdf, pageNumber, canvas, scale);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

/** Cache a rendered page dataURL. */
export function cachePage(key, dataUrl) {
  if (_pageCache.size >= MAX_PAGE_CACHE) {
    const firstKey = _pageCache.keys().next().value;
    _pageCache.delete(firstKey);
  }
  _pageCache.set(key, dataUrl);
}

/** Get a cached page dataURL. */
export function getCachedPage(key) {
  return _pageCache.get(key);
}

/** Clear all caches (e.g., on unmount). */
export function clearPageCache() {
  _pageCache.clear();
}

/**
 * Warm the PDF worker, chunk and document caches in the background — call the
 * moment the user taps "read" so the book opens visibly faster.
 */
export function prefetchPdf(url, metadata = {}) {
  if (!url) return;
  loadPdfDocument(url, metadata).catch(() => {});
}