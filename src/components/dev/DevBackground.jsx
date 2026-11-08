import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Image, Layers, Play, Upload, Trash2, Film, Zap,
  Plus, X, Check, Maximize2, Monitor,
  Settings, Eye, RotateCcw
} from "lucide-react";
import { getSetting, setSettings } from "@/lib/settingsStore";
import { uploads } from "@/lib/uploadFacade";
import HeroBanner from "@/components/HeroBanner";

const BG_TYPES = [
  { id: "gradient_anim",   label: "تدرج متحرك",       icon: "🌈" },
  { id: "particles",       label: "جزيئات",            icon: "✨" },
  { id: "islamic_pattern", label: "نمط إسلامي",        icon: "☪" },
  { id: "floating_shapes", label: "أشكال طائرة",       icon: "◆" },
  { id: "stars",           label: "نجوم",              icon: "⭐" },
  { id: "waves",           label: "موجات",             icon: "〰" },
  { id: "static_image",    label: "صورة ثابتة",        icon: "🖼" },
  { id: "animated_gif",    label: "GIF متحرك",         icon: "🎞" },
  { id: "slideshow",       label: "شرائح",             icon: "📸" },
  { id: "video_mp4",       label: "فيديو MP4",         icon: "🎬" },
  { id: "video_webm",      label: "فيديو WebM",        icon: "🎥" },
  { id: "custom_html",     label: "HTML مخصص",        icon: "💻" },
  ];

  // Layers that can be combined on top of ANY base background type
  const EXTRA_LAYERS = [
  { id: "particles",       label: "جزيئات",     icon: "✨" },
  { id: "stars",           label: "نجوم",       icon: "⭐" },
  { id: "waves",           label: "موجات",      icon: "〰" },
  { id: "islamic_pattern", label: "نمط إسلامي", icon: "☪" },
  { id: "floating_shapes", label: "أشكال طائرة", icon: "◆" },
  { id: "custom_html",     label: "HTML مخصص",  icon: "💻" },
  { id: "snow",            label: "ثلج",         icon: "❄" },
  { id: "rain",            label: "مطر",          icon: "🌧" },
  { id: "fireflies",       label: "يراعات مضيئة", icon: "🟢" },
  { id: "bubbles",         label: "فقاعات",      icon: "🫧" },
  { id: "light_rays",      label: "أشعة ضوء",    icon: "🔆" },
  { id: "aurora",          label: "شفق قطبي",    icon: "🌌" },
  { id: "grid",            label: "شبكة هندسية", icon: "▦" },
  ];

const TRANSITIONS = ["fade", "slide", "zoom", "flip", "blur"];
const TABS = ["type", "preview", "upload", "effects", "content", "video", "slides"];

const DEFAULTS = {
  hero_bg_type: "gradient_anim", hero_title: "", hero_subtitle: "",
  hero_btn_text: "", hero_btn_link: "/books",
  hero_bg_opacity: "100", hero_bg_blur: "0", hero_bg_brightness: "100",
  hero_bg_contrast: "100", hero_bg_saturation: "100",
  hero_overlay_color: "#000000", hero_overlay_alpha: "30",
  hero_anim_speed: "5", hero_zoom: "false", hero_parallax: "false",
  hero_bg_url: "", hero_slideshow_urls: "[]",
  hero_slide_transition: "fade", hero_slide_duration: "4",
  hero_video_autoplay: "true", hero_video_loop: "true",
  hero_video_mute: "true", hero_video_brightness: "100",
  hero_video_mobile: "true", hero_video_speed: "1",
  hero_grad_from: "#134e2a", hero_grad_to: "#1a6b3c",
  hero_custom_html: "",
};

function read(k) { return getSetting(k) || DEFAULTS[k] || ""; }

export default function DevBackground() {
  const [tab, setTab]           = useState("type");
  const [fullscreen, setFullscreen] = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [uploadPct, setUploadPct]   = useState(0);
  const [uploadLabel, setUploadLabel] = useState("");

  // All settings as flat state
  const [st, setSt] = useState(() => ({
    bgType:        read("hero_bg_type"),
    title:         read("hero_title"),
    subtitle:      read("hero_subtitle"),
    btnText:       read("hero_btn_text"),
    btnLink:       read("hero_btn_link") || "/books",
    opacity:       Number(read("hero_bg_opacity")),
    blur:          Number(read("hero_bg_blur")),
    brightness:    Number(read("hero_bg_brightness")),
    contrast:      Number(read("hero_bg_contrast") || 100),
    saturation:    Number(read("hero_bg_saturation") || 100),
    overlayColor:  read("hero_overlay_color") || "#000000",
    overlayAlpha:  Number(read("hero_overlay_alpha")),
    animSpeed:     Number(read("hero_anim_speed")),
    zoom:          read("hero_zoom") === "true",
    parallax:      read("hero_parallax") === "true",
    bgUrl:         read("hero_bg_url"),
    slideUrls:     (() => { try { return JSON.parse(read("hero_slideshow_urls") || "[]"); } catch { return []; } })(),
    slideTrans:    read("hero_slide_transition") || "fade",
    slideDur:      Number(read("hero_slide_duration") || 4),
    autoplay:      read("hero_video_autoplay") !== "false",
    loop:          read("hero_video_loop") !== "false",
    mute:          read("hero_video_mute") !== "false",
    videoBright:   Number(read("hero_video_brightness") || 100),
    videoMobile:   read("hero_video_mobile") !== "false",
    videoSpeed:    Number(read("hero_video_speed") || 1),
    gradFrom:      read("hero_grad_from") || "#134e2a",
    gradTo:        read("hero_grad_to") || "#1a6b3c",
    customHtml:    read("hero_custom_html"),
    extraLayers:   (() => { try { return JSON.parse(read("hero_extra_layers") || "[]"); } catch { return []; } })(),
  }));

  const fileRef     = useRef();
  const slideRef    = useRef();

  // Persist to settingsStore on every change
  const persist = useCallback((next) => {
    setSettings({
      hero_bg_type: next.bgType, hero_title: next.title, hero_subtitle: next.subtitle,
      hero_btn_text: next.btnText, hero_btn_link: next.btnLink,
      hero_bg_opacity: next.opacity, hero_bg_blur: next.blur,
      hero_bg_brightness: next.brightness, hero_bg_contrast: next.contrast,
      hero_bg_saturation: next.saturation,
      hero_overlay_color: next.overlayColor, hero_overlay_alpha: next.overlayAlpha,
      hero_anim_speed: next.animSpeed, hero_zoom: next.zoom, hero_parallax: next.parallax,
      hero_bg_url: next.bgUrl, hero_slideshow_urls: JSON.stringify(next.slideUrls),
      hero_slide_transition: next.slideTrans, hero_slide_duration: next.slideDur,
      hero_video_autoplay: next.autoplay, hero_video_loop: next.loop,
      hero_video_mute: next.mute, hero_video_brightness: next.videoBright,
      hero_video_mobile: next.videoMobile, hero_video_speed: next.videoSpeed,
      hero_grad_from: next.gradFrom, hero_grad_to: next.gradTo,
      hero_custom_html: next.customHtml,
      hero_extra_layers: JSON.stringify(next.extraLayers || []),
    });
  }, []);

  const update = useCallback((patch) => {
    setSt(prev => {
      const next = { ...prev, ...patch };
      persist(next);
      return next;
    });
  }, [persist]);

  const resetToDefault = () => {
    const d = {
      bgType: "gradient_anim", title: "", subtitle: "", btnText: "", btnLink: "/books",
      opacity: 100, blur: 0, brightness: 100, contrast: 100, saturation: 100,
      overlayColor: "#000000", overlayAlpha: 30, animSpeed: 5, zoom: false, parallax: false,
      bgUrl: "", slideUrls: [], slideTrans: "fade", slideDur: 4,
      autoplay: true, loop: true, mute: true, videoBright: 100, videoMobile: true, videoSpeed: 1,
      gradFrom: "#134e2a", gradTo: "#1a6b3c", customHtml: "", extraLayers: [],
    };
    setSt(d); persist(d);
    toast.success("تمت الاستعادة للافتراضي");
  };

  const uploadFile = async (file, onDone, label = "الملف") => {
    if (!file) return;
    setUploading(true); setUploadPct(0); setUploadLabel(label);
    const fakeProgress = setInterval(() => setUploadPct(p => Math.min(p + 8, 88)), 300);
    try {
      const { file_url } = await uploads.upload({ file, kind: isVideo ? "videos" : "misc" });
      clearInterval(fakeProgress); setUploadPct(100);
      onDone(file_url);
      toast.success("✓ تم الرفع بنجاح");
    } catch {
      clearInterval(fakeProgress);
      toast.error("فشل الرفع — حاول مرة أخرى");
    } finally {
      setTimeout(() => { setUploading(false); setUploadPct(0); setUploadLabel(""); }, 900);
    }
  };

  const isVideo = st.bgType === "video_mp4" || st.bgType === "video_webm";
  const isImage = st.bgType === "static_image" || st.bgType === "animated_gif";
  const isSlide = st.bgType === "slideshow";
  const isGrad  = st.bgType === "gradient_anim";
  const isAnim  = ["particles","islamic_pattern","floating_shapes","stars","waves"].includes(st.bgType);
  const isHtml  = st.bgType === "custom_html";

  const visibleTabs = [
    { id: "type",    label: "النوع",      icon: Layers },
    { id: "preview", label: "معاينة",     icon: Eye },
    { id: "upload",  label: "رفع",        icon: Upload },
    { id: "effects", label: "تأثيرات",    icon: Zap },
    { id: "content", label: "نصوص",       icon: Settings },
    ...(isVideo ? [{ id: "video", label: "فيديو",  icon: Film }] : []),
    ...(isSlide ? [{ id: "slides", label: "شرائح", icon: Play }] : []),
  ];

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
            <Image className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black">إدارة الخلفيات</h2>
            <p className="text-xs text-muted-foreground">تحكم احترافي كامل — يُطبَّق فوراً على الصفحة الرئيسية</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={resetToDefault} className="gap-1.5 text-xs">
            <RotateCcw className="w-3.5 h-3.5" /> استعادة
          </Button>
          <Button size="sm" variant="outline" onClick={() => setFullscreen(true)} className="gap-1.5 text-xs">
            <Maximize2 className="w-3.5 h-3.5" /> ملء الشاشة
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl overflow-x-auto">
        {visibleTabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              tab === t.id ? "bg-white dark:bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TYPE ── */}
      {tab === "type" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {BG_TYPES.map(type => (
              <button key={type.id} onClick={() => update({ bgType: type.id })}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  st.bgType === type.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card hover:border-primary/40 hover:bg-muted"
                }`}>
                <span className="text-xl">{type.icon}</span>
                <span className="text-xs font-medium flex-1 text-right">{type.label}</span>
                {st.bgType === type.id && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            ))}
          </div>

          {isGrad && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold">ألوان التدرج</p>
              <div className="grid grid-cols-2 gap-4">
                {[["اللون الأول", "gradFrom"], ["اللون الثاني", "gradTo"]].map(([label, key]) => (
                  <div key={key}>
                    <Label className="text-xs mb-2 block">{label}</Label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={st[key]} onChange={e => update({ [key]: e.target.value })}
                        className="w-10 h-10 rounded-lg cursor-pointer border border-border" />
                      <span className="text-xs text-muted-foreground font-mono">{st[key]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(isAnim || isGrad) && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-2">
              <Label className="text-xs">سرعة الحركة: {st.animSpeed}x</Label>
              <Slider min={1} max={10} step={1} value={[st.animSpeed]} onValueChange={([v]) => update({ animSpeed: v })} />
            </div>
          )}
          {isHtml && (
            <div className="space-y-2">
              <Label className="text-xs">كود HTML/CSS/JS مخصص</Label>
              <textarea value={st.customHtml} onChange={e => update({ customHtml: e.target.value })}
                className="w-full h-40 p-3 text-xs font-mono bg-muted rounded-xl border border-border resize-none"
                placeholder="<div style='...'>...</div>" />
            </div>
          )}

          {/* ── Extra layers combined on top of the base type ── */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" /> طبقات إضافية فوق الخلفية
            </p>
            <p className="text-[11px] text-muted-foreground">
              فعّل أي عدد من الطبقات لتركيبها فوق النوع المختار — مثلاً فيديو + جزيئات + نمط إسلامي معاً
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {EXTRA_LAYERS.map(layer => {
                const on = st.extraLayers.includes(layer.id);
                return (
                  <button key={layer.id}
                    onClick={() => update({ extraLayers: on ? st.extraLayers.filter(l => l !== layer.id) : [...st.extraLayers, layer.id] })}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border-2 transition-all ${
                      on ? "border-primary bg-primary/10 text-primary" : "border-border bg-card hover:border-primary/40"
                    }`}>
                    <span className="text-base">{layer.icon}</span>
                    <span className="text-xs font-medium flex-1 text-right">{layer.label}</span>
                    {on && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
            {st.extraLayers.includes("custom_html") && (
              <div className="space-y-1">
                <Label className="text-xs">كود الطبقة المخصصة</Label>
                <textarea value={st.customHtml} onChange={e => update({ customHtml: e.target.value })}
                  className="w-full h-24 p-3 text-xs font-mono bg-muted rounded-xl border border-border resize-none"
                  placeholder="<div style='...'>...</div>" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PREVIEW ── */}
      {tab === "preview" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Monitor className="w-4 h-4" />
            <span>معاينة مباشرة مطابقة 100% للصفحة الرئيسية</span>
          </div>
          <div className="rounded-2xl overflow-hidden border-2 border-border shadow-xl">
            <HeroBanner />
          </div>
          <p className="text-[11px] text-muted-foreground text-center">
            أي تعديل تجريه يظهر هنا فوراً ويُطبَّق على الصفحة الرئيسية
          </p>
        </div>
      )}

      {/* ── UPLOAD ── */}
      {tab === "upload" && (
        <div className="space-y-4">
          {(isImage || isVideo) && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold">{isVideo ? "رفع فيديو" : "رفع صورة الخلفية"}</p>
              {st.bgUrl && (
                <div className="relative rounded-xl overflow-hidden border border-border">
                  {isVideo
                    ? <video src={st.bgUrl} className="w-full h-40 object-cover" muted />
                    : <img src={st.bgUrl} className="w-full h-40 object-cover" alt="preview" />}
                  <button onClick={() => update({ bgUrl: "" })}
                    className="absolute top-2 left-2 bg-destructive text-white rounded-full p-1.5 shadow">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
                    {isVideo ? "فيديو مرفوع" : "صورة مرفوعة"}
                  </div>
                </div>
              )}
              <input ref={fileRef} type="file"
                accept={isVideo ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp,image/gif"}
                className="hidden"
                onChange={e => uploadFile(e.target.files[0], url => update({ bgUrl: url }), isVideo ? "الفيديو" : "الصورة")} />
              <Button variant="outline" className="w-full gap-2" onClick={() => fileRef.current.click()} disabled={uploading}>
                <Upload className="w-4 h-4" />
                {uploading && uploadLabel ? `جارٍ رفع ${uploadLabel}... ${uploadPct}%` : `اختر ${isVideo ? "فيديو" : "صورة"}`}
              </Button>
              {uploading && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>جارٍ الرفع...</span>
                    <span>{uploadPct}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${uploadPct}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {isSlide && (
            <div className="bg-card border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">صور الشرائح ({st.slideUrls.length})</p>
                <button onClick={() => slideRef.current.click()} disabled={uploading}
                  className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline">
                  <Plus className="w-3.5 h-3.5" /> إضافة صورة
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {st.slideUrls.map((url, i) => (
                  <div key={i} className="relative group rounded-xl overflow-hidden border border-border">
                    <img src={url} className="w-full h-24 object-cover" alt={`slide ${i + 1}`} />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                    <button onClick={() => update({ slideUrls: st.slideUrls.filter((_, idx) => idx !== i) })}
                      className="absolute top-1 left-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3 h-3" />
                    </button>
                    <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 rounded-full">{i + 1}</span>
                  </div>
                ))}
                <button onClick={() => slideRef.current.click()} disabled={uploading}
                  className="flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary text-muted-foreground hover:text-primary transition-colors">
                  <Plus className="w-6 h-6" />
                  <span className="text-[10px] mt-1">إضافة</span>
                </button>
              </div>
              <input ref={slideRef} type="file" accept="image/*" className="hidden"
                onChange={e => uploadFile(e.target.files[0], url => update({ slideUrls: [...st.slideUrls, url] }), "الصورة")} />
              {uploading && (
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${uploadPct}%` }} />
                </div>
              )}
            </div>
          )}

          <div className="bg-card border border-border rounded-xl p-4 space-y-2">
            <Label className="text-xs font-semibold">أو أدخل رابط مباشر</Label>
            <Input value={st.bgUrl} onChange={e => update({ bgUrl: e.target.value })}
              dir="ltr" className="text-xs font-mono" placeholder="https://..." />
            {st.bgUrl && (
              <button onClick={() => update({ bgUrl: "" })} className="text-xs text-destructive hover:underline flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> حذف الرابط
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── EFFECTS ── */}
      {tab === "effects" && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <p className="text-sm font-semibold">تأثيرات الصورة / الفيديو</p>
            {[
              { label: "الشفافية", key: "opacity",    min: 10, max: 100, unit: "%" },
              { label: "الضبابية", key: "blur",        min: 0,  max: 30,  unit: "px" },
              { label: "السطوع",   key: "brightness",  min: 20, max: 150, unit: "%" },
              { label: "التباين",  key: "contrast",    min: 50, max: 200, unit: "%" },
              { label: "التشبع",   key: "saturation",  min: 0,  max: 200, unit: "%" },
            ].map(({ label, key, min, max, unit }) => (
              <div key={key}>
                <Label className="text-xs mb-1 block">{label}: {st[key]}{unit}</Label>
                <Slider min={min} max={max} value={[st[key]]} onValueChange={([v]) => update({ [key]: v })} />
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl p-4 space-y-4">
            <p className="text-sm font-semibold">طبقة التعتيم</p>
            <div className="flex items-center gap-3">
              <Label className="text-xs">اللون</Label>
              <input type="color" value={st.overlayColor} onChange={e => update({ overlayColor: e.target.value })}
                className="w-10 h-9 rounded-lg cursor-pointer border border-border" />
              <span className="text-xs text-muted-foreground font-mono">{st.overlayColor}</span>
            </div>
            <div>
              <Label className="text-xs mb-1 block">شدة التعتيم: {st.overlayAlpha}%</Label>
              <Slider min={0} max={90} value={[st.overlayAlpha]} onValueChange={([v]) => update({ overlayAlpha: v })} />
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold">تأثيرات حركية</p>
            {[
              { label: "تأثير التكبير (Ken Burns)", key: "zoom" },
              { label: "تأثير المنظور (Parallax)",  key: "parallax" },
            ].map(({ label, key }) => (
              <div key={key} className="flex items-center justify-between">
                <Label className="text-xs">{label}</Label>
                <Switch checked={st[key]} onCheckedChange={v => update({ [key]: v })} />
              </div>
            ))}
            <div>
              <Label className="text-xs mb-1 block">سرعة الحركة: {st.animSpeed}x</Label>
              <Slider min={1} max={10} step={1} value={[st.animSpeed]} onValueChange={([v]) => update({ animSpeed: v })} />
            </div>
          </div>
        </div>
      )}

      {/* ── CONTENT ── */}
      {tab === "content" && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <p className="text-sm font-semibold flex items-center gap-2"><Settings className="w-4 h-4" /> نصوص البانر</p>
          {[
            { label: "العنوان الرئيسي", key: "title",    placeholder: "اتركه فارغاً للافتراضي" },
            { label: "العنوان الفرعي",  key: "subtitle", placeholder: "اتركه فارغاً للافتراضي" },
            { label: "نص الزر",         key: "btnText",  placeholder: "اتركه فارغاً للافتراضي" },
          ].map(({ label, key, placeholder }) => (
            <div key={key} className="space-y-1">
              <Label className="text-xs">{label}</Label>
              <Input value={st[key]} onChange={e => update({ [key]: e.target.value })}
                placeholder={placeholder} className="text-sm" />
            </div>
          ))}
          <div className="space-y-1">
            <Label className="text-xs">رابط الزر</Label>
            <Input value={st.btnLink} onChange={e => update({ btnLink: e.target.value })}
              placeholder="/books" className="text-sm font-mono" dir="ltr" />
          </div>

          {/* Mini preview */}
          <div className="mt-2 p-4 rounded-xl bg-primary/10 border border-primary/20">
            <p className="text-xs text-muted-foreground mb-2">معاينة النصوص:</p>
            <p className="font-black text-foreground text-lg leading-tight">{st.title || "عنوان البانر"}</p>
            <p className="text-sm text-muted-foreground mt-1">{st.subtitle || "وصف البانر"}</p>
            <span className="inline-block mt-2 px-4 py-1.5 bg-accent text-accent-foreground rounded-lg text-xs font-bold">
              {st.btnText || "زر البانر"}
            </span>
          </div>
        </div>
      )}

      {/* ── VIDEO ── */}
      {tab === "video" && isVideo && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold flex items-center gap-2"><Film className="w-4 h-4" /> إعدادات الفيديو</p>
            {[
              { label: "تشغيل تلقائي عند الدخول", key: "autoplay" },
              { label: "تكرار تلقائي",              key: "loop"     },
              { label: "كتم الصوت",                 key: "mute"     },
              { label: "تحسين الأجهزة الضعيفة",    key: "videoMobile" },
            ].map(({ label, key }) => (
              <div key={key} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
                <Label className="text-xs">{label}</Label>
                <Switch checked={st[key]} onCheckedChange={v => update({ [key]: v })} />
              </div>
            ))}
            <div>
              <Label className="text-xs mb-1 block">سطوع الفيديو: {st.videoBright}%</Label>
              <Slider min={20} max={150} value={[st.videoBright]} onValueChange={([v]) => update({ videoBright: v })} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">سرعة التشغيل: {st.videoSpeed}x</Label>
              <Slider min={0.5} max={2} step={0.25} value={[st.videoSpeed]} onValueChange={([v]) => update({ videoSpeed: v })} />
            </div>
          </div>
        </div>
      )}

      {/* ── SLIDES ── */}
      {tab === "slides" && isSlide && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-4">
          <p className="text-sm font-semibold flex items-center gap-2"><Play className="w-4 h-4" /> إعدادات عرض الشرائح</p>
          <div className="space-y-2">
            <Label className="text-xs">تأثير الانتقال</Label>
            <div className="flex gap-2 flex-wrap">
              {TRANSITIONS.map(t => (
                <button key={t} onClick={() => update({ slideTrans: t })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${
                    st.slideTrans === t ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40"
                  }`}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs mb-1 block">مدة كل شريحة: {st.slideDur} ثانية</Label>
            <Slider min={2} max={15} step={1} value={[st.slideDur]} onValueChange={([v]) => update({ slideDur: v })} />
          </div>
        </div>
      )}

      {/* Footer action */}
      <div className="flex gap-2 pt-2 border-t border-border">
        <Button onClick={() => { persist(st); toast.success("✓ تم الحفظ وتطبيق التغييرات"); }} className="flex-1 gap-2">
          <Check className="w-4 h-4" /> حفظ وتطبيق
        </Button>
        <Button variant="outline" onClick={() => setTab("preview")} className="gap-2">
          <Eye className="w-4 h-4" /> معاينة
        </Button>
      </div>

      {/* Fullscreen preview modal */}
      {fullscreen && (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 bg-black/80">
            <span className="text-white text-sm font-semibold">معاينة ملء الشاشة</span>
            <button onClick={() => setFullscreen(false)} className="text-white p-1.5 hover:bg-white/10 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4">
            <HeroBanner />
          </div>
        </div>
      )}
    </div>
  );
}