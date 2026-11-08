import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { getChannelTypeInfo } from "@/components/dev/DevSocialChannels";
import { ExternalLink } from "lucide-react";
import { getSocialChannels } from "@/lib/offlineSync";
import { useContentRefresh } from "@/hooks/useContentSync";
import SmartImage from "./SmartImage";
import { useT } from "@/lib/i18n";

export default function SocialChannelsSection() {
  const t = useT();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    getSocialChannels().
    then((data) => setChannels((data || []).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)))).
    catch(() => {}).
    finally(() => setLoading(false));
  };

  useEffect(() => {loadData();}, []);

  // Auto-refresh when social channels change in background
  useContentRefresh(["social"], loadData);

  if (loading) return null;
  if (channels.length === 0) return null;

  const handleShare = async (ch) => {
    if (navigator.share) {
      try {
        await navigator.share({ title: ch.name, url: ch.url });
      } catch (e) {}
    } else {
      try {
        await navigator.clipboard.writeText(ch.url);
        toast.success(t.linkCopied);
      } catch (e) {}
    }
  };

  return (
    <section className="px-4 sm:px-6 lg:px-8 py-8 max-w-6xl mx-auto" dir={t.dir}>
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold mb-1">{t.socialTitle}</h2>
        <p className="text-sm text-muted-foreground">{t.socialSub}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {channels.map((ch) => {
          const typeInfo = getChannelTypeInfo(ch.channel_type);
          const Icon = typeInfo.icon;
          return (
            <motion.div
              key={ch.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center text-center hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/30 transition-all group">
              
              <div className={`w-16 h-16 rounded-2xl ${typeInfo.bg} flex items-center justify-center mb-3 group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-sm`}>
                {ch.icon_url ?
                <SmartImage src={ch.icon_url} alt={ch.name} className="w-full h-full rounded-2xl object-cover" fallback={() => <Icon className={`w-8 h-8 ${typeInfo.color}`} />} /> :
                <Icon className={`w-8 h-8 ${typeInfo.color}`} />}
              </div>
              <p className="text-sm font-bold mb-1 truncate w-full">{ch.name}</p>
              {ch.description && <p className="text-[10px] text-muted-foreground line-clamp-2 mb-3">{ch.description}</p>}
              <div className="flex gap-1.5 mt-auto w-full">
                <a href={ch.url} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1 bg-primary text-primary-foreground text-xs font-bold px-3 py-2 hover:bg-primary/90 transition-colors active:scale-95 shadow-sm rounded-[4px_20px_4px_20px]">
                  {t.openBtn} <ExternalLink className="w-3 h-3" />
                </a>
                


                
              </div>
            </motion.div>);

        })}
      </div>
    </section>);

}