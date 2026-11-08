/**
 * DevTheme — Professional Theme Engine UI
 * Handles light / dark / auto modes with live preview
 */
import { Moon, Sun, Monitor, Check, Palette, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useTheme } from "@/hooks/useTheme";

const MODES = [
  {
    id: "light",
    label: "الوضع الفاتح",
    desc: "واجهة بيضاء مريحة للعيون في النهار",
    icon: Sun,
    preview: "bg-white border-2 border-amber-300",
    textPreview: "text-gray-900",
    badgeColor: "bg-amber-100 text-amber-700",
  },
  {
    id: "dark",
    label: "الوضع الليلي",
    desc: "واجهة داكنة تريح العيون في الليل",
    icon: Moon,
    preview: "bg-gray-900 border-2 border-blue-500",
    textPreview: "text-gray-100",
    badgeColor: "bg-blue-900 text-blue-200",
  },
  {
    id: "auto",
    label: "تلقائي حسب الجهاز",
    desc: "يتبع إعداد الجهاز تلقائياً (ليل / نهار)",
    icon: Monitor,
    preview: "bg-gradient-to-r from-white to-gray-900 border-2 border-green-400",
    textPreview: "text-gray-500",
    badgeColor: "bg-green-100 text-green-700",
  },
];

// Mini preview component
function ThemePreviewCard({ isDark }) {
  return (
    <div className={`rounded-2xl p-4 border-2 transition-all duration-500 ${isDark ? "bg-gray-900 border-gray-700" : "bg-white border-gray-200"}`}>
      {/* Fake header */}
      <div className={`flex items-center gap-2 mb-3 pb-3 border-b ${isDark ? "border-gray-700" : "border-gray-100"}`}>
        <div className={`w-8 h-8 rounded-lg ${isDark ? "bg-emerald-800" : "bg-emerald-100"}`} />
        <div className="flex-1 space-y-1">
          <div className={`h-2.5 rounded w-24 ${isDark ? "bg-gray-600" : "bg-gray-200"}`} />
          <div className={`h-2 rounded w-16 ${isDark ? "bg-gray-700" : "bg-gray-100"}`} />
        </div>
      </div>
      {/* Fake cards */}
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`rounded-xl p-3 ${isDark ? "bg-gray-800" : "bg-gray-50"}`}>
            <div className={`h-10 rounded-lg mb-2 ${isDark ? "bg-gray-700" : "bg-gray-200"}`} />
            <div className={`h-2 rounded w-3/4 mb-1 ${isDark ? "bg-gray-600" : "bg-gray-200"}`} />
            <div className={`h-2 rounded w-1/2 ${isDark ? "bg-gray-700" : "bg-gray-100"}`} />
          </div>
        ))}
      </div>
      {/* Fake button */}
      <div className={`mt-3 h-9 rounded-xl ${isDark ? "bg-emerald-700" : "bg-emerald-500"}`} />
    </div>
  );
}

export default function DevTheme() {
  const { mode, isDark, setMode } = useTheme();

  const handleApply = (modeId) => {
    setMode(modeId);
    toast.success(
      modeId === "dark" ? "🌙 تم تفعيل الوضع الليلي على جميع الصفحات" :
      modeId === "light" ? "☀️ تم تفعيل الوضع الفاتح على جميع الصفحات" :
      "🔄 تم تفعيل الوضع التلقائي حسب الجهاز"
    );
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Palette className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-black">نظام الثيمات</h2>
          <p className="text-xs text-muted-foreground">يُطبَّق فوراً على جميع الصفحات والمكوّنات</p>
        </div>
      </div>

      {/* Current status */}
      <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex items-center gap-3">
        {isDark
          ? <Moon className="w-5 h-5 text-primary shrink-0" />
          : <Sun className="w-5 h-5 text-primary shrink-0" />}
        <div className="flex-1">
          <p className="text-sm font-bold">
            الوضع الحالي: {MODES.find(m => m.id === mode)?.label || "فاتح"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isDark ? "الواجهة تعرض الثيم الداكن حالياً" : "الواجهة تعرض الثيم الفاتح حالياً"}
          </p>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${isDark ? "bg-blue-500/20 text-blue-400" : "bg-amber-500/20 text-amber-600"}`}>
          {isDark ? "🌙 ليلي" : "☀️ نهاري"}
        </span>
      </div>

      {/* Mode cards */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-muted-foreground">اختر الوضع المناسب:</p>
        {MODES.map(m => {
          const Icon = m.icon;
          const isActive = mode === m.id;
          return (
            <div key={m.id}
              className={`rounded-2xl border-2 p-4 transition-all cursor-pointer ${
                isActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 bg-card"
              }`}
              onClick={() => handleApply(m.id)}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${m.preview}`}>
                  <Icon className={`w-5 h-5 ${m.textPreview}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">{m.label}</p>
                    {isActive && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.badgeColor}`}>
                        مُفعَّل
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                </div>
                {isActive && <Check className="w-5 h-5 text-primary shrink-0" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live preview */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-muted-foreground" />
          <p className="text-sm font-semibold">معاينة مباشرة للواجهة</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground text-center mb-2">فاتح ☀️</p>
            <ThemePreviewCard isDark={false} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground text-center mb-2">ليلي 🌙</p>
            <ThemePreviewCard isDark={true} />
          </div>
        </div>
      </div>

      {/* What's affected */}
      <div className="bg-muted/50 rounded-2xl p-4 space-y-2">
        <p className="text-sm font-semibold">ما الذي يتأثر بتغيير الثيم؟</p>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            "الصفحة الرئيسية", "مكتبة الكتب", "صفحة المفضلة",
            "الإعدادات", "لوحة المطور", "قارئ PDF",
            "جميع البطاقات", "جميع الأزرار", "النوافذ المنبثقة",
            "شريط التنقل", "الهيدر والفوتر", "جميع النصوص"
          ].map(item => (
            <div key={item} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Quick toggles */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant={!isDark ? "default" : "outline"}
          onClick={() => handleApply("light")}
          className="gap-2">
          <Sun className="w-4 h-4" /> فاتح
        </Button>
        <Button
          variant={isDark ? "default" : "outline"}
          onClick={() => handleApply("dark")}
          className="gap-2">
          <Moon className="w-4 h-4" /> ليلي
        </Button>
        <Button
          variant={mode === "auto" ? "default" : "outline"}
          onClick={() => handleApply("auto")}
          className="col-span-2 gap-2">
          <Monitor className="w-4 h-4" /> تلقائي حسب الجهاز
        </Button>
      </div>
    </div>
  );
}