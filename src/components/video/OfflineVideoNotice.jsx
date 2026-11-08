import { WifiOff, X } from "lucide-react";
import { useT } from "@/lib/i18n";

/**
 * Shown instead of the player when the device is offline — YouTube playback
 * needs a connection, while the video data itself stays available offline.
 */
export default function OfflineVideoNotice({ video, onClose }) {
  const t = useT();
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 px-6" dir={t.dir}>
      <div className="max-w-sm text-center text-white">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/10 flex items-center justify-center">
          <WifiOff className="w-8 h-8 text-orange-400" />
        </div>
        <p className="text-base font-bold mb-2 line-clamp-2">{video?.title}</p>
        <p className="text-sm text-white/70 mb-6">{t.videoNeedsNet || t.offlineMode}</p>
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-[4px_20px_4px_20px] bg-primary text-primary-foreground font-bold text-sm"
        >
          <X className="w-4 h-4" /> {t.close}
        </button>
      </div>
    </div>
  );
}