import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Type, Upload, Check, RotateCcw, Eye, SlidersHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { getSetting, setSetting, setSettings, subscribeToSettings } from "@/lib/settingsStore";

import { FONT_PRESETS, FONT_ROLES } from "@/lib/fontConstants";

const CATEGORIES = ["الكل", "حديث", "أوردو", "كلاسيكي", "قرآني", "زخرفي"];

function injectFont(preset) {
  // Uploaded fonts carry a file URL instead of a stylesheet URL
  if (preset.file_url) { injectCustomFontFace(preset.name, preset.file_url); return; }
  if (!preset.url) return;
  const linkId = `df-${preset.name.replace(/\s+/g,"-")}`;
  if (!document.getElementById(linkId)) {
    const link = document.createElement("link");
    link.id = linkId; link.rel = "stylesheet"; link.href = preset.url;
    document.head.appendChild(link);
  }
}

function injectCustomFontFace(name, fileUrl) {
  const styleId = `dff-${name.replace(/\s+/g,"-")}`;
  if (document.getElementById(styleId)) return;
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = `@font-face { font-family: '${name}'; src: url('${fileUrl}'); font-display: swap; }`;
  document.head.appendChild(style);
}

export default function DevFonts() {
  const [roleFonts, setRoleFonts]       = useState(() => Object.fromEntries(FONT_ROLES.map(r => [r.key, getSetting(`font_${r.key}`) || ""])));
  const [fontSize, setFontSize]         = useState(() => Number(getSetting("font_size")) || 16);
  const [lineHeight, setLineHeight]     = useState(() => Number(getSetting("line_height")) || 1.6);
  const [letterSpacing, setLetterSpacing] = useState(() => Number(getSetting("letter_spacing")) || 0);
  const [activeRole, setActiveRole]     = useState("body");
  const [fontCat, setFontCat]           = useState("الكل");
  const [uploading, setUploading]       = useState(false);
  const [customFonts, setCustomFonts]   = useState(() => {
    try { return JSON.parse(getSetting("custom_fonts") || "[]"); } catch(e) { return []; }
  });

  // Re-register uploaded fonts on every mount so they survive a page reload
  useEffect(() => {
    customFonts.forEach(f => { if (f.file_url) injectCustomFontFace(f.name, f.file_url); });
  }, [customFonts]);

  useEffect(() => {
    const unsub = subscribeToSettings((s) => {
      const rf = {};
      FONT_ROLES.forEach(r => { rf[r.key] = s[`font_${r.key}`] || ""; });
      setRoleFonts(rf);
      setFontSize(Number(s.font_size) || 16);
    });
    return unsub;
  }, []);

  const applyRoleFont = (role, preset) => {
    injectFont(preset);
    document.documentElement.style.setProperty(role.cssVar, preset.value);
    setRoleFonts(prev => ({ ...prev, [role.key]: preset.name }));
    setSetting(`font_${role.key}`, preset.name);
    toast.success(`تم تطبيق "${preset.label}" على ${role.label} ✓`);
  };

  const handleFontSize = (val) => {
    setFontSize(val);
    document.documentElement.style.setProperty("font-size", `${val}px`);
    setSetting("font_size", String(val));
  };

  const handleLineHeight = (val) => {
    setLineHeight(val);
    document.documentElement.style.setProperty("line-height", String(val));
    setSetting("line_height", String(val));
  };

  const handleLetterSpacing = (val) => {
    setLetterSpacing(val);
    document.documentElement.style.setProperty("letter-spacing", `${val}em`);
    setSetting("letter_spacing", String(val));
  };

  const handleCustomFontUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
    const fontName = file.name.replace(/\.[^.]+$/, "");
    injectCustomFontFace(fontName, file_url);
    const newFont = { name: fontName, label: fontName, category: "مرفوع", url: "", file_url, value: `'${fontName}', sans-serif` };
    const updated = [...customFonts, newFont];
    setCustomFonts(updated);
    setSetting("custom_fonts", JSON.stringify(updated));
    setUploading(false);
    toast.success(`تم رفع الخط "${fontName}" ✓`);
  };

  const handleResetFonts = () => {
    FONT_ROLES.forEach(r => {
      document.documentElement.style.removeProperty(r.cssVar);
      setSetting(`font_${r.key}`, "");
    });
    document.documentElement.style.removeProperty("font-size");
    document.documentElement.style.removeProperty("line-height");
    document.documentElement.style.removeProperty("letter-spacing");
    setSettings({ font_size: "16", line_height: "1.6", letter_spacing: "0" });
    setRoleFonts(Object.fromEntries(FONT_ROLES.map(r => [r.key, ""])));
    setFontSize(16);
    setLineHeight(1.6);
    setLetterSpacing(0);
    toast.success("تم إعادة جميع الخطوط والطباعة للافتراضي");
  };

  const deleteCustomFont = (font) => {
    if (!confirm(`حذف الخط "${font.name}"؟`)) return;
    const updated = customFonts.filter(f => f.name !== font.name);
    setCustomFonts(updated);
    setSetting("custom_fonts", JSON.stringify(updated));
    // Clear any role still pointing at the removed font
    FONT_ROLES.forEach(r => {
      if (roleFonts[r.key] === font.name) {
        document.documentElement.style.removeProperty(r.cssVar);
        setSetting(`font_${r.key}`, "");
        setRoleFonts(prev => ({ ...prev, [r.key]: "" }));
      }
    });
    toast.success("تم حذف الخط");
  };

  const allFonts = [...FONT_PRESETS, ...customFonts];
  const filtered = allFonts.filter(p => fontCat === "الكل" || p.category === fontCat);
  const currentRole = FONT_ROLES.find(r => r.key === activeRole);
  // Resolve a role's font family from presets AND uploaded fonts
  const familyOf = (roleKey) => allFonts.find(f => f.name === roleFonts[roleKey])?.value || undefined;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Live Preview */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-4 h-4 text-primary" />  
          <h3 className="font-bold text-sm">معاينة مباشرة</h3>
        </div>
        <div className="bg-background rounded-xl p-4 border border-border space-y-3">
          <p className="text-2xl font-bold" style={{ fontFamily: familyOf("heading"), lineHeight, letterSpacing: `${letterSpacing}em` }}>
            المكتبة الإسلامية الرقمية
          </p>
          <p className="text-base font-semibold text-primary" style={{ fontFamily: familyOf("title"), lineHeight, letterSpacing: `${letterSpacing}em` }}>
            صحيح البخاري — الإمام البخاري
          </p>
          <p className="text-sm text-muted-foreground" style={{ fontFamily: familyOf("body"), lineHeight, letterSpacing: `${letterSpacing}em` }}>
            بسم الله الرحمن الرحيم — نمونہ متن اردو
          </p>
          <div className="flex gap-2 flex-wrap">
            <span className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg" style={{ fontFamily: familyOf("button") }}>تصفح المكتبة</span>
            <span className="text-xs bg-muted text-muted-foreground px-3 py-1.5 rounded-lg" style={{ fontFamily: familyOf("nav") }}>الرئيسية · المكتبة · المفضلة</span>
          </div>
        </div>
      </div>

      {/* Typography Controls */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-5">
        <h3 className="font-bold text-sm flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-primary" /> ضبط الطباعة</h3>
        
        <div className="space-y-2">
          <div className="flex justify-between"><Label className="text-xs">حجم الخط الأساسي</Label><span className="text-xs font-mono font-bold text-primary">{fontSize}px</span></div>
          <Slider min={12} max={24} step={1} value={[fontSize]} onValueChange={([v]) => handleFontSize(v)} />
          <div className="flex gap-2 flex-wrap">
            {[13, 14, 15, 16, 17, 18, 20].map(s => (
              <button key={s} onClick={() => handleFontSize(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${fontSize === s ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/40"}`}>{s}px</button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between"><Label className="text-xs">ارتفاع السطر</Label><span className="text-xs font-mono font-bold text-primary">{lineHeight}</span></div>
          <Slider min={1.2} max={2.4} step={0.1} value={[lineHeight]} onValueChange={([v]) => handleLineHeight(parseFloat(v.toFixed(1)))} />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between"><Label className="text-xs">تباعد الحروف</Label><span className="text-xs font-mono font-bold text-primary">{letterSpacing}em</span></div>
          <Slider min={-0.05} max={0.2} step={0.01} value={[letterSpacing]} onValueChange={([v]) => handleLetterSpacing(parseFloat(v.toFixed(2)))} />
        </div>
      </div>

      {/* Role Selector */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Type className="w-4 h-4 text-primary" /> تخصيص الخط حسب العنصر</h3>
        <div className="grid grid-cols-5 gap-2 mb-5">
          {FONT_ROLES.map(role => (
            <button key={role.key} onClick={() => setActiveRole(role.key)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${activeRole === role.key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
              <span className="text-xs font-bold">{role.label}</span>
              {roleFonts[role.key]
                ? <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-medium truncate max-w-full">{roleFonts[role.key]}</span>
                : <span className="text-[9px] text-muted-foreground">افتراضي</span>}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFontCat(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border-2 shrink-0 transition-all ${fontCat === cat ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/30"}`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Font Grid */}
        <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
          {filtered.map(preset => {
            const isActive = roleFonts[activeRole] === preset.name;
            return (
              <button key={preset.name} onClick={() => applyRoleFont(currentRole, preset)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-right ${isActive ? "border-primary bg-primary/5 shadow" : "border-border hover:border-primary/40"}`}>
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border">
                  <span className="text-xl" style={{ fontFamily: preset.value }}>{preset.category === "أوردو" ? "ا" : "أ"}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate" style={{ fontFamily: preset.value }}>{preset.label}</p>
                  <p className="text-[10px] text-muted-foreground truncate" style={{ fontFamily: preset.value }}>{currentRole?.sample}</p>
                </div>
                {isActive && <Check className="w-4 h-4 text-primary shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Upload Custom Font */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-bold text-sm mb-3 flex items-center gap-2"><Upload className="w-4 h-4 text-primary" /> رفع خط مخصص (TTF / OTF / WOFF)</h3>
        <label className="cursor-pointer block">
          <input type="file" accept=".ttf,.otf,.woff,.woff2" onChange={handleCustomFontUpload} className="hidden" />
          <div className={`flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed transition-colors ${uploading ? "border-primary" : "border-border hover:border-primary/50"}`}>
            {uploading
              ? <><div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /><span className="text-sm text-muted-foreground">جاري الرفع...</span></>
              : <><Upload className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">اضغط لرفع ملف الخط</span></>}
          </div>
        </label>
        {customFonts.length > 0 && (
          <div className="mt-3 space-y-1">
            {customFonts.map(f => (
              <div key={f.name} className="flex items-center gap-2 text-xs bg-muted/50 px-3 py-2 rounded-lg">
                <span className="text-green-600">✓</span>
                <span className="font-medium" style={{ fontFamily: f.value }}>{f.name}</span>
                <button onClick={() => deleteCustomFont(f)} className="mr-auto p-1 rounded-lg hover:bg-destructive/10 transition-colors" title="حذف الخط">
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button variant="outline" onClick={handleResetFonts} className="w-full rounded-xl h-11 gap-2 font-bold hover:border-destructive/50 hover:text-destructive">
        <RotateCcw className="w-4 h-4" /> إعادة جميع الخطوط للافتراضي
      </Button>
    </div>
  );
}