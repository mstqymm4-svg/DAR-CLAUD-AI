import { useState, useEffect } from "react";
import { Layers, Eye, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { getSetting, setSettings, subscribeToSettings } from "@/lib/settingsStore";

const CARD_STYLES = [
  { id: "modern",  label: "عصري",   desc: "نظيف وحديث" },
  { id: "glass",   label: "زجاجي",  desc: "شفاف وأنيق" },
  { id: "premium", label: "مميز",   desc: "فاخر وراقي" },
  { id: "elegant", label: "كلاسيكي",desc: "رسمي وأنيق" },
  { id: "minimal", label: "بسيط",   desc: "نظيف وواضح" },
  { id: "luxury",  label: "فاخر",   desc: "ذهبي مترف" },
];

const SHADOW_OPTIONS = [
  { id: "none",   label: "بدون ظل",  value: "none" },
  { id: "sm",     label: "خفيف",     value: "0 1px 3px rgba(0,0,0,0.1)" },
  { id: "md",     label: "متوسط",    value: "0 4px 16px rgba(0,0,0,0.12)" },
  { id: "lg",     label: "قوي",      value: "0 8px 32px rgba(0,0,0,0.18)" },
  { id: "xl",     label: "قوي جداً", value: "0 16px 48px rgba(0,0,0,0.22)" },
  { id: "glow",   label: "توهج",     value: "0 0 24px rgba(var(--primary),0.3)" },
];

const HOVER_OPTIONS = [
  { id: "none",       label: "بدون",      css: "" },
  { id: "lift",       label: "رفع",       css: "hover:-translate-y-1 hover:shadow-lg" },
  { id: "scale",      label: "تكبير",     css: "hover:scale-105" },
  { id: "glow",       label: "توهج",      css: "hover:shadow-primary/30 hover:shadow-lg" },
  { id: "border",     label: "حد ملون",   css: "hover:border-primary" },
  { id: "tilt",       label: "ميلان",     css: "hover:rotate-1 hover:scale-105" },
];

export default function DevCards() {
  const [borderRadius, setBorderRadius] = useState(() => Number(getSetting("card_radius")) || 16);
  const [padding, setPadding]           = useState(() => Number(getSetting("card_padding")) || 16);
  const [cardStyle, setCardStyle]       = useState(() => getSetting("card_style") || "modern");
  const [shadow, setShadow]             = useState(() => getSetting("card_shadow") || "md");
  const [hover, setHover]               = useState(() => getSetting("card_hover") || "lift");
  const [gap, setGap]                   = useState(() => Number(getSetting("card_gap")) || 16);

  useEffect(() => {
    const unsub = subscribeToSettings((s) => {
      setBorderRadius(Number(s.card_radius) || 16);
      setPadding(Number(s.card_padding) || 16);
      setCardStyle(s.card_style || "modern");
      setShadow(s.card_shadow || "md");
      setHover(s.card_hover || "lift");
      setGap(Number(s.card_gap) || 16);
    });
    return unsub;
  }, []);

  const save = (key, value) => {
    setSettings({ [key]: String(value) });
    if (key === "card_radius") document.documentElement.style.setProperty("--card-radius", `${value}px`);
    if (key === "card_padding") document.documentElement.style.setProperty("--card-padding", `${value}px`);
    if (key === "card_gap") document.documentElement.style.setProperty("--card-gap", `${value}px`);
    toast.success("تم الحفظ ✓");
  };

  const handleReset = () => {
    setBorderRadius(16); setPadding(16); setGap(16);
    setCardStyle("modern"); setShadow("md"); setHover("lift");
    setSettings({
      card_radius: "16", card_padding: "16", card_gap: "16",
      card_style: "modern", card_shadow: "md", card_hover: "lift",
    });
    document.documentElement.style.setProperty("--card-radius", "16px");
    document.documentElement.style.setProperty("--card-padding", "16px");
    document.documentElement.style.setProperty("--card-gap", "16px");
    toast.success("تم إعادة إعدادات البطاقات للافتراضي");
  };

  const previewShadow = SHADOW_OPTIONS.find(s => s.id === shadow)?.value || "";

  const getStyleClasses = (style) => {
    switch(style) {
      case "glass":   return "bg-white/20 dark:bg-white/5 backdrop-blur-sm border border-white/30";
      case "premium": return "bg-gradient-to-br from-card to-muted border border-primary/20";
      case "elegant": return "bg-card border-2 border-border";
      case "minimal": return "bg-transparent border border-border/50";
      case "luxury":  return "bg-gradient-to-br from-amber-50 to-card border border-amber-200/50 dark:from-amber-900/10 dark:border-amber-800/30";
      default:        return "bg-card border border-border";
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Live Preview */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-sm">معاينة مباشرة للبطاقات</h3>
        </div>
        <div className="grid grid-cols-3" style={{ gap: `${gap}px` }}>
          {[1,2,3].map(i => (
            <div key={i}
              className={`overflow-hidden transition-all duration-300 ${getStyleClasses(cardStyle)} ${HOVER_OPTIONS.find(h=>h.id===hover)?.css||""}`}
              style={{ borderRadius: `${borderRadius}px`, padding: `${padding}px`, boxShadow: previewShadow }}>
              <div className="bg-primary/20 rounded-lg mb-3" style={{ height: "80px" }} />
              <div className="bg-foreground/20 rounded h-2 w-3/4 mb-1.5" />
              <div className="bg-foreground/10 rounded h-1.5 w-1/2 mb-2" />
              <div className="bg-primary rounded-lg h-7 text-[10px] text-primary-foreground flex items-center justify-center" style={{ borderRadius: `${Math.max(4,borderRadius/2)}px` }}>قراءة</div>
            </div>
          ))}
        </div>
      </div>

      {/* Card Style */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Layers className="w-4 h-4 text-primary" /> نمط البطاقة</h3>
        <div className="grid grid-cols-3 gap-2">
          {CARD_STYLES.map(s => (
            <button key={s.id} onClick={() => { setCardStyle(s.id); save("card_style", s.id); }}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all ${cardStyle===s.id?"border-primary bg-primary/10 text-primary":"border-border text-muted-foreground hover:border-primary/40"}`}>
              <span className="text-sm font-bold">{s.label}</span>
              <span className="text-[10px]">{s.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sliders */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
        <h3 className="font-bold text-sm">أبعاد البطاقة</h3>

        <div className="space-y-2">
          <div className="flex justify-between"><Label className="text-xs">نصف قطر الزوايا</Label><span className="text-xs font-mono font-bold text-primary">{borderRadius}px</span></div>
          <Slider min={0} max={32} step={2} value={[borderRadius]}
            onValueChange={([v]) => setBorderRadius(v)}
            onValueCommit={([v]) => save("card_radius", v)} />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between"><Label className="text-xs">الحشوة الداخلية</Label><span className="text-xs font-mono font-bold text-primary">{padding}px</span></div>
          <Slider min={8} max={40} step={4} value={[padding]}
            onValueChange={([v]) => setPadding(v)}
            onValueCommit={([v]) => save("card_padding", v)} />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between"><Label className="text-xs">المسافة بين البطاقات</Label><span className="text-xs font-mono font-bold text-primary">{gap}px</span></div>
          <Slider min={8} max={48} step={4} value={[gap]}
            onValueChange={([v]) => setGap(v)}
            onValueCommit={([v]) => save("card_gap", v)} />
        </div>
      </div>

      {/* Shadow */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-bold text-sm mb-3">الظل</h3>
        <div className="grid grid-cols-3 gap-2">
          {SHADOW_OPTIONS.map(s => (
            <button key={s.id} onClick={() => { setShadow(s.id); save("card_shadow", s.id); }}
              className={`p-3 rounded-xl border-2 text-center transition-all text-xs font-bold ${shadow===s.id?"border-primary bg-primary/10 text-primary":"border-border text-muted-foreground hover:border-primary/40"}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hover */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-bold text-sm mb-3">تأثير التحويم</h3>
        <div className="grid grid-cols-3 gap-2">
          {HOVER_OPTIONS.map(h => (
            <button key={h.id} onClick={() => { setHover(h.id); save("card_hover", h.id); }}
              className={`p-3 rounded-xl border-2 text-center transition-all text-xs font-bold ${hover===h.id?"border-primary bg-primary/10 text-primary":"border-border text-muted-foreground hover:border-primary/40"}`}>
              {h.label}
            </button>
          ))}
        </div>
      </div>

      <Button variant="outline" onClick={handleReset} className="w-full rounded-xl h-11 gap-2 font-bold hover:border-destructive/50 hover:text-destructive">
        <RotateCcw className="w-4 h-4" /> إعادة إعدادات البطاقات للافتراضي
      </Button>
    </div>
  );
}