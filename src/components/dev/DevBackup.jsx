import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Archive, Download, Upload, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { getAllSettings, setSettings } from "@/lib/settingsStore";

export default function DevBackup() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [lastBackup, setLastBackup] = useState(() => {
    try { return localStorage.getItem("last_backup_date") || null; } catch(e) { return null; }
  });

  const handleExportSettings = () => {
    const settings = getAllSettings();
    const data = JSON.stringify({ type: "settings_backup", date: new Date().toISOString(), data: settings }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `settings_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    const now = new Date().toLocaleString("ar");
    setLastBackup(now);
    try { localStorage.setItem("last_backup_date", now); } catch(e) {}
    toast.success("تم تصدير الإعدادات ✓");
  };

  const handleExportBooks = async () => {
    setExporting(true);
    const books = await base44.entities.Book.list('-created_date', 1000);
    const data = JSON.stringify({ type: "books_backup", date: new Date().toISOString(), count: books.length, data: books }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `books_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    setExporting(false);
    toast.success(`تم تصدير ${books.length} كتاب ✓`);
  };

  const handleImportSettings = (e) => {
    const file = e.target.files[0]; if (!file) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const settings = parsed.data || parsed;
        setSettings(settings);
        toast.success("تم استيراد الإعدادات ✓ — يطبق فورياً");
      } catch { toast.error("ملف غير صحيح"); }
      setImporting(false);
    };
    reader.readAsText(file);
  };

  const handleImportBooks = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const books = parsed.data || parsed;
        if (!Array.isArray(books)) { toast.error("ملف غير صحيح"); return; }
        let count = 0;
        for (const book of books) {
          const { id, created_date, updated_date, created_by_id, ...data } = book;
          await base44.entities.Book.create(data);
          count++;
        }
        toast.success(`تم استيراد ${count} كتاب ✓`);
      } catch { toast.error("خطأ في الاستيراد"); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-bold text-sm mb-1 flex items-center gap-2"><Archive className="w-4 h-4 text-primary" /> نظام النسخ الاحتياطي</h3>
        <p className="text-xs text-muted-foreground">صدّر إعداداتك وبياناتك، واستوردها في أي وقت</p>
        {lastBackup && (
          <div className="flex items-center gap-2 mt-3 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-lg">
            <Clock className="w-3.5 h-3.5" />
            آخر نسخة احتياطية: {lastBackup}
          </div>
        )}
      </div>

      {/* Export */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-sm flex items-center gap-2"><Download className="w-4 h-4 text-green-600" /> التصدير</h3>
        <Button onClick={handleExportSettings} variant="outline" className="w-full rounded-xl h-11 gap-2 font-bold justify-start">
          <Download className="w-4 h-4 text-primary" /> تصدير الإعدادات والتصميم (.json)
        </Button>
        <Button onClick={handleExportBooks} disabled={exporting} variant="outline" className="w-full rounded-xl h-11 gap-2 font-bold justify-start">
          {exporting
            ? <><div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />جاري التصدير...</>
            : <><Download className="w-4 h-4 text-green-600" /> تصدير قاعدة بيانات الكتب (.json)</>}
        </Button>
      </div>

      {/* Import */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
        <h3 className="font-bold text-sm flex items-center gap-2"><Upload className="w-4 h-4 text-blue-600" /> الاستيراد</h3>
        <label className="cursor-pointer block">
          <input type="file" accept=".json" onChange={handleImportSettings} className="hidden" />
          <div className={`flex items-center gap-2 h-11 px-4 rounded-xl border-2 border-dashed transition-colors cursor-pointer hover:border-primary/50 ${importing?"border-primary":"border-border"}`}>
            <Upload className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold">استيراد الإعدادات (.json)</span>
          </div>
        </label>
        <label className="cursor-pointer block">
          <input type="file" accept=".json" onChange={handleImportBooks} className="hidden" />
          <div className="flex items-center gap-2 h-11 px-4 rounded-xl border-2 border-dashed border-border hover:border-blue-400 transition-colors cursor-pointer">
            <Upload className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-bold">استيراد كتب من نسخة احتياطية (.json)</span>
          </div>
        </label>
        <p className="text-xs text-muted-foreground">⚠ الاستيراد يُضيف بيانات جديدة ولا يحذف البيانات الموجودة</p>
      </div>
    </div>
  );
}