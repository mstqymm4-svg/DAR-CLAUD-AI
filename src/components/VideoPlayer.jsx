import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Maximize, Minimize, Play, Pause, RotateCcw, Volume2, VolumeX,
  Share2, Rewind, FastForward, Repeat, SkipBack, SkipForward,
  ListVideo, Sun, HelpCircle, Gauge
} from "lucide-react";
import { extractYoutubeId } from "@/components/dev/DevVideos";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";
import { usePlayerGestures } from "@/hooks/usePlayerGestures";
import PlaylistPanel from "@/components/video/PlaylistPanel";
import PlayerButton from "@/components/video/PlayerButton";
import OfflineVideoNotice from "@/components/video/OfflineVideoNotice";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

export default function VideoPlayer({ video, onClose, playlist = [], onSelectVideo }) {
  const t = useT();
  const { isOnline } = useOnlineStatus();
  const containerRef = useRef(null);
  const playerInstanceRef = useRef(null);
  const hideTimerRef = useRef(null);
  const barRef = useRef(null);
  const [player, setPlayer] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedPct, setBufferedPct] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [ready, setReady] = useState(false);
  const [restoreTime, setRestoreTime] = useState(0);
  const [rate, setRate] = useState(1);
  const [loop, setLoop] = useState(false);
  const loopRef = useRef(false);
  const [feedbackPill, setFeedbackPill] = useState(null);
  const feedbackTimerRef = useRef(null);

  const showPill = (text) => {
    setFeedbackPill(text);
    clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setFeedbackPill(null), 1200);
  };

  // Auto-advance countdown state
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState(null);
  const [autoAdvanceSeconds, setAutoAdvanceSeconds] = useState(5);

  const videoId = extractYoutubeId(video?.youtube_url);

  // ── Playlist navigation ──
  const plIdx = playlist.findIndex((v) => v.id === video.id);
  const nextItem = plIdx >= 0 && plIdx < playlist.length - 1 ? playlist[plIdx + 1] : null;
  const prevItem = plIdx > 0 ? playlist[plIdx - 1] : null;
  const nextItemRef = useRef(null);
  const onSelectVideoRef = useRef(null);
  nextItemRef.current = nextItem;
  onSelectVideoRef.current = onSelectVideo;

  // Restore last position
  useEffect(() => {
    if (!videoId) return;
    const saved = localStorage.getItem(`video_pos_${videoId}`);
    if (saved) setRestoreTime(Number(saved));
  }, [videoId]);

  // Handle auto-advance countdown
  useEffect(() => {
    if (autoAdvanceTimer === null) return;
    if (autoAdvanceSeconds <= 0) {
      if (nextItemRef.current && onSelectVideoRef.current) {
        onSelectVideoRef.current(nextItemRef.current);
      }
      setAutoAdvanceTimer(null);
      return;
    }
    const interval = setInterval(() => {
      setAutoAdvanceSeconds((s) => s - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [autoAdvanceTimer, autoAdvanceSeconds]);

  const cancelAutoAdvance = () => {
    setAutoAdvanceTimer(null);
    setAutoAdvanceSeconds(5);
  };

  const playNextNow = () => {
    if (nextItemRef.current && onSelectVideoRef.current) {
      onSelectVideoRef.current(nextItemRef.current);
    }
    cancelAutoAdvance();
  };

  // Initialize YouTube IFrame API player
  useEffect(() => {
    if (!videoId) return;
    let cancelled = false;

    const initPlayer = () => {
      if (cancelled || !window.YT?.Player) return;
      playerInstanceRef.current = new window.YT.Player("yt-player-container", {
        videoId,
        playerVars: {
          autoplay: 1, controls: 0, modestbranding: 1, rel: 0,
          playsinline: 1, iv_load_policy: 3, fs: 0, disablekb: 1,
          start: restoreTime || 0,
        },
        events: {
          onReady: (e) => {
            if (cancelled) return;
            setPlayer(e.target);
            setDuration(e.target.getDuration());
            setReady(true);
            try {
              setVolume(e.target.getVolume() || 100);
              setMuted(e.target.isMuted() || false);
            } catch {}
            e.target.playVideo();
          },
          onStateChange: (e) => {
            if (cancelled) return;
            const isNowPlaying = e.data === window.YT.PlayerState.PLAYING;
            setPlaying(isNowPlaying);
            if (isNowPlaying) {
              setDuration(e.target.getDuration());
              cancelAutoAdvance();
            } else if (e.data === window.YT.PlayerState.ENDED) {
              if (loopRef.current) {
                e.target.seekTo(0, true);
                e.target.playVideo();
              } else if (nextItemRef.current) {
                // Trigger auto-advance countdown
                setAutoAdvanceSeconds(5);
                setAutoAdvanceTimer(true);
              }
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }
      const interval = setInterval(() => {
        if (window.YT?.Player) { clearInterval(interval); initPlayer(); }
      }, 100);
      return () => { cancelled = true; clearInterval(interval); };
    }

    return () => {
      cancelled = true;
      if (playerInstanceRef.current) {
        try { playerInstanceRef.current.destroy(); } catch(e) {}
      }
    };
  }, [videoId]);

  // Time update polling + save position
  useEffect(() => {
    if (!player) return;
    const interval = setInterval(() => {
      try {
        const cur = player.getCurrentTime() || 0;
        setCurrentTime(cur);
        const d = player.getDuration();
        if (d) setDuration(d);
        const loaded = player.getVideoLoadedFraction?.();
        if (typeof loaded === "number" && d) setBufferedPct(loaded * 100);
        if (videoId && cur > 0) {
          localStorage.setItem(`video_pos_${videoId}`, String(Math.floor(cur)));
        }
      } catch(e) {}
    }, 250);
    return () => clearInterval(interval);
  }, [player, videoId]);

  // Fullscreen handling
  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e) => {
      if (e.target?.tagName === "INPUT" || e.target?.tagName === "TEXTAREA") return;
      if (e.key === "Escape") {
        if (showShortcutsModal) setShowShortcutsModal(false);
        else if (showSpeedMenu) setShowSpeedMenu(false);
        else if (showPlaylist) setShowPlaylist(false);
        else if (document.fullscreenElement) document.exitFullscreen();
        else onClose?.();
      } else if (e.key === " " && player) {
        e.preventDefault();
        if (playing) player.pauseVideo();
        else player.playVideo();
      } else if (e.key === "ArrowLeft" && player) {
        e.preventDefault();
        player.seekTo(Math.max(0, (player.getCurrentTime?.() || 0) - 5), true);
      } else if (e.key === "ArrowRight" && player) {
        e.preventDefault();
        player.seekTo((player.getCurrentTime?.() || 0) + 5, true);
      } else if (e.key === "ArrowUp" && player) {
        e.preventDefault();
        if (muted) { player.unMute(); setMuted(false); }
        const newVol = Math.min(100, (player.getVolume?.() || 100) + 10);
        player.setVolume?.(newVol);
        setVolume(newVol);
      } else if (e.key === "ArrowDown" && player) {
        e.preventDefault();
        const newVol = Math.max(0, (player.getVolume?.() || 100) - 10);
        player.setVolume?.(newVol);
        setVolume(newVol);
      } else if (e.key === "m" || e.key === "M") {
        toggleMute();
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      } else if (e.key === "l" || e.key === "L") {
        toggleLoop();
      } else if (e.key === "?") {
        setShowShortcutsModal((s) => !s);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [player, playing, onClose, muted, showShortcutsModal, showSpeedMenu, showPlaylist]);

  // Touch gestures
  const getCurrentTime = useCallback(() => {
    try { return player?.getCurrentTime?.() || 0; } catch { return 0; }
  }, [player]);
  const { onTouchStart, onTouchMove, onTouchEnd, seekPreview, adjust, ripple, brightness } =
    usePlayerGestures({ player, duration, getCurrentTime });

  const togglePlay = () => {
    if (!player) return;
    if (playing) player.pauseVideo();
    else player.playVideo();
  };

  const handleRestart = () => {
    if (!player) return;
    player.seekTo(0, true);
    player.playVideo();
  };

  const skip = (sec) => {
    if (!player) return;
    const cur = (player.getCurrentTime?.() || 0) + sec;
    player.seekTo(Math.max(0, cur), true);
  };

  const selectSpeed = (s) => {
    if (!player?.setPlaybackRate) return;
    setRate(s);
    player.setPlaybackRate(s);
    setShowSpeedMenu(false);
    showPill(`سرعة التشغيل: ${s}x`);
  };

  const toggleLoop = () => {
    const v = !loop;
    setLoop(v);
    loopRef.current = v;
    showPill(v ? "وضع التكرار: مفعّل 🔁" : "وضع التكرار: معطّل");
  };

  // Draggable progress bar
  const seekFromClientX = (clientX) => {
    if (!player || !duration || !barRef.current) return;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const time = ratio * duration;
    player.seekTo(time, true);
    setCurrentTime(time);
  };

  const toggleMute = () => {
    if (!player) return;
    if (muted) {
      player.unMute();
      setMuted(false);
      const v = player.getVolume() || 100;
      setVolume(v === 0 ? 50 : v);
    } else {
      player.mute();
      setMuted(true);
    }
  };

  const handleVolumeChange = (newVal) => {
    if (!player) return;
    setVolume(newVal);
    player.setVolume(newVal);
    if (newVal === 0) {
      player.mute();
      setMuted(true);
    } else if (muted) {
      player.unMute();
      setMuted(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: video.title, url: video.youtube_url }); } catch(e) {}
    } else {
      try { await navigator.clipboard.writeText(video.youtube_url); toast.success(t.linkCopied); } catch(e) {}
    }
  };

  const showControlsTemp = () => {
    setShowControls(true);
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (playing && !showPlaylist && !showSpeedMenu && !showShortcutsModal) {
        setShowControls(false);
        setShowVolumeSlider(false);
      }
    }, 3500);
  };

  // Hide bottom nav while video player is open; restore on close
  useEffect(() => {
    const nav = document.getElementById("bottom-nav");
    if (nav) nav.style.transform = "translateY(100%)";
    return () => {
      if (nav) nav.style.transform = "translateY(0)";
      clearTimeout(hideTimerRef.current);
    };
  }, []);

  if (!isOnline) {
    return <OfflineVideoNotice video={video} onClose={onClose} />;
  }

  if (!videoId) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95" dir="rtl">
        <div className="text-center text-white p-8">
          <p className="text-lg font-bold mb-2">{t.invalidVideoUrl}</p>
          <button onClick={onClose} className="text-primary hover:underline">{t.close}</button>
        </div>
      </div>
    );
  }

  const progressPct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[60] bg-black flex flex-col select-none overflow-hidden"
      dir="rtl"
      onMouseMove={showControlsTemp}
      onClick={showControlsTemp}
    >
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {/* Ambient Cinema Backdrop Glow */}
        {video?.thumbnail && (
          <div
            className="absolute inset-0 opacity-25 filter blur-3xl scale-125 pointer-events-none transition-opacity duration-700"
            style={{
              backgroundImage: `url(${video.thumbnail})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}

        {/* YouTube iframe container */}
        <div
          className="w-full h-full relative z-[2] transition-filter duration-200"
          style={{ filter: `brightness(${brightness})` }}
        >
          <div id="yt-player-container" className="w-full h-full pointer-events-none" />
        </div>

        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {/* Gesture capture layer */}
        <div
          className="absolute inset-0 z-[5]"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onDoubleClick={toggleFullscreen}
        />

        {/* Double-tap ripple feedback */}
        <AnimatePresence>
          {ripple && (
            <motion.div
              key={ripple.key}
              initial={{ opacity: 0.4, scale: 0.5 }}
              animate={{ opacity: 0, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className={`absolute top-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-white/20 pointer-events-none z-[15] flex items-center justify-center text-white font-bold text-lg ${
                ripple.side === "left" ? "start-[10%]" : "end-[10%]"
              }`}
            >
              {ripple.side === "left" ? "-10s" : "+10s"}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Seek / volume / brightness indicator overlay */}
        {(seekPreview || adjust) && (
          <div
            dir="ltr"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[15] px-5 py-2.5 rounded-2xl bg-black/85 backdrop-blur-md text-white text-sm font-bold flex items-center gap-2 pointer-events-none shadow-2xl ring-1 ring-white/10"
          >
            {seekPreview && (
              <>
                {seekPreview.delta < 0 ? <Rewind className="w-4 h-4" /> : <FastForward className="w-4 h-4" />}
                {formatTime(seekPreview.time)}
                <span className="text-white/60 text-xs">
                  ({seekPreview.delta >= 0 ? "+" : ""}{Math.round(seekPreview.delta)}s)
                </span>
              </>
            )}
            {adjust?.type === "volume" && (<><Volume2 className="w-4 h-4" />{adjust.value}%</>)}
            {adjust?.type === "brightness" && (<><Sun className="w-4 h-4" />{adjust.value}%</>)}
          </div>
        )}

        {/* Momentary action feedback pill (Speed / Loop) */}
        <AnimatePresence>
          {feedbackPill && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: -10 }}
              className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-2xl bg-black/85 backdrop-blur-xl border border-white/20 text-white font-bold text-xs shadow-2xl pointer-events-none flex items-center gap-2"
            >
              <span>{feedbackPill}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Playlist panel */}
        <PlaylistPanel
          show={showPlaylist}
          videos={playlist}
          currentIndex={plIdx}
          onSelect={(v) => { setShowPlaylist(false); onSelectVideo?.(v); }}
          onClose={() => setShowPlaylist(false)}
        />

        {/* Keyboard Shortcuts Modal */}
        <AnimatePresence>
          {showShortcutsModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-black/75 backdrop-blur-md flex items-center justify-center p-4"
              onClick={() => setShowShortcutsModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 10 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 10 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-stone-900 border border-white/15 rounded-3xl p-5 max-w-sm w-full text-white shadow-2xl space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <h3 className="text-sm font-bold flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-primary" />
                    <span>{t.shortcutsTitle}</span>
                  </h3>
                  <button onClick={() => setShowShortcutsModal(false)} className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-1.5 text-xs text-stone-200">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                    <span>تشغيل / إيقاف مؤقت</span>
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      <kbd className="px-2 py-0.5 rounded bg-white/10 border border-white/10 font-bold">Space</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                    <span>تقديم / ترجيع (5 ثوانٍ)</span>
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 font-bold">→</kbd>
                      <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 font-bold">←</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                    <span>رفع / خفض مستوى الصوت</span>
                    <div className="flex items-center gap-1 font-mono text-[11px]">
                      <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 font-bold">↑</kbd>
                      <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 font-bold">↓</kbd>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                    <span>ملء الشاشة</span>
                    <kbd className="px-2 py-0.5 rounded bg-white/10 border border-white/10 font-bold font-mono text-[11px]">F</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                    <span>كتم / تشغيل الصوت</span>
                    <kbd className="px-2 py-0.5 rounded bg-white/10 border border-white/10 font-bold font-mono text-[11px]">M</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                    <span>تكرار الفيديو</span>
                    <kbd className="px-2 py-0.5 rounded bg-white/10 border border-white/10 font-bold font-mono text-[11px]">L</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                    <span>إغلاق المشغل</span>
                    <kbd className="px-2 py-0.5 rounded bg-white/10 border border-white/10 font-bold font-mono text-[11px]">Esc</kbd>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auto-Advance Countdown Banner */}
        <AnimatePresence>
          {autoAdvanceTimer && nextItem && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="absolute bottom-28 inset-x-4 max-w-md mx-auto z-30 p-4 rounded-2xl bg-black/90 backdrop-blur-xl border border-white/15 shadow-2xl flex items-center justify-between gap-3 text-white"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 font-bold text-primary">
                  {autoAdvanceSeconds}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] text-white/70">{t.autoPlayingNext}</p>
                  <p className="text-xs font-bold truncate text-white">{nextItem.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={playNextNow}
                  className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 active:scale-95 transition-all flex items-center gap-1"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{t.playNow}</span>
                </button>
                <button
                  onClick={cancelAutoAdvance}
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 text-xs active:scale-95 transition-all"
                >
                  {t.cancel}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Top Header Controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 via-black/50 to-transparent px-4 pt-4 pb-12 flex items-start justify-between gap-4 pointer-events-none z-20"
            >
              <div className="flex-1 min-w-0 text-white pointer-events-auto">
                <h2 className="text-base sm:text-lg font-bold truncate drop-shadow-sm leading-tight">{video.title}</h2>
                {video.channel_name && (
                  <p className="text-[12px] text-white/70 mt-0.5 truncate flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span>{video.channel_name}</span>
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 pointer-events-auto shrink-0">
                <button
                  onClick={() => setShowShortcutsModal(true)}
                  title={t.shortcutsTitle}
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/15 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={handleShare}
                  title={t.share}
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/15 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  title={t.close}
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md ring-1 ring-white/15 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Center play button when paused */}
        <AnimatePresence>
          {ready && !playing && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="absolute inset-0 flex items-center justify-center z-15"
            >
              <div className="w-20 h-20 rounded-full bg-primary/90 backdrop-blur-md ring-4 ring-white/20 flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform">
                <Play className="w-9 h-9 text-white fill-white mr-1" />
              </div>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Bottom player controls */}
        <AnimatePresence>
          {showControls && ready && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-4 pt-16 pb-4 pointer-events-none z-20"
            >
              {/* Progress bar */}
              <div className="flex items-center gap-3 mb-2.5 pointer-events-auto">
                <span className="text-[11px] text-white font-mono w-12 text-center shrink-0 select-none">
                  {formatTime(currentTime)}
                </span>
                <div
                  ref={barRef}
                  dir="ltr"
                  className="relative flex-1 h-7 flex items-center cursor-pointer touch-none group"
                  onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); seekFromClientX(e.clientX); }}
                  onPointerMove={(e) => { if (e.buttons === 1) seekFromClientX(e.clientX); }}
                >
                  <div className="relative w-full h-1.5 rounded-full bg-white/20 transition-all group-hover:h-2.5">
                    <div className="absolute inset-y-0 left-0 rounded-full bg-white/30" style={{ width: `${bufferedPct}%` }} />
                    <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-accent" style={{ width: `${progressPct}%` }} />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.6)] transition-transform group-hover:scale-125"
                      style={{ left: `${progressPct}%` }}
                    />
                  </div>
                </div>
                <span className="text-[11px] text-white/80 font-mono w-12 text-center shrink-0 select-none">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Primary control buttons row */}
              <div className="flex items-center justify-center gap-3.5 pointer-events-auto mb-2" onClick={(e) => e.stopPropagation()}>
                <PlayerButton onClick={() => prevItem && onSelectVideo?.(prevItem)} disabled={!prevItem} title={t.prevVideo}>
                  <SkipBack className="w-5 h-5" />
                </PlayerButton>
                <PlayerButton onClick={() => skip(-10)} title="-10s">
                  <Rewind className="w-5 h-5" />
                </PlayerButton>
                <PlayerButton onClick={togglePlay} primary size="lg" title={t.play}>
                  {playing ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 fill-white ml-0.5" />}
                </PlayerButton>
                <PlayerButton onClick={() => skip(10)} title="+10s">
                  <FastForward className="w-5 h-5" />
                </PlayerButton>
                <PlayerButton onClick={() => nextItem && onSelectVideo?.(nextItem)} disabled={!nextItem} title={t.nextVideo}>
                  <SkipForward className="w-5 h-5" />
                </PlayerButton>
              </div>

              {/* Secondary Controls Bar */}
              <div className="flex items-center justify-center gap-1.5 pointer-events-auto relative" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/[0.08] backdrop-blur-xl ring-1 ring-white/15 shadow-xl">
                  {/* Restart */}
                  <PlayerButton onClick={handleRestart} size="sm" title={t.restartPlayback}>
                    <RotateCcw className="w-4 h-4" />
                  </PlayerButton>

                  {/* Speed Popover Toggle */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSpeedMenu((s) => !s)}
                      title={t.speedLabel}
                      className={`h-9 px-3 rounded-full flex items-center gap-1 text-xs font-bold transition-all shrink-0 ${
                        rate !== 1
                          ? "bg-primary text-primary-foreground shadow"
                          : "bg-white/10 hover:bg-white/20 text-white"
                      }`}
                    >
                      <Gauge className="w-3.5 h-3.5" />
                      <span>{rate}x</span>
                    </button>

                    {/* Speed options popover */}
                    {showSpeedMenu && (
                      <div className="absolute bottom-11 start-1/2 -translate-x-1/2 bg-stone-900/95 backdrop-blur-xl border border-white/15 rounded-2xl p-1.5 shadow-2xl flex flex-col gap-1 min-w-[70px] z-30">
                        {SPEED_OPTIONS.map((s) => (
                          <button
                            key={s}
                            onClick={() => selectSpeed(s)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-mono tabular-nums transition-colors text-center ${
                              rate === s
                                ? "bg-primary text-white font-bold"
                                : "text-white/80 hover:bg-white/10"
                            }`}
                          >
                            {s}x
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Loop toggle */}
                  <PlayerButton onClick={toggleLoop} size="sm" active={loop} title={t.loopBtn}>
                    <Repeat className="w-4 h-4" />
                  </PlayerButton>

                  {/* Playlist drawer toggle */}
                  {playlist.length > 0 && (
                    <PlayerButton onClick={() => setShowPlaylist((s) => !s)} size="sm" active={showPlaylist} title={t.playlist}>
                      <ListVideo className="w-4 h-4" />
                    </PlayerButton>
                  )}

                  {/* Volume with responsive hover & tap popover */}
                  <div
                    className="relative flex items-center"
                    onMouseEnter={() => setShowVolumeSlider(true)}
                    onMouseLeave={() => setShowVolumeSlider(false)}
                  >
                    <PlayerButton
                      onClick={() => {
                        if (typeof window !== "undefined" && window.innerWidth < 640) {
                          setShowVolumeSlider((s) => !s);
                        } else {
                          toggleMute();
                        }
                      }}
                      size="sm"
                      title={t.shortcutMute}
                    >
                      {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </PlayerButton>

                    {showVolumeSlider && (
                      <div
                        dir="ltr"
                        className="absolute bottom-11 start-1/2 -translate-x-1/2 sm:static sm:translate-x-0 flex items-center px-2.5 py-1.5 bg-stone-900/95 backdrop-blur-xl rounded-full ring-1 ring-white/15 w-28 sm:w-24 sm:ms-1 shadow-2xl z-30 transition-all"
                      >
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={muted ? 0 : volume}
                          onChange={(e) => handleVolumeChange(Number(e.target.value))}
                          className="w-full accent-primary h-1.5 cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  {/* Fullscreen */}
                  <PlayerButton onClick={toggleFullscreen} size="sm" title={t.tbFullscreen}>
                    {fullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </PlayerButton>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}