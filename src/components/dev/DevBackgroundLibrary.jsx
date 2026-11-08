import { useState } from "react";
import { toast } from "sonner";
import { Check, Zap, Plus, X } from "lucide-react";
import { setSettings, getSetting } from "@/lib/settingsStore";

// ── Preset library ─────────────────────────────────────────────────────────────
const PRESETS = [
  { id: "islamic_gold", category: "إسلامية", label: "ذهبي إسلامي", icon: "☪", preview: "from-yellow-900 via-amber-800 to-yellow-700",
    settings: { hero_bg_type: "islamic_pattern", hero_grad_from: "#4a3000", hero_grad_to: "#c9860a", hero_anim_speed: "5" } },
  { id: "islamic_green", category: "إسلامية", label: "أخضر إسلامي", icon: "🕌", preview: "from-green-950 via-emerald-900 to-green-800",
    settings: { hero_bg_type: "islamic_pattern", hero_grad_from: "#052e16", hero_grad_to: "#166534", hero_anim_speed: "4" } },
  { id: "islamic_blue", category: "إسلامية", label: "أزرق إسلامي", icon: "🌙", preview: "from-blue-950 via-blue-900 to-indigo-900",
    settings: { hero_bg_type: "islamic_pattern", hero_grad_from: "#0a1628", hero_grad_to: "#1e3a8a", hero_anim_speed: "4" } },
  { id: "stars_night", category: "إسلامية", label: "ليلة نجوم", icon: "⭐", preview: "from-slate-950 via-indigo-950 to-slate-900",
    settings: { hero_bg_type: "stars", hero_grad_from: "#020617", hero_grad_to: "#1e1b4b", hero_anim_speed: "3" } },
  { id: "luxury_green", category: "فخمة", label: "فخم أخضر", icon: "💚", preview: "from-emerald-900 to-green-600",
    settings: { hero_bg_type: "gradient_anim", hero_grad_from: "#064e3b", hero_grad_to: "#059669", hero_anim_speed: "6" } },
  { id: "luxury_blue", category: "فخمة", label: "فخم أزرق", icon: "💎", preview: "from-blue-950 to-cyan-700",
    settings: { hero_bg_type: "gradient_anim", hero_grad_from: "#0c1445", hero_grad_to: "#0891b2", hero_anim_speed: "5" } },
  { id: "luxury_gold", category: "فخمة", label: "فخم ذهبي", icon: "✨", preview: "from-yellow-950 to-amber-600",
    settings: { hero_bg_type: "gradient_anim", hero_grad_from: "#451a03", hero_grad_to: "#d97706", hero_anim_speed: "5" } },
  { id: "luxury_purple", category: "فخمة", label: "فخم بنفسجي", icon: "👑", preview: "from-purple-950 to-fuchsia-700",
    settings: { hero_bg_type: "gradient_anim", hero_grad_from: "#1e0a3c", hero_grad_to: "#9333ea", hero_anim_speed: "6" } },
  { id: "particles_gold", category: "متحركة", label: "جزيئات ذهبية", icon: "🌟", preview: "from-amber-950 to-yellow-900",
    settings: { hero_bg_type: "particles", hero_grad_from: "#3d1c00", hero_grad_to: "#92400e", hero_anim_speed: "5" } },
  { id: "waves_ocean", category: "متحركة", label: "موجات المحيط", icon: "🌊", preview: "from-cyan-950 to-blue-800",
    settings: { hero_bg_type: "waves", hero_grad_from: "#083344", hero_grad_to: "#1e40af", hero_anim_speed: "3" } },
  { id: "floating_shapes", category: "متحركة", label: "أشكال طائرة", icon: "◆", preview: "from-violet-950 to-purple-800",
    settings: { hero_bg_type: "floating_shapes", hero_grad_from: "#2e1065", hero_grad_to: "#7e22ce", hero_anim_speed: "4" } },
  { id: "unsplash_mosque", category: "صور", label: "مسجد فخم", icon: "🕌", preview: "from-stone-900 to-stone-700",
    settings: { hero_bg_type: "static_image", hero_bg_url: "https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=1600&auto=format&fit=crop", hero_bg_brightness: "70", hero_overlay_alpha: "30", hero_overlay_color: "#000000" } },
  { id: "unsplash_quran", category: "صور", label: "قرآن كريم", icon: "📖", preview: "from-amber-950 to-amber-800",
    settings: { hero_bg_type: "static_image", hero_bg_url: "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=1600&auto=format&fit=crop", hero_bg_brightness: "60", hero_overlay_alpha: "40", hero_overlay_color: "#000000" } },
  { id: "unsplash_kaaba", category: "صور", label: "الكعبة المشرفة", icon: "🕋", preview: "from-neutral-900 to-stone-800",
    settings: { hero_bg_type: "static_image", hero_bg_url: "https://images.unsplash.com/photo-1564769662533-4f00a87b4056?w=1600&auto=format&fit=crop", hero_bg_brightness: "65", hero_overlay_alpha: "35", hero_overlay_color: "#000000" } },
];

// Custom presets live in the settings store so they sync across devices
const loadCustom = () => { try { return JSON.parse(getSetting("custom_bg_presets") || "[]"); } catch { return []; } };
const saveCustom = (list) => setSettings({ custom_bg_presets: JSON.stringify(list) });

const CATEGORIES = ["الكل", "إسلامية", "فخمة", "متحركة", "صور", "مخصص"];

export default function DevBackgroundLibrary() {
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [applied, setApplied] = useState(() => getSetting("hero_bg_preset") || "");
  const [custom, setCustom] = useState(loadCustom);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ label: "", type: "gradient_anim", gradFrom: "#0d3b2e", gradTo: "#1a6b3c", bgUrl: "" });

  const allPresets = [...PRESETS, ...custom];
  const filtered = activeCategory === "الكل" ? allPresets : allPresets.filter((p) => p.category === activeCategory);

  const applyPreset = (preset) => {
    setSettings({ ...preset.settings, hero_bg_preset: preset.id });
    setApplied(preset.id);
    toast.success(`✓ تم تطبيق "${preset.label}" على الصفحة الرئيسية`);
  };

  const deleteCustom = (id) => {
    const next = custom.filter((p) => p.id !== id);
    setCustom(next);
    saveCustom(next);
    toast.success("تم حذف الخلفية المخصصة");
  };

  const createPreset = () => {
    if (!form.label.trim()) { toast.error("أدخل اسم الخلفية"); return; }
    const isImg = form.type === "static_image";
    if (isImg && !form.bgUrl.trim()) { toast.error("أدخل رابط الصورة"); return; }
    const preset = {
      id: `custom_${Date.now()}`,
      category: "مخصص",
      label: form.label.trim(),
      icon: isImg ? "🖼️" : "🎨",
      preview: isImg ? "from-slate-700 to-slate-900" : "from-emerald-900 to-primary",
      settings: isImg
        ? { hero_bg_type: "static_image", hero_bg_url: form.bgUrl.trim(), hero_bg_brightness: "70", hero_overlay_alpha: "30", hero_overlay_color: "#000000" }
        : { hero_bg_type: "gradient_anim", hero_grad_from: form.gradFrom, hero_grad_to: form.gradTo, hero_anim_speed: "5" },
    };
    const next = [preset, ...custom];
    setCustom(next);
    saveCustom(next);
    setForm({ label: "", type: "gradient_anim", gradFrom: "#0d3b2e", gradTo: "#1a6b3c", bgUrl: "" });
    setCreating(false);
    setActiveCategory("مخصص");
    toast.success("تمت إضافة الخلفية المخصصة");
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black">مكتبة الخلفيات</h2>
            <p className="text-xs text-muted-foreground">اختر خلفية جاهزة أو أضف خلفيتك الخاصة</p>
          </div>
        </div>
        <button onClick={() => setCreating((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition">
          {creating ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {creating ? "إغلاق" : "إضافة خلفية"}
        </button>
      </div>

      {/* Custom background creator */}
      {creating && (
        <div className="rounded-2xl border border-primary/30 bg-card p-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">اسم الخلفية</label>
            <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="مثال: خلفية المسجد الأزرق"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">النوع</label>
            <div className="flex gap-2">
              {[
                { v: "gradient_anim", l: "تدرج متحرك" },
                { v: "static_image", l: "صورة (رابط)" },
              ].map((o) => (
                <button key={o.v} onClick={() => setForm({ ...form, type: o.v })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${form.type === o.v ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background"}`}>
                  {o.l}
                </button>
              ))}
            </div>
          </div>
          {form.type === "static_image" ? (
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">رابط الصورة</label>
              <input value={form.bgUrl} onChange={(e) => setForm({ ...form, bgUrl: e.target.value })}
                placeholder="https://..." className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">اللون الأول</label>
                <input type="color" value={form.gradFrom} onChange={(e) => setForm({ ...form, gradFrom: e.target.value })}
                  className="w-full h-9 rounded-lg border border-border bg-background" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">اللون الثاني</label>
                <input type="color" value={form.gradTo} onChange={(e) => setForm({ ...form, gradTo: e.target.value })}
                  className="w-full h-9 rounded-lg border border-border bg-background" />
              </div>
            </div>
          )}
          <button onClick={createPreset}
            className="w-full rounded-xl bg-primary py-2 text-sm font-bold text-primary-foreground hover:opacity-90">
            حفظ الخلفية المخصصة
          </button>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
              activeCategory === cat ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/40 bg-card"
            }`}>{cat}</button>
        ))}
      </div>

      {/* Presets Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {filtered.map((preset) => (
          <div key={preset.id} className="relative">
            <button onClick={() => applyPreset(preset)}
              className={`w-full relative flex flex-col overflow-hidden rounded-2xl border-2 transition-all hover:scale-[1.02] active:scale-95 ${
                applied === preset.id ? "border-primary shadow-lg shadow-primary/20" : "border-border hover:border-primary/50"
              }`}>
              <div className={`h-20 bg-gradient-to-br ${preset.preview} flex items-center justify-center relative`}>
                {preset.settings.hero_bg_url && (
                  <img src={preset.settings.hero_bg_url} alt={preset.label}
                    className="absolute inset-0 w-full h-full object-cover opacity-80" />
                )}
                <span className="text-4xl relative drop-shadow-lg">{preset.icon}</span>
                {applied === preset.id && (
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground rounded-full p-0.5">
                    <Check className="w-3 h-3" />
                  </div>
                )}
              </div>
              <div className="bg-card p-2 text-right">
                <p className="text-xs font-bold truncate">{preset.label}</p>
                <p className="text-[10px] text-muted-foreground">{preset.category}</p>
              </div>
            </button>
            {preset.category === "مخصص" && (
              <button onClick={() => deleteCustom(preset.id)}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-red-500 transition">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}