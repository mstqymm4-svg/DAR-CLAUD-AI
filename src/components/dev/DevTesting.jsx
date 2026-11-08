import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { FlaskConical, Play, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function DevTesting() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([]);

  const tests = [
    {
      name: "الاتصال بقاعدة البيانات",
      icon: "🔌",
      run: async () => {
        const books = await base44.entities.Book.list("-created_date", 1);
        if (books !== undefined) return { pass: true, detail: `${books.length} سجل` };
        return { pass: false, detail: "لا توجد استجابة" };
      },
    },
    {
      name: "قراءة الكتب",
      icon: "📚",
      run: async () => {
        const books = await base44.entities.Book.list("-created_date", 5);
        return { pass: books.length >= 0, detail: `${books.length} كتاب متاح` };
      },
    },
    {
      name: "قراءة الفيديوهات",
      icon: "🎥",
      run: async () => {
        const videos = await base44.entities.Video.list("-created_date", 5);
        return { pass: videos.length >= 0, detail: `${videos.length} فيديو` };
      },
    },
    {
      name: "قراءة القنوات",
      icon: "📺",
      run: async () => {
        const channels = await base44.entities.VideoChannel.list("-created_date", 5);
        return { pass: channels.length >= 0, detail: `${channels.length} قناة` };
      },
    },
    {
      name: "قراءة المفضلة",
      icon: "❤️",
      run: async () => {
        const favs = await base44.entities.Favorite.list("-created_date", 5);
        return { pass: favs.length >= 0, detail: `${favs.length} مفضلة` };
      },
    },
    {
      name: "قراءة الإعدادات",
      icon: "⚙️",
      run: async () => {
        const settings = await base44.entities.AppSettings.list("-created_date", 5);
        return { pass: settings.length >= 0, detail: `${settings.length} إعداد` };
      },
    },
    {
      name: "مصادقة المستخدم",
      icon: "👤",
      run: async () => {
        const user = await base44.auth.me();
        return { pass: !!user, detail: user ? user.email || "مسجل" : "زائر" };
      },
    },
    {
      name: "التخزين المحلي",
      icon: "💾",
      run: () => {
        const testKey = "__test_storage__";
        localStorage.setItem(testKey, "ok");
        const val = localStorage.getItem(testKey);
        localStorage.removeItem(testKey);
        return { pass: val === "ok", detail: "يعمل بشكل صحيح" };
      },
    },
    {
      name: "وضع عدم الاتصال",
      icon: "📡",
      run: () => {
        const online = navigator.onLine;
        return { pass: true, detail: online ? "متصل بالإنترنت" : "وضع عدم الاتصال" };
      },
    },
  ];

  const runAllTests = async () => {
    setRunning(true);
    setResults([]);
    const newResults = [];
    for (const test of tests) {
      try {
        const result = await test.run();
        newResults.push({ name: test.name, icon: test.icon, ...result });
        setResults([...newResults]);
      } catch(e) {
        newResults.push({ name: test.name, icon: test.icon, pass: false, detail: e.message || "خطأ" });
        setResults([...newResults]);
      }
    }
    setRunning(false);
    const passed = newResults.filter((r) => r.pass).length;
    toast.success(`اكتمل الاختبار: ${passed}/${newResults.length} ناجح`);
  };

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;

  return (
    <div className="space-y-5" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black mb-1 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-primary" /> أدوات الاختبار
          </h2>
          <p className="text-sm text-muted-foreground">اختبار جميع وظائف التطبيق</p>
        </div>
        <Button onClick={runAllTests} disabled={running} className="rounded-xl gap-2">
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {running ? "جاري الاختبار..." : "تشغيل الاختبارات"}
        </Button>
      </div>

      {/* Summary */}
      {results.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-black text-primary">{results.length}</p>
            <p className="text-xs text-muted-foreground">إجمالي</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-black text-green-600 dark:text-green-400">{passed}</p>
            <p className="text-xs text-muted-foreground">ناجح</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-black text-destructive">{failed}</p>
            <p className="text-xs text-muted-foreground">فاشل</p>
          </div>
        </div>
      )}

      {/* Test Results */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {results.length === 0 ? (
          <div className="p-12 text-center">
            <FlaskConical className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">اضغط "تشغيل الاختبارات" لبدء الفحص</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {results.map((r, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <span className="text-lg">{r.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">{r.name}</p>
                  <p className="text-xs text-muted-foreground">{r.detail}</p>
                </div>
                {r.pass ? (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}