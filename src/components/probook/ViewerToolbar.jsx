import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  ZoomIn,
  ZoomOut,
  Moon,
  Sun,
  List,
  Maximize,
  ChevronDown,
  Search,
  Palette,
} from "lucide-react";
import { useT } from "@/lib/i18n";

/**
 * Ergonomic bottom toolbar for ProBookViewer.
 * Includes zoom controls with 100% reset, page navigation, 3-tab navigator drawer
 * (TOC + Bookmarks + Page Grid), full-text search, bookmark toggle, view-mode cycle,
 * reading comfort/theme settings, fullscreen, and interactive progress scrubber with bookmark markers.
 * Fully localized for English, Arabic, French, Urdu, Turkish, Hindi.
 */
export default function ViewerToolbar({
  currentPage,
  totalPages,
  zoom,
  theme,
  viewMode = "scroll",
  bookmarks = [],
  onNext,
  onPrev,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onToggleComfort,
  onCycleViewMode,
  onToggleBookmark,
  onToggleToc,
  onToggleSearch,
  onToggleGoTo,
  onSeekProgress,
  onToggleFullscreen,
  onHide,
}) {
  const t = useT();
  const dark = theme === "dark" || theme === "dusk";
  const pct = totalPages ? Math.round((currentPage / totalPages) * 100) : 0;
  const [hoverPage, setHoverPage] = useState(null);
  const [hoverX, setHoverX] = useState(0);

  const themeIcon =
    theme === "dark" || theme === "dusk" ? (
      <Moon className="w-3.5 h-3.5" />
    ) : theme === "sepia" ? (
      <Palette className="w-3.5 h-3.5" />
    ) : (
      <Sun className="w-3.5 h-3.5" />
    );



  const isBookmarked = bookmarks.includes(currentPage);

  return (
    <div
      data-viewer-ui
      className={`shrink-0 border-t backdrop-blur-xl transition-colors ${
        dark
          ? "border-neutral-800 bg-[#14171D]/95 text-stone-100"
          : theme === "sepia"
          ? "border-[#D5C7AD] bg-[#F3EAD8]/95 text-[#3D2E1E]"
          : theme === "mint"
          ? "border-[#BBD3C2] bg-[#E3ECE6]/95 text-[#183621]"
          : "border-stone-200 bg-[#FBF9F5]/95 text-stone-900"
      }`}
    >
      {/* Interactive reading-progress scrubber with bookmark ticks */}
      <div
        dir="ltr"
        className={`h-2 cursor-pointer group relative ${
          dark
            ? "bg-neutral-800"
            : theme === "sepia"
            ? "bg-[#DFD2BA]"
            : theme === "mint"
            ? "bg-[#CADECF]"
            : "bg-stone-200"
        }`}
        onMouseMove={(e) => {
          if (!totalPages) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
          setHoverPage(Math.max(1, Math.round(ratio * totalPages)));
          setHoverX(e.clientX - rect.left);
        }}
        onMouseLeave={() => setHoverPage(null)}
        onClick={(e) => {
          if (!onSeekProgress) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
          onSeekProgress(ratio);
        }}
      >
        <div
          className="h-full bg-primary transition-all duration-200"
          style={{ width: `${pct}%` }}
        />

        {/* Bookmark ticks on progress bar */}
        {totalPages > 0 &&
          bookmarks.map((bmPage) => {
            const bmPct = Math.min(100, Math.max(0, (bmPage / totalPages) * 100));
            return (
              <span
                key={bmPage}
                className="absolute top-0 bottom-0 w-1 bg-amber-500 pointer-events-none"
                style={{ left: `${bmPct}%` }}
              />
            );
          })}

        {/* Hover page tooltip */}
        {hoverPage !== null && (
          <div
            className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded bg-stone-900 text-stone-100 text-[10px] font-mono tabular-nums pointer-events-none shadow"
            style={{ left: `${hoverX}px` }}
          >
            {t.pageNo || "ص"} {hoverPage}
          </div>
        )}
      </div>

      {/* Main controls row */}
      <div
        dir="ltr"
        className="max-w-4xl mx-auto flex items-center justify-between px-2 py-1.5 sm:py-2 gap-1 sm:gap-2 overflow-x-auto scrollbar-none pb-2 sm:pb-1.5"
      >
        {/* Left group: Zoom controls */}
        <div className="flex items-center gap-0.5">
          <ToolBtn onClick={onZoomOut} dark={dark} title={t.tbZoomOut || "تصغير"}>
            <ZoomOut className="w-3.5 h-3.5" />
          </ToolBtn>
          <button
            onClick={onResetZoom}
            title={t.tbResetZoom || "إعادة ضبط التكبير (100%)"}
            className={`hidden xs:inline-flex text-[11px] font-mono tabular-nums font-medium px-1.5 py-1 rounded-md transition-colors ${
              dark ? "hover:bg-neutral-800 text-stone-300" : "hover:bg-stone-200/70 text-stone-700"
            }`}
          >
            {Math.round(zoom * 100)}%
          </button>
          <ToolBtn onClick={onZoomIn} dark={dark} title={t.tbZoomIn || "تكبير"}>
            <ZoomIn className="w-3.5 h-3.5" />
          </ToolBtn>
        </div>

        {/* Center group: Page navigation */}
        <div className="flex items-center gap-1">
          <ToolBtn
            onClick={onPrev}
            dark={dark}
            title={t.tbPrev || "الصفحة السابقة"}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </ToolBtn>

          <button
            onClick={onToggleGoTo}
            title={t.tbGoTo || "انتقال إلى صفحة"}
            className={`text-xs font-mono tabular-nums font-bold px-2.5 py-1 rounded-lg shrink-0 whitespace-nowrap transition-colors ${
              dark
                ? "text-stone-100 bg-neutral-800 hover:bg-neutral-700"
                : theme === "sepia"
                ? "text-[#3D2E1E] bg-[#E5D8C1] hover:bg-[#DBC9AC]"
                : theme === "mint"
                ? "text-[#183621] bg-[#D4E5D8] hover:bg-[#C5DAC9]"
                : "text-stone-900 bg-stone-200/75 hover:bg-stone-300/80"
            }`}
          >
            {currentPage} / {totalPages}
          </button>

          <ToolBtn
            onClick={onNext}
            dark={dark}
            title={t.tbNext || "الصفحة التالية"}
            disabled={currentPage >= totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </ToolBtn>
        </div>

        {/* Right group: Reading tools */}
        <div className="flex items-center gap-0.5">
          <ToolBtn
            onClick={onToggleToc}
            dark={dark}
            title={t.tocAndBookmarks || t.idxTitle || "الفهرس والعلامات المرجعية"}
            badge={bookmarks.length > 0 ? bookmarks.length : null}
          >
            <List className="w-3.5 h-3.5" />
          </ToolBtn>

          <ToolBtn onClick={onToggleSearch} dark={dark} title={t.tbSearch || "بحث في الكتاب"}>
            <Search className="w-3.5 h-3.5" />
          </ToolBtn>

          <ToolBtn
            onClick={onToggleBookmark}
            dark={dark}
            title={t.tbBookmark || "حفظ علامة مرجعية"}
            active={isBookmarked}
          >
            {isBookmarked ? (
              <BookmarkCheck className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            ) : (
              <Bookmark className="w-3.5 h-3.5" />
            )}
          </ToolBtn>



          <ToolBtn
            onClick={onToggleComfort}
            dark={dark}
            title={t.tbComfort || "إعدادات الإضاءة وراحة العين"}
            active={theme !== "light"}
          >
            {themeIcon}
          </ToolBtn>

          <ToolBtn
            onClick={onToggleFullscreen}
            dark={dark}
            title={t.tbFullscreen || "ملء الشاشة"}
            className="hidden sm:flex"
          >
            <Maximize className="w-3.5 h-3.5" />
          </ToolBtn>

          <ToolBtn onClick={onHide} dark={dark} title={t.tbHide || "إخفاء الشريط"}>
            <ChevronDown className="w-4 h-4" />
          </ToolBtn>
        </div>
      </div>
    </div>
  );
}

function ToolBtn({ children, onClick, dark, title, active, disabled, badge, className = "" }) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center transition-all active:scale-90 shrink-0 disabled:opacity-25 disabled:cursor-default ${
        active
          ? "bg-primary/15 text-primary"
          : dark
          ? "hover:bg-neutral-800 text-stone-200"
          : "hover:bg-black/5 text-current"
      } ${className}`}
    >
      {children}
      {badge != null && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-0.5 rounded-full bg-amber-500 text-white text-[9px] font-mono tabular-nums font-bold flex items-center justify-center">
          {badge}
        </span>
      )}
    </button>
  );
}