import { useState, useEffect } from "react";
import { Zap, RefreshCw, Cpu, Clock, Database, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function DevPerformance() {
  const [metrics, setMetrics]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [dbPing, setDbPing]     = useState(null);
  const [pinging, setPinging]   = useState(false);

  useEffect(() => {
    collectMetrics();
  }, []);

  const collectMetrics = () => {
    const nav = performance.getEntriesByType("navigation")[0];
    const mem = performance.memory || null;
    setMetrics({
      loadTime:    nav ? Math.round(nav.loadEventEnd - nav.fetchStart) : null,
      domReady:    nav ? Math.round(nav.domContentLoadedEventEnd - nav.fetchStart) : null,
      ttfb:        nav ? Math.round(nav.responseStart - nav.fetchStart) : null,
      memUsed:     mem ? Math.round(mem.usedJSHeapSize / 1024 / 1024) : null,
      memLimit:    mem ? Math.round(mem.jsHeapSizeLimit / 1024 / 1024) : null,
    });
  };

  const pingDB = async () => {
    setPinging(true);
    const start = performance.now();
    await base44.entities.AppSettings.list('-updated_date', 1);
    const ms = Math.round(performance.now() - start);
    setDbPing(ms);
    setPinging(false);
    toast.success(`قاعدة البيانات: ${ms}ms`);
  };

  const MetricCard = ({ icon: Icon, label, value, unit, color = "text-primary", desc }) => (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className={`text-2xl font-black ${color}`}>{value !== null ? value : "—"}<span className="text-sm font-normal text-muted-foreground mr-1">{unit}</span></p>
      {desc && <p className="text-[10px] text-muted-foreground mt-1">{desc}</p>}
    </div>
  );

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm flex items-center gap-2"><Zap className="w-4 h-4 text-primary" /> مقاييس الأداء</h3>
        <button onClick={collectMetrics} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><RefreshCw className="w-4 h-4 text-muted-foreground" /></button>
      </div>

      {/* Page Load */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard icon={Globe}    label="زمن التحميل"  value={metrics?.loadTime}  unit="ms"  color={metrics?.loadTime < 2000 ? "text-green-600" : "text-amber-600"} desc="إجمالي تحميل الصفحة" />
        <MetricCard icon={Clock}    label="DOM جاهز"     value={metrics?.domReady}  unit="ms"  color={metrics?.domReady < 1000 ? "text-green-600" : "text-amber-600"} desc="اكتمال بناء الصفحة" />
        <MetricCard icon={Zap}      label="TTFB"         value={metrics?.ttfb}      unit="ms"  color={metrics?.ttfb < 500 ? "text-green-600" : "text-red-500"} desc="وقت أول استجابة" />
        <MetricCard icon={Cpu}      label="ذاكرة JS"     value={metrics?.memUsed}   unit="MB"  color="text-primary" desc={metrics?.memLimit ? `من ${metrics.memLimit} MB` : ""} />
      </div>

      {/* DB Ping */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Database className="w-4 h-4 text-primary" /> اتصال قاعدة البيانات</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            {dbPing !== null ? (
              <div>
                <p className={`text-2xl font-black ${dbPing < 200 ? "text-green-600" : dbPing < 500 ? "text-amber-600" : "text-red-500"}`}>{dbPing} <span className="text-sm font-normal text-muted-foreground">ms</span></p>
                <p className="text-xs text-muted-foreground">{dbPing < 200 ? "ممتاز" : dbPing < 500 ? "جيد" : "بطيء"}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">اضغط لقياس سرعة الاتصال</p>
            )}
          </div>
          <Button onClick={pingDB} disabled={pinging} variant="outline" className="rounded-xl gap-2 font-bold shrink-0">
            {pinging ? <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /> : <Zap className="w-4 h-4" />}
            قياس
          </Button>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
        <h3 className="font-bold text-sm mb-3">نصائح لتحسين الأداء</h3>
        {[
          "استخدم صور مضغوطة للأغلفة (WebP أقل من 100KB)",
          "حافظ على عدد الكتب المميزة في حدود 6-8 كتب",
          "تأكد من تحسين ملفات PDF قبل الرفع",
          "استخدم شبكة CDN لرفع الملفات الكبيرة",
        ].map((tip, i) => (
          <p key={i} className="text-xs text-muted-foreground flex items-start gap-2">
            <span className="text-green-500 mt-0.5">✓</span> {tip}
          </p>
        ))}
      </div>
    </div>
  );
}