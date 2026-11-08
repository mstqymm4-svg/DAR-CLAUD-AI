import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search, Video, Tv, Clock, Play, Heart, Share2,
  Filter, X, ExternalLink, ArrowUpDown, Film, Flame
} from "lucide-react";
import { toast } from "sonner";
import VideoPlayer from "@/components/VideoPlayer";
import ShortsPlayerModal from "@/components/ShortsPlayerModal";
import VideoCard from "@/components/VideoCard";
import { PageSpinner } from "@/components/Skeleton";
import { useT } from "@/lib/i18n";
import { base44 } from "@/api/base44Client";
import { getVideos, getVideoChannels } from "@/lib/offlineSync";
import {
  getAccountEmail,
  getVideoFavIds,
  setVideoFavIds,
  getWatchedVideoIds,
  markVideoWatched
} from "@/lib/activeUser";
import { useContentRefresh } from "@/hooks/useContentSync";
import SmartImage from "@/components/SmartImage";

export default function Videos() {
  const t = useT();
  const [videos, setVideos] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [selectedChannelId, setSelectedChannelId] = useState("all");
  const [videoTypeFilter, setVideoTypeFilter] = useState("all"); // 'all' | 'normal' | 'short' | 'live'
  const [sortBy, setSortBy] = useState("newest"); // 'newest' | 'oldest' | 'duration' | 'title'
  const [playingVideo, setPlayingVideo] = useState(null);
  const [playingShort, setPlayingShort] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [watchedIds, setWatchedIds] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ch = params.get("channel");
    if (ch) setSelectedChannelId(ch);
    const cat = params.get("category");
    if (cat) setCategory(cat);
  }, []);

  const loadData = () => {
    base44.auth.me().then((u) => {
      setUser(u);
      const email = getAccountEmail(u);
      setFavorites(getVideoFavIds(email));
      setWatchedIds(getWatchedVideoIds(email));
    }).catch(() => {
      const email = getAccountEmail(null);
      setFavorites(getVideoFavIds(email));
      setWatchedIds(getWatchedVideoIds(email));
    });

    Promise.all([
      getVideos(),
      getVideoChannels()
    ]).then(([vData, chData]) => {
      setVideos(vData || []);
      setChannels(chData || []);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, []);

  // Auto-refresh when videos or channels change in background
  useContentRefresh(["videos", "channels"], loadData);

  // Channels lookup map
  const channelsById = useMemo(() => {
    const map = {};
    for (const ch of channels) {
      if (ch.id) map[ch.id] = ch;
    }
    return map;
  }, [channels]);

  // Selected Channel Object
  const selectedChannel = useMemo(() => {
    if (selectedChannelId === "all") return null;
    return channelsById[selectedChannelId] || null;
  }, [selectedChannelId, channelsById]);

  // Distinct categories
  const categories = useMemo(() => {
    return [...new Set(videos.map((v) => v.category).filter(Boolean))];
  }, [videos]);

  // All Shorts in current context
  const allShorts = useMemo(() => {
    return videos.filter((v) =>
      v.visible !== false && (v.video_type === "short" || v.youtube_url?.includes("/shorts/"))
    );
  }, [videos]);

  // Helper to parse duration string (e.g. "14:20" or "1:02:15") into seconds for sorting
  const parseDurationToSeconds = (dur) => {
    if (!dur) return 0;
    const parts = String(dur).split(":").map(Number);
    if (parts.some(isNaN)) return 0;
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] || 0;
  };

  // Filtered & Sorted videos
  const filtered = useMemo(() => {
    let result = videos.filter((v) => {
      // Visibility filter
      if (v.visible === false) return false;

      // Category filter
      if (category !== "all" && v.category !== category) return false;

      // Channel filter
      if (selectedChannelId !== "all") {
        if (v.channel_id) {
          if (v.channel_id !== selectedChannelId) return false;
        } else {
          const selectedCh = channelsById[selectedChannelId];
          if (!selectedCh || v.channel_name !== selectedCh.name) return false;
        }
      }

      // Video Type filter
      if (videoTypeFilter !== "all") {
        const isShort = v.video_type === "short" || v.youtube_url?.includes("/shorts/");
        if (videoTypeFilter === "short" && !isShort) return false;
        if (videoTypeFilter === "normal" && (isShort || v.video_type === "live")) return false;
        if (videoTypeFilter === "live" && v.video_type !== "live") return false;
      }

      // Search query
      if (search) {
        const q = search.toLowerCase();
        const titleMatch = v.title?.toLowerCase().includes(q);
        const channelMatch = v.channel_name?.toLowerCase().includes(q);
        const descMatch = v.description?.toLowerCase().includes(q);
        if (!titleMatch && !channelMatch && !descMatch) return false;
      }

      return true;
    });

    // Sorting
    return result.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_date || 0) - new Date(a.created_date || 0);
      }
      if (sortBy === "oldest") {
        return new Date(a.created_date || 0) - new Date(b.created_date || 0);
      }
      if (sortBy === "duration") {
        return parseDurationToSeconds(b.duration) - parseDurationToSeconds(a.duration);
      }
      if (sortBy === "title") {
        return (a.title || "").localeCompare(b.title || "", "ar");
      }
      return 0;
    });
  }, [videos, search, category, selectedChannelId, videoTypeFilter, sortBy, channelsById]);

  // Featured video for spotlight
  const featuredVideo = useMemo(() => {
    const list = videos.filter((v) => v.visible !== false && v.is_featured);
    return list.length > 0 ? list[0] : (videos.find((v) => v.visible !== false) || null);
  }, [videos]);

  const toggleFavorite = (videoId) => {
    const email = getAccountEmail(user);
    const next = favorites.includes(videoId)
      ? favorites.filter((id) => id !== videoId)
      : [...favorites, videoId];
    setFavorites(next);
    setVideoFavIds(email, next);
    toast.success(favorites.includes(videoId) ? (t.removeFav || "تمت الإزالة من المفضلة") : (t.addFav || "تمت الإضافة إلى المفضلة"));
  };

  // Open appropriate player (Shorts vs Normal Player)
  const handlePlayVideo = (v) => {
    if (!v) return;
    const isShort = v.video_type === "short" || v.youtube_url?.includes("/shorts/");
    if (isShort) {
      setPlayingShort(v);
    } else {
      if (v?.id) {
        const email = getAccountEmail(user);
        markVideoWatched(email, v.id);
        setWatchedIds((prev) => prev.includes(v.id) ? prev : [...prev, v.id]);
      }
      setPlayingVideo(v);
    }
  };

  const handleShare = async (video) => {
    if (navigator.share) {
      try {
        await navigator.share({ title: video.title, url: video.youtube_url });
      } catch (e) {}
    } else {
      try {
        await navigator.clipboard.writeText(video.youtube_url);
        toast.success(t.linkCopied || "تم نسخ الرابط");
      } catch (e) {}
    }
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="pb-16 min-h-screen" dir={t.dir}>
      {/* ─── Hero Spotlight Section (Only when on home view) ───────────────── */}
      {featuredVideo && !search && selectedChannelId === "all" && category === "all" && videoTypeFilter === "all" && (
        <div className="relative bg-gradient-to-b from-primary/15 via-primary/5 to-transparent border-b border-border/40 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(#1c5c46_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Column: Spotlight details */}
              <div className="lg:col-span-7 space-y-4 text-right">
                {featuredVideo.duration && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-black/5 dark:bg-white/10 text-foreground">
                      <Clock className="w-3 h-3 text-primary" /> {featuredVideo.duration}
                    </span>
                  </div>
                )}

                <h1
                  onClick={() => handlePlayVideo(featuredVideo)}
                  className="text-2xl sm:text-3xl lg:text-4xl font-black leading-tight cursor-pointer hover:text-primary transition-colors"
                >
                  {featuredVideo.title}
                </h1>

                {featuredVideo.channel_name && (
                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs">
                      📺
                    </span>
                    {featuredVideo.channel_name}
                  </p>
                )}

                {featuredVideo.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 max-w-xl leading-relaxed">
                    {featuredVideo.description}
                  </p>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    size="lg"
                    onClick={() => handlePlayVideo(featuredVideo)}
                    className="h-11 px-6 rounded-xl font-bold text-sm gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/95 text-primary-foreground"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                    {t.watchNow || "مشاهدة الآن"}
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-11 w-11 rounded-xl border-border bg-card/80 hover:bg-card"
                    title={favorites.includes(featuredVideo.id) ? (t.removeFav || "إزالة") : (t.addFav || "تفضيل")}
                    onClick={() => toggleFavorite(featuredVideo.id)}
                  >
                    <Heart className={`w-5 h-5 ${favorites.includes(featuredVideo.id) ? "fill-red-500 text-red-500" : ""}`} />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-11 w-11 rounded-xl border-border bg-card/80 hover:bg-card"
                    title="مشاركة"
                    onClick={() => handleShare(featuredVideo)}
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Right Column: Thumbnail Preview */}
              <div className="lg:col-span-5">
                <div
                  onClick={() => handlePlayVideo(featuredVideo)}
                  className="relative aspect-video rounded-2xl overflow-hidden shadow-2xl border-2 border-primary/20 group cursor-pointer"
                >
                  {featuredVideo.thumbnail && (
                    <SmartImage
                      src={featuredVideo.thumbnail}
                      alt={featuredVideo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-2xl ring-4 ring-white/30 transform group-hover:scale-110 transition-transform">
                      <Play className="w-7 h-7 fill-current ml-1" />
                    </div>
                  </div>
                  {featuredVideo.duration && (
                    <div className="absolute bottom-3 left-3 px-2 py-1 rounded-md bg-black/85 text-white text-xs font-mono font-medium flex items-center gap-1 shadow">
                      <Clock className="w-3 h-3 text-primary-foreground" /> {featuredVideo.duration}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Dedicated Channel Profile Banner (when a channel is selected) ─── */}
      {selectedChannel && (
        <div className="bg-card border-b border-border py-6 sm:py-8 px-4 sm:px-6 lg:px-8 shadow-sm">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-right">
            <div className="relative group shrink-0">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-primary/30 shadow-lg bg-red-500/10 flex items-center justify-center">
                {selectedChannel.channel_logo ? (
                  <img src={selectedChannel.channel_logo} alt={selectedChannel.name} className="w-full h-full object-cover" />
                ) : (
                  <Tv className="w-10 h-10 text-red-500" />
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-foreground">
                  {selectedChannel.name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                  {filtered.length} {t.videosCount || "فيديو"}
                </span>
                {selectedChannel.category && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
                    {selectedChannel.category}
                  </span>
                )}
              </div>

              {selectedChannel.description && (
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 max-w-2xl leading-relaxed">
                  {selectedChannel.description}
                </p>
              )}

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                {selectedChannel.youtube_url && (
                  <a
                    href={selectedChannel.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {t.visitChannel || "زيارة القناة على يوتيوب"}
                  </a>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedChannelId("all")}
                  className="h-8 text-xs gap-1 rounded-xl"
                >
                  <X className="w-3.5 h-3.5" />
                  {t.allChannels || "عرض جميع القنوات"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Content Container ─────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-8">
        {/* Header Title when on simple view */}
        {!selectedChannel && (search || category !== "all" || videoTypeFilter !== "all" || !featuredVideo) && (
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div>
              <h1 className="text-2xl font-black flex items-center gap-2">
                <Video className="w-6 h-6 text-primary" /> {t.videosTitle || "الفيديوهات"}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">{t.videosSub || "شاهد الدروس والمحاضرات مباشرة"}</p>
            </div>
            <div className="text-xs text-muted-foreground">
              {filtered.length} {t.videosCount || "مقطع فيديو"}
            </div>
          </div>
        )}

        {/* ─── Channel Showcase Bar ─────────────────────────────────────────── */}
        {channels.length > 0 && !selectedChannel && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2 text-foreground">
                <Tv className="w-4 h-4 text-primary" /> {t.videoChannels || "قنوات الفيديو"}
              </h2>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide pt-1">
              {/* All channels button */}
              <button
                onClick={() => setSelectedChannelId("all")}
                className={`shrink-0 px-4 py-2.5 rounded-2xl border transition-all flex items-center gap-2.5 text-xs font-bold ${
                  selectedChannelId === "all"
                    ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                    : "bg-card border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <Tv className="w-4 h-4 text-current" />
                </div>
                <div className="text-right">
                  <p className="leading-tight">{t.allChannels || "جميع القنوات"}</p>
                  <span className="text-[10px] opacity-75 font-normal">{videos.length} {t.videosCount || "فيديو"}</span>
                </div>
              </button>

              {/* Individual channels */}
              {channels.map((ch) => {
                const count = videos.filter((v) => v.channel_id === ch.id || v.channel_name === ch.name).length;
                const isSelected = selectedChannelId === ch.id;

                return (
                  <div
                    key={ch.id}
                    onClick={() => setSelectedChannelId(isSelected ? "all" : ch.id)}
                    className={`shrink-0 min-w-[170px] max-w-[220px] rounded-2xl border p-2.5 transition-all cursor-pointer flex items-center gap-2.5 ${
                      isSelected
                        ? "bg-primary/10 border-primary shadow-md shadow-primary/10 ring-2 ring-primary/20"
                        : "bg-card border-border hover:border-primary/40 hover:-translate-y-0.5"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0 overflow-hidden border border-border/60">
                      {ch.channel_logo ? (
                        <SmartImage
                          src={ch.channel_logo}
                          alt={ch.name}
                          className="w-full h-full object-cover"
                          fallback={() => <Tv className="w-5 h-5 text-red-500" />}
                        />
                      ) : (
                        <Tv className="w-5 h-5 text-red-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 text-right">
                      <p className="text-xs font-bold truncate text-foreground">{ch.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{count} {t.videosCount || "فيديو"}</p>
                    </div>

                    {ch.youtube_url && (
                      <a
                        href={ch.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title="زيارة القناة على يوتيوب"
                        className="text-muted-foreground hover:text-red-600 p-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ─── Search, Filter and Sort Toolbar ──────────────────────────────── */}
        <section className="bg-card border border-border rounded-2xl p-4 shadow-sm space-y-3.5">
          {/* Top Row: Search input */}
          <div className="relative group">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder={t.searchVideo || "ابحث عن فيديو، درس، أو محاضرة..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 pl-9 h-11 rounded-xl bg-muted/40 border-border text-sm focus-visible:bg-background focus-visible:border-primary transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Middle Row: Video Types & Sort */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border/50">
            {/* Video Type Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
              {[
                { id: "all", label: t.all || "الكل" },
                { id: "normal", label: t.videoLectures || "محاضرات ودروس" },
                { id: "short", label: t.videoShorts || "مقاطع قصيرة (شورتس)" },
                { id: "live", label: t.videoLive || "بث مباشر" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setVideoTypeFilter(tab.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    videoTypeFilter === tab.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">{t.sortBy || "الترتيب"}:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-muted/70 border border-border rounded-lg px-2.5 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="newest">{t.sortNewest || "الأحدث أولاً"}</option>
                <option value="oldest">{t.sortOldest || "الأقدم أولاً"}</option>
                <option value="duration">{t.sortDuration || "الأطول مدة"}</option>
                <option value="title">{t.sortTitle || "العنوان (أبجدياً)"}</option>
              </select>
            </div>
          </div>

          {/* Bottom Row: Category Chips */}
          {categories.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-hide border-t border-border/40">
              <span className="text-xs text-muted-foreground shrink-0 ml-1 flex items-center gap-1">
                <Filter className="w-3 h-3" /> {t.category || "التصنيف"}:
              </span>
              <button
                onClick={() => setCategory("all")}
                className={`shrink-0 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  category === "all"
                    ? "bg-primary/15 text-primary border border-primary/30 font-bold"
                    : "bg-muted/50 text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.showAll || "الكل"}
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`shrink-0 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    category === c
                      ? "bg-primary/15 text-primary border border-primary/30 font-bold"
                      : "bg-muted/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ─── Active Filters Feedback Bar ──────────────────────────────────── */}
        {(search || selectedChannelId !== "all" || category !== "all" || videoTypeFilter !== "all") && (
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <p>
              {t.foundVideos ? t.foundVideos.replace("{count}", String(filtered.length)) : `تم العثور على ${filtered.length} مقطع فيديو`}
              {selectedChannelId !== "all" && channelsById[selectedChannelId] && (
                <> {t.inChannel ? t.inChannel.replace("{name}", channelsById[selectedChannelId].name) : `في قناة ${channelsById[selectedChannelId].name}`}</>
              )}
            </p>
            <button
              onClick={() => {
                setSearch("");
                setCategory("all");
                setSelectedChannelId("all");
                setVideoTypeFilter("all");
              }}
              className="text-primary hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> {t.resetFilters || "إعادة ضبط التصفية"}
            </button>
          </div>
        )}

        {/* ─── Dedicated Shorts Shelf (YouTube Shorts Style) ────────────────── */}
        {allShorts.length > 0 && videoTypeFilter !== "normal" && !search && (
          <section className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold flex items-center gap-2 text-foreground">
                <span className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-600">
                  <Flame className="w-4 h-4 fill-current" />
                </span>
                <span>{t.videoShorts || "مقاطع قصيرة (شورتس)"}</span>
              </h2>
              <span className="text-xs text-muted-foreground">
                {t.swipeForMoreShorts || "مرر وشاهد مثل يوتيوب"}
              </span>
            </div>

            <div className="flex gap-3.5 overflow-x-auto pb-3 pt-1 scrollbar-hide">
              {allShorts.map((sv) => (
                <div
                  key={sv.id}
                  onClick={() => handlePlayVideo(sv)}
                  className="shrink-0 w-36 sm:w-44 aspect-[9/16] rounded-2xl overflow-hidden relative group cursor-pointer border border-border shadow-md hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 bg-black"
                >
                  {sv.thumbnail && (
                    <img
                      src={sv.thumbnail}
                      alt={sv.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30" />
                  
                  {/* Play badge */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-11 h-11 rounded-full bg-purple-600/90 text-white flex items-center justify-center shadow-lg">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>

                  {/* Top Shorts Tag */}
                  <div className="absolute top-2.5 right-2.5">
                    <span className="px-2 py-0.5 rounded-md bg-purple-600 text-white text-[10px] font-bold shadow">
                      Shorts
                    </span>
                  </div>

                  {/* Bottom Title */}
                  <div className="absolute bottom-2.5 inset-x-2.5 text-right space-y-0.5">
                    <p className="text-xs font-bold text-white line-clamp-2 leading-tight drop-shadow">
                      {sv.title}
                    </p>
                    {sv.channel_name && (
                      <p className="text-[10px] text-white/75 truncate">{sv.channel_name}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── Main Videos Grid ─────────────────────────────────────────────── */}
        <section className="space-y-4">
          {videoTypeFilter !== "short" && (
            <div className="flex items-center justify-between border-b border-border/50 pb-2">
              <h2 className="text-base font-bold flex items-center gap-2 text-foreground">
                <Film className="w-4 h-4 text-primary" />
                <span>{selectedChannel ? (t.channelVideos || "فيديوهات القناة") : (t.recentVideos || "جميع الفيديوهات والمحاضرات")}</span>
              </h2>
              <span className="text-xs text-muted-foreground font-mono">
                {filtered.length} {t.videosCount || "فيديو"}
              </span>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border/60 rounded-3xl p-8 max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <Video className="w-8 h-8 opacity-40" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">
                  {t.noMatchingVideos || "لا توجد فيديوهات مطابقة للبحث"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  جرب البحث بكلمات أخرى أو اختر قناة أو تصنيفاً مختلفاً.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setCategory("all");
                  setSelectedChannelId("all");
                  setVideoTypeFilter("all");
                }}
                className="rounded-xl text-xs gap-1"
              >
                {t.showAll || "عرض جميع الفيديوهات"}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((v, i) => (
                <VideoCard
                  key={v.id}
                  video={v}
                  index={i}
                  channel={channelsById[v.channel_id]}
                  isFavorite={favorites.includes(v.id)}
                  isWatched={watchedIds.includes(v.id)}
                  onToggleFavorite={toggleFavorite}
                  onPlay={handlePlayVideo}
                  onShare={handleShare}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ─── Regular Video Player Modal ────────────────────────────────────── */}
      {playingVideo && (
        <VideoPlayer
          video={playingVideo}
          onClose={() => setPlayingVideo(null)}
          playlist={filtered.filter((v) => v.video_type !== "short" && !v.youtube_url?.includes("/shorts/"))}
          onSelectVideo={handlePlayVideo}
        />
      )}

      {/* ─── Dedicated Vertical Shorts Swipe Player Modal ──────────────────── */}
      {playingShort && (
        <ShortsPlayerModal
          initialVideo={playingShort}
          shortsList={allShorts.length > 0 ? allShorts : [playingShort]}
          isOpen={Boolean(playingShort)}
          onClose={() => setPlayingShort(null)}
          onToggleFavorite={toggleFavorite}
          favorites={favorites}
          user={user}
        />
      )}
    </div>
  );
}