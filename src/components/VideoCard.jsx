import { motion } from "framer-motion";
import { Play, Heart, Share2, Star, Clock, Video, CheckCircle, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import SmartImage from "./SmartImage";

export default function VideoCard({
  video,
  isFavorite,
  isWatched = false,
  channel = null,
  onToggleFavorite,
  onPlay,
  onShare,
  index = 0
}) {
  const t = useT();

  const channelLogo = channel?.channel_logo;
  const channelDisplayName = channel?.name || video.channel_name;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.25) }}
      className="group bg-card border border-border/80 hover:border-primary/40 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 flex flex-col"
    >
      {/* Thumbnail Area */}
      <div
        className="relative aspect-video bg-muted/80 cursor-pointer overflow-hidden"
        onClick={() => onPlay(video)}
      >
        {video.thumbnail ? (
          <SmartImage
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            fallback={() => (
              <div className="w-full h-full flex items-center justify-center bg-muted">
                <Video className="w-10 h-10 text-muted-foreground/30" />
              </div>
            )}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <Video className="w-10 h-10 text-muted-foreground/30" />
          </div>
        )}

        {/* Gradient shadow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-60 group-hover:opacity-40 transition-opacity" />

        {/* Central Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 transform scale-95 group-hover:scale-100">
          <div className="w-12 h-12 rounded-full bg-primary/95 text-primary-foreground flex items-center justify-center shadow-lg shadow-black/40 ring-4 ring-white/20">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>

        {/* Badges on Top */}
        <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5 flex-wrap">
            {video.is_featured && (
              <span className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-md">
                <Star className="w-2.5 h-2.5 fill-current" /> {t.featured || "مميز"}
              </span>
            )}
            {video.video_type === "short" && (
              <span className="px-1.5 py-0.5 rounded-md bg-purple-600 text-white text-[10px] font-bold shadow-md">
                شورت
              </span>
            )}
            {video.video_type === "live" && (
              <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-md animate-pulse">
                <Radio className="w-2.5 h-2.5" /> مباشر
              </span>
            )}
          </div>

          {isWatched && (
            <span className="px-1.5 py-0.5 rounded-md bg-black/75 backdrop-blur-sm text-emerald-400 text-[10px] font-medium flex items-center gap-1 shadow">
              <CheckCircle className="w-3 h-3" /> تمّت المشاهدة
            </span>
          )}
        </div>

        {/* Duration Badge */}
        {video.duration && (
          <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/85 text-white text-[11px] font-mono font-medium flex items-center gap-1 shadow pointer-events-none">
            <Clock className="w-2.5 h-2.5 opacity-80" /> {video.duration}
          </span>
        )}
      </div>

      {/* Info Area */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-3">
        <div>
          {/* Channel info */}
          {channelDisplayName && (
            <div className="flex items-center gap-1.5 mb-1 text-xs text-muted-foreground">
              {channelLogo ? (
                <img
                  src={channelLogo}
                  alt={channelDisplayName}
                  className="w-4 h-4 rounded-full object-cover shrink-0"
                />
              ) : (
                <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[9px] font-bold">
                  📺
                </span>
              )}
              <span className="font-medium truncate">{channelDisplayName}</span>
            </div>
          )}

          {/* Title */}
          <h3
            onClick={() => onPlay(video)}
            className="font-bold text-sm leading-snug line-clamp-2 hover:text-primary transition-colors cursor-pointer"
            title={video.title}
          >
            {video.title}
          </h3>

          {/* Description snippet */}
          {video.description && (
            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
              {video.description}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-border/50">
          <Button
            size="sm"
            onClick={() => onPlay(video)}
            className="flex-1 h-8 text-xs font-bold gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> {t.play || "تشغيل"}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-xl border border-border/60 hover:border-red-400 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
            title={isFavorite ? (t.removeFav || "إزالة من المفضلة") : (t.addFav || "إضافة للمفضلة")}
            onClick={() => onToggleFavorite(video.id)}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? "fill-red-500 text-red-500" : ""}`} />
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 rounded-xl border border-border/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="مشاركة الرابط"
            onClick={() => onShare(video)}
          >
            <Share2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}