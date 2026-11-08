import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowRight, BookOpen, ShieldCheck } from "lucide-react";
import ProBookViewer from "@/components/probook/ProBookViewer";
import { useT } from "@/lib/i18n";
import { getBook } from "@/lib/offlineSync";
import PageLogoLoader from "@/components/PageLogoLoader";

export default function ReadBook() {
  const { id } = useParams();
  const t = useT();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isWindowBlurred, setIsWindowBlurred] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [progress, setProgress] = useState({ currentPage: 1, totalPages: 0 });

  useEffect(() => {
    loadBook();
  }, [id]);

  const loadBook = async () => {
    try {
      const b = await getBook(id);
      if (b) setBook(b);
    } catch {}
    setLoading(false);
  };

  // Hide the app's bottom nav while reading; restore it when leaving
  useEffect(() => {
    const nav = document.getElementById("bottom-nav");
    if (nav) nav.style.transform = "translateY(100%)";
    return () => {
      if (nav) nav.style.transform = "translateY(0)";
    };
  }, []);

  // Anti-screenshot & content protection
  useEffect(() => {
    // When window loses focus (e.g. snipping tool or screen grabber is invoked), shield content
    const handleBlur = () => setIsWindowBlurred(true);
    const handleFocus = () => setIsWindowBlurred(false);
    const handleVisibility = () => {
      if (document.hidden) setIsWindowBlurred(true);
      else setIsWindowBlurred(false);
    };

    const handleKeyDown = (e) => {
      // Intercept PrintScreen
      if (e.key === "PrintScreen" || e.keyCode === 44) {
        setIsWindowBlurred(true);
        try {
          if (navigator.clipboard?.writeText) {
            navigator.clipboard.writeText("");
          }
        } catch {}
        setTimeout(() => setIsWindowBlurred(false), 2000);
      }
      // Intercept Print (Ctrl+P / Cmd+P)
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        e.stopPropagation();
      }
      // Intercept Save (Ctrl+S / Cmd+S)
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        e.stopPropagation();
      }
      // Intercept Mac screenshot combinations Cmd+Shift+3/4/5
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["3", "4", "5"].includes(e.key)) {
        setIsWindowBlurred(true);
        setTimeout(() => setIsWindowBlurred(false), 1500);
      }
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, []);

  if (loading) {
    return <PageLogoLoader />;
  }

  if (!book || !book.pdf_url) {
    return (
      <div className="text-center py-20 px-4">
        <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-lg font-bold mb-2">{t.noPdf}</h3>
        <Link to="/books" className="text-primary text-sm hover:underline">
          {t.backToLib}
        </Link>
      </div>
    );
  }

  return (
    <div
      data-book-reader
      className={`fixed inset-x-0 bottom-0 z-40 flex flex-col bg-background select-none transition-all ${
        isZenMode ? "top-0 z-50" : "top-16"
      }`}
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <style>{`
        @media print {
          body, html, [data-book-reader], #root {
            display: none !important;
            visibility: hidden !important;
          }
        }
        [data-book-reader] {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
      `}</style>

      {/* Editorial Reader Header Bar */}
      <div className="bg-card/95 backdrop-blur border-b border-border px-3 sm:px-5 py-2 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to={`/book/${book.id}`}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap shrink-0"
          >
            <ArrowRight className={`w-4 h-4 ${t.dir === "ltr" ? "rotate-180" : ""}`} />
            <span>{t.backBtn || "رجوع"}</span>
          </Link>

          <span className="text-border select-none" aria-hidden="true">
            /
          </span>

          <div className="flex items-center gap-2 min-w-0 text-xs">
            <span className="font-bold text-foreground truncate">{book.title}</span>
            {book.author && (
              <>
                <span className="text-muted-foreground hidden sm:inline" aria-hidden="true">
                  ·
                </span>
                <span className="text-muted-foreground truncate hidden sm:inline">
                  {book.author}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Right side controls: Reading Progress + Zen mode toggle + Protection Badge */}
        <div className="flex items-center gap-2 shrink-0">
          {progress.totalPages > 0 && (
            <span className="hidden xs:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono tabular-nums bg-muted text-muted-foreground">
              {progress.currentPage} / {progress.totalPages} ({Math.round((progress.currentPage / progress.totalPages) * 100)}%)
            </span>
          )}

          <button
            onClick={() => setIsZenMode((z) => !z)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              isZenMode
                ? "bg-primary text-primary-foreground font-bold"
                : "bg-muted/70 hover:bg-muted text-foreground"
            }`}
            title={isZenMode ? "الخروج من وضع التركيز" : "وضع التركيز الكامل"}
          >
            {isZenMode ? "تركيز ✓" : "تركيز"}
          </button>

          {/* Protection Badge */}
          <div
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-muted-foreground bg-muted/50 whitespace-nowrap shrink-0"
            title={t.contentProtectedNotice}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">
              {t.langCode === "en" ? "Protected" : "محمي"}
            </span>
          </div>
        </div>
      </div>

      {/* Professional PDF Viewer */}
      <div className="flex-1 overflow-hidden relative">
        <ProBookViewer
          pdfUrl={book.pdf_url}
          title={book.title}
          bookId={book.id}
          language={t.langCode || "ar"}
          onProgressChange={setProgress}
        />

        {/* Privacy shield overlay when window is blurred/screenshot tool is opened */}
        {isWindowBlurred && (
          <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center select-none pointer-events-none transition-all">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-bold text-foreground max-w-sm mb-1">
              {t.contentProtectedNotice}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}