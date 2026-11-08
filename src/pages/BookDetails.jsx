import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Heart, Star, BookOpen, ArrowRight, FileText, User, BookMarked, Download, CheckCircle, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useT } from "@/lib/i18n";
import { catLabel } from "@/lib/i18n-terms";
import { getBook, getFavoriteIds, toggleFavorite, downloadBookPdf, isPdfDownloaded } from "@/lib/offlineSync";
import { getAccountEmail, addDownloadedBookId } from "@/lib/activeUser";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { toast } from "sonner";
import SmartImage from "@/components/SmartImage";
import MobileHeader from "@/components/MobileHeader";

export default function BookDetails() {
  const { id } = useParams();
  const t = useT();
  const [book, setBook] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [pdfDownloaded, setPdfDownloaded] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const { isOnline } = useOnlineStatus();

  useEffect(() => {loadBook();}, [id]);

  const loadBook = async () => {
    const u = await base44.auth.me().catch(() => null);
    setUser(u);
    const b = await getBook(id);
    if (b) setBook(b);
    if (u) {
      const favIds = await getFavoriteIds(getAccountEmail(u));
      setIsFavorite(favIds.includes(id));
    }
    if (b?.pdf_url) {
      setPdfDownloaded(await isPdfDownloaded(b.pdf_url));
    }
    setLoading(false);
  };

  const handleToggleFavorite = async () => {
    if (!user) return;
    const added = await toggleFavorite(id, getAccountEmail(user));
    setIsFavorite(added);
  };

  const handleDownload = async () => {
    if (!book?.pdf_url) return;
    setDownloading(true);
    setDownloadProgress(0);
    try {
      await downloadBookPdf(book, (p) => {
        if (p.percent !== undefined) setDownloadProgress(p.percent);
      });
      setPdfDownloaded(true);
      addDownloadedBookId(getAccountEmail(user), book.id);
      toast.success(t.downloadDone);
    } catch (e) {
      toast.error(t.downloadFailed);
    }
    setDownloading(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="aspect-[3/4] rounded-2xl bg-muted animate-pulse" />
          </div>
          <div className="md:col-span-2 space-y-4">
            <div className="h-6 w-24 bg-muted rounded-full animate-pulse" />
            <div className="h-8 w-3/4 bg-muted rounded animate-pulse" />
            <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
            <div className="h-24 w-full bg-muted rounded-xl animate-pulse" />
            <div className="h-12 w-full bg-muted rounded-xl animate-pulse" />
          </div>
        </div>
      </div>);

  }

  if (!book) {
    return (
      <div className="text-center py-20 px-4">
        <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
        <h3 className="text-lg font-bold mb-2">{t.bookNotFound}</h3>
        <Link to="/books" className="text-primary text-sm hover:underline">{t.backToLib}</Link>
      </div>);

  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <MobileHeader title={book?.title} />
      {!isOnline &&
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500/10 border border-orange-500/30 text-orange-700 dark:text-orange-400 text-xs font-bold mb-4">
        
          <WifiOff className="w-4 h-4" />
          {t.offlineMode}
        </motion.div>
      }
      <Link to="/books" className="hidden md:inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
        <ArrowRight className="w-4 h-4" />
        {t.backToLib}
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid md:grid-cols-3 gap-8">
        
        {/* Cover */}
        <div className="md:col-span-1">
          <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-primary/15 to-primary/5 border border-border flex items-center justify-center shadow-lg shadow-primary/10">
            {book.cover_image ?
            <SmartImage src={book.cover_image} alt={book.title} className="w-full h-full object-cover" fallback={() => <BookOpen className="w-16 h-16 text-primary/30" />} /> :

            <BookOpen className="w-16 h-16 text-primary/30" />
            }
          </div>
        </div>

        {/* Details */}
        <div className="md:col-span-2">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-primary/10 font-semibold mb-3 text-[hsl(var(--primary))]">
                {catLabel(book.category, t.langCode)}
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-foreground leading-tight">{book.title}</h1>
            </div>
            {user &&
            <button
              onClick={handleToggleFavorite}
              className="shrink-0 w-11 h-11 rounded-xl border border-border flex items-center justify-center hover:bg-muted hover:border-primary/30 active:scale-95 transition-all">

              <Heart className={`w-5 h-5 transition-all text-[hsl(var(--background))] ${isFavorite ? "fill-red-500 scale-110" : "text-muted-foreground"}`} />
            </button>
            }
          </div>

          <div className="flex items-center gap-2 text-muted-foreground mb-6">
            <User className="w-4 h-4 opacity-100 text-[hsl(var(--primary))]" />
            <span className="text-sm font-medium">{book.author}</span>
          </div>

          {book.rating > 0 &&
          <div className="flex items-center gap-2 mb-6">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) =>
              <Star key={i} className={`w-4 h-4 ${i < Math.round(book.rating) ? "fill-accent text-accent" : "text-border"}`} />
              )}
              </div>
              <span className="text-sm text-muted-foreground">{book.rating} / 5</span>
            </div>
          }

          <div className="grid grid-cols-2 gap-3 mb-6">
            {book.pages_count &&
            <div className="p-4 rounded-xl bg-muted/50 border border-border hover:border-primary/20 transition-colors">
                <FileText className="w-4 h-4 mb-1" />
                <p className="text-lg font-bold text-[hsl(var(--primary))]">{book.pages_count}</p>
                <p className="text-xs text-[hsl(var(--popover-foreground))]">{t.pages}</p>
              </div>
            }

            





            
          </div>

          {book.description &&
          <div className="mb-8">
              <h3 className="text-sm font-bold text-foreground mb-3">{t.aboutBook}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{book.description}</p>
            </div>
          }

          {book.pdf_url &&
          <div className="space-y-2">
            <Link
              to={`/read/${book.id}`}
              className="block"
              onClick={() => {
                import("@/lib/pdfLoader")
                  .then(({ prefetchPdf }) => prefetchPdf(book.pdf_url, { bookId: book.id, title: book.title }))
                  .catch(() => {});
              }}>
              <Button className="w-full gap-2 h-12 text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-shadow rounded-[4px_24px_4px_24px]">
                <BookMarked className="w-4 h-4" />
                {t.readBook}
              </Button>
            </Link>
            {isOnline && !pdfDownloaded && !downloading &&
            <Button variant="outline" onClick={handleDownload} className="w-full gap-2 h-10 rounded-xl text-sm hover:border-primary/30 bg-[hsl(var(--foreground))] text-[hsl(var(--background))]">
                <Download className="w-4 h-4" />
                {t.downloadOffline}
              </Button>
            }
            {downloading &&
            <div className="w-full px-4 py-3 rounded-xl border border-primary/20 bg-primary/5">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-muted-foreground">{t.downloading}</span>
                  <span className="font-bold text-primary">{downloadProgress}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-to-l from-primary to-primary/80 rounded-full transition-all" style={{ width: `${downloadProgress}%` }} />
                </div>
              </div>
            }
            {pdfDownloaded &&
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/5 border border-green-500/20 text-green-700 dark:text-green-400 text-xs font-bold">
                <CheckCircle className="w-4 h-4" />
                {t.availableOffline}
              </div>
            }
          </div>
          }

        </div>
      </motion.div>
    </div>);

}