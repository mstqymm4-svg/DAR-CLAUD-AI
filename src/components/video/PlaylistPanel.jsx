import { motion, AnimatePresence } from "framer-motion";
import { X, Play, ListVideo } from "lucide-react";
import { useT } from "@/lib/i18n";

/**
 * Slide-in playlist panel for the video player.
 * Highlights the currently playing video; tapping an item switches to it.
 */
export default function PlaylistPanel({ show, videos, currentIndex, onSelect, onClose }) {
  const t = useT();
  return (
    <AnimatePresence>
      {show && videos.length > 0 && (
        <motion.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          dir={t.dir}
          className="absolute inset-y-0 end-0 z-20 w-80 max-w-[88%] bg-black/85 backdrop-blur-xl border-s border-white/10 flex flex-col shadow-[-12px_0_40px_rgba(0,0,0,0.5)]"
        >
          <div className="flex items-center justify-between px-4 h-16 shrink-0 border-b border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-9 h-9 rounded-full bg-primary/20 ring-1 ring-primary/30 flex items-center justify-center shrink-0">
                <ListVideo className="w-4 h-4 text-primary" />
              </span>
              <div className="min-w-0">
                <h3 className="text-white text-sm font-bold truncate">{t.playlist}</h3>
                <p className="text-white/50 text-[10px]">
                  {currentIndex + 1} / {videos.length}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 active:scale-90 flex items-center justify-center text-white transition-all shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {videos.map((v, i) => {
              const current = i === currentIndex;
              return (
                <button
                  key={v.id}
                  onClick={() => onSelect(v)}
                  className={`w-full flex items-center gap-3 p-2 rounded-xl text-start transition-all active:scale-[0.98] ${
                    current
                      ? "bg-primary/20 ring-1 ring-primary/40"
                      : "hover:bg-white/[0.07] ring-1 ring-transparent"
                  }`}
                >
                  <span className="relative w-20 h-12 rounded-lg overflow-hidden bg-white/10 shrink-0">
                    {v.thumbnail && (
                      <img src={v.thumbnail} alt="" className="w-full h-full object-cover" />
                    )}
                    <span
                      className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${
                        current ? "bg-primary/60 text-white" : "bg-black/35 text-white/80"
                      }`}
                    >
                      {current ? <Play className="w-4 h-4 fill-white" /> : i + 1}
                    </span>
                  </span>
                  <span className="flex-1 min-w-0">
                    <span
                      className={`block text-xs font-semibold leading-snug line-clamp-2 ${
                        current ? "text-primary" : "text-white"
                      }`}
                    >
                      {v.title}
                    </span>
                    <span className="flex items-center gap-1.5 mt-1">
                      {v.channel_name && (
                        <span className="text-[10px] text-white/50 truncate">{v.channel_name}</span>
                      )}
                      {v.duration && (
                        <span className="text-[10px] text-white/60 font-mono shrink-0">{v.duration}</span>
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}