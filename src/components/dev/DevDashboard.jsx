import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BookOpen, Users, Activity, TrendingUp, Star, FileText, Clock, Video, Heart, Tv, RefreshCw } from "lucide-react";
import StatCard from "@/components/dev/StatCard";
import CategoryBreakdown from "@/components/dev/CategoryBreakdown";

export default function DevDashboard() {
  const [stats, setStats] = useState({ total: 0, featured: 0, categories: 0, withPdf: 0, videos: 0, channels: 0, favorites: 0, users: 0 });
  const [recentBooks, setRecentBooks] = useState([]);
  const [allBooks, setAllBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    setLoading(true);
    const [books, videos, channels, favs, users] = await Promise.all([
      base44.entities.Book.list('-created_date', 1000).catch(() => []),
      base44.entities.Video.list('-created_date', 1000).catch(() => []),
      base44.entities.VideoChannel.list('-created_date', 1000).catch(() => []),
      base44.entities.Favorite.list('-created_date', 1000).catch(() => []),
      base44.entities.User.list('-created_date', 500).catch(() => []),
    ]);
    const cats = new Set(books.map(b => b.category));
    setStats({
      total: books.length,
      featured: books.filter(b=>b.is_featured).length,
      categories: cats.size,
      withPdf: books.filter(b=>b.pdf_url).length,
      videos: videos.length,
      channels: channels.length,
      favorites: favs.length,
      users: users.length,
    });
    setAllBooks(books);
    setRecentBooks(books.slice(0, 8));
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, []);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black mb-1">مرحباً بك في مركز التحكم</h2>
          <p className="text-sm text-muted-foreground">نظرة عامة على حالة المكتبة الرقمية</p>
        </div>
        <button onClick={loadAll} className="p-2 rounded-xl hover:bg-muted transition-colors shrink-0" title="تحديث">
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard loading={loading} icon={BookOpen}  label="إجمالي الكتب"   value={stats.total}      color="bg-primary/10 text-primary" />
        <StatCard loading={loading} icon={Star}      label="كتاب مميز"       value={stats.featured}   color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" />
        <StatCard loading={loading} icon={Activity}  label="تصنيف"           value={stats.categories} color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" />
        <StatCard loading={loading} icon={FileText}  label="كتاب بـ PDF"     value={stats.withPdf}    color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" />
        <StatCard loading={loading} icon={Video}     label="الفيديوهات"      value={stats.videos}     color="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" />
        <StatCard loading={loading} icon={Tv}        label="القنوات"         value={stats.channels}   color="bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400" />
        <StatCard loading={loading} icon={Heart}     label="المفضلة"         value={stats.favorites}  color="bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" />
        <StatCard loading={loading} icon={Users}     label="المستخدمون"      value={stats.users}      color="bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400" />
      </div>

      {!loading && <CategoryBreakdown books={allBooks} />}

      {/* PDF Coverage */}
      {!loading && stats.total > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex justify-between items-center mb-3">
            <p className="font-bold text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary" /> تغطية PDF</p>
            <span className="text-sm font-mono font-bold text-primary">{Math.round((stats.withPdf/stats.total)*100)}%</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-gradient-to-l from-primary to-primary/70 rounded-full transition-all duration-700"
              style={{ width: `${Math.round((stats.withPdf/stats.total)*100)}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{stats.withPdf} من {stats.total} كتاب</p>
        </div>
      )}

      {/* Recent Books */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> آخر الكتب المضافة</h3>
        {loading
          ? <div className="flex justify-center py-8"><div className="w-6 h-6 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
          : <div className="space-y-2">
              {recentBooks.map(book => (
                <div key={book.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="w-9 h-11 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-border">
                    {book.cover_image ? <img src={book.cover_image} alt="" className="w-full h-full object-cover" /> : <BookOpen className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{book.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{book.author} · {book.category}</p>
                  </div>
                  <div className="flex flex-col gap-1 items-end shrink-0">
                    {book.pdf_url && <span className="text-[10px] text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full">PDF ✓</span>}
                    {book.is_featured && <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">⭐ مميز</span>}
                  </div>
                </div>
              ))}
            </div>
        }
      </div>
    </div>
  );
}