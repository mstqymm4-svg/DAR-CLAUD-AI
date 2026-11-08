import { useState, useEffect, useRef, useCallback } from "react";
import {
  Loader2,
  AlertCircle,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { loadPdfDocument, extractPageText, clearPageCache } from "@/lib/pdfLoader";
import { useT } from "@/lib/i18n";
import ViewerToolbar from "./ViewerToolbar";
import {
  TocPanel,
  SearchPanel,
  GoToPanel,
  ThemeComfortPanel,
} from "./ViewerPanels";
import VerticalPageStream, { READER_THEMES } from "./VerticalPageStream";

const BM_PREFIX = "dau_bm_";

const clampZoom = (z) => Math.max(0.5, Math.min(3, +Number(z).toFixed(2)));

export default function ProBookViewer({
  pdfUrl,
  title,
  bookId,
  language = "ar",
  onProgressChange,
}) {
  const t = useT();
  const [pdf, setPdf] = useState(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1);

  const [theme, setTheme] = useState(() => {
    try {
      const v = localStorage.getItem("dau_reader_theme");
      return ["light", "dark", "sepia", "dusk", "mint"].includes(v) ? v : "light";
    } catch {
      return "light";
    }
  });

  const [viewMode, setViewMode] = useState(() => {
    try {
      const v = localStorage.getItem("dau_reader_view_mode");
      return ["scroll", "single", "spread"].includes(v) ? v : "scroll";
    } catch {
      return "scroll";
    }
  });

  const [fitMode, setFitMode] = useState(() => {
    try {
      const v = localStorage.getItem("dau_reader_fit_mode");
      return ["width", "page"].includes(v) ? v : "width";
    } catch {
      return "width";
    }
  });

  const [brightness, setBrightness] = useState(() => {
    try {
      const v = Number(localStorage.getItem("dau_reader_brightness"));
      return v >= 55 && v <= 110 ? v : 100;
    } catch {
      return 100;
    }
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [showToolbar, setShowToolbar] = useState(true);

  // Panels
  const [showToc, setShowToc] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showGoTo, setShowGoTo] = useState(false);
  const [showComfort, setShowComfort] = useState(false);
  const [outline, setOutline] = useState([]);

  // Search
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [results, setResults] = useState([]);
  const [resultIdx, setResultIdx] = useState(0);

  // Go-to input
  const [goToValue, setGoToValue] = useState("");
  const totalPagesRef = useRef(0);

  // Bookmarks (persisted per book)
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(BM_PREFIX + bookId) || "[]");
    } catch {
      return [];
    }
  });

  const rootRef = useRef(null);
  const scrollToPageRef = useRef(null);
  const currentPageRef = useRef(1);
  const pointerDownRef = useRef({ x: 0, y: 0 });
  const lastTapRef = useRef(0);
  const [showZoomPct, setShowZoomPct] = useState(false);
  const didRestoreRef = useRef(false);

  // ── Flash zoom indicator on change ──
  const firstZoomRef = useRef(true);
  useEffect(() => {
    if (firstZoomRef.current) {
      firstZoomRef.current = false;
      return;
    }
    setShowZoomPct(true);
    const tm = setTimeout(() => setShowZoomPct(false), 900);
    return () => clearTimeout(tm);
  }, [zoom]);

  // ── Ctrl/⌘ + wheel zoom ──
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      setZoom((z) => clampZoom(z * (e.deltaY < 0 ? 1.1 : 1 / 1.1)));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const isRTL = language === "ar" || language === "ur";

  // ── Load PDF document ──
  useEffect(() => {
    let cancelled = false;
    didRestoreRef.current = false;
    setLoading(true);
    setError(false);
    setPdf(null);
    setOutline([]);
    setCurrentPage(1);

    loadPdfDocument(pdfUrl, { bookId, title })
      .then((doc) => {
        if (cancelled) return;
        setPdf(doc);
        setTotalPages(doc.numPages);
        setLoading(false);
        doc
          .getOutline()
          .then((out) => (cancelled ? [] : normalizeOutline(out, doc)))
          .then((items) => {
            if (!cancelled) setOutline(items || []);
          })
          .catch(() => {});
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [pdfUrl, bookId, title, reloadKey]);

  useEffect(() => {
    totalPagesRef.current = totalPages;
  }, [totalPages]);
  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  // ── Save & restore last read page ──
  useEffect(() => {
    if (pdf && totalPages > 0 && !didRestoreRef.current) {
      didRestoreRef.current = true;
      const saved = Number(localStorage.getItem(`lastpage_${bookId}`));
      if (saved && saved > 0 && saved <= totalPages) {
        setCurrentPage(saved);
        setTimeout(() => scrollToPageRef.current?.(saved), 120);
      }
    }
  }, [pdf, totalPages, bookId]);

  useEffect(() => {
    if (totalPages > 0 && currentPage > 0) {
      localStorage.setItem(`lastpage_${bookId}`, String(currentPage));
      localStorage.setItem(`lastts_${bookId}`, String(Date.now()));
      onProgressChange?.({ currentPage, totalPages });
    }
  }, [currentPage, totalPages, bookId, onProgressChange]);

  // ── Persist reader preferences ──
  useEffect(() => {
    try {
      localStorage.setItem(BM_PREFIX + bookId, JSON.stringify(bookmarks));
    } catch {}
  }, [bookmarks, bookId]);

  useEffect(() => {
    try {
      localStorage.setItem("dau_reader_theme", theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem("dau_reader_view_mode", viewMode);
    } catch {}
  }, [viewMode]);

  useEffect(() => {
    try {
      localStorage.setItem("dau_reader_fit_mode", fitMode);
    } catch {}
  }, [fitMode]);

  useEffect(() => {
    try {
      localStorage.setItem("dau_reader_brightness", String(brightness));
    } catch {}
  }, [brightness]);

  // ── Navigation helpers ──
  const goToPage = useCallback(
    (p) => {
      const tp = totalPagesRef.current || totalPages;
      const n = Math.max(1, Math.min(tp, Number(p) || 1));
      setCurrentPage(n);
      scrollToPageRef.current?.(n);
    },
    [totalPages]
  );

  const stepSize = viewMode === "spread" ? 2 : 1;

  const nextPage = useCallback(
    () => goToPage((currentPageRef.current || 1) + stepSize),
    [goToPage, stepSize]
  );
  const prevPage = useCallback(
    () => goToPage((currentPageRef.current || 1) - stepSize),
    [goToPage, stepSize]
  );

  const onStreamPageChange = useCallback((n) => setCurrentPage(n), []);
  const zoomIn = useCallback(() => setZoom((z) => clampZoom(z + 0.2)), []);
  const zoomOut = useCallback(() => setZoom((z) => clampZoom(z - 0.2)), []);
  const resetZoom = useCallback(() => setZoom(1), []);

  const toggleBookmark = useCallback(() => {
    setCurrentPage((cp) => {
      setBookmarks((b) =>
        b.includes(cp)
          ? b.filter((x) => x !== cp)
          : [...b, cp].sort((a, c) => a - c)
      );
      return cp;
    });
  }, []);

  const removeBookmark = useCallback((pageNum) => {
    setBookmarks((b) => b.filter((x) => x !== pageNum));
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = rootRef.current;
    if (!document.fullscreenElement) {
      (el || document.documentElement).requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }, []);

  const cycleViewMode = useCallback(() => {
    setViewMode((vm) =>
      vm === "scroll" ? "single" : vm === "single" ? "spread" : "scroll"
    );
  }, []);

  // ── Keyboard navigation ──
  useEffect(() => {
    const onKey = (e) => {
      if (showToc || showSearch || showGoTo || showComfort) return;
      if (e.target?.tagName === "INPUT" || e.target?.tagName === "TEXTAREA") return;
      if (e.key === "ArrowDown" || e.key === "PageDown") nextPage();
      else if (e.key === "ArrowUp" || e.key === "PageUp") prevPage();
      else if (e.key === "ArrowRight") {
        if (isRTL && viewMode !== "scroll") prevPage();
        else nextPage();
      } else if (e.key === "ArrowLeft") {
        if (isRTL && viewMode !== "scroll") nextPage();
        else prevPage();
      } else if (e.key === "+" || e.key === "=") zoomIn();
      else if (e.key === "-") zoomOut();
      else if (e.key === "0") resetZoom();
      else if (e.key === "b" || e.key === "B") toggleBookmark();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    nextPage,
    prevPage,
    zoomIn,
    zoomOut,
    resetZoom,
    toggleBookmark,
    isRTL,
    viewMode,
    showToc,
    showSearch,
    showGoTo,
    showComfort,
  ]);

  // ── Search across all pages with contextual snippets ──
  const runSearch = useCallback(async () => {
    const q = query.trim();
    if (!q || !pdf) return;
    setSearching(true);
    setSearchProgress(0);
    setResults([]);
    setResultIdx(0);

    const lower = q.toLowerCase();
    const found = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const rawText = await extractPageText(pdf, i);
        const idx = rawText.toLowerCase().indexOf(lower);
        if (idx !== -1) {
          const start = Math.max(0, idx - 32);
          const end = Math.min(rawText.length, idx + q.length + 42);
          const snippet =
            (start > 0 ? "…" : "") +
            rawText.slice(start, end).trim() +
            (end < rawText.length ? "…" : "");
          found.push({ page: i, snippet });
        }
      } catch {}
      if (i % 5 === 0 || i === pdf.numPages) {
        setSearchProgress(Math.round((i / pdf.numPages) * 100));
        setResults([...found]);
      }
    }
    setResults(found);
    setResultIdx(0);
    setSearching(false);
    if (found.length > 0) goToPage(found[0].page);
  }, [query, pdf, goToPage]);

  const selectResult = useCallback(
    (idx) => {
      if (!results[idx]) return;
      setResultIdx(idx);
      const item = results[idx];
      goToPage(typeof item === "object" ? item.page : item);
    },
    [results, goToPage]
  );

  const nextResult = useCallback(() => {
    if (results.length === 0) return;
    const ni = (resultIdx + 1) % results.length;
    selectResult(ni);
  }, [results, resultIdx, selectResult]);

  const prevResult = useCallback(() => {
    if (results.length === 0) return;
    const pi = (resultIdx - 1 + results.length) % results.length;
    selectResult(pi);
  }, [results, resultIdx, selectResult]);

  const openGoTo = useCallback(() => {
    setGoToValue(String(currentPage));
    setShowGoTo((s) => !s);
  }, [currentPage]);

  useEffect(() => () => clearPageCache(), []);

  const themeConfig = READER_THEMES[theme] || READER_THEMES.light;
  const isDarkTheme = theme === "dark" || theme === "dusk";

  if (loading) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center ${themeConfig.canvasBg}`}>
        <div className="w-full max-w-md mx-auto px-6 animate-pulse">
          <div className="bg-white/90 dark:bg-neutral-900/90 border border-stone-200 dark:border-neutral-800 rounded-xl shadow-lg aspect-[3/4] p-8 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-4 w-2/3 bg-stone-200 dark:bg-neutral-800 rounded mx-auto mb-6" />
              <div className="h-2.5 w-full bg-stone-200 dark:bg-neutral-800 rounded" />
              <div className="h-2.5 w-11/12 bg-stone-200 dark:bg-neutral-800 rounded" />
              <div className="h-2.5 w-full bg-stone-200 dark:bg-neutral-800 rounded" />
              <div className="h-2.5 w-4/5 bg-stone-200 dark:bg-neutral-800 rounded" />
            </div>
            <div className="flex items-center justify-center gap-2 text-muted-foreground pt-4">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <p className="text-xs font-medium">{t.readerLoading}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <span className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-7 h-7 text-destructive" />
        </span>
        <p className="text-sm text-destructive font-semibold">{t.readerLoadError}</p>
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold active:scale-95 transition-transform"
        >
          {t.readerRetry}
        </button>
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={`relative w-full h-full flex flex-col select-none ${themeConfig.canvasBg}`}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        pointerDownRef.current = { x: e.clientX, y: e.clientY };
      }}
      onClick={(e) => {
        if (showToc || showSearch || showGoTo || showComfort) {
          if (!e.target.closest?.("[data-viewer-ui]")) {
            setShowComfort(false);
          }
          return;
        }
        if (e.target.closest?.("[data-viewer-ui]")) return;
        // Ignore clicks that were actually scroll/drag gestures
        const dist = Math.hypot(
          e.clientX - pointerDownRef.current.x,
          e.clientY - pointerDownRef.current.y
        );
        if (dist > 8) return;

        const now = Date.now();
        const isDoubleTap = now - lastTapRef.current < 320;
        lastTapRef.current = now;
        if (isDoubleTap) {
          setShowToolbar((s) => !s);
          setZoom((z) => (z > 1.05 ? 1 : 1.75));
          return;
        }
        setShowToolbar((s) => !s);
      }}
    >
      {/* Page Stream / Single / Spread Canvas */}
      <VerticalPageStream
        pdf={pdf}
        totalPages={totalPages}
        currentPage={currentPage}
        zoom={zoom}
        onZoomChange={(z) => setZoom(clampZoom(z))}
        theme={theme}
        viewMode={viewMode}
        fitMode={fitMode}
        brightness={brightness}
        isRTL={isRTL}
        bookmarks={bookmarks}
        onCurrentPageChange={onStreamPageChange}
        onNextPage={nextPage}
        onPrevPage={prevPage}
        scrollToPageRef={scrollToPageRef}
        onToggleToolbar={() => setShowToolbar((s) => !s)}
      />

      {/* Floating desktop side navigation buttons for effortless reading */}
      {totalPages > 1 && (
        <>
          <button
            data-viewer-ui
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              isRTL ? nextPage() : prevPage();
            }}
            disabled={isRTL ? currentPage >= totalPages : currentPage <= 1}
            title={isRTL ? t.tbNext || "الصفحة التالية" : t.tbPrev || "الصفحة السابقة"}
            className="hidden md:flex absolute top-1/2 -translate-y-1/2 start-3 z-20 w-11 h-11 rounded-full items-center justify-center bg-black/40 hover:bg-black/70 text-white backdrop-blur-md transition-all active:scale-90 disabled:opacity-0 disabled:pointer-events-none shadow-lg ring-1 ring-white/15"
          >
            {isRTL ? <ChevronRight className="w-6 h-6" /> : <ChevronLeft className="w-6 h-6" />}
          </button>

          <button
            data-viewer-ui
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              isRTL ? prevPage() : nextPage();
            }}
            disabled={isRTL ? currentPage <= 1 : currentPage >= totalPages}
            title={isRTL ? t.tbPrev || "الصفحة السابقة" : t.tbNext || "الصفحة التالية"}
            className="hidden md:flex absolute top-1/2 -translate-y-1/2 end-3 z-20 w-11 h-11 rounded-full items-center justify-center bg-black/40 hover:bg-black/70 text-white backdrop-blur-md transition-all active:scale-90 disabled:opacity-0 disabled:pointer-events-none shadow-lg ring-1 ring-white/15"
          >
            {isRTL ? <ChevronLeft className="w-6 h-6" /> : <ChevronRight className="w-6 h-6" />}
          </button>
        </>
      )}

      {/* Zoom level indicator */}
      <div
        className={`absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-md bg-stone-900/80 text-white text-xs font-mono tabular-nums font-bold pointer-events-none transition-opacity duration-200 ${
          showZoomPct ? "opacity-100" : "opacity-0"
        }`}
      >
        {Math.round(zoom * 100)}%
      </div>

      {/* Panels */}
      <TocPanel
        show={showToc}
        isRTL={isRTL}
        darkMode={isDarkTheme}
        outline={outline}
        totalPages={totalPages}
        currentPage={currentPage}
        bookmarks={bookmarks}
        onClose={() => setShowToc(false)}
        onPageClick={goToPage}
        onToggleBookmark={toggleBookmark}
        onRemoveBookmark={removeBookmark}
      />

      <SearchPanel
        show={showSearch}
        darkMode={isDarkTheme}
        query={query}
        setQuery={setQuery}
        onSearch={runSearch}
        searching={searching}
        searchProgress={searchProgress}
        results={results}
        resultIdx={resultIdx}
        onSelectResult={selectResult}
        onNextResult={nextResult}
        onPrevResult={prevResult}
        onClose={() => setShowSearch(false)}
      />

      <ThemeComfortPanel
        show={showComfort}
        theme={theme}
        onSelectTheme={setTheme}
        viewMode={viewMode}
        onSelectViewMode={setViewMode}
        fitMode={fitMode}
        onSelectFitMode={setFitMode}
        brightness={brightness}
        onChangeBrightness={setBrightness}
        onClose={() => setShowComfort(false)}
      />

      <GoToPanel
        show={showGoTo}
        value={goToValue}
        setValue={setGoToValue}
        totalPages={totalPages}
        onGo={() => {
          goToPage(goToValue);
          setShowGoTo(false);
        }}
        onClose={() => setShowGoTo(false)}
      />

      {/* Bottom Toolbar */}
      {showToolbar ? (
        <ViewerToolbar
          currentPage={currentPage}
          totalPages={totalPages}
          zoom={zoom}
          theme={theme}
          viewMode={viewMode}
          bookmarks={bookmarks}
          onNext={nextPage}
          onPrev={prevPage}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetZoom={resetZoom}
          onToggleComfort={() => setShowComfort((s) => !s)}
          onCycleViewMode={cycleViewMode}
          onToggleBookmark={toggleBookmark}
          onToggleToc={() => setShowToc((s) => !s)}
          onToggleSearch={() => setShowSearch((s) => !s)}
          onToggleGoTo={openGoTo}
          onSeekProgress={(f) => goToPage(Math.max(1, Math.round(f * totalPages)))}
          onToggleFullscreen={toggleFullscreen}
          onHide={() => {
            setShowComfort(false);
            setShowToolbar(false);
          }}
        />
      ) : (
        <button
          data-viewer-ui
          onClick={() => setShowToolbar(true)}
          className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-lg bg-stone-900/80 text-stone-100 shadow-lg flex items-center gap-1.5 text-xs font-mono tabular-nums hover:bg-stone-900 transition-colors"
          title={t.tbShow}
        >
          <ChevronUp className="w-3.5 h-3.5" />
          <span>
            {currentPage} / {totalPages}
          </span>
        </button>
      )}
    </div>
  );
}

// Normalize PDF.js outline into { title, pageNumber, items[] }
async function normalizeOutline(outline, pdf) {
  if (!outline || !outline.length) return [];
  const walk = async (items) => {
    const res = [];
    for (const it of items) {
      let pageNumber = null;
      try {
        if (it.dest) {
          let dest = it.dest;
          if (typeof dest === "string") dest = await pdf.getDestination(dest);
          if (Array.isArray(dest) && dest[0]) {
            const idx = await pdf.getPageIndex(dest[0]);
            pageNumber = idx + 1;
          }
        }
      } catch {}
      res.push({
        title: it.title || "",
        pageNumber,
        items: it.items && it.items.length ? await walk(it.items) : [],
      });
    }
    return res;
  };
  return walk(outline);
}