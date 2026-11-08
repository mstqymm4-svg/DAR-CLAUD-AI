import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useT } from "@/lib/i18n";
import { getVideoChannels } from "@/lib/offlineSync";
import { useContentRefresh } from "@/hooks/useContentSync";
import { Tv, ChevronLeft, Video } from "lucide-react";
import SmartImage from "./SmartImage";

export default function HomeChannels() {
  const t = useT();
  const [channels, setChannels] = useState([]);

  const loadData = () => {
    getVideoChannels()
      .then((data) =>
        setChannels((data || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)))
      )
      .catch(() => {});
  };

  useEffect(() => {
    loadData();
  }, []);

  useContentRefresh(["channels"], loadData);

  if (!channels || channels.length === 0) return null;

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Tv className="w-4 h-4 text-primary" />
          </span>
          {t.channelsTitle || "قنوات الدروس والمحاضرات"}
        </h2>
        <Link
          to="/videos"
          className="text-sm text-primary font-bold hover:underline flex items-center gap-1 hover:gap-2 transition-all"
        >
          {t.viewAll || "عرض الكل"}
          <ChevronLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
        {channels.slice(0, 6).map((channel) => (
          <Link
            key={channel.id}
            to={`/videos?channel=${encodeURIComponent(channel.id)}`}
            className="group relative flex flex-col items-center text-center p-3 sm:p-4 rounded-2xl bg-card border border-border/80 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
          >
            <div className="relative mb-3">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-muted border-2 border-border/60 group-hover:border-primary/50 group-hover:scale-105 transition-all duration-300 shadow-sm flex items-center justify-center">
                {channel.thumbnail_url || channel.logo_url ? (
                  <SmartImage
                    src={channel.thumbnail_url || channel.logo_url}
                    alt={channel.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Tv className="w-8 h-8 text-muted-foreground/40" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] shadow">
                <Video className="w-3 h-3" />
              </div>
            </div>

            <h3 className="font-bold text-xs sm:text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {channel.name}
            </h3>
            {channel.description && (
              <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                {channel.description}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}