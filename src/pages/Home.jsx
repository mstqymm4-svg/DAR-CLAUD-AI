import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { BookOpen, Sparkles, Youtube, ExternalLink, ChevronLeft } from "lucide-react";
import BookCard from "../components/BookCard";
import HeroBanner from "../components/HeroBanner";
import SocialChannelsSection from "../components/SocialChannelsSection";
import HomeChannels from "../components/HomeChannels";
import { SkeletonGrid } from "../components/Skeleton";
import { motion } from "framer-motion";
import { useT } from "@/lib/i18n";
import { getSetting, subscribeToSettings } from "@/lib/settingsStore";
import { getFeaturedBooks, getRecentBooks, getFavoriteIds, toggleFavorite } from "@/lib/offlineSync";
import { getAccountEmail } from "@/lib/activeUser";
import { useContentRefresh } from "@/hooks/useContentSync";
import PullToRefresh from "@/components/PullToRefresh";
import { forceSyncNow } from "@/lib/contentSyncEngine";

export default function Home() {
  const t = useT();
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [recentBooks, setRecentBooks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const [youtubeUrl, setYoutubeUrl] = useState(() => getSetting("youtube_url") || "");
  const [youtubeLabel, setYoutubeLabel] = useState(() => getSetting("youtube_label") || t.youtubeBtn);
  const [youtubeSubText, setYoutubeSubText] = useState(() => getSetting("youtube_sub") || "");

  const loadData = async () => {
    const u = await base44.auth.me().catch(() => null);
    setUser(u);
    const [featured, recent] = await Promise.all([
      getFeaturedBooks(),
      getRecentBooks(),
    ]);
    setFeaturedBooks(featured || []);
    setRecentBooks(recent || []);
    if (u) {
      const favIds = await getFavoriteIds(getAccountEmail(u));
      setFavorites(favIds);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToSettings((s) => {
      setYoutubeUrl(s.youtube_url || "");
      setYoutubeLabel(s.youtube_label || t.youtubeBtn);
      setYoutubeSubText(s.youtube_sub || "");
    });
    return unsub;
  }, []);

  // Auto-refresh when content changes in background
  useContentRefresh(["books", "videos", "channels", "social"], loadData);

  const handleToggleFavorite = async (bookId) => {
    if (!user) return;
    const added = await toggleFavorite(bookId, getAccountEmail(user));
    setFavorites((prev) =>
      added ? [...prev, bookId] : prev.filter((id) => id !== bookId)
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SkeletonGrid count={6} />
      </div>
    );
  }

  return (
    <PullToRefresh
      onRefresh={async () => {
        await forceSyncNow();
        await loadData();
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Hero */}
        <HeroBanner />

        {/* YouTube Channel Banner */}
        {youtubeUrl && (
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-10 -mt-4"
          >
            <a
              href={youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-l from-red-600/15 via-red-500/8 to-transparent border border-red-200/50 dark:border-red-500/20 hover:border-red-400/60 hover:shadow-xl hover:shadow-red-500/10 transition-all group overflow-hidden relative"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-red-500/30 group-hover:scale-110 group-hover:rotate-3 transition-transform bg-gradient-to-br from-[#e21246] to-[#b00d3a]">
                <Youtube className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-foreground">
                  {youtubeLabel || t.youtubeBtn}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {youtubeSubText || t.youtubeSub}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-red-500/10 flex items-center justify-center shrink-0 group-hover:bg-red-500/20 transition-colors">
                <ExternalLink className="w-4 h-4 text-red-500 shrink-0 group-hover:scale-110 transition-transform" />
              </div>
            </a>
          </motion.section>
        )}

        {/* Featured Books */}
        {featuredBooks.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-accent" />
                </span>
                {t.featuredBooks}
              </h2>
              <Link
                to="/books"
                className="text-sm text-primary font-bold hover:underline flex items-center gap-1 hover:gap-2 transition-all"
              >
                {t.viewAll}
                <ChevronLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredBooks.slice(0, 4).map((book, i) => (
                <BookCard
                  key={book.id}
                  book={book}
                  index={i}
                  isFavorite={favorites.includes(book.id)}
                  onToggleFavorite={user ? handleToggleFavorite : null}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State if no books */}
        {recentBooks.length === 0 && featuredBooks.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">{t.emptyLib}</h3>
            <p className="text-sm text-muted-foreground">{t.emptyLibSub}</p>
          </div>
        )}

        {/* Video Channels Showcase */}
        <HomeChannels />

        {/* Social Channels */}
        <SocialChannelsSection />
      </div>
    </PullToRefresh>
  );
}