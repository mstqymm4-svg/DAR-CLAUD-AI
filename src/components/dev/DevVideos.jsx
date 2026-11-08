import { useState, useEffect, useCallback, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Upload, Save, Youtube, Star, StarOff,
  Video, Tv, Loader2, Sparkles, CheckCircle2, Clock, DownloadCloud
} from "lucide-react";
import {
  extractYoutubeId,
  getThumbnail,
  fetchVideoMetadata,
  fetchChannelMetadata,
  normalizeChannelUrl,
  autoUploadChannelLogo,
  fetchChannelVideos
} from "@/lib/youtubeMeta";
import ChannelVideosImportModal from "@/components/dev/ChannelVideosImportModal";

export { extractYoutubeId, getThumbnail };

// ─── Video Channels Tab ───────────────────────────────────────────────────────
function ChannelsTab() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [fetchSuccess, setFetchSuccess] = useState(false);
  const [uploadingAutoLogo, setUploadingAutoLogo] = useState(false);
  const [importChannel, setImportChannel] = useState(null);
  const [autoImportOnCreate, setAutoImportOnCreate] = useState(false);
  const [autoImportLimit, setAutoImportLimit] = useState(10);
  const [savingAndImporting, setSavingAndImporting] = useState(false);
  const [form, setForm] = useState({
    name: "", channel_logo: "", description: "", youtube_url: "",
    category: "عام", sort_order: 0, visible: true,
  });

  const lastFetchedUrl = useRef("");

  const load = useCallback(async () => {
    setLoading(true);
    const data = await base44.entities.VideoChannel.list("sort_order", 200);
    setChannels(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-fetch channel info and auto-upload channel logo when youtube_url is pasted or entered
  const fetchChannelData = useCallback(async (urlToFetch) => {
    if (!urlToFetch || urlToFetch.trim().length < 4) return;
    const normalized = normalizeChannelUrl(urlToFetch);
    if (lastFetchedUrl.current === normalized) return;
    lastFetchedUrl.current = normalized;

    setFetchingMeta(true);
    setFetchSuccess(false);
    try {
      const meta = await fetchChannelMetadata(normalized);
      if (meta && (meta.name || meta.channel_logo)) {
        const channelName = meta.name || form.name;

        // Set immediate data
        setForm((prev) => ({
          ...prev,
          name: prev.name ? prev.name : (meta.name || prev.name),
          channel_logo: meta.channel_logo || prev.channel_logo,
          description: prev.description ? prev.description : (meta.description || prev.description),
          youtube_url: meta.youtube_url || prev.youtube_url,
        }));
        setFetchSuccess(true);

        // Auto-upload channel logo into app storage
        if (meta.channel_logo) {
          setUploadingAutoLogo(true);
          try {
            const uploadedUrl = await autoUploadChannelLogo(meta.channel_logo, channelName);
            if (uploadedUrl) {
              setForm((prev) => ({ ...prev, channel_logo: uploadedUrl }));
            }
            toast.success(`تم جلب اسم القناة ورفع صورتها تلقائياً ✓`);
          } catch (uploadErr) {
            console.warn("Auto upload error, keeping extracted logo URL:", uploadErr);
            toast.success(`تم جلب بيانات القناة: ${meta.name || "بنجاح"}`);
          } finally {
            setUploadingAutoLogo(false);
          }
        } else {
          toast.success(`تم جلب بيانات القناة: ${meta.name || "بنجاح"}`);
        }
      }
    } catch (err) {
      console.warn("Channel auto-fetch error:", err);
    } finally {
      setFetchingMeta(false);
    }
  }, [form.name]);

  useEffect(() => {
    if (!showForm || !form.youtube_url) return;
    const trimmed = form.youtube_url.trim();
    if (trimmed.length < 5) return;

    const timer = setTimeout(() => {
      fetchChannelData(trimmed);
    }, 700);

    return () => clearTimeout(timer);
  }, [form.youtube_url, showForm, fetchChannelData]);

  const handleSave = async () => {
    if (!form.name) { toast.error("أدخل اسم القناة"); return; }
    setSavingAndImporting(true);
    try {
      if (editing) {
        await base44.entities.VideoChannel.update(editing.id, form);
        toast.success("تم تحديث القناة");
        setShowForm(false);
        setEditing(null);
        load();
      } else {
        const newCh = await base44.entities.VideoChannel.create(form);
        toast.success("تمت إضافة القناة بنجاح");

        // If auto-import is enabled on creation
        if (autoImportOnCreate && form.youtube_url) {
          toast.info(`جاري استخراج ورفع ${autoImportLimit} فيديو من القناة تلقائياً...`);
          try {
            const fetchedVideos = await fetchChannelVideos(form.youtube_url, autoImportLimit);
            if (fetchedVideos && fetchedVideos.length > 0) {
              let count = 0;
              for (const v of fetchedVideos) {
                await base44.entities.Video.create({
                  title: v.title,
                  youtube_url: v.youtube_url,
                  duration: v.duration || "",
                  thumbnail: v.thumbnail || getThumbnail(v.youtube_url),
                  channel_id: newCh.id,
                  channel_name: form.name,
                  category: form.category || "عام",
                  video_type: v.video_type || "normal",
                  description: v.description || "",
                  is_featured: false,
                  visible: true,
                  sort_order: 0,
                });
                count++;
              }
              toast.success(`تم استيراد ${count} فيديو تلقائياً من القناة! 🎉`);
            } else {
              toast.warning("تمت إضافة القناة، لكن لم يتم العثور على فيديوهات جديدة لاستيرادها");
            }
          } catch (importErr) {
            console.warn("Auto import error on create:", importErr);
            toast.error("تعذر استيراد الفيديوهات تلقائياً، يمكنك استيرادها لاحقاً");
          }
        }

        setShowForm(false);
        setEditing(null);
        setAutoImportOnCreate(false);
        setForm({ name: "", channel_logo: "", description: "", youtube_url: "", category: "عام", sort_order: 0, visible: true });
        load();
      }
    } catch (e) {
      toast.error("فشل الحفظ");
    } finally {
      setSavingAndImporting(false);
    }
  };

  const handleUploadLogo = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setForm((prev) => ({ ...prev, channel_logo: file_url }));
      toast.success("تم رفع الشعار");
    } catch (e) { toast.error("فشل الرفع"); }
    setUploading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">قنوات الفيديو ({channels.length})</h3>
        <Button size="sm" onClick={() => {
          setEditing(null);
          lastFetchedUrl.current = "";
          setFetchSuccess(false);
          setForm({ name: "", channel_logo: "", description: "", youtube_url: "", category: "عام", sort_order: channels.length, visible: true });
          setShowForm(true);
        }}>
          <Plus className="w-4 h-4 ml-1" /> إضافة قناة
        </Button>
      </div>

      {showForm && (
        <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs">رابط قناة اليوتيوب أو المعرّف</Label>
              <div className="flex items-center gap-1.5 text-[11px]">
                {fetchingMeta && (
                  <span className="text-primary flex items-center gap-1 animate-pulse">
                    <Loader2 className="w-3 h-3 animate-spin" /> جلب بيانات القناة تلقائياً...
                  </span>
                )}
                {fetchSuccess && !fetchingMeta && (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> تم الجلب التلقائي
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                value={form.youtube_url}
                onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData("text");
                  if (pasted) fetchChannelData(pasted);
                }}
                placeholder="https://youtube.com/@channelName أو @channelName"
                className="h-9 text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={fetchingMeta || !form.youtube_url}
                onClick={() => fetchChannelData(form.youtube_url)}
                className="shrink-0 h-9 text-xs gap-1"
                title="جلب اسم وشعار القناة تلقائياً من الرابط"
              >
                {fetchingMeta ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
                جلب تلقائي
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              💡 بمجرد وضع رابط القناة أو المعرف، سيتم كتابة اسم القناة وجلب شعارها تلقائياً.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">
                اسم القناة {fetchingMeta && <Loader2 className="w-3 h-3 inline animate-spin text-primary mr-1" />}
              </Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="قناة دار العلوم"
                className="h-9 text-sm"
              />
            </div>
            <div>
              <Label className="text-xs">التصنيف</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="عام"
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs">شعار / صورة القناة</Label>
              {uploadingAutoLogo && (
                <span className="text-[11px] text-primary flex items-center gap-1 animate-pulse font-medium">
                  <Loader2 className="w-3 h-3 animate-spin" /> جاري رفع وحفظ صورة القناة تلقائياً...
                </span>
              )}
              {form.channel_logo && !uploadingAutoLogo && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> تم استخراج ورفع صورة القناة تلقائياً
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {form.channel_logo ? (
                <div className="relative group">
                  <img
                    src={form.channel_logo}
                    alt="logo"
                    className="w-12 h-12 rounded-xl object-cover border border-border shadow-sm ring-2 ring-primary/20"
                  />
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, channel_logo: "" }))}
                    className="absolute -top-1.5 -right-1.5 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="إزالة الشعار"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-muted/60 border border-dashed border-border flex items-center justify-center text-muted-foreground">
                  {uploadingAutoLogo ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <Tv className="w-5 h-5 opacity-40" />}
                </div>
              )}
              <div className="flex-1 flex gap-2">
                <Input
                  value={form.channel_logo}
                  onChange={(e) => setForm({ ...form, channel_logo: e.target.value })}
                  placeholder="رابط صورة الشعار (يُجلب ويُرفع تلقائياً من رابط القناة)"
                  className="h-9 text-xs flex-1"
                />
                <label className="cursor-pointer shrink-0">
                  <input type="file" accept="image/*" onChange={handleUploadLogo} className="hidden" />
                  <div className="flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-border hover:bg-muted text-xs text-muted-foreground">
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><Upload className="w-3.5 h-3.5" /> رفع ملف</>}
                  </div>
                </label>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              💡 صورة القناة تُجلب وتُرفع تلقائياً من رابط اليوتيوب، كما يمكنك استبدالها برفع صورة يدوياً إذا رغبت.
            </p>
          </div>

          <div>
            <Label className="text-xs">وصف القناة</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="وصف مختصر للقناة ومحتواها"
              className="text-sm min-h-[60px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">ترتيب الظهور</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                className="h-9 text-sm"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch checked={form.visible} onCheckedChange={(v) => setForm({ ...form, visible: v })} />
              <Label className="text-xs">{form.visible ? "ظاهرة" : "مخفية"}</Label>
            </div>
          </div>

          {/* Automatic video extraction option on channel creation */}
          {!editing && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-bold text-foreground flex items-center gap-1.5 cursor-pointer">
                    <Video className="w-4 h-4 text-primary" />
                    استخراج ورفع فيديوهات القناة تلقائياً فور الحفظ
                  </Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    سحب مقاطع القناة مع العناوين والمدد والصور وحفظها في قائمة الفيديوهات تلقائياً
                  </p>
                </div>
                <Switch
                  checked={autoImportOnCreate}
                  onCheckedChange={setAutoImportOnCreate}
                />
              </div>

              {autoImportOnCreate && (
                <div className="flex items-center gap-3 pt-2 border-t border-primary/10">
                  <Label className="text-xs shrink-0 font-medium">عدد الفيديوهات المطلوبة:</Label>
                  <Select value={String(autoImportLimit)} onValueChange={(v) => setAutoImportLimit(Number(v))}>
                    <SelectTrigger className="h-8 text-xs w-36 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">فيديو واحد (1)</SelectItem>
                      <SelectItem value="5">5 فيديوهات</SelectItem>
                      <SelectItem value="10">10 فيديوهات</SelectItem>
                      <SelectItem value="20">20 فيديو</SelectItem>
                      <SelectItem value="30">30 فيديو</SelectItem>
                      <SelectItem value="50">50 فيديو</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleSave} disabled={savingAndImporting} className="gap-1.5">
              {savingAndImporting ? (
                <>
                  <Loader2 className="w-4 h-4 ml-1 animate-spin" /> جاري الحفظ واستخراج الفيديوهات...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 ml-1" /> حفظ القناة
                </>
              )}
            </Button>
            <Button size="sm" variant="outline" disabled={savingAndImporting} onClick={() => { setShowForm(false); setEditing(null); }}>
              إلغاء
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-center text-sm text-muted-foreground py-8">جاري التحميل...</p>
      ) : channels.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">لا توجد قنوات بعد</p>
      ) : (
        <div className="space-y-2">
          {channels.map((ch) => (
            <div key={ch.id} className={`flex items-center gap-3 bg-card border border-border rounded-xl p-3 ${!ch.visible ? "opacity-50" : ""}`}>
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0 overflow-hidden border border-border">
                {ch.channel_logo ? (
                  <img src={ch.channel_logo} alt={ch.name} className="w-full h-full object-cover" />
                ) : (
                  <Tv className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{ch.name}</p>
                <p className="text-xs text-muted-foreground truncate" dir="ltr">{ch.youtube_url || "بدون رابط"}</p>
              </div>

              {/* Import Videos Button */}
              {ch.youtube_url && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 text-xs gap-1.5 text-primary border-primary/30 hover:bg-primary/10 shrink-0"
                  onClick={() => setImportChannel(ch)}
                  title="استخراج واستيراد فيديوهات القناة"
                >
                  <DownloadCloud className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">استيراد فيديوهات</span>
                </Button>
              )}

              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={async () => {
                await base44.entities.VideoChannel.update(ch.id, { visible: !ch.visible }); load();
              }}>{ch.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}</Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                setEditing(ch);
                lastFetchedUrl.current = ch.youtube_url || "";
                setForm({
                  name: ch.name,
                  channel_logo: ch.channel_logo || "",
                  description: ch.description || "",
                  youtube_url: ch.youtube_url || "",
                  category: ch.category || "عام",
                  sort_order: ch.sort_order || 0,
                  visible: ch.visible
                });
                setShowForm(true);
              }}><Pencil className="w-3.5 h-3.5" /></Button>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={async () => {
                try {
                  await base44.entities.VideoChannel.delete(ch.id);
                  toast.success("تم حذف القناة بنجاح");
                  load();
                } catch (err) {
                  toast.error("فشل الحذف: " + (err?.message || "خطأ غير معروف"));
                }
              }}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
            </div>
          ))}
        </div>
      )}

      {/* Import Channel Videos Modal */}
      <ChannelVideosImportModal
        channel={importChannel}
        isOpen={Boolean(importChannel)}
        onClose={() => setImportChannel(null)}
        onSuccess={load}
      />
    </div>
  );
}

// ─── Videos Tab ───────────────────────────────────────────────────────────────
function VideosTab() {
  const [videos, setVideos] = useState([]);
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [fetchSuccess, setFetchSuccess] = useState(false);
  const lastFetchedVideoId = useRef("");

  const [form, setForm] = useState({
    title: "",
    youtube_url: "",
    description: "",
    channel_id: "",
    channel_name: "",
    category: "عام",
    video_type: "normal",
    duration: "",
    is_featured: false,
    visible: true,
    sort_order: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const [vData, chData] = await Promise.all([
      base44.entities.Video.list("-created_date", 500),
      base44.entities.VideoChannel.list("sort_order", 200),
    ]);
    setVideos(vData || []);
    setChannels(chData || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Auto-fill video data (title / channel / duration / type) from YouTube URL ──
  const fetchVideoData = useCallback(async (urlToFetch) => {
    const videoId = extractYoutubeId(urlToFetch);
    if (!videoId) return;
    if (lastFetchedVideoId.current === videoId) return;
    lastFetchedVideoId.current = videoId;

    setFetchingMeta(true);
    setFetchSuccess(false);

    try {
      const meta = await fetchVideoMetadata(urlToFetch);
      if (meta) {
        // Look up if a matching channel exists in channels list
        const matchedChannel = channels.find((c) =>
          (c.name && meta.channel_name && (c.name.trim().toLowerCase() === meta.channel_name.trim().toLowerCase() ||
           meta.channel_name.includes(c.name) || c.name.includes(meta.channel_name)))
        );

        setForm((prev) => ({
          ...prev,
          title: meta.title || prev.title,
          channel_name: meta.channel_name || prev.channel_name,
          channel_id: matchedChannel ? matchedChannel.id : prev.channel_id,
          duration: meta.duration || prev.duration,
          video_type: meta.video_type || prev.video_type || "normal",
          description: prev.description ? prev.description : (meta.description || prev.description),
        }));

        setFetchSuccess(true);
        toast.success(`تم جلب بيانات الفيديو: ${meta.title?.slice(0, 30) || "بنجاح"}`);
      }
    } catch (err) {
      console.warn("Video auto-fetch error:", err);
    } finally {
      setFetchingMeta(false);
    }
  }, [channels]);

  useEffect(() => {
    if (!showForm || !form.youtube_url) return;
    const videoId = extractYoutubeId(form.youtube_url);
    if (!videoId) return;

    const timer = setTimeout(() => {
      fetchVideoData(form.youtube_url);
    }, 600);

    return () => clearTimeout(timer);
  }, [form.youtube_url, showForm, fetchVideoData]);

  const handleSave = async () => {
    if (!form.title || !form.youtube_url) { toast.error("أدخل العنوان والرابط"); return; }
    const thumbnail = getThumbnail(form.youtube_url);
    const ch = channels.find((c) => c.id === form.channel_id);
    const data = {
      ...form,
      thumbnail,
      channel_name: ch?.name || form.channel_name || "",
      video_type: form.video_type || "normal",
    };
    try {
      if (editing) {
        await base44.entities.Video.update(editing.id, data);
        toast.success("تم تحديث الفيديو");
      } else {
        await base44.entities.Video.create(data);
        toast.success("تمت إضافة الفيديو");
      }
      setShowForm(false);
      setEditing(null);
      lastFetchedVideoId.current = "";
      setForm({
        title: "",
        youtube_url: "",
        description: "",
        channel_id: "",
        channel_name: "",
        category: "عام",
        duration: "",
        video_type: "normal",
        is_featured: false,
        visible: true,
        sort_order: 0,
      });
      load();
    } catch (e) { toast.error("فشل الحفظ"); }
  };

  const filtered = videos.filter((v) =>
    !search || v.title?.includes(search) || v.category?.includes(search) || v.channel_name?.includes(search)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold">الفيديوهات ({videos.length})</h3>
        <div className="flex gap-2">
          <Input
            placeholder="بحث..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 w-32 text-sm"
          />
          <Button size="sm" onClick={() => {
            setEditing(null);
            lastFetchedVideoId.current = "";
            setFetchSuccess(false);
            setForm({
              title: "",
              youtube_url: "",
              description: "",
              channel_id: "",
              channel_name: "",
              category: "عام",
              duration: "",
              is_featured: false,
              visible: true,
              sort_order: videos.length
            });
            setShowForm(true);
          }}>
            <Plus className="w-4 h-4 ml-1" /> إضافة فيديو
          </Button>
        </div>
      </div>

      {showForm && (
        <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
          {/* URL Input with Instant Auto-fill */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs">رابط فيديو اليوتيوب</Label>
              <div className="flex items-center gap-1.5 text-[11px]">
                {fetchingMeta && (
                  <span className="text-primary flex items-center gap-1 animate-pulse font-medium">
                    <Loader2 className="w-3 h-3 animate-spin" /> جلب بيانات الفيديو (العنوان، المدة، القناة)...
                  </span>
                )}
                {fetchSuccess && !fetchingMeta && (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3 h-3" /> تم جلب البيانات تلقائياً
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                value={form.youtube_url}
                onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData("text");
                  if (pasted) fetchVideoData(pasted);
                }}
                placeholder="https://youtube.com/watch?v=... أو https://youtu.be/... أو shorts"
                className="h-9 text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={fetchingMeta || !form.youtube_url}
                onClick={() => fetchVideoData(form.youtube_url)}
                className="shrink-0 h-9 text-xs gap-1"
                title="جلب العنوان والمدة والقناة تلقائياً"
              >
                {fetchingMeta ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-primary" />}
                جلب تلقائي
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              💡 مجرد لصق رابط الفيديو سيتم استخراج وتعبئة العنوان، وقت الفيديو، اسم القناة ونوع الفيديو تلقائياً.
            </p>
          </div>

          {/* Title */}
          <div>
            <Label className="text-xs">
              عنوان الفيديو {fetchingMeta && <Loader2 className="w-3 h-3 inline animate-spin text-primary mr-1" />}
            </Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="عنوان الفيديو (يُجلب تلقائياً من الرابط)"
              className="h-9 text-sm"
            />
          </div>

          {/* Thumbnail & Preview info */}
          {form.youtube_url && extractYoutubeId(form.youtube_url) && (
            <div className="flex items-center gap-3 p-2 rounded-lg bg-card border border-border">
              <div className="relative w-28 aspect-video rounded-md overflow-hidden bg-black/10 shrink-0">
                <img
                  src={getThumbnail(form.youtube_url)}
                  alt="thumbnail"
                  className="w-full h-full object-cover"
                />
                {form.duration && (
                  <span className="absolute bottom-1 left-1 px-1 py-0.5 rounded bg-black/85 text-white text-[9px] font-mono flex items-center gap-0.5">
                    <Clock className="w-2.5 h-2.5" /> {form.duration}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0 text-xs space-y-0.5">
                <p className="font-bold truncate">{form.title || "عنوان الفيديو"}</p>
                <p className="text-muted-foreground truncate">القناة: {form.channel_name || "غير محدد"}</p>
                {form.duration && <p className="text-primary font-mono text-[11px]">المدة: {form.duration}</p>}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {/* Channel Select or write */}
            <div>
              <Label className="text-xs">القناة المرتبطة</Label>
              <Select
                value={form.channel_id}
                onValueChange={(v) => {
                  const ch = channels.find((c) => c.id === v);
                  setForm({
                    ...form,
                    channel_id: v,
                    channel_name: ch ? ch.name : form.channel_name,
                  });
                }}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="اختر قناة" />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">اسم القناة المكتوب</Label>
              <Input
                value={form.channel_name}
                onChange={(e) => setForm({ ...form, channel_name: e.target.value })}
                placeholder="اسم القناة"
                className="h-9 text-sm"
              />
            </div>

            <div>
              <Label className="text-xs">التصنيف</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="h-9 text-sm"
              />
            </div>

            <div>
              <Label className="text-xs">نوع الفيديو</Label>
              <Select
                value={form.video_type || "normal"}
                onValueChange={(value) => setForm({ ...form, video_type: value })}
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">📺 فيديو عادي</SelectItem>
                  <SelectItem value="short">🟣 شورت / قصير</SelectItem>
                  <SelectItem value="live">🔴 بث مباشر</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">وقت الفيديو (المدة)</Label>
              <Input
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                placeholder="مثال: 14:20"
                className="h-9 text-sm font-mono"
              />
            </div>

            <div>
              <Label className="text-xs">الترتيب</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                className="h-9 text-sm"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs">الوصف</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="وصف الفيديو ومحاوره"
              className="text-sm min-h-[60px]"
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} />
              مميز (يظهر في قسم الفيديوهات المميزة)
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <Switch checked={form.visible} onCheckedChange={(v) => setForm({ ...form, visible: v })} />
              {form.visible ? "ظاهر" : "مخفي"}
            </label>
          </div>

          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleSave} className="gap-1.5">
              <Save className="w-4 h-4 ml-1" /> حفظ الفيديو
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>
              إلغاء
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-center text-sm text-muted-foreground py-8">جاري التحميل...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">لا توجد فيديوهات</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((v) => (
            <div key={v.id} className={`bg-card border border-border rounded-xl p-3 ${!v.visible ? "opacity-50" : ""}`}>
              <div className="flex gap-3">
                <div className="relative w-28 h-20 rounded-lg overflow-hidden shrink-0 bg-muted">
                  {v.thumbnail && (
                    <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" />
                  )}
                  {v.duration && (
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/85 text-white text-[9px] font-mono flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" /> {v.duration}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{v.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{v.channel_name || "بدون قناة"}</p>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {v.is_featured && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-medium">مميز</span>}
                    {v.video_type === "short" && <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 font-medium">شورت</span>}
                    {v.video_type === "live" && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-600 font-medium">مباشر</span>}
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{v.category}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1 mt-2.5 pt-2 border-t border-border/50 justify-end">
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={async () => {
                  await base44.entities.Video.update(v.id, { is_featured: !v.is_featured }); load();
                }}>{v.is_featured ? <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> : <StarOff className="w-3 h-3" />}</Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={async () => {
                  await base44.entities.Video.update(v.id, { visible: !v.visible }); load();
                }}>{v.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}</Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                  setEditing(v);
                  lastFetchedVideoId.current = extractYoutubeId(v.youtube_url) || "";
                  setForm({
                    title: v.title,
                    youtube_url: v.youtube_url,
                    description: v.description || "",
                    channel_id: v.channel_id || "",
                    channel_name: v.channel_name || "",
                    category: v.category || "عام",
                    duration: v.duration || "",
                    video_type: v.video_type || "normal",
                    is_featured: v.is_featured,
                    visible: v.visible,
                    sort_order: v.sort_order || 0
                  });
                  setShowForm(true);
                }}><Pencil className="w-3 h-3" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={async () => {
                  try {
                    await base44.entities.Video.delete(v.id);
                    toast.success("تم حذف الفيديو بنجاح");
                    load();
                  } catch (err) {
                    toast.error("فشل الحذف: " + (err?.message || "خطأ غير معروف"));
                  }
                }}><Trash2 className="w-3 h-3 text-destructive" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Settings Tab ─────────────────────────────────────────────────────────────
function VideoSettingsTab() {
  const [enabled, setEnabled] = useState(() => localStorage.getItem("devs_videos_enabled") !== "false");
  const [showInfo, setShowInfo] = useState(() => localStorage.getItem("devs_videos_show_info") !== "false");

  const handleSave = () => {
    localStorage.setItem("devs_videos_enabled", String(enabled));
    localStorage.setItem("devs_videos_show_info", String(showInfo));
    toast.success("تم حفظ الإعدادات");
    window.dispatchEvent(new Event("app-settings-changed"));
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-xl p-4 space-y-4">
        <h3 className="text-sm font-bold">إعدادات الفيديوهات</h3>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm">تفعيل قسم الفيديوهات</Label>
            <p className="text-xs text-muted-foreground">إظهار أو إخفاء قسم الفيديوهات عن المستخدمين</p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm">إظهار معلومات الفيديو</Label>
            <p className="text-xs text-muted-foreground">عرض العنوان والوصف واسم القناة أثناء التشغيل</p>
          </div>
          <Switch checked={showInfo} onCheckedChange={setShowInfo} />
        </div>
        <Button onClick={handleSave} className="w-full"><Save className="w-4 h-4 ml-2" /> حفظ الإعدادات</Button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DevVideos() {
  const [tab, setTab] = useState("videos");
  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="videos" className="text-xs gap-1"><Video className="w-3.5 h-3.5" /> الفيديوهات</TabsTrigger>
          <TabsTrigger value="channels" className="text-xs gap-1"><Tv className="w-3.5 h-3.5" /> القنوات</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs gap-1"><Youtube className="w-3.5 h-3.5" /> الإعدادات</TabsTrigger>
        </TabsList>
        <TabsContent value="videos" className="mt-4"><VideosTab /></TabsContent>
        <TabsContent value="channels" className="mt-4"><ChannelsTab /></TabsContent>
        <TabsContent value="settings" className="mt-4"><VideoSettingsTab /></TabsContent>
      </Tabs>
    </div>
  );
}