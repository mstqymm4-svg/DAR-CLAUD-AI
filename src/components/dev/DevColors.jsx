import { useState, useEffect } from "react";
import { Palette, Check, RotateCcw, Download, Upload, Sun, Moon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getSetting, setSettings, subscribeToSettings } from "@/lib/settingsStore";
import { getThemeState } from "@/lib/themeEngine";

// HSL ↔ HEX helpers
function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = n => { const k = (n + h / 30) % 12; const c = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1); return Math.round(255 * c).toString(16).padStart(2, "0"); };
  return `#${f(0)}${f(8)}${f(4)}`;
}
function hexToHsl(hex) {
  let r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
  const max = Math.max(r,g,b), min = Math.min(r,g,b); let h, s, l = (max+min)/2;
  if (max === min) { h = s = 0; } else {
    const d = max - min; s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max) { case r: h=((g-b)/d+(g<b?6:0))/6; break; case g: h=((b-r)/d+2)/6; break; default: h=((r-g)/d+4)/6; }
  }
  return `${Math.round(h*360)} ${Math.round(s*100)}% ${Math.round(l*100)}%`;
}
function hslToHexSafe(hsl) {
  if (!hsl) return "#000000";
  const p = hsl.trim().replace(/%/g,"").split(/\s+/);
  if (p.length < 3) return "#000000";
  return hslToHex(Number(p[0]), Number(p[1]), Number(p[2]));
}

const COLOR_PRESETS = [
  { name: "أخضر إسلامي",  bg: "40 30% 97%",  fg: "160 30% 10%", primary: "158 45% 28%", secondary: "40 40% 92%", accent: "43 80% 55%", card: "40 25% 99%",  border: "40 20% 88%", button: "158 45% 28%" },
  { name: "أزرق عميق",    bg: "220 30% 97%", fg: "220 30% 10%", primary: "217 71% 35%", secondary: "220 30% 92%", accent: "43 80% 55%", card: "220 25% 99%", border: "220 20% 88%", button: "217 71% 35%" },
  { name: "ذهب فاخر",     bg: "40 20% 97%",  fg: "30 40% 10%",  primary: "38 92% 40%",  secondary: "40 30% 92%", accent: "43 80% 55%", card: "40 15% 98%",  border: "40 20% 85%", button: "38 92% 40%" },
  { name: "زمردي",        bg: "160 25% 97%", fg: "160 35% 10%", primary: "160 60% 30%", secondary: "160 20% 92%", accent: "43 80% 55%", card: "160 20% 99%", border: "160 15% 88%", button: "160 60% 30%" },
  { name: "أسود ملكي",    bg: "240 10% 6%",  fg: "240 10% 92%", primary: "271 81% 56%", secondary: "240 10% 14%", accent: "43 80% 55%", card: "240 10% 10%", border: "240 10% 16%", button: "271 81% 56%" },
  { name: "أبيض نقي",     bg: "0 0% 100%",   fg: "240 10% 10%", primary: "240 5% 26%",  secondary: "0 0% 96%",  accent: "43 80% 55%", card: "0 0% 99%",    border: "0 0% 90%",   button: "240 5% 26%" },
];

const DARK_PRESETS = [
  { name: "ليلي زمردي", bg: "160 20% 7%",  fg: "40 20% 95%", primary: "158 45% 40%", secondary: "160 15% 15%", accent: "43 80% 55%", card: "160 20% 10%", border: "160 15% 18%", button: "158 45% 40%" },
  { name: "ليلي دافئ",  bg: "30 15% 8%",   fg: "40 20% 95%", primary: "38 92% 45%",  secondary: "30 10% 15%", accent: "43 80% 55%", card: "30 12% 11%",  border: "30 10% 18%",  button: "38 92% 45%" },
  { name: "ليلي ملكي",  bg: "240 10% 6%",  fg: "240 10% 92%", primary: "271 81% 56%", secondary: "240 10% 14%", accent: "43 80% 55%", card: "240 10% 10%", border: "240 10% 16%", button: "271 81% 56%" },
];

const COLOR_FIELDS = [
  { key: "color_bg",        label: "الخلفية",      desc: "خلفية الصفحات الرئيسية" },
  { key: "color_fg",        label: "النص",          desc: "لون النصوص الأساسية" },
  { key: "color_primary",   label: "اللون الأساسي", desc: "الأزرار والتمييز" },
  { key: "color_secondary", label: "اللون الثانوي",  desc: "العناصر الثانوية" },
  { key: "color_accent",    label: "لون التمييز",    desc: "التوكيدات والنجوم" },
  { key: "color_card",      label: "البطاقات",       desc: "خلفية البطاقات" },
  { key: "color_border",    label: "الحدود",         desc: "حدود العناصر" },
  { key: "color_button",    label: "الأزرار",        desc: "لون أزرار الإجراء" },
];
const DARK_FIELDS = COLOR_FIELDS.map(f => ({ ...f, key: f.key.replace("color_", "color_dark_") }));
const ALL_KEYS = [...COLOR_FIELDS.map(f => f.key), ...DARK_FIELDS.map(f => f.key)];

export default function DevColors() {
  const [colors, setColors] = useState(() => Object.fromEntries(ALL_KEYS.map(k => [k, getSetting(k)])));
  const [mode, setMode] = useState(() => (getThemeState().isDark ? "dark" : "light"));
  const [activePreset, setActivePreset] = useState(null);

  useEffect(() => {
    const unsub = subscribeToSettings((s) => {
      setColors(Object.fromEntries(ALL_KEYS.map(k => [k, s[k] || ""])));
    });
    return unsub;
  }, []);

  const handlePreset = (preset) => {
    const prefix = mode === "dark" ? "color_dark_" : "color_";
    const c = {
      [prefix + "bg"]:        preset.bg,
      [prefix + "fg"]:        preset.fg,
      [prefix + "primary"]:   preset.primary,
      [prefix + "secondary"]: preset.secondary,
      [prefix + "accent"]:    preset.accent,
      [prefix + "card"]:      preset.card,
      [prefix + "border"]:    preset.border,
      [prefix + "button"]:   preset.button,
    };
    setColors(prev => ({ ...prev, ...c }));
    setActivePreset(preset.name);
    setSettings(c);
    toast.success(`تم تطبيق ثيم "${preset.name}" ✓`);
  };

  const handleColorChange = (key, hexVal) => {
    const hsl = hexToHsl(hexVal);
    setColors(prev => ({ ...prev, [key]: hsl }));
    setSettings({ [key]: hsl });
  };

  const handleReset = () => {
    const reset = Object.fromEntries(ALL_KEYS.map(k => [k, ""]));
    setColors(reset);
    setSettings(reset);
    setActivePreset(null);
    toast.success("تم إعادة الألوان للافتراضي");
  };

  const handleExport = () => {
    const data = JSON.stringify(colors, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "theme.json"; a.click();
    toast.success("تم تصدير الثيم ✓");
  };

  const handleImport = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        setColors(prev => ({ ...prev, ...data }));
        setSettings(data);
        toast.success("تم استيراد الثيم ✓");
      } catch { toast.error("ملف غير صحيح"); }
    };
    reader.readAsText(file);
  };

  const clearField = (key) => {
    setColors(prev => ({ ...prev, [key]: "" }));
    setSettings({ [key]: "" });
    setActivePreset(null);
  };

  const fields = mode === "dark" ? DARK_FIELDS : COLOR_FIELDS;
  const presets = mode === "dark" ? DARK_PRESETS : COLOR_PRESETS;

  // Highlight the preset that matches the currently saved colors
  const prefix = mode === "dark" ? "color_dark_" : "color_";
  const matchedPreset = presets.find(pr =>
    pr.bg === colors[prefix + "bg"] && pr.primary === colors[prefix + "primary"] && pr.card === colors[prefix + "card"]
  )?.name;
  const selectedPreset = activePreset || matchedPreset;

  // Preview colors for the selected mode
  const p = mode === "dark"
    ? { bg: colors.color_dark_bg, fg: colors.color_dark_fg, primary: colors.color_dark_primary, card: colors.color_dark_card, border: colors.color_dark_border }
    : { bg: colors.color_bg, fg: colors.color_fg, primary: colors.color_primary, card: colors.color_card, border: colors.color_border };
  const darkFallback = mode === "dark";
  const bgS  = p.bg     ? `hsl(${p.bg})`      : (darkFallback ? "#0d1512" : undefined);
  const fgS  = p.fg     ? `hsl(${p.fg})`      : (darkFallback ? "#e9e9e4" : undefined);
  const prS  = p.primary ? `hsl(${p.primary})` : (darkFallback ? "#2f9e63" : undefined);
  const cdS  = p.card   ? `hsl(${p.card})`    : (darkFallback ? "#13201a" : undefined);
  const brS  = p.border ? `hsl(${p.border})`  : (darkFallback ? "#26332d" : undefined);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Mode switch */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setMode("light")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${mode === "light" ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-muted hover:bg-muted/70"}`}>
            <Sun className="w-4 h-4" /> الوضع النهاري
          </button>
          <button onClick={() => setMode("dark")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${mode === "dark" ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-muted hover:bg-muted/70"}`}>
            <Moon className="w-4 h-4" /> الوضع الليلي
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          اختر الوضع الذي تريد ضبط ألوانه — الألوان تُطبَّق تلقائياً عند تفعيل الوضع المقابل في التطبيق.
        </p>
      </div>

      {/* Preset Themes */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Palette className="w-4 h-4 text-primary" /> ثيمات جاهزة {mode === "dark" ? "(ليلية)" : "(نهارية)"}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {presets.map(preset => (
            <button key={preset.name} onClick={() => handlePreset(preset)}
              className={`relative flex flex-col gap-2 p-3 rounded-xl border-2 transition-all ${selectedPreset === preset.name ? "border-primary shadow-md shadow-primary/20" : "border-border hover:border-primary/40"}`}>
              <div className="flex gap-1 rounded-lg overflow-hidden h-8 shadow-sm">
                <div className="flex-1" style={{ background: `hsl(${preset.bg})` }} />
                <div className="flex-1" style={{ background: `hsl(${preset.primary})` }} />
                <div className="flex-1" style={{ background: `hsl(${preset.accent})` }} />
                <div className="flex-1" style={{ background: `hsl(${preset.card})` }} />
              </div>
              <span className="text-xs font-bold text-center">{preset.name}</span>
              {selectedPreset === preset.name && <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"><Check className="w-3 h-3 text-primary-foreground" /></div>}
            </button>
          ))}
        </div>
      </div>

      {/* Live Preview */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-bold text-sm mb-4">معاينة مباشرة</h3>
        <div className="rounded-xl overflow-hidden border border-border shadow-sm">
          <div style={{ background: bgS, color: fgS }} className="px-4 py-3 flex items-center gap-2 border-b" >
            <div style={{ background: prS }} className="w-7 h-7 rounded-lg" />
            <span className="text-sm font-bold">المكتبة الدينية</span>
            <div className="flex gap-1 mr-auto">
              <span style={{ background: prS, color: "#fff" }} className="text-[10px] px-2 py-0.5 rounded-md">الرئيسية</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md opacity-70">المكتبة</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md opacity-70">المفضلة</span>
            </div>
          </div>
          <div style={{ background: bgS }} className="px-3 py-3 grid grid-cols-3 gap-2">
            {[1,2,3].map(i => (
              <div key={i} style={{ background: cdS, borderColor: brS }} className="rounded-xl p-3 border">
                <div style={{ background: prS, opacity: 0.25 }} className="rounded-lg h-10 mb-2" />
                <div className="rounded h-2 w-3/4 mb-1 bg-current opacity-20" />
                <div className="rounded h-1.5 w-1/2 bg-current opacity-10" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Color Fields */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-bold text-sm mb-4">ضبط الألوان المتقدم {mode === "dark" ? "(الوضع الليلي)" : "(الوضع النهاري)"}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {fields.map(({ key, label, desc }) => {
            const hsl = colors[key];
            const hex = hsl ? hslToHexSafe(hsl) : "#888888";
            return (
              <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border">
                <label className="relative cursor-pointer shrink-0">
                  <div className="w-12 h-12 rounded-xl border-2 border-border shadow-sm overflow-hidden" style={{ background: hsl ? `hsl(${hsl})` : hex }}>
                    <input type="color" value={hex} onChange={e => handleColorChange(key, e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                  </div>
                </label>
                <div className="flex-1 min-w-0">
                  <Label className="text-xs font-bold">{label}</Label>
                  <p className="text-[10px] text-muted-foreground">{desc}</p>
                  <p className="text-[10px] font-mono text-primary mt-0.5">{hsl ? hex : "افتراضي"}</p>
                </div>
                {hsl && (
                  <button onClick={() => clearField(key)} title="إعادة هذا اللون للافتراضي"
                    className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors shrink-0">
                    <X className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <Button onClick={handleExport} variant="outline" className="gap-2 rounded-xl font-bold flex-1">
          <Download className="w-4 h-4" /> تصدير الثيم
        </Button>
        <label className="flex-1 cursor-pointer">
          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          <div className="flex items-center justify-center gap-2 h-9 px-4 rounded-xl border border-input bg-background shadow-sm hover:bg-muted font-bold text-sm cursor-pointer transition-colors">
            <Upload className="w-4 h-4" /> استيراد ثيم
          </div>
        </label>
        <Button onClick={handleReset} variant="outline" className="gap-2 rounded-xl font-bold hover:border-destructive/50 hover:text-destructive flex-1">
          <RotateCcw className="w-4 h-4" /> إعادة للافتراضي
        </Button>
      </div>
    </div>
  );
}