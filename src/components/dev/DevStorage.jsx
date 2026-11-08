import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { HardDrive, BookOpen, Image, FileText, RefreshCw, Trash2, Database, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getStorageEstimate, clearAllCache, formatBytes } from "@/lib/offlineDB";

export default function DevStorage() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [estimate, setEstimate] = useState(null);
  const [estLoading, setEstLoading] = useState(false);
  const [persisted, setPersisted] = useState(null);
  const [clearing, setClearing] = useState(false);

  useEffect(() => { loadData(); loadEstimate(); checkPersist(); }, []);

  const loadData = async () => {
    setLoading(true);
    const all = await base44.entities.Book.list('-created_date', 1000);
    setBooks(all);
    setLoading(false);
  };

  const loadEstimate = async () => {
    setEstLoading(true);
    try { setEstimate(await getStorageEstimate()); } catch {}
    setEstLoading(false);
  };

  const checkPersist = async () => {
    try { if (navigator.storage?.persisted) setPersisted(await navigator.storage.persisted()); } catch {}
  };

  const requestPersist = async () => {
    try {
      const ok = await navigator.storage?.persist?.();
      setPersisted(ok);
      toast.success(ok ? "تم تفعيل التخزين الدائم" : "تعذّر تفعيل التخزين الدائم");
    } catch { toast.error("تعذّر تفعيل التخزين الدائم"); }
  };

  const handleClear = async () => {
    setClearing(true);
    try {
      await clearAllCache();
      await loadEstimate();
      toast.success("تم مسح التخزين المؤقت");
    } catch { toast.error("تعذّر المسح"); }
    setClearing(false);
  };

  const withPdf = books.filter(b => b.pdf_url);
  const withCover = books.filter(b => b.cover_image);
  const withBoth = books.filter(b => b.pdf_url && b.cover_image);
  const incomplete = books.filter(b => !b.pdf_url);

  const quota = estimate?.quota || 0;
  const usage = estimate?.usage || 0;
  const usagePct = quota > 0 ? Math.min(100, (usage / quota) * 100) : 0;
  const cachedSize = estimate?.totalSize || 0;

  const StatBar = ({ label, count, total, color }) => (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="font-mono font-bold">{count}/{total}</span>
      </div>
      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-700`}
          style={{ width: total > 0 ? `${Math.round((count / total) * 100)}%` : "0%" }} />
      </div>
      <p className="text-[10px] text-muted-foreground text-left">{total > 0 ? `${Math.round((count / total) * 100)}%` : "0%"}</p>
    </div>
  );

  return (
    <div className="space-y-5" dir="rtl">
      {/* Device storage management (offline) */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2"><Database className="w-4 h-4 text-primary" /> تخزين الجهاز (Offline)</h3>
          <button onClick={loadEstimate} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><RefreshCw className="w-3.5 h-3.5 text-muted-foreground" /></button>
        </div>
        {estLoading ? (
          <div className="flex justify-center py-6"><div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
        ) : (
          <>
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">المستخدم من حصة المتصفح</span>
                <span className="font-mono font-bold">{formatBytes(usage)} / {formatBytes(quota)}</span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary transition-all duration-700" style={{ width: `${usagePct}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-muted/50 p-2">
                <p className="text-lg font-black">{estimate?.pdfsCount ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">PDF محفوظ</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-2">
                <p className="text-lg font-black">{estimate?.imagesCount ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">صورة محفوظة</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-2">
                <p className="text-lg font-black">{formatBytes(cachedSize)}</p>
                <p className="text-[10px] text-muted-foreground">حجم الكاش</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant={persisted ? "secondary" : "default"} onClick={requestPersist} className="gap-2 rounded-xl">
                <ShieldCheck className="w-4 h-4" /> {persisted ? "تخزين دائم ✓" : "تفعيل التخزين الدائم"}
              </Button>
              <Button size="sm" variant="outline" onClick={handleClear} disabled={clearing} className="gap-2 rounded-xl">
                {clearing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} مسح التخزين المؤقت
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">تفعيل التخزين الدائم يمنع المتصفح من حذف كتبك وصورك المحفوظة تلقائياً ويمنح حصة أكبر — يمنع تجمّد التطبيق عند امتلاء الذاكرة.</p>
          </>
        )}
      </div>

      {/* Books overview */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm flex items-center gap-2"><HardDrive className="w-4 h-4 text-primary" /> نظرة عامة على الكتب</h3>
          <button onClick={loadData} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><RefreshCw className="w-3.5 h-3.5 text-muted-foreground" /></button>
        </div>
        {loading
          ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
          : (
            <div className="space-y-4">
              <StatBar label="كتب بملف PDF" count={withPdf.length} total={books.length} color="bg-green-500" />
              <StatBar label="كتب بصورة غلاف" count={withCover.length} total={books.length} color="bg-blue-500" />
              <StatBar label="كتب مكتملة" count={withBoth.length} total={books.length} color="bg-primary" />
            </div>
          )
        }
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xl font-black">{loading ? "..." : withPdf.length}</p>
            <p className="text-xs text-muted-foreground">ملف PDF</p>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
            <Image className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xl font-black">{loading ? "..." : withCover.length}</p>
            <p className="text-xs text-muted-foreground">صورة غلاف</p>
          </div>
        </div>
      </div>

      {/* Incomplete Books */}
      {!loading && incomplete.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="font-bold text-sm text-amber-600">⚠ كتب بدون PDF ({incomplete.length})</h3>
          </div>
          <div className="divide-y divide-border max-h-64 overflow-y-auto">
            {incomplete.map(book => (
              <div key={book.id} className="flex items-center gap-3 px-4 py-2.5">
                <div className="w-8 h-10 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {book.cover_image ? <img src={book.cover_image} alt="" className="w-full h-full object-cover" /> : <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{book.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{book.author}</p>
                </div>
                <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full shrink-0">بدون PDF</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}