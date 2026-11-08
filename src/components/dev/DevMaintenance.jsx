import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Trash2, RefreshCw, Database, AlertTriangle, CheckCircle, HardDrive, Zap, Wrench, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DevMaintenance() {
  const [stats, setStats] = useState({ books: 0, favorites: 0, videos: 0, channels: 0 });
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [clearingCache, setClearingCache] = useState(false);
  const [cleaningOrphans, setCleaningOrphans] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [books, favs, videos, channels] = await Promise.all([
        base44.entities.Book.list("-created_date", 1000).catch(() => []),
        base44.entities.Favorite.list("-created_date", 1000).catch(() => []),
        base44.entities.Video.list("-created_date", 1000).catch(() => []),
        base44.entities.VideoChannel.list("-created_date", 1000).catch(() => []),
      ]);
      setStats({
        books: books.length,
        favorites: favs.length,
        videos: videos.length,
        channels: channels.length,
      });
    } catch(e) {}
    setLoading(false);
  };

  const cleanLocalStorage = async () => {
    if (!confirm("تنظيف البيانات المحلية المؤقتة؟ (لن يتم حذف الكتب أو الإعدادات)")) return;
    setCleaning(true);
    try {
      const keysToKeep = ["dev_panel_password", "devs_theme_mode", "devs_dark_mode", "dev_app_lang", "dev_categories", "dev_settings"];
      const allKeys = Object.keys(localStorage);
      let removed = 0;
      allKeys.forEach((key) => {
        if (!keysToKeep.some((keep) => key.startsWith(keep)) && !key.startsWith("bookmarks_") && !key.startsWith("lastpage_") && !key.startsWith("video_pos_")) {
          localStorage.removeItem(key);
          removed++;
        }
      });
      toast.success(`تم تنظيف ${removed} عنصر مؤقت`);
    } catch(e) {
      toast.error("فشل التنظيف");
    }
    setCleaning(false);
  };

  const clearPageCache = async () => {
    if (!confirm("مسح ذاكرة المتصفح المؤقتة للتطبيق؟ (الكتب المحفوظة للقراءة دون اتصال تبقى كما هي)")) return;
    setClearingCache(true);
    try {
      let cleared = 0;
      if (typeof caches !== "undefined") {
        const names = await caches.keys();
        for (const name of names) {
          await caches.delete(name);
          cleared++;
        }
      }
      toast.success(cleared > 0 ? `تم مسح ${cleared} ذاكرة مؤقتة` : "لا توجد ذاكرة مؤقتة لمسحها");
    } catch (e) {
      toast.error("فشل مسح الذاكرة المؤقتة");
    }
    setClearingCache(false);
  };

  // Remove favorites pointing at books that no longer exist
  const cleanOrphanFavorites = async () => {
    setCleaningOrphans(true);
    try {
      const [books, favs] = await Promise.all([
        base44.entities.Book.list("-created_date", 1000),
        base44.entities.Favorite.list("-created_date", 1000),
      ]);
      const ids = new Set(books.map(b => b.id));
      const orphans = favs.filter(f => f.book_id && !ids.has(f.book_id));
      if (orphans.length === 0) {
        toast.success("لا توجد مفضلات معلّقة ✓");
      } else if (confirm(`حذف ${orphans.length} مفضلة تشير إلى كتب محذوفة؟`)) {
        await Promise.allSettled(orphans.map(f => base44.entities.Favorite.delete(f.id)));
        toast.success(`تم حذف ${orphans.length} مفضلة معلّقة`);
        loadStats();
      }
    } catch (e) {
      toast.error("فشل الفحص");
    }
    setCleaningOrphans(false);
  };

  const optimizeDB = async () => {
    setOptimizing(true);
    try {
      // Check for books without required fields
      const books = await base44.entities.Book.list("-created_date", 1000);
      const incomplete = books.filter((b) => !b.title || !b.author);
      if (incomplete.length > 0) {
        toast.warning(`وجدت ${incomplete.length} كتاب بناقص بيانات`);
      } else {
        toast.success("قاعدة البيانات سليمة ✓");
      }
    } catch(e) {
      toast.error("فشل الفحص");
    }
    setOptimizing(false);
  };

  const StatBox = ({ icon: Icon, label, value, color }) => (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-lg font-black">{loading ? "..." : value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-5" dir="rtl">
      <div>
        <h2 className="text-xl font-black mb-1 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-primary" /> أدوات الصيانة
        </h2>
        <p className="text-sm text-muted-foreground">صيانة وتحسين أداء التطبيق</p>
      </div>

      {/* DB Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatBox icon={Database} label="الكتب" value={stats.books} color="bg-primary/10 text-primary" />
        <StatBox icon={HardDrive} label="المفضلة" value={stats.favorites} color="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" />
        <StatBox icon={Zap} label="الفيديوهات" value={stats.videos} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
        <StatBox icon={Database} label="القنوات" value={stats.channels} color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
      </div>

      {/* Maintenance Actions */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-primary" /> عمليات الصيانة
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Clean localStorage */}
          <div className="border border-border rounded-xl p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">تنظيف البيانات المؤقتة</p>
                <p className="text-xs text-muted-foreground mt-0.5">حذف الذاكرة المؤقتة المحلية</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={cleanLocalStorage} disabled={cleaning} className="w-full rounded-xl gap-1.5">
              {cleaning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              تنظيف
            </Button>
          </div>

          {/* Clear page cache */}
          <div className="border border-border rounded-xl p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <RefreshCw className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">مسح ذاكرة المتصفح</p>
                <p className="text-xs text-muted-foreground mt-0.5">حذف الملفات المؤقتة المخزّنة</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={clearPageCache} disabled={clearingCache} className="w-full rounded-xl gap-1.5">
              {clearingCache ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              مسح
            </Button>
          </div>

          {/* Orphan favorites */}
          <div className="border border-border rounded-xl p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center shrink-0">
                <Database className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">تنظيف المفضلات المعلّقة</p>
                <p className="text-xs text-muted-foreground mt-0.5">مفضلات لكتب تم حذفها</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={cleanOrphanFavorites} disabled={cleaningOrphans} className="w-full rounded-xl gap-1.5">
              {cleaningOrphans ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              فحص وتنظيف
            </Button>
          </div>

          {/* DB Health Check */}
          <div className="border border-border rounded-xl p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">فحص سلامة البيانات</p>
                <p className="text-xs text-muted-foreground mt-0.5">التحقق من اكتمال السجلات</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={optimizeDB} disabled={optimizing} className="w-full rounded-xl gap-1.5">
              {optimizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              فحص
            </Button>
          </div>

          {/* Refresh stats */}
          <div className="border border-border rounded-xl p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Database className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold">تحديث الإحصائيات</p>
                <p className="text-xs text-muted-foreground mt-0.5">إعادة تحميل البيانات</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={loadStats} disabled={loading} className="w-full rounded-xl gap-1.5">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              تحديث
            </Button>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-800 dark:text-amber-300">تنبيه</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
            عمليات الصيانة آمنة ولا تحذف الكتب أو الإعدادات. البيانات المؤقتة فقط هي ما يتم تنظيفه.
          </p>
        </div>
      </div>
    </div>
  );
}