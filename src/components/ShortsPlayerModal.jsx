import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Heart, Share2, Volume2, VolumeX, ChevronUp, ChevronDown,
  Sparkles, Tv
} from "lucide-react";
import { extractYoutubeId } from "@/lib/youtubeMeta";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { markVideoWatched, getAccountEmail } from "@/lib/activeUser";

export default function ShortsPlayerModal({
  initialVideo,
  shortsList = [],
  isOpen,
  onClose,
  onToggleFavorite,
  favorites = [],
  user = null,
}) {
  const t = useT();
  // Filter only shorts or use provided list
  const list = shortsList.length > 0 ? shortsList : (initialVideo ? [initialVideo] : []);
  const initialIndex = list.findIndex((v) => v.id === initialVideo?.id);
  const [currentIndex, setCurrentIndex] = useState(initialIndex >= 0 ? initialIndex : 0);
  const [muted, setMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [showHint, setShowHint] = useState(true);
  const [direction, setDirection] = useState(0); // 1 = next (down), -1 = prev (up)

  const currentVideo = list[currentIndex] || initialVideo;
  const videoId = extractYoutubeId(currentVideo?.youtube_url);

  // Sync index when initialVideo changes
  useEffect(() => {
    if (initialVideo) {
      const idx = list.findIndex((v) => v.id === initialVideo.id);
      if (idx >= 0) setCurrentIndex(idx);
    }
  }, [initialVideo, list]);

  // Record watched when currentVideo changes
  useEffect(() => {
    if (currentVideo?.id) {
      markVideoWatched(getAccountEmail(user), currentVideo.id);
    }
  }, [currentVideo, user]);

  // Hide swipe hint after 3.5 seconds
  useEffect(() => {
    setShowHint(true);
    const timer = setTimeout(() => setShowHint(false), 3500);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  const goToNext = useCallback(() => {
    if (currentIndex < list.length - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    } else {
      toast.info("وصلت إلى آخر مقطع قصير");
    }
  }, [currentIndex, list.length]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  // Keyboard navigation (ArrowDown / ArrowUp / Space / Escape)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        goToNext();
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        goToPrev();
      } else if (e.key === "Escape") {
        onClose();
      } else if (e.key === "m" || e.key === "M") {
        setMuted((m) => !m);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, goToNext, goToPrev, onClose]);

  // Throttled mouse wheel scroll navigation
  const wheelLockRef = useRef(false);
  const handleWheel = useCallback((e) => {
    if (wheelLockRef.current) return;
    if (Math.abs(e.deltaY) > 35) {
      wheelLockRef.current = true;
      if (e.deltaY > 0) {
        goToNext();
      } else {
        goToPrev();
      }
      setTimeout(() => {
        wheelLockRef.current = false;
      }, 650);
    }
  }, [goToNext, goToPrev]);

  // Touch gesture handling (Swipe up / down)
  const touchStartY = useRef(null);
  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };
  const handleTouchEnd = (e) => {
    if (touchStartY.current === null) return;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    if (deltaY < -45) {
      goToNext(); // Swipe Up -> Next short
    } else if (deltaY > 45) {
      goToPrev(); // Swipe Down -> Prev short
    }
    touchStartY.current = null;
  };

  const handleShare = async () => {
    if (!currentVideo) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: currentVideo.title, url: currentVideo.youtube_url });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(currentVideo.youtube_url);
        toast.success(t.linkCopied || "تم نسخ الرابط");
      } catch {}
    }
  };

  if (!isOpen || !currentVideo) return null;

  const isFav = currentVideo?.id && favorites.includes(currentVideo.id);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 select-none overflow-hidden"
      style={{ touchAction: "none" }}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      dir="rtl"
    >
      {/* Close button top corner */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-50 p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white/90 hover:text-white transition-colors border border-white/10 shadow-lg"
        title="إغلاق"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Main Shorts Container: 9:16 aspect ratio */}
      <div className="relative w-full h-full sm:h-[92vh] sm:max-w-[430px] sm:rounded-3xl overflow-hidden bg-black shadow-2xl flex flex-col justify-between border border-white/10">
        {/* Active Short Video (IFrame Embed) */}
        <div className="absolute inset-0 z-0 bg-black flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentVideo.id || videoId}
              initial={{ opacity: 0, y: direction * 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -direction * 80 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="w-full h-full relative"
            >
              {videoId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${muted ? 1 : 0}&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0&playsinline=1`}
                  title={currentVideo.title}
                  className="w-full h-full object-cover pointer-events-auto"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/50 p-6 text-center">
                  <Tv className="w-12 h-12 mb-3 opacity-40" />
                  <p className="text-sm">رابط الفيديو غير متوفر</p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Top Gradient & Short Index */}
        <div className="relative z-20 p-4 pt-3 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <span className="px-2.5 py-1 rounded-full bg-purple-600 text-white text-xs font-bold shadow-md flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> شورتس
            </span>
            <span className="text-xs text-white/80 font-mono bg-black/40 px-2 py-0.5 rounded-md border border-white/10">
              {currentIndex + 1} / {list.length}
            </span>
          </div>

          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setMuted((m) => !m)}
              className="p-2 rounded-full bg-black/50 hover:bg-black/70 text-white border border-white/10 transition-colors"
              title={muted ? "تشغيل الصوت" : "كتم الصوت"}
            >
              {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-white" />}
            </button>
          </div>
        </div>

        {/* Floating Right Actions (Vertical Bar) */}
        <div className="absolute right-3.5 bottom-24 z-30 flex flex-col items-center gap-3.5 text-white">
          {/* Favorite */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => onToggleFavorite?.(currentVideo.id)}
              className={`p-3 rounded-full backdrop-blur-md transition-transform active:scale-90 shadow-lg ${
                isFav
                  ? "bg-red-500 text-white"
                  : "bg-black/50 hover:bg-black/70 text-white border border-white/15"
              }`}
              title="إعجاب / مفضلة"
            >
              <Heart className={`w-5 h-5 ${isFav ? "fill-white" : ""}`} />
            </button>
            <span className="text-[10px] text-white/80 font-medium">مفضلة</span>
          </div>

          {/* Share */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleShare}
              className="p-3 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white border border-white/15 transition-transform active:scale-90 shadow-lg"
              title="مشاركة"
            >
              <Share2 className="w-5 h-5" />
            </button>
            <span className="text-[10px] text-white/80 font-medium">مشاركة</span>
          </div>

          {/* Prev Short (Up) */}
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0}
            className={`p-2.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white border border-white/15 transition-all active:scale-90 ${
              currentIndex === 0 ? "opacity-30 cursor-not-allowed" : "opacity-90 hover:opacity-100"
            }`}
            title="المقطع السابق (سهم للأعلى)"
          >
            <ChevronUp className="w-5 h-5" />
          </button>

          {/* Next Short (Down) */}
          <button
            onClick={goToNext}
            disabled={currentIndex === list.length - 1}
            className={`p-2.5 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-md text-white border border-white/15 transition-all active:scale-90 ${
              currentIndex === list.length - 1 ? "opacity-30 cursor-not-allowed" : "opacity-90 hover:opacity-100 animate-bounce"
            }`}
            title="المقطع التالي (سهم للأسفل)"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Overlay Info (Channel & Title) */}
        <div className="relative z-20 p-4 pb-6 bg-gradient-to-t from-black/95 via-black/70 to-transparent text-white space-y-2 pointer-events-auto pr-16">
          {/* Channel Name */}
          {currentVideo.channel_name && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/30 border border-primary/50 flex items-center justify-center font-bold text-xs text-primary-foreground shadow">
                📺
              </div>
              <span className="font-bold text-sm text-white drop-shadow">
                {currentVideo.channel_name}
              </span>
            </div>
          )}

          {/* Title */}
          <h2 className="text-sm font-semibold leading-snug line-clamp-2 text-white/95 drop-shadow">
            {currentVideo.title}
          </h2>

          {/* Swipe Hint overlay */}
          <AnimatePresence>
            {showHint && list.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] text-white/90 border border-white/20"
              >
                <ChevronUp className="w-3.5 h-3.5 animate-bounce" />
                <span>مرر للأعلى أو للأسفل للتنقل بين المقاطع</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
