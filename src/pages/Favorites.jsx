import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Heart, BookOpen, Video, Search, X, Compass } from "lucide-react";
import BookCard from "../components/BookCard";
import VideoCard from "@/components/VideoCard";
import VideoPlayer from "@/components/VideoPlayer";
import ShortsPlayerModal from "@/components/ShortsPlayerModal";
import { SkeletonGrid } from "../components/Skeleton";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n";
import { getBooks, getVideos, getFavoriteIds, toggleFavorite } from "@/lib/offlineSync";
import {
  getAccountEmail,
  getVideoFavIds,
  setVideoFavIds as saveVideoFavIds,
  markVideoWatched,
} from "@/lib/activeUser";
import { useContentRefresh } from "@/hooks/useContentSync";
import PullToRefresh from "@/components/PullToRefresh";
import { forceSyncNow } from "@/lib/contentSyncEngine";
import { toast } from "sonner";

export default function Favorites() {
  const t = useT();
  const [books, setBooks] = useState([]);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [videos, setVideos] = useState([]);
  const [videoFavIds, setVideoFavIds] = useState([]);
  const [tab, setTab] = useState("books");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Modal player states
  const [playingVideo, setPlayingVideo] = useState(null);
  const [playingShort, setPlayingShort] = useState(null);

  const loadFavorites = async () => {
    const u = await base44.auth.me().catch(() => null);
    setUser(u);
    const em = getAccountEmail(u);
    setVideoFavIds(getVideoFavIds(em));
    setVideos((await getVideos()) || []);

    if (!u) {
      setLoading(false);
      return;
    }
    const ids = await getFavoriteIds(em);
    setFavoriteIds(ids);
    if (ids.length > 0) {
      const allBooks = await getBooks();
      setBooks((allBooks || []).filter((b) => ids.includes(b.id)));
    } else {
      setBooks([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  useContentRefresh(["books", "videos"], loadFavorites);

  const handleToggleFavorite = async (bookId) => {
    if (!user) return;
    await toggleFavorite(bookId, getAccountEmail(user));
    setFavoriteIds((prev) => prev.filter((id) => id !== bookId));
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
    toast.success(t.removeFav || "تمت الإزالة من المفضلة");
  };

  const handleToggleVideoFav = (videoId) => {
    const next = videoFavIds.filter((id) => id !== videoId);
    setVideoFavIds(next);
    saveVideoFavIds(getAccountEmail(user), next);
    toast.success(t.removeFav || "تمت الإزالة من المفضلة");
  };

  const handlePlayVideo = (vid) => {
    if (!vid) return;
    const isShort =
      vid.video_type === "short" || vid.youtube_url?.includes("/shorts/");
    if (isShort) {
      setPlayingShort(vid);
    } else {
      if (vid.id) {
        markVideoWatched(getAccountEmail(user), vid.id);
      }
      setPlayingVideo(vid);
    }
  };

  const handleShare = async (vid) => {
    if (navigator.share) {
      try {
        await navigator.share({ title: vid.title, url: vid.youtube_url });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(vid.youtube_url);
        toast.success(t.linkCopied || "تم نسخ الرابط");
      } catch {}
    }
  };

  const favoriteVideos = useMemo(() => {
    return videos.filter((v) => videoFavIds.includes(v.id));
  }, [videos, videoFavIds]);

  const filteredBooks = useMemo(() => {
    if (!search) return books;
    const q = search.toLowerCase();
    return books.filter(
      (b) =>
        b.title?.toLowerCase().includes(q) ||
        b.author?.toLowerCase().includes(q) ||
        b.category?.toLowerCase().includes(q)
    );
  }, [books, search]);

  const filteredVideos = useMemo(() => {
    if (!search) return favoriteVideos;
    const q = search.toLowerCase();
    return favoriteVideos.filter(
      (v) =>
        v.title?.toLowerCase().includes(q) ||
        v.channel_name?.toLowerCase().includes(q) ||
        v.category?.toLowerCase().includes(q)
    );
  }, [favoriteVideos, search]);

  const allShorts = useMemo(() => {
    return videos.filter(
      (v) =>
        v.visible !== false &&
        (v.video_type === "short" || v.youtube_url?.includes("/shorts/"))
    );
  }, [videos]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SkeletonGrid count={6} />
      </div>
    );
  }

  const hasAnyFavorites = books.length > 0 || favoriteVideos.length > 0;

  return (
    <PullToRefresh
      onRefresh={async () => {
        await forceSyncNow();
        await loadFavorites();
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[80vh]">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
            <Heart className="w-6 h-6 text-red-500 fill-red-500" />
            {t.favorites}
          </h1>
          <p className="text-sm text-muted-foreground">{t.favoritesSub}</p>
        </div>

        {/* Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => {
                setTab("books");
                setSearch("");
              }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-bold transition-all rounded-[4px_20px_4px_20px] ${
                tab === "books"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{t.navBooks}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  tab === "books"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {books.length}
              </span>
            </button>

            <button
              onClick={() => {
                setTab("videos");
                setSearch("");
              }}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-bold transition-all rounded-[4px_20px_4px_20px] ${
                tab === "videos"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <Video className="w-4 h-4" />
              <span>{t.navVideos}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  tab === "videos"
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {favoriteVideos.length}
              </span>
            </button>
          </div>

          {/* Quick search inside favorites if there are items */}
          {((tab === "books" && books.length > 1) ||
            (tab === "videos" && favoriteVideos.length > 1)) && (
            <div className="relative w-full sm:w-64 group">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                placeholder={tab === "books" ? "بحث في مفضلة الكتب..." : "بحث في مفضلة الفيديوهات..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pr-9 pl-8 h-10 rounded-xl bg-card border-border text-xs focus-visible:border-primary"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Content Area */}
        {tab === "books" ? (
          filteredBooks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredBooks.map((book, i) => (
                <BookCard
                  key={book.id}
                  book={book}
                  index={i}
                  isFavorite={true}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-card/40 rounded-3xl border border-dashed border-border/80 p-6">
              <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Heart className="w-10 h-10 text-red-500/40" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">
                {search ? t.noResults || "لا توجد نتائج مطابقة" : t.noFavorites}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">
                {search
                  ? "جرّب البحث بكلمة أخرى في قائمتك المفضلة"
                  : t.noFavoritesSub}
              </p>
              {!search && (
                <Link
                  to="/books"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[4px_20px_4px_20px] bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:bg-primary/95 transition-all"
                >
                  <Compass className="w-4 h-4" />
                  {t.browseLib || "تصفح المكتبة الآن"}
                </Link>
              )}
            </div>
          )
        ) : filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVideos.map((v, i) => (
              <VideoCard
                key={v.id}
                video={v}
                index={i}
                isFavorite={true}
                onToggleFavorite={handleToggleVideoFav}
                onPlay={() => handlePlayVideo(v)}
                onShare={() => handleShare(v)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card/40 rounded-3xl border border-dashed border-border/80 p-6">
            <div className="w-20 h-20 rounded-3xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Video className="w-10 h-10 text-red-500/40" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">
              {search
                ? t.noResults || "لا توجد نتائج مطابقة"
                : t.noVideoFavorites}
            </h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">
              {search
                ? "جرّب البحث بكلمة أخرى في قائمتك المفضلة"
                : t.noVideoFavoritesSub}
            </p>
            {!search && (
              <Link
                to="/videos"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[4px_20px_4px_20px] bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:bg-primary/95 transition-all"
              >
                <Compass className="w-4 h-4" />
                {t.watchVideos || "استكشف الفيديوهات"}
              </Link>
            )}
          </div>
        )}

        {/* Modal Video Player for Normal Videos */}
        {playingVideo && (
          <VideoPlayer
            video={playingVideo}
            onClose={() => setPlayingVideo(null)}
          />
        )}

        {/* Shorts Player Modal */}
        {playingShort && (
          <ShortsPlayerModal
            initialShort={playingShort}
            allShorts={allShorts}
            onClose={() => setPlayingShort(null)}
          />
        )}
      </div>
    </PullToRefresh>
  );
}