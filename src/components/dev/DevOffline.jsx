import { useState, useEffect, useCallback } from "react";
import {
  Wifi, WifiOff, Database, Trash2, RefreshCw, HardDrive,
  Download, CheckCircle, Loader2, Smartphone, Zap, FileText, Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { downloadMultiplePdfs, checkForUpdates, fullSync,
  isOfflineModeEnabled,
} from "@/lib/offlineSync";
import { setSetting, subscribeToSettings } from "@/lib/settingsStore";
import * as db from "@/lib/offlineDB";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export default function DevOffline() {
  const { isOnline } = useOnlineStatus();
  const [offlineEnabled, setOfflineEnabled] = useState(() => isOfflineModeEnabled());
  const [stats, setStats] = useState({ booksCount: 0, pdfsCount: 0, imagesCount: 0, pdfsSize: 0, imagesSize: 0, totalSize: 0, quota: 0, usage: 0 });
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState("");
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloadedBooks, setDownloadedBooks] = useState([]);

  const refreshStats = useCallback(async () => {
    const s = await db.getStorageEstimate();
    setStats(s);
    const dl = await db.getAllCachedPdfs();
    setDownloadedBooks(dl);
  }, []);

  useEffect(() => {
    refreshStats();
    const unsub = subscribeToSettings(() => {
      setOfflineEnabled(isOfflineModeEnabled());
      refreshStats();
    });
    return unsub;
  }, [refreshStats]);

  const handleToggleOffline = () => {
    const val = !offlineEnabled;
    setOfflineEnabled(val);
    setSetting("offline_mode", String(val));
    toast.success(val ? "تم تفعيل وضع عدم الاتصال" : "تم إيقاف وضع عدم الاتصال");
  };

  const handleSync = async () => {
    if (!isOnline) { toast.error("لا يمكن المزامنة بدون اتصال بالإنترنت"); return; }
    setSyncing(true);
    setSyncProgress("جاري مزامنة بيانات المكتبة...");
    try {
      const result = await fullSync((p) => {
        if (p.step === "books" && p.status === "started") setSyncProgress("جاري تنزيل بيانات الكتب...");
        else if (p.step === "favorites") setSyncProgress("جاري مزامنة المفضلة...");
        else if (p.imagesCached !== undefined) setSyncProgress(`جاري حفظ صور الأغلفة... (${p.imagesCached})`);
      });
      toast.success(`تمت المزامنة: ${result.total} كتاب، ${result.imagesCached} صورة`);
      refreshStats();
    } catch(e) {
      toast.error("فشلت المزامنة: " + (e.message || "خطأ غير معروف"));
    }
    setSyncing(false);
    setSyncProgress("");
  };

  const handleCheckUpdates = async () => {
    if (!isOnline) { toast.error("لا يمكن التحقق بدون اتصال بالإنترنت"); return; }
    setCheckingUpdates(true);
    try {
      const info = await checkForUpdates();
      setUpdateInfo(info);
      if (info.hasUpdates) {
        toast.info(`توجد تحديثات: ${info.newCount} جديد، ${info.updatedCount} محدّث`);
      } else {
        toast.success("التطبيق محدّث — لا توجد تغييرات جديدة");
      }
    } catch(e) {
      toast.error("فشل التحقق من التحديثات");
    }
    setCheckingUpdates(false);
  };

  const handleClearCache = async () => {
    if (!confirm("هل أنت متأكد من حذف جميع البيانات المخزنة محلياً؟")) return;
    await db.clearAllCache();
    toast.success("تم حذف ذاكرة التخزين المؤقت");
    refreshStats();
  };

  const handleDownloadAllPdfs = async () => {
    if (!isOnline) { toast.error("يتطلب اتصالاً بالإنترنت"); return; }
    const cached = await db.getCachedBooks();
    const withPdf = cached.filter(b => b.pdf_url);
    if (withPdf.length === 0) { toast.info("لا توجد كتب لتنزيلها"); return; }
    if (!confirm(`سيتم تنزيل ${withPdf.length} كتاب. قد يستغرق هذا وقتاً طويلاً. متابعة؟`)) return;
    setSyncing(true);
    setSyncProgress("جاري تنزيل الكتب...");
    try {
      const result = await downloadMultiplePdfs(withPdf, (p) => {
        setSyncProgress(`جاري التنزيل... ${p.done}/${p.total}`);
      });
      toast.success(`تم تنزيل ${result.done} كتاب${result.failed ? `، فشل ${result.failed}` : ""}`);
      refreshStats();
    } catch(e) {
      toast.error("فشل التنزيل");
    }
    setSyncing(false);
    setSyncProgress("");
  };

  const handleDeletePdf = async (url) => {
    await db.deleteCachedPdf(url);
    toast.success("تم حذف الملف");
    refreshStats();
  };

  const usagePercent = stats.quota > 0 ? Math.round(stats.usage / stats.quota * 100) : 0;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Status Banner */}
      <div className={`rounded-2xl p-5 border ${isOnline ? "bg-green-500/5 border-green-500/20" : "bg-orange-500/5 border-orange-500/20"}`}>
        <div className="flex items-center gap-3">
          {isOnline
            ? <Wifi className="w-5 h-5 text-green-600" />
            : <WifiOff className="w-5 h-5 text-orange-600" />}
          <div className="flex-1">
            <p className="font-bold text-sm">{isOnline ? "متصل بالإنترنت" : "غير متصل — وضع عدم الاتصال"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {offlineEnabled
                ? "وضع عدم الاتصال مفعّل — التطبيق يعمل بالكامل بدون إنترنت"
                : "وضع عدم الاتصال متوقف"}
            </p>
          </div>
          <button
            onClick={handleToggleOffline}
            className={`relative w-12 h-7 rounded-full transition-colors ${offlineEnabled ? "bg-primary" : "bg-muted"}`}
          >
            <motion.div
              className="absolute top-1 w-5 h-5 rounded-full bg-white shadow"
              animate={{ left: offlineEnabled ? "26px" : "4px" }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
        </div>
      </div>

      {/* Storage Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="الكتب" value={stats.booksCount} color="text-blue-600" />
        <StatCard icon={Download} label="ملفات PDF" value={stats.pdfsCount} color="text-green-600" />
        <StatCard icon={ImageIcon} label="الصور" value={stats.imagesCount} color="text-purple-600" />
        <StatCard icon={HardDrive} label="الحجم" value={db.formatBytes(stats.totalSize)} color="text-orange-600" />
      </div>

      {/* Storage Usage */}
      {stats.quota > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">مساحة التخزين المستخدمة</span>
            <span className="text-xs text-muted-foreground">{db.formatBytes(stats.usage)} / {db.formatBytes(stats.quota)}</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(usagePercent, 100)}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{usagePercent}% من المساحة المتاحة</p>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ActionCard
          icon={RefreshCw}
          title="مزامنة البيانات"
          desc="تنزيل وتحديث بيانات المكتبة والصور"
          onClick={handleSync}
          disabled={syncing || !isOnline}
          loading={syncing}
        />
        <ActionCard
          icon={Zap}
          title="التحقق من التحديثات"
          desc="البحث عن كتب جديدة أو محدّثة"
          onClick={handleCheckUpdates}
          disabled={checkingUpdates || !isOnline}
          loading={checkingUpdates}
        />
        <ActionCard
          icon={Download}
          title="تنزيل جميع الكتب"
          desc="تنزيل ملفات PDF لجميع الكتب للقراءة بدون إنترنت"
          onClick={handleDownloadAllPdfs}
          disabled={syncing || !isOnline}
        />
        <ActionCard
          icon={Trash2}
          title="حذف الذاكرة المؤقتة"
          desc="مسح جميع البيانات المحفوظة محلياً"
          onClick={handleClearCache}
          danger
        />
      </div>

      {/* Sync Progress */}
      <AnimatePresence>
        {syncProgress && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-3"
          >
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <span className="text-sm text-foreground">{syncProgress}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Update Info */}
      {updateInfo && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-bold mb-3">معلومات التحديث</h3>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex justify-between p-2 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">كتب جديدة</span>
              <span className="font-bold text-green-600">{updateInfo.newCount || 0}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">كتب محدّثة</span>
              <span className="font-bold text-orange-600">{updateInfo.updatedCount || 0}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">المخزنة محلياً</span>
              <span className="font-bold">{updateInfo.cachedTotal || 0}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-muted/50">
              <span className="text-muted-foreground">على الخادم</span>
              <span className="font-bold">{updateInfo.serverTotal || 0}</span>
            </div>
          </div>
          {updateInfo.hasUpdates && (
            <Button onClick={handleSync} size="sm" className="w-full mt-3" disabled={syncing}>
              <RefreshCw className="w-3.5 h-3.5" /> تحديث الآن
            </Button>
          )}
        </div>
      )}

      {/* Downloaded PDFs List */}
      {downloadedBooks.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-primary" />
            الكتب المحفوظة للقراءة بدون إنترنت ({downloadedBooks.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {downloadedBooks.map((pdf) => (
              <div key={pdf.url} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{pdf.title || "بدون عنوان"}</p>
                  <p className="text-[10px] text-muted-foreground">{db.formatBytes(pdf.size)}</p>
                </div>
                <button
                  onClick={() => handleDeletePdf(pdf.url)}
                  className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
        <div className="flex items-start gap-3">
          <Database className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">كيف يعمل وضع عدم الاتصال؟</p>
            <p>• عند المزامنة، يتم حفظ بيانات الكتب وصور الأغلفة محلياً.</p>
            <p>• يمكنك تنزيل ملفات PDF كاملة للقراءة بدون إنترنت.</p>
            <p>• المفضلة تعمل تلقائياً بدون إنترنت وتُزامن عند توفّر الاتصال.</p>
            <p>• الإعدادات وآخر صفحة مقروءة محفوظة دائماً محلياً.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Icon className={`w-5 h-5 ${color} mb-2`} />
      <p className="text-xl font-black text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ActionCard({ icon: Icon, title, desc, onClick, disabled, loading, danger }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-start gap-3 p-4 rounded-xl border text-right transition-all ${
        danger
          ? "border-destructive/20 hover:bg-destructive/5 hover:border-destructive/40"
          : "border-border hover:bg-muted/50 hover:border-primary/30"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading
        ? <Loader2 className="w-5 h-5 text-primary animate-spin shrink-0" />
        : <Icon className={`w-5 h-5 shrink-0 ${danger ? "text-destructive" : "text-primary"}`} />}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${danger ? "text-destructive" : "text-foreground"}`}>{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </button>
  );
}