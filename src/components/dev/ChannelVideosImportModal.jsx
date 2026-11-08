import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  DownloadCloud, Loader2, CheckCircle2, Film, Clock, ExternalLink,
  CheckSquare, Square, AlertCircle, Sparkles, Tv
} from "lucide-react";
import { fetchChannelVideos, extractYoutubeId, getThumbnail } from "@/lib/youtubeMeta";
import { useT } from "@/lib/i18n";

export default function ChannelVideosImportModal({ channel, isOpen, onClose, onSuccess }) {
  const t = useT();
  const [limit, setLimit] = useState("15");
  const [customLimit, setCustomLimit] = useState("");
  const [loading, setLoading] = useState(false);
  const [videos, setVideos] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [existingVideoUrls, setExistingVideoUrls] = useState(new Set());
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Load existing videos from DB when modal opens to mark duplicates
  useEffect(() => {
    if (!isOpen || !channel) return;
    setVideos([]);
    setSelectedIds(new Set());
    setProgress({ current: 0, total: 0 });

    base44.entities.Video.list("-created_date", 1000).then((list) => {
      const set = new Set();
      (list || []).forEach((v) => {
        const id = extractYoutubeId(v.youtube_url);
        if (id) set.add(id);
      });
      setExistingVideoUrls(set);
    }).catch(() => {});
  }, [isOpen, channel]);

  const handleFetchVideos = async () => {
    if (!channel?.youtube_url) {
      toast.error("القناة لا تحتوي على رابط يوتيوب صالح");
      return;
    }

    setLoading(true);
    setVideos([]);
    setSelectedIds(new Set());

    try {
      const fetched = await fetchChannelVideos(channel.youtube_url, limit);
      if (!fetched || fetched.length === 0) {
        toast.error("تعذر العثور على فيديوهات في القناة، تأكد من صحة الرابط أو خصوصية القناة");
        setLoading(false);
        return;
      }

      setVideos(fetched);

      // Auto-select videos that are not yet in the database
      const newIds = new Set();
      fetched.forEach((v) => {
        const id = extractYoutubeId(v.youtube_url);
        if (id && !existingVideoUrls.has(id)) {
          newIds.add(id);
        }
      });
      setSelectedIds(newIds);

      toast.success(`تم استخراج ${fetched.length} فيديو من القناة`);
    } catch (err) {
      console.error("Error fetching channel videos:", err);
      toast.error("حدث خطأ أثناء الاتصال باليوتيوب");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSelectAll = (select) => {
    if (!select) {
      setSelectedIds(new Set());
      return;
    }
    const all = new Set();
    videos.forEach((v) => {
      const id = extractYoutubeId(v.youtube_url);
      if (id) all.add(id);
    });
    setSelectedIds(all);
  };

  const handleStartImport = async () => {
    const toImport = videos.filter((v) => {
      const id = extractYoutubeId(v.youtube_url);
      return id && selectedIds.has(id);
    });

    if (toImport.length === 0) {
      toast.error("يرجى تحديد فيديو واحد على الأقل للاستيراد");
      return;
    }

    setImporting(true);
    setProgress({ current: 0, total: toImport.length });

    let successCount = 0;
    for (let i = 0; i < toImport.length; i++) {
      const v = toImport[i];
      try {
        await base44.entities.Video.create({
          title: v.title,
          youtube_url: v.youtube_url,
          duration: v.duration || "",
          thumbnail: v.thumbnail || getThumbnail(v.youtube_url),
          channel_id: channel.id || "",
          channel_name: channel.name || v.channel_name || "",
          category: channel.category || "عام",
          video_type: v.video_type || "normal",
          description: v.description || "",
          is_featured: false,
          visible: true,
          sort_order: 0,
        });
        successCount++;
      } catch (err) {
        console.error("Failed to import video:", v.title, err);
      }
      setProgress({ current: i + 1, total: toImport.length });
    }

    setImporting(false);
    toast.success(`تم استيراد ${successCount} فيديو بنجاح إلى قاعدة البيانات! 🎉`);
    if (onSuccess) onSuccess();
    onClose();
  };

  if (!channel) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !importing && !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl" dir="rtl">
        {/* Header */}
        <DialogHeader className="p-4 sm:p-5 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0 overflow-hidden border border-border">
              {channel.channel_logo ? (
                <img src={channel.channel_logo} alt={channel.name} className="w-full h-full object-cover" />
              ) : (
                <Tv className="w-6 h-6 text-red-500" />
              )}
            </div>
            <div className="flex-1 min-w-0 text-right">
              <DialogTitle className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>استيراد فيديوهات القناة تلقائياً</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
                  {channel.name}
                </span>
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 truncate">
                <span dir="ltr">{channel.youtube_url}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Controls bar */}
          <div className="bg-muted/40 border border-border rounded-xl p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="text-xs font-bold text-foreground">
                خيارات استخراج الفيديوهات:
              </Label>
              <span className="text-[11px] text-muted-foreground">
                حدد عدداً محدداً، اكتب أي عدد، أو اختر سحب جميع الفيديوهات
              </span>
            </div>

            {/* Mode selection buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => { setLimit("10"); setCustomLimit(""); }}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  limit === "10" && !customLimit
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                10 فيديوهات
              </button>

              <button
                type="button"
                onClick={() => { setLimit("25"); setCustomLimit(""); }}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  limit === "25" && !customLimit
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                25 فيديو
              </button>

              <button
                type="button"
                onClick={() => { setLimit("50"); setCustomLimit(""); }}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  limit === "50" && !customLimit
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                50 فيديو
              </button>

              <button
                type="button"
                onClick={() => { setLimit("all"); setCustomLimit(""); }}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  limit === "all"
                    ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                    : "bg-card border-border hover:border-amber-500/40 text-muted-foreground hover:text-foreground"
                }`}
              >
                🔥 جميع الفيديوهات (الكل)
              </button>
            </div>

            {/* Custom Input or summary */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border/50">
              <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                <Label className="text-xs shrink-0">أو اكتب أي عدد يدوياً:</Label>
                <Input
                  type="number"
                  min={1}
                  max={500}
                  value={customLimit}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCustomLimit(val);
                    if (val) setLimit(val);
                  }}
                  placeholder="مثال: 15 أو 40 أو 100"
                  className="h-8 text-xs w-36 bg-background font-mono"
                  disabled={loading || importing}
                />
              </div>

              <Button
                size="sm"
                onClick={handleFetchVideos}
                disabled={loading || importing}
                className="h-9 text-xs gap-1.5 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground font-bold shrink-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> جاري الاستخراج من القناة...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    {limit === "all" ? "استخراج جميع فيديوهات القناة" : `استخراج (${customLimit || limit}) فيديو`}
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Prompt before fetching */}
          {!loading && videos.length === 0 && (
            <div className="text-center py-10 px-4 border border-dashed border-border rounded-xl space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Film className="w-6 h-6" />
              </div>
              <div className="max-w-sm mx-auto">
                <h4 className="font-bold text-sm text-foreground">جاهز لاستخراج الفيديوهات من القناة</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  اختر عدد الفيديوهات (من 1 إلى 50) ثم اضغط "استخراج الفيديوهات الآن" لعرض قائمة مقاطع القناة واختيار ما تريد رفعه.
                </p>
              </div>
            </div>
          )}

          {/* Videos List */}
          {videos.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                <span>
                  تم العثور على <strong className="text-foreground">{videos.length}</strong> فيديو
                  (تم تحديد <strong className="text-primary">{selectedIds.size}</strong>)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAll(true)}
                    className="hover:text-primary font-medium flex items-center gap-1"
                  >
                    <CheckSquare className="w-3.5 h-3.5" /> تحديد الكل
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={() => handleSelectAll(false)}
                    className="hover:text-primary font-medium flex items-center gap-1"
                  >
                    <Square className="w-3.5 h-3.5" /> إلغاء التحديد
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {videos.map((v) => {
                  const vId = extractYoutubeId(v.youtube_url);
                  const isExisting = vId && existingVideoUrls.has(vId);
                  const isSelected = vId && selectedIds.has(vId);

                  return (
                    <div
                      key={v.youtube_url}
                      onClick={() => !importing && vId && toggleSelect(vId)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary/5 border-primary/40 shadow-sm"
                          : "bg-card border-border hover:border-border/80"
                      }`}
                    >
                      {/* Checkbox */}
                      <div className="shrink-0">
                        {isSelected ? (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        ) : (
                          <div className="w-5 h-5 rounded-md border border-muted-foreground/40" />
                        )}
                      </div>

                      {/* Thumbnail */}
                      <div className="relative w-24 aspect-video rounded-lg overflow-hidden bg-muted shrink-0">
                        <img
                          src={v.thumbnail || getThumbnail(v.youtube_url)}
                          alt={v.title}
                          className="w-full h-full object-cover"
                        />
                        {v.duration && (
                          <span className="absolute bottom-1 left-1 px-1 py-0.5 rounded bg-black/85 text-white text-[9px] font-mono flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" /> {v.duration}
                          </span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 text-right">
                        <p className="text-xs font-bold line-clamp-2 leading-snug">{v.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {isExisting ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-amber-500" /> مضاف مسبقاً
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                              جديد
                            </span>
                          )}
                          <a
                            href={v.youtube_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-0.5"
                          >
                            معاينة <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Progress Bar during Import */}
          {importing && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-primary">
                  <Loader2 className="w-4 h-4 animate-spin" /> جاري استيراد الفيديوهات وحفظها...
                </span>
                <span className="font-mono text-primary">
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full transition-all duration-300"
                  style={{
                    width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-3 sm:p-4 border-t border-border bg-card flex sm:justify-between items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={importing}
            onClick={onClose}
            className="text-xs"
          >
            إلغاء
          </Button>

          {videos.length > 0 && (
            <Button
              size="sm"
              disabled={importing || selectedIds.size === 0}
              onClick={handleStartImport}
              className="text-xs gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md"
            >
              {importing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> جاري الاستيراد ({progress.current}/{progress.total})...
                </>
              ) : (
                <>
                  <DownloadCloud className="w-4 h-4" /> استيراد الفيديوهات المحددة ({selectedIds.size} فيديو)
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
