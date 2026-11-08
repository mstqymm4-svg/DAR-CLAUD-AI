/**
 * DevBackgroundManager — Complete background management system
 * Live preview + instant save + all background types
 */
import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Image, Video, Upload, Trash2, Film, Zap, Plus, X, Check,
  Layers, Eye, Settings, RotateCcw, Maximize2,
  ImageIcon, Sparkles, Globe, Star
} from "lucide-react";
import { getSetting, setSettings } from "@/lib/settingsStore";
import { base44 } from "@/api/base44Client";
import HeroBanner from "@/components/HeroBanner";
import UserLayer, { USER_LAYER_EFFECTS } from "@/components/hero/UserLayer";
import MediaLayer, { BLEND_MODES, MOTIONS } from "@/components/hero/MediaLayer";
import AiLayerStudio from "@/components/dev/AiLayerStudio";

// ── Background types ──────────────────────────────────────────────────────────
const BG_TYPES = [
  { id: "gradient_anim",   label: "تدرج متحرك",    icon: "🌈", cat: "animated" },
  { id: "particles",       label: "جزيئات",         icon: "✨", cat: "animated" },
  { id: "islamic_pattern", label: "نمط إسلامي",     icon: "☪",  cat: "islamic"  },
  { id: "floating_shapes", label: "أشكال طائرة",    icon: "◆",  cat: "animated" },
  { id: "stars",           label: "نجوم متحركة",    icon: "⭐", cat: "animated" },
  { id: "waves",           label: "موجات",          icon: "〰", cat: "animated" },
  { id: "static_image",    label: "صورة ثابتة",     icon: "🖼",  cat: "images"   },
  { id: "animated_gif",    label: "GIF متحرك",      icon: "🎞",  cat: "images"   },
  { id: "slideshow",       label: "عرض شرائح",      icon: "📸",  cat: "images"   },
  { id: "video_mp4",       label: "فيديو MP4",      icon: "🎬",  cat: "video"    },
  { id: "video_webm",      label: "فيديو WebM",     icon: "🎥",  cat: "video"    },
  { id: "custom_html",     label: "HTML مخصص",      icon: "💻",  cat: "custom"   },
];

const BG_CATS = [
  { id: "all",      label: "الكل",       icon: Layers    },
  { id: "images",   label: "صور",        icon: ImageIcon },
  { id: "animated", label: "متحركة",     icon: Sparkles  },
  { id: "video",    label: "فيديو",      icon: Video     },
  { id: "islamic",  label: "إسلامية",    icon: Star      },
  { id: "custom",   label: "مخصصة",      icon: Globe     },
];

const TABS = [
  { id: "current",  label: "الحالية",    icon: Eye      },
  { id: "type",     label: "النوع",      icon: Layers   },
  { id: "upload",   label: "رفع",        icon: Upload   },
  { id: "effects",  label: "التأثيرات",  icon: Zap      },
  { id: "content",  label: "النصوص",     icon: Settings },
  { id: "preview",  label: "معاينة",     icon: Eye      },
];

const TRANSITIONS = ["fade", "slide", "zoom", "blur"];

// Layers that can be combined on top of ANY base background type
const EXTRA_LAYERS = [
  { id: "particles",       label: "جزيئات",        icon: "✨" },
  { id: "stars",           label: "نجوم",          icon: "⭐" },
  { id: "waves",           label: "موجات",         icon: "〰" },
  { id: "islamic_pattern", label: "نمط إسلامي",    icon: "☪" },
  { id: "floating_shapes", label: "أشكال طائرة",   icon: "◆" },
  { id: "snow",            label: "ثلج",           icon: "❄" },
  { id: "rain",            label: "مطر",           icon: "🌧" },
  { id: "fireflies",       label: "يراعات مضيئة",  icon: "🟢" },
  { id: "bubbles",         label: "فقاعات",        icon: "🫧" },
  { id: "light_rays",      label: "أشعة ضوء",      icon: "🔆" },
  { id: "aurora",          label: "شفق قطبي",      icon: "🌌" },
  { id: "grid",            label: "شبكة هندسية",   icon: "▦" },
  { id: "custom_html",     label: "HTML مخصص",     icon: "💻" },
];

function r(k, fallback = "") { return getSetting(k) || fallback; }

function buildState() {
  return {
    bgType:      r("hero_bg_type", "gradient_anim"),
    title:       r("hero_title"),
    subtitle:    r("hero_subtitle"),
    btnText:     r("hero_btn_text"),
    btnLink:     r("hero_btn_link") || "/books",
    opacity:     Number(r("hero_bg_opacity") || 100),
    blur:        Number(r("hero_bg_blur") || 0),
    brightness:  Number(r("hero_bg_brightness") || 100),
    contrast:    Number(r("hero_bg_contrast") || 100),
    saturation:  Number(r("hero_bg_saturation") || 100),
    overlayColor: r("hero_overlay_color") || "#000000",
    overlayAlpha: Number(r("hero_overlay_alpha") || 30),
    animSpeed:   Number(r("hero_anim_speed") || 5),
    zoom:        r("hero_zoom") === "true",
    parallax:    r("hero_parallax") === "true",
    bgUrl:       r("hero_bg_url"),
    slideUrls:   (() => { try { return JSON.parse(r("hero_slideshow_urls") || "[]"); } catch { return []; } })(),
    slideTrans:  r("hero_slide_transition") || "fade",
    slideDur:    Number(r("hero_slide_duration") || 4),
    autoplay:    r("hero_video_autoplay") !== "false",
    loop:        r("hero_video_loop") !== "false",
    mute:        r("hero_video_mute") !== "false",
    videoBright: Number(r("hero_video_brightness") || 100),
    videoMobile: r("hero_video_mobile") !== "false",
    videoSpeed:  Number(r("hero_video_speed") || 1),
    gradFrom:    r("hero_grad_from") || "#134e2a",
    gradTo:      r("hero_grad_to") || "#1a6b3c",
    customHtml:  r("hero_custom_html"),
    extraLayers: (() => { try { return JSON.parse(r("hero_extra_layers") || "[]"); } catch { return []; } })(),
    customLayers: (() => { try { return JSON.parse(r("hero_custom_layers") || "[]"); } catch { return []; } })(),
  };
}

export default function DevBackgroundManager() {
  const [tab, setTab]           = useState("current");
  const [bgCat, setBgCat]       = useState("all");
  const [st, setSt]             = useState(buildState);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadLabel, setUploadLabel] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const fileRef   = useRef();
  const slideRef  = useRef();
  const layerFileRef = useRef();

  const isVideo = st.bgType === "video_mp4" || st.bgType === "video_webm";
  const isImage = st.bgType === "static_image" || st.bgType === "animated_gif";
  const isSlide = st.bgType === "slideshow";
  const isGrad  = st.bgType === "gradient_anim";
  const isAnim  = ["particles","islamic_pattern","floating_shapes","stars","waves"].includes(st.bgType);

  const persist = useCallback((next) => {
    setSettings({
      hero_bg_type:       next.bgType,
      hero_title:         next.title,
      hero_subtitle:      next.subtitle,
      hero_btn_text:      next.btnText,
      hero_btn_link:      next.btnLink,
      hero_bg_opacity:    next.opacity,
      hero_bg_blur:       next.blur,
      hero_bg_brightness: next.brightness,
      hero_bg_contrast:   next.contrast,
      hero_bg_saturation: next.saturation,
      hero_overlay_color: next.overlayColor,
      hero_overlay_alpha: next.overlayAlpha,
      hero_anim_speed:    next.animSpeed,
      hero_zoom:          next.zoom,
      hero_parallax:      next.parallax,
      hero_bg_url:        next.bgUrl,
      hero_slideshow_urls: JSON.stringify(next.slideUrls),
      hero_slide_transition: next.slideTrans,
      hero_slide_duration: next.slideDur,
      hero_video_autoplay: next.autoplay,
      hero_video_loop:    next.loop,
      hero_video_mute:    next.mute,
      hero_video_brightness: next.videoBright,
      hero_video_mobile:  next.videoMobile,
      hero_video_speed:   next.videoSpeed,
      hero_grad_from:     next.gradFrom,
      hero_grad_to:      next.gradTo,
      hero_custom_html:   next.customHtml,
      hero_extra_layers:  JSON.stringify(next.extraLayers || []),
      hero_custom_layers: JSON.stringify(next.customLayers || []),
      });
  }, []);

  const update = useCallback((patch) => {
    setSt(prev => {
      const next = { ...prev, ...patch };
      persist(next);
      return next;
    });
  }, [persist]);

  const reset = () => {
    const d = buildState();
    // Reset to defaults
    const def = {
      bgType: "gradient_anim", title: "", subtitle: "", btnText: "", btnLink: "/books",
      opacity: 100, blur: 0, brightness: 100, contrast: 100, saturation: 100,
      overlayColor: "#000000", overlayAlpha: 30, animSpeed: 5, zoom: false, parallax: false,
      bgUrl: "", slideUrls: [], slideTrans: "fade", slideDur: 4,
      autoplay: true, loop: true, mute: true, videoBright: 100, videoMobile: true, videoSpeed: 1,
      gradFrom: "#134e2a", gradTo: "#1a6b3c", customHtml: "", extraLayers: [], customLayers: [],
    };
    setSt(def); persist(def);
    toast.success("تمت الاستعادة للإعدادات الافتراضية");
  };

  // ── User-defined custom layers ──
  const [layerForm, setLayerForm] = useState(null); // { id, label, html }

  const saveCustomLayer = () => {
    if (!layerForm) return;
    const label = layerForm.label.trim();
    if (!label) { toast.error("أدخل اسم الطبقة"); return; }
    const id = layerForm.id || "l" + Date.now().toString(36);
    const src = layerForm.source || "effect";
    if (src === "media" && !layerForm.url) { toast.error("ارفع صورة أو فيديو للطبقة أولاً"); return; }
    if (src === "ai" && !layerForm.html) { toast.error("أنشئ التأثير بالوصف أولاً"); return; }
    const cfg = src === "effect"
      ? { effect: layerForm.effect, color: layerForm.color, density: layerForm.density, speed: layerForm.speed }
      : src === "media"
        ? { url: layerForm.url, blend: layerForm.blend, opacity: layerForm.opacity,
            motion: layerForm.motion, speed: layerForm.speed, tile: layerForm.tile, tileSize: layerForm.tileSize }
        : { html: layerForm.html };
    const exists = st.customLayers.some(l => l.id === id);
    const customLayers = exists
      ? st.customLayers.map(l => l.id === id ? { id, label, ...cfg } : l)
      : [...st.customLayers, { id, label, ...cfg }];
    const key = "custom:" + id;
    update({
      customLayers,
      extraLayers: [...new Set([...st.extraLayers.filter(x => x !== key), key])]
    });
    setLayerForm(null);
    toast.success(exists ? "تم تحديث الطبقة ✓" : "تمت إضافة الطبقة وتفعيلها ✓");
  };

  const deleteCustomLayer = (id) => {
    update({
      customLayers: st.customLayers.filter(l => l.id !== id),
      extraLayers: st.extraLayers.filter(x => x !== "custom:" + id)
    });
    if (layerForm?.id === id) setLayerForm(null);
  };

  const NEW_LAYER = {
    id: "", label: "", source: "effect",
    effect: "particles", color: "#ffd786", density: 60, speed: 5,
    url: "", blend: "screen", opacity: 70, motion: "drift", tile: false, tileSize: 160,
    aiPrompt: "", html: "",
  };

  const uploadFile = async (file, onDone, label = "الملف") => {
    if (!file) return;
    if (file.size > 500 * 1024 * 1024) { toast.error("الحجم الأقصى 500MB"); return; }
    setUploading(true); setUploadPct(0); setUploadLabel(label);
    const timer = setInterval(() => setUploadPct(p => Math.min(p + 7, 88)), 350);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      clearInterval(timer); setUploadPct(100);
      onDone(file_url);
      toast.success("✓ تم رفع الملف بنجاح");
    } catch {
      clearInterval(timer);
      toast.error("فشل الرفع — حاول مرة أخرى");
    } finally {
      setTimeout(() => { setUploading(false); setUploadPct(0); setUploadLabel(""); }, 800);
    }
  };

  // ── Render sections ──────────────────────────────────────────────────────────

  const renderCurrent = () => {
    const typeInfo = BG_TYPES.find(t => t.id === st.bgType);
    const now = new Date().toLocaleString("ar-SA");
    return (
      <div className="space-y-4">
        {/* Status card */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">
                {typeInfo?.icon || "🎨"}
              </div>
              <div>
                <p className="font-bold">{typeInfo?.label || "خلفية"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">آخر تعديل: {now}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-green-500/10 text-green-600 text-xs font-bold px-3 py-1.5 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              نشطة
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: "الشفافية", val: `${st.opacity}%` },
              { label: "السطوع",   val: `${st.brightness}%` },
              { label: "الضبابية", val: `${st.blur}px` },
            ].map(({ label, val }) => (
              <div key={label} className="bg-muted/50 rounded-xl p-3 text-center">
                <p className="text-lg font-black text-primary">{val}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Current bg preview */}
        {(st.bgUrl || isSlide) && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <p className="text-sm font-semibold">الخلفية الحالية</p>
              <button onClick={() => update({ bgUrl: "" })}
                className="flex items-center gap-1.5 text-xs text-destructive hover:underline">
                <Trash2 className="w-3.5 h-3.5" /> حذف
              </button>
            </div>
            {isSlide ? (
              <div className="grid grid-cols-3 gap-1 p-3">
                {st.slideUrls.map((url, i) => (
                  <img key={i} src={url} alt="" className="w-full h-20 object-cover rounded-lg" />
                ))}
              </div>
            ) : isVideo ? (
              <video src={st.bgUrl} className="w-full h-48 object-cover" muted loop autoPlay playsInline />
            ) : (
              <img src={st.bgUrl} alt="background" className="w-full h-48 object-cover" />
            )}
          </div>
        )}

        {/* Content preview */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
          <p className="text-sm font-semibold">نصوص البانر الحالية</p>
          <div className="bg-muted/30 rounded-xl p-4 space-y-1.5">
            <p className="font-black text-xl">{st.title || "عنوان البانر الافتراضي"}</p>
            <p className="text-sm text-muted-foreground">{st.subtitle || "وصف البانر الافتراضي"}</p>
            <span className="inline-block mt-1 px-4 py-1.5 bg-accent text-accent-foreground rounded-lg text-xs font-bold">
              {st.btnText || "استعرض المكتبة"}
            </span>
          </div>
        </div>

        <Button onClick={() => setTab("preview")} className="w-full gap-2">
          <Eye className="w-4 h-4" /> فتح المعاينة المباشرة
        </Button>
      </div>
    );
  };

  const renderType = () => {
    const filtered = bgCat === "all" ? BG_TYPES : BG_TYPES.filter(t => t.cat === bgCat);
    return (
      <div className="space-y-4">
        {/* Category filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {BG_CATS.map(cat => {
            const Icon = cat.icon;
            return (
              <button key={cat.id} onClick={() => setBgCat(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all ${
                  bgCat === cat.id ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/40"
                }`}>
                <Icon className="w-3.5 h-3.5" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Types grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {filtered.map(type => (
            <button key={type.id} onClick={() => update({ bgType: type.id })}
              className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                st.bgType === type.id
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-border bg-card hover:border-primary/40 hover:bg-muted"
              }`}>
              <span className="text-2xl">{type.icon}</span>
              <span className="text-xs font-medium text-right flex-1">{type.label}</span>
              {st.bgType === type.id && <Check className="w-4 h-4 shrink-0" />}
            </button>
          ))}
        </div>

        {/* Type-specific settings */}
        {isGrad && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <p className="text-sm font-semibold">🎨 ألوان التدرج</p>
            <div className="grid grid-cols-2 gap-4">
              {[["اللون الأول", "gradFrom"], ["اللون الثاني", "gradTo"]].map(([label, key]) => (
                <div key={key}>
                  <Label className="text-xs mb-2 block">{label}</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={st[key]} onChange={e => update({ [key]: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0" style={{ appearance: "none" }} />
                    <Input value={st[key]} onChange={e => update({ [key]: e.target.value })}
                      className="h-8 text-xs font-mono" maxLength={7} />
                  </div>
                </div>
              ))}
            </div>
            <div className="h-8 rounded-xl transition-all"
              style={{ background: `linear-gradient(135deg, ${st.gradFrom}, ${st.gradTo})` }} />
          </div>
        )}
        {(isAnim || isGrad) && (
          <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
            <Label className="text-xs">⚡ سرعة الحركة: {st.animSpeed}x</Label>
            <Slider min={1} max={10} step={1} value={[st.animSpeed]} onValueChange={([v]) => update({ animSpeed: v })} />
          </div>
        )}
        {st.bgType === "custom_html" && (
          <div className="space-y-2">
            <Label className="text-xs font-semibold">كود HTML/CSS/JS مخصص</Label>
            <textarea value={st.customHtml} onChange={e => update({ customHtml: e.target.value })}
              className="w-full h-40 p-3 text-xs font-mono bg-muted rounded-xl border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="<div style='background: linear-gradient(...);'>...</div>" />
          </div>
        )}

        {/* ── Extra layers combined on top of the base type ── */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <p className="text-sm font-bold flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" /> طبقات إضافية فوق الخلفية
          </p>
          <p className="text-[11px] text-muted-foreground">
            فعّل أي عدد من الطبقات لتركيبها فوق النوع المختار — مثلاً فيديو + ثلج + نمط إسلامي معاً
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
                className="w-full h-24 p-3 text-xs font-mono bg-muted rounded-xl border border-border resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="<div style='...'>...</div>" />
            </div>
          )}

          {/* ── User's own layers ── */}
          <div className="border-t border-border pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold">🧩 طبقاتك الخاصة</p>
              <button onClick={() => setLayerForm({ ...NEW_LAYER })}
                className="flex items-center gap-1 text-[11px] text-primary font-bold hover:underline">
                <Plus className="w-3.5 h-3.5" /> إضافة طبقة جديدة
              </button>
            </div>
            {st.customLayers.length === 0 && !layerForm && (
              <p className="text-[11px] text-muted-foreground">
                لا توجد طبقات خاصة بعد — أنشئ طبقتك بكود HTML/CSS مخصص وتفعّلها مثل باقي الطبقات
              </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {st.customLayers.map(cl => {
                const key = "custom:" + cl.id;
                const on = st.extraLayers.includes(key);
                return (
                  <div key={cl.id}
                    className={`flex items-center gap-1 p-2.5 rounded-xl border-2 transition-all ${
                      on ? "border-primary bg-primary/10 text-primary" : "border-border bg-card"
                    }`}>
                    <button onClick={() => update({ extraLayers: on ? st.extraLayers.filter(l => l !== key) : [...st.extraLayers, key] })}
                      className="flex items-center gap-1.5 flex-1 min-w-0 text-right">
                      <span className="text-base shrink-0">🧩</span>
                      <span className="text-xs font-medium truncate">{cl.label}</span>
                    </button>
                    {on && <Check className="w-3 h-3 shrink-0" />}
                    <button onClick={() => setLayerForm({
                      ...NEW_LAYER, ...cl,
                      source: cl.url ? "media" : cl.effect ? "effect" : "ai",
                    })}
                      className="text-muted-foreground hover:text-primary shrink-0">
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteCustomLayer(cl.id)}
                      className="text-muted-foreground hover:text-destructive shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
            {layerForm && (
              <div className="bg-muted/40 rounded-xl p-3 space-y-3">
                {/* 0. Source picker */}
                <div className="flex gap-1 bg-card p-1 rounded-xl border border-border">
                  {[
                    { id: "effect", label: "تأثير جاهز" },
                    { id: "media",  label: "صورة / فيديو" },
                    { id: "ai",     label: "بالوصف ✨" },
                  ].map(o => (
                    <button key={o.id} onClick={() => setLayerForm({ ...layerForm, source: o.id })}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                        (layerForm.source || "effect") === o.id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                      }`}>{o.label}</button>
                  ))}
                </div>

                {/* MEDIA source */}
                {layerForm.source === "media" && (
                  <div className="space-y-2">
                    <input ref={layerFileRef} type="file" accept="image/*,video/mp4,video/webm" className="hidden"
                      onChange={e => uploadFile(e.target.files[0], url => setLayerForm(f => ({ ...f, url })), "الطبقة")} />
                    <Button variant="outline" className="w-full gap-2 h-10 text-xs" disabled={uploading}
                      onClick={() => layerFileRef.current.click()}>
                      <Upload className="w-4 h-4" />
                      {uploading ? `جارٍ الرفع... ${uploadPct}%` : layerForm.url ? "تغيير الملف" : "ارفع صورة شفافة / GIF / فيديو"}
                    </Button>
                    <Input value={layerForm.url} onChange={e => setLayerForm({ ...layerForm, url: e.target.value })}
                      dir="ltr" placeholder="أو الصق رابطاً مباشراً" className="h-9 text-[11px] font-mono" />
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[11px]">نمط الدمج</Label>
                        <select value={layerForm.blend} onChange={e => setLayerForm({ ...layerForm, blend: e.target.value })}
                          className="w-full h-9 rounded-lg bg-card border border-border text-xs px-2">
                          {BLEND_MODES.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px]">الحركة</Label>
                        <select value={layerForm.motion} onChange={e => setLayerForm({ ...layerForm, motion: e.target.value })}
                          className="w-full h-9 rounded-lg bg-card border border-border text-xs px-2">
                          {MOTIONS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">الشفافية: {layerForm.opacity}%</Label>
                      <Slider min={5} max={100} value={[layerForm.opacity]}
                        onValueChange={([v]) => setLayerForm({ ...layerForm, opacity: v })} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px]">تكرار كنمط (Tile)</Label>
                      <Switch checked={layerForm.tile} onCheckedChange={v => setLayerForm({ ...layerForm, tile: v })} />
                    </div>
                    {layerForm.tile && (
                      <div className="space-y-1">
                        <Label className="text-[11px]">حجم النمط: {layerForm.tileSize}px</Label>
                        <Slider min={40} max={400} step={10} value={[layerForm.tileSize]}
                          onValueChange={([v]) => setLayerForm({ ...layerForm, tileSize: v })} />
                      </div>
                    )}
                  </div>
                )}

                {/* AI source */}
                {layerForm.source === "ai" && (
                  <AiLayerStudio layerForm={layerForm} setLayerForm={setLayerForm} />
                )}

                {/* 1. Effect picker */}
                {(layerForm.source || "effect") === "effect" && (
                <div>
                  <Label className="text-xs mb-1.5 block">١. اختر شكل الطبقة</Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {USER_LAYER_EFFECTS.map(e => (
                      <button key={e.id} onClick={() => setLayerForm({ ...layerForm, effect: e.id })}
                        className={`flex flex-col items-center gap-0.5 p-2 rounded-xl border-2 transition-all ${
                          layerForm.effect === e.id
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card hover:border-primary/40"
                        }`}>
                        <span className="text-lg leading-none">{e.icon}</span>
                        <span className="text-[10px] font-medium">{e.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                )}
                {/* 2. Name */}
                <div className="space-y-1">
                  <Label className="text-xs">اسم الطبقة</Label>
                  <Input value={layerForm.label}
                    onChange={e => setLayerForm({ ...layerForm, label: e.target.value })}
                    placeholder="مثلاً: ذهب متطاير" className="h-9 text-xs" />
                </div>
                {/* 3. Color / density / speed */}
                {(layerForm.source || "effect") === "effect" && (
                <div>
                  <Label className="text-xs mb-1.5 block">التخصيص</Label>
                  <div className="grid grid-cols-3 gap-3 items-start">
                    <div className="space-y-1">
                      <Label className="text-[11px]">اللون</Label>
                      <input type="color" value={layerForm.color}
                        onChange={e => setLayerForm({ ...layerForm, color: e.target.value })}
                        className="w-full h-9 rounded-lg cursor-pointer border border-border p-0.5" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">الكمية: {layerForm.density}</Label>
                      <Slider min={10} max={150} value={[layerForm.density]}
                        onValueChange={([v]) => setLayerForm({ ...layerForm, density: v })} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">السرعة: {layerForm.speed}x</Label>
                      <Slider min={1} max={10} value={[layerForm.speed]}
                        onValueChange={([v]) => setLayerForm({ ...layerForm, speed: v })} />
                    </div>
                  </div>
                </div>
                )}
                {/* Live preview */}
                <div className="relative h-20 rounded-xl overflow-hidden border border-border bg-black/70">
                  {layerForm.source === "media"
                    ? <MediaLayer cfg={layerForm} />
                    : layerForm.source === "ai"
                      ? (layerForm.html
                          ? <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: layerForm.html }} />
                          : <p className="absolute inset-0 flex items-center justify-center text-[11px] text-white/60">المعاينة تظهر بعد إنشاء التأثير</p>)
                      : <UserLayer cfg={layerForm} />}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={saveCustomLayer} className="h-8 text-xs gap-1">
                    <Check className="w-3.5 h-3.5" /> حفظ وتفعيل
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setLayerForm(null)} className="h-8 text-xs">
                    إلغاء
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderUpload = () => (
    <div className="space-y-4">
      {(isImage || isVideo) && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border">
            <p className="text-sm font-bold">{isVideo ? "🎬 رفع ملف فيديو" : "🖼 رفع صورة خلفية"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isVideo ? "يدعم: MP4, WebM — الحجم الأقصى 500MB" : "يدعم: JPG, PNG, WEBP, GIF — الحجم الأقصى 500MB"}
            </p>
          </div>
          <div className="p-4 space-y-3">
            {st.bgUrl && (
              <div className="relative rounded-xl overflow-hidden border border-border group">
                {isVideo
                  ? <video src={st.bgUrl} className="w-full h-40 object-cover" muted loop autoPlay playsInline />
                  : <img src={st.bgUrl} className="w-full h-40 object-cover" alt="preview" />}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                <button onClick={() => update({ bgUrl: "" })}
                  className="absolute top-2 left-2 bg-destructive text-white rounded-full p-1.5 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded-full flex items-center gap-1">
                  <Check className="w-3 h-3" /> مرفوع
                </div>
              </div>
            )}

            <input ref={fileRef} type="file"
              accept={isVideo ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp,image/gif"}
              className="hidden"
              onChange={e => uploadFile(e.target.files[0], url => update({ bgUrl: url }), isVideo ? "الفيديو" : "الصورة")} />

            <Button variant="outline" className="w-full gap-2 h-12" onClick={() => fileRef.current.click()} disabled={uploading}>
              <Upload className="w-4 h-4" />
              {uploading ? `جارٍ رفع ${uploadLabel}...` : `اختر ${isVideo ? "فيديو" : "صورة"} من جهازك`}
            </Button>

            {uploading && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">جارٍ الرفع...</span>
                  <span className="font-bold text-primary">{uploadPct}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadPct}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isSlide && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">📸 صور عرض الشرائح</p>
              <p className="text-xs text-muted-foreground">{st.slideUrls.length} صورة مضافة</p>
            </div>
            <button onClick={() => slideRef.current.click()} disabled={uploading}
              className="flex items-center gap-1.5 text-xs text-primary font-bold hover:underline">
              <Plus className="w-3.5 h-3.5" /> إضافة صورة
            </button>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {st.slideUrls.map((url, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden border border-border">
                  <img src={url} className="w-full h-24 object-cover" alt="" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
                  <button onClick={() => update({ slideUrls: st.slideUrls.filter((_, idx) => idx !== i) })}
                    className="absolute top-1 left-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-3 h-3" />
                  </button>
                  <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1.5 rounded-full">{i + 1}</span>
                </div>
              ))}
              <button onClick={() => slideRef.current.click()} disabled={uploading}
                className="flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary text-muted-foreground hover:text-primary transition-all">
                <Plus className="w-6 h-6" />
                <span className="text-[10px] mt-1">إضافة</span>
              </button>
            </div>
            <input ref={slideRef} type="file" accept="image/*" className="hidden"
              onChange={e => uploadFile(e.target.files[0], url => update({ slideUrls: [...st.slideUrls, url] }), "الصورة")} />
            {uploading && (
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${uploadPct}%` }} />
              </div>
            )}
            {isSlide && st.slideUrls.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-border">
                <p className="text-xs font-semibold text-muted-foreground">إعدادات العرض</p>
                <div className="space-y-2">
                  <Label className="text-xs">تأثير الانتقال</Label>
                  <div className="flex gap-2">
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
          </div>
        </div>
      )}

      {/* Direct URL */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
        <Label className="text-sm font-bold">🔗 أو أدخل رابطاً مباشراً</Label>
        <Input value={st.bgUrl} onChange={e => update({ bgUrl: e.target.value })}
          dir="ltr" className="text-xs font-mono h-10" placeholder="https://example.com/image.jpg" />
        {st.bgUrl && (
          <button onClick={() => update({ bgUrl: "" })} className="flex items-center gap-1 text-xs text-destructive hover:underline">
            <X className="w-3 h-3" /> مسح الرابط
          </button>
        )}
      </div>
    </div>
  );

  const renderEffects = () => (
    <div className="space-y-4">
      {/* Image filters */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
        <p className="text-sm font-bold flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> فلاتر الصورة</p>
        {[
          { label: "الشفافية",  key: "opacity",    min: 10,  max: 100, unit: "%" },
          { label: "الضبابية",  key: "blur",        min: 0,   max: 30,  unit: "px" },
          { label: "السطوع",    key: "brightness",  min: 20,  max: 150, unit: "%" },
          { label: "التباين",   key: "contrast",    min: 50,  max: 200, unit: "%" },
          { label: "التشبع",    key: "saturation",  min: 0,   max: 200, unit: "%" },
        ].map(({ label, key, min, max, unit }) => (
          <div key={key} className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="text-xs">{label}</Label>
              <span className="text-xs font-mono font-bold text-primary">{st[key]}{unit}</span>
            </div>
            <Slider min={min} max={max} value={[st[key]]} onValueChange={([v]) => update({ [key]: v })} />
          </div>
        ))}
      </div>

      {/* Overlay */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <p className="text-sm font-bold">🎭 طبقة التعتيم</p>
        <div className="flex items-center gap-3">
          <Label className="text-xs shrink-0">اللون</Label>
          <input type="color" value={st.overlayColor}
            onChange={e => update({ overlayColor: e.target.value })}
            className="w-10 h-9 rounded-lg cursor-pointer border border-border p-0.5" />
          <Input value={st.overlayColor} onChange={e => update({ overlayColor: e.target.value })}
            className="h-8 text-xs font-mono flex-1" maxLength={7} />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <Label className="text-xs">شدة التعتيم</Label>
            <span className="text-xs font-mono font-bold text-primary">{st.overlayAlpha}%</span>
          </div>
          <Slider min={0} max={90} value={[st.overlayAlpha]} onValueChange={([v]) => update({ overlayAlpha: v })} />
        </div>
        {/* Overlay preview */}
        <div className="h-12 rounded-xl border border-border relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${st.gradFrom}, ${st.gradTo})` }} />
          <div className="absolute inset-0 transition-all" style={{ backgroundColor: `${st.overlayColor}${Math.round(st.overlayAlpha * 2.55).toString(16).padStart(2,"0")}` }} />
          <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold drop-shadow">معاينة الطبقة</div>
        </div>
      </div>

      {/* Motion effects */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <p className="text-sm font-bold">🎬 تأثيرات حركية</p>
        {[
          { label: "تأثير التكبير (Ken Burns)", key: "zoom" },
          { label: "تأثير التوازي (Parallax)",  key: "parallax" },
        ].map(({ label, key }) => (
          <div key={key} className="flex items-center justify-between py-1">
            <Label className="text-xs">{label}</Label>
            <Switch checked={st[key]} onCheckedChange={v => update({ [key]: v })} />
          </div>
        ))}
      </div>

      {/* Video settings (if video) */}
      {isVideo && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <p className="text-sm font-bold flex items-center gap-2"><Film className="w-4 h-4 text-primary" /> إعدادات الفيديو</p>
          {[
            { label: "تشغيل تلقائي",    key: "autoplay"    },
            { label: "تكرار تلقائي",     key: "loop"        },
            { label: "كتم الصوت",        key: "mute"        },
            { label: "تحسين الجوال",     key: "videoMobile" },
          ].map(({ label, key }) => (
            <div key={key} className="flex items-center justify-between py-1 border-b border-border/40 last:border-0">
              <Label className="text-xs">{label}</Label>
              <Switch checked={st[key]} onCheckedChange={v => update({ [key]: v })} />
            </div>
          ))}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <Label className="text-xs">سطوع الفيديو</Label>
              <span className="text-xs font-mono font-bold text-primary">{st.videoBright}%</span>
            </div>
            <Slider min={20} max={150} value={[st.videoBright]} onValueChange={([v]) => update({ videoBright: v })} />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <Label className="text-xs">سرعة التشغيل</Label>
              <span className="text-xs font-mono font-bold text-primary">{st.videoSpeed}x</span>
            </div>
            <Slider min={0.5} max={2} step={0.25} value={[st.videoSpeed]} onValueChange={([v]) => update({ videoSpeed: v })} />
          </div>
        </div>
      )}
    </div>
  );

  const renderContent = () => (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
        <p className="text-sm font-bold flex items-center gap-2"><Settings className="w-4 h-4 text-primary" /> نصوص البانر</p>
        {[
          { label: "العنوان الرئيسي", key: "title",    ph: "اتركه فارغاً للافتراضي"  },
          { label: "العنوان الفرعي",  key: "subtitle", ph: "اتركه فارغاً للافتراضي"  },
          { label: "نص الزر",         key: "btnText",  ph: "اتركه فارغاً للافتراضي"  },
        ].map(({ label, key, ph }) => (
          <div key={key} className="space-y-1.5">
            <Label className="text-xs">{label}</Label>
            <Input value={st[key]} onChange={e => update({ [key]: e.target.value })}
              placeholder={ph} className="h-9 text-sm" />
          </div>
        ))}
        <div className="space-y-1.5">
          <Label className="text-xs">رابط الزر</Label>
          <Input value={st.btnLink} onChange={e => update({ btnLink: e.target.value })}
            placeholder="/books" className="h-9 text-sm font-mono" dir="ltr" />
        </div>
      </div>

      {/* Live text preview */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5">
        <p className="text-xs text-muted-foreground mb-3 font-medium">✨ معاينة النصوص</p>
        <div className="space-y-2">
          <p className="text-2xl font-black leading-tight">{st.title || "عنوان البانر الافتراضي"}</p>
          <p className="text-sm text-muted-foreground">{st.subtitle || "وصف البانر الافتراضي هنا"}</p>
          <Link className="inline-flex items-center gap-2 px-5 py-2 bg-accent text-accent-foreground rounded-xl text-xs font-bold cursor-default">
            {st.btnText || "استعرض المكتبة"} ←
          </Link>
        </div>
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground flex items-center gap-2">
          <Eye className="w-4 h-4" />
          معاينة حية مطابقة للصفحة الرئيسية
        </p>
        <button onClick={() => setFullscreen(true)}
          className="flex items-center gap-1.5 text-xs text-primary font-bold hover:underline">
          <Maximize2 className="w-3.5 h-3.5" /> ملء الشاشة
        </button>
      </div>
      <div className="rounded-2xl overflow-hidden border-2 border-border shadow-xl">
        <HeroBanner />
      </div>
      <p className="text-[11px] text-center text-muted-foreground">
        أي تعديل تجريه يظهر هنا مباشرة ويُحفظ ويُطبَّق على الصفحة الرئيسية
      </p>
    </div>
  );

  const sectionMap = {
    current: renderCurrent,
    type:    renderType,
    upload:  renderUpload,
    effects: renderEffects,
    content: renderContent,
    preview: renderPreview,
  };

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shrink-0">
            <Image className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black">إدارة الخلفيات</h2>
            <p className="text-xs text-muted-foreground">حفظ فوري — معاينة مباشرة — دائم بعد إعادة التحميل</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={reset} className="gap-1.5 text-xs">
            <RotateCcw className="w-3.5 h-3.5" /> استعادة
          </Button>
          <Button size="sm" onClick={() => { persist(st); toast.success("✓ تم الحفظ"); }} className="gap-1.5 text-xs">
            <Check className="w-3.5 h-3.5" /> حفظ الآن
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              tab === t.id ? "bg-white dark:bg-card shadow text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Section */}
      {(sectionMap[tab] || renderCurrent)()}

      {/* Fullscreen preview */}
      {fullscreen && (
        <div className="fixed inset-0 z-[9999] bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-black/90 shrink-0">
            <span className="text-white text-sm font-bold">معاينة ملء الشاشة — الصفحة الرئيسية</span>
            <button onClick={() => setFullscreen(false)}
              className="text-white p-2 rounded-lg hover:bg-white/10">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-auto bg-background p-6">
            <HeroBanner />
          </div>
        </div>
      )}
    </div>
  );
}

// Fake Link for preview only
function Link({ children, className }) {
  return <span className={className}>{children}</span>;
}