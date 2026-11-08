import { useState, useEffect } from "react";
import { SlidersHorizontal, Globe, Moon, Check, RotateCcw, Tags, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { getSetting, setSetting, subscribeToSettings } from "@/lib/settingsStore";
import { useTheme } from "@/hooks/useTheme";

const LANG_OPTIONS = [
  { code: "ar", name: "العربية",  flag: "🇸🇦" },
  { code: "en", name: "English",  flag: "🇬🇧" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "ur", name: "اردو",     flag: "🇵🇰" },
  { code: "hi", name: "हिंदी",   flag: "🇮🇳" },
  { code: "tr", name: "Türkçe",   flag: "🇹🇷" },
];
const DEFAULT_CATS = ["القرآن وعلومه","الحديث الشريف","الفقه الإسلامي","السيرة النبوية","العقيدة","التزكية والرقائق","التاريخ الإسلامي","أخرى"];

export default function DevAppDesign() {
  const { isDark, setMode } = useTheme();
  const [appLang, setAppLang]       = useState(() => getSetting("app_lang") || "ar");
  const [borderRadius, setBorderRadius] = useState(() => Number(getSetting("ui_radius")) || 12);
  const [categories, setCategories] = useState(() => {
    try { return JSON.parse(getSetting("categories") || "[]"); } catch(e) { return []; }
  });
  const [newCat, setNewCat]         = useState("");

  useEffect(() => {
    const unsub = subscribeToSettings((s) => {
      setAppLang(s.app_lang || "ar");
      setBorderRadius(Number(s.ui_radius) || 12);
      try { if (s.categories) setCategories(JSON.parse(s.categories)); } catch(e) {}
    });
    return unsub;
  }, []);

  const handleLang = (code) => {
    setAppLang(code);
    setSetting("app_lang", code);
    toast.success("تم حفظ اللغة ✓ — أعد تحميل الصفحة");
  };

  const handleRadius = (val) => {
    setBorderRadius(val);
    document.documentElement.style.setProperty("--radius", `${val}px`);
    setSetting("ui_radius", String(val));
  };

  const saveCategories = (cats) => {
    setCategories(cats);
    setSetting("categories", JSON.stringify(cats));
    try { localStorage.setItem("dev_categories", JSON.stringify(cats)); } catch(e) {}
  };

  const addCategory = () => {
    const t = newCat.trim();
    if (!t || categories.includes(t)) { toast.error(t ? "التصنيف موجود" : "أدخل اسماً"); return; }
    saveCategories([...categories, t]);
    setNewCat("");
    toast.success("تم إضافة التصنيف ✓");
  };

  const removeCategory = (cat) => {
    if (!confirm(`حذف تصنيف "${cat}"؟`)) return;
    saveCategories(categories.filter(c => c !== cat));
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Dark Mode — link to DevTheme */}
      <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Moon className="w-5 h-5 text-primary" />
          <div>
            <Label className="text-sm font-bold">الوضع الليلي</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              الوضع الحالي: {isDark ? "🌙 ليلي" : "☀️ فاتح"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={isDark ? "default" : "outline"} onClick={() => setMode(isDark ? "light" : "dark")} className="gap-1.5 text-xs">
            {isDark ? "☀️ فاتح" : "🌙 ليلي"}
          </Button>
        </div>
      </div>

      {/* Language */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Globe className="w-4 h-4 text-primary" /> لغة واجهة التطبيق</h3>
        <div className="grid grid-cols-3 gap-2">
          {LANG_OPTIONS.map(({ code, name, flag }) => (
            <button key={code} onClick={() => handleLang(code)}
              className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all ${appLang===code?"border-primary bg-primary/10 text-primary":"border-border text-muted-foreground hover:border-primary/30"}`}>
              <span>{flag}</span>
              <span className="text-xs font-bold">{name}</span>
              {appLang===code && <Check className="w-3 h-3 mr-auto" />}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">⚠ تغيير اللغة يتطلب إعادة تحميل الصفحة</p>
        <Button variant="outline" onClick={() => window.location.reload()} className="mt-2 rounded-xl h-9 gap-2 text-xs font-bold">
          إعادة تحميل الصفحة
        </Button>
      </div>

      {/* Border Radius */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <div className="flex justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2"><SlidersHorizontal className="w-4 h-4 text-primary" /> انحناء الزوايا العام</h3>
          <span className="text-xs font-mono font-bold text-primary">{borderRadius}px</span>
        </div>
        <Slider min={0} max={24} step={2} value={[borderRadius]} onValueChange={([v]) => handleRadius(v)} />
        <div className="flex flex-wrap items-center gap-2">
          {[0, 4, 8, 12, 16, 20, 24].map(r => (
            <button key={r} onClick={() => handleRadius(r)}
              className={`px-2 py-1 text-xs font-bold border rounded-lg transition-all ${borderRadius===r?"border-primary bg-primary text-primary-foreground":"border-border hover:border-primary/40"}`}>
              {r}
            </button>
          ))}
          <button onClick={() => handleRadius(12)}
            className="ms-auto flex items-center gap-1 px-2 py-1 text-xs font-bold text-muted-foreground hover:text-primary transition-colors">
            <RotateCcw className="w-3 h-3" /> افتراضي
          </button>
        </div>
      </div>

      {/* Categories */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2"><Tags className="w-4 h-4 text-primary" /> التصنيفات</h3>
        <div className="flex gap-2">
          <Input value={newCat} onChange={e=>setNewCat(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCategory()} placeholder="اسم التصنيف الجديد..." className="flex-1" />
          <Button onClick={addCategory} size="sm" className="rounded-xl shrink-0 gap-1"><Plus className="w-3.5 h-3.5" />إضافة</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(categories.length > 0 ? categories : DEFAULT_CATS).map(cat => (
            <div key={cat} className="flex items-center gap-1.5 bg-muted/70 border border-border rounded-lg px-3 py-1.5">
              <span className="text-xs font-medium">{cat}</span>
              {categories.includes(cat) && (
                <button onClick={() => removeCategory(cat)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
        <Button variant="outline" onClick={() => saveCategories(DEFAULT_CATS)} className="w-full rounded-xl h-9 gap-2 text-xs font-bold hover:border-primary/50">
          <RotateCcw className="w-3.5 h-3.5" /> إعادة للتصنيفات الافتراضية
        </Button>
      </div>
    </div>
  );
}