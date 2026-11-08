import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Activity, RefreshCw, Search, Clock, User, Tag, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function DevLogs() {
  const [logs, setLogs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { loadLogs(); }, []);

  const loadLogs = async () => {
    setLoading(true);
    const rows = await base44.entities.AppSettings.list('-updated_date', 100);
    setLogs(rows.filter(r => r.setting_key));
    setLoading(false);
  };

  const filtered = logs.filter(l =>
    !search || l.setting_key?.includes(search) || l.setting_value?.includes(search) || l.changed_by?.includes(search)
  );

  const keyLabel = (key) => {
    const map = {
      app_name: "اسم التطبيق", app_subtitle: "الوصف", logo_url: "الشعار",
      color_bg: "لون الخلفية", color_primary: "اللون الأساسي", color_accent: "لون التمييز",
      color_card: "لون البطاقات", color_fg: "لون النص", dark_mode: "الوضع الليلي",
      app_lang: "اللغة", font_body: "خط النص", font_heading: "خط العناوين",
      font_size: "حجم الخط", show_dev_nav: "زر المطور", categories: "التصنيفات",
      youtube_url: "رابط يوتيوب", card_style: "نمط البطاقات", card_radius: "زوايا البطاقات",
    };
    return map[key] || key;
  };

  const exportCsv = () => {
    const header = ["الإعداد", "المفتاح", "القيمة السابقة", "القيمة الجديدة", "بواسطة", "التاريخ"];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const rows = filtered.map(l => [
      keyLabel(l.setting_key), l.setting_key, l.previous_value, l.setting_value,
      l.changed_by, l.updated_date ? new Date(l.updated_date).toLocaleString("ar") : "",
    ].map(esc).join(","));
    const csv = "\uFEFF" + [header.map(esc).join(","), ...rows].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <Activity className="w-4 h-4 text-primary" /> سجلات النشاط والتغييرات
          <span className="text-xs text-muted-foreground font-normal">({filtered.length})</span>
        </h3>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="outline" size="sm" onClick={exportCsv} className="rounded-xl gap-1.5 h-8">
            <Download className="w-3.5 h-3.5" /> تصدير
          </Button>
          <button onClick={loadLogs} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><RefreshCw className="w-4 h-4 text-muted-foreground" /></button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث في السجلات..." className="pr-9 rounded-xl" />
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading
          ? <div className="flex justify-center py-10"><div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
          : <div className="divide-y divide-border max-h-[65vh] overflow-y-auto">
              {filtered.map(log => (
                <div key={log.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Tag className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold">{keyLabel(log.setting_key)}</span>
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">{log.setting_key}</span>
                      </div>
                      <div className="flex gap-3 text-xs flex-wrap">
                        {log.previous_value && (
                          <span className="text-muted-foreground line-through truncate max-w-[150px]">{log.previous_value}</span>
                        )}
                        {log.previous_value && <span className="text-muted-foreground">→</span>}
                        <span className="text-foreground font-medium truncate max-w-[150px]">{log.setting_value || "—"}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                        {log.changed_by && <span className="flex items-center gap-1"><User className="w-3 h-3" />{log.changed_by}</span>}
                        {log.updated_date && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(log.updated_date).toLocaleString("ar")}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-10">لا توجد سجلات</p>}
            </div>
        }
      </div>
    </div>
  );
}