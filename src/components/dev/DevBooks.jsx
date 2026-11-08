import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BookPlus, Pencil, Trash2, Upload, Check, Search, RefreshCw, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getSetting } from "@/lib/settingsStore";
import { deleteCachedBook } from "@/lib/offlineDB";


const DEFAULT_CATS = ["القرآن وعلومه","الحديث الشريف","الفقه الإسلامي","السيرة النبوية","العقيدة","التزكية والرقائق","التاريخ الإسلامي","أخرى"];
const emptyForm = { title:"", author:"", category:"القرآن وعلومه", description:"", cover_image:"", pages_count:"", language:"العربية", pdf_url:"", is_featured:false, rating:0, status:"published" };
const STATUS_OPTIONS = [{ value:"published", label:"منشور", color:"text-green-600" },{ value:"draft", label:"مسودة", color:"text-amber-600" },{ value:"hidden", label:"مخفي", color:"text-red-500" }];

// Derive a clean book title from a PDF filename / direct URL (editable manually)
const titleFromPdfUrl = (url) => {
  try {
    const name = decodeURIComponent(String(url).split("?")[0].split("#")[0]).split("/").pop() || "";
    if (!/\.pdf$/i.test(name)) return "";
    return name.replace(/\.pdf$/i, "").replace(/[-_+]+/g, " ").trim();
  } catch (e) { return ""; }
};

export default function DevBooks() {
  const [books, setBooks]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filter, setFilter]         = useState("all");
  const [selected, setSelected]     = useState([]);
  const [showAdd, setShowAdd]       = useState(false);
  const [editBook, setEditBook]     = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [saving, setSaving]         = useState(false);
  const [pdfUploading, setPdfUploading]     = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [pdfProgress, setPdfProgress]       = useState(0);
  const [pdfProgressInfo, setPdfProgressInfo] = useState("");
  const [pdfSpeed, setPdfSpeed]             = useState("");

  const categories = (() => { try { return JSON.parse(getSetting("categories") || "[]"); } catch(e) { return []; } })().length > 0
    ? (() => { try { return JSON.parse(getSetting("categories")); } catch(e) { return DEFAULT_CATS; } })()
    : DEFAULT_CATS;

  useEffect(() => { loadBooks(); }, []);

  const loadBooks = async () => {
    setLoading(true);
    const all = await base44.entities.Book.list('-created_date', 1000);
    setBooks(all);
    setLoading(false);
  };

  const filtered = books.filter(b => {
    const matchSearch = !search || b.title?.includes(search) || b.author?.includes(search);
    const matchFilter = filter === "all" || (filter === "featured" && b.is_featured) || (filter === "pdf" && b.pdf_url) || (filter === "no_pdf" && !b.pdf_url);
    return matchSearch && matchFilter;
  });

  const openAdd = () => { setForm(emptyForm); setEditBook(null); setShowAdd(true); };
  const openEdit = (book) => {
    setEditBook(book);
    setForm({ title:book.title||"", author:book.author||"", category:book.category||"القرآن وعلومه", description:book.description||"", cover_image:book.cover_image||"", pages_count:book.pages_count||"", language:book.language||"العربية", pdf_url:book.pdf_url||"", is_featured:book.is_featured||false, rating:book.rating||0, status:book.status||"published" });
    setShowAdd(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.author) { toast.error("أدخل العنوان والمؤلف"); return; }
    setSaving(true);
    const data = { ...form, pages_count: form.pages_count ? Number(form.pages_count) : null, rating: Number(form.rating)||0 };
    if (editBook) {
      const updated = await base44.entities.Book.update(editBook.id, data);
      setBooks(prev => prev.map(b => b.id === editBook.id ? { ...b, ...updated } : b));
      toast.success("تم التحديث ✓");
    } else {
      const created = await base44.entities.Book.create(data);
      setBooks(prev => [created, ...prev]);
      toast.success("تمت الإضافة ✓");
    }
    setShowAdd(false);
    setSaving(false);
  };

  const handleDelete = async (book) => {
    if (!confirm(`حذف "${book.title}"؟`)) return;
    try {
      await base44.entities.Book.delete(book.id);
      await deleteCachedBook(book.id).catch(() => {});
      setBooks(prev => prev.filter(b => b.id !== book.id));
      toast.success("تم الحذف");
    } catch (err) {
      toast.error("فشل الحذف: " + (err?.message || "خطأ غير معروف"));
    }
  };

  const handleBulkDelete = async () => {
    const count = selected.length;
    if (!confirm(`حذف ${count} كتاب؟`)) return;
    const ids = [...selected];
    const results = await Promise.allSettled(ids.map(id => base44.entities.Book.delete(id)));
    const failed = results.filter(r => r.status === "rejected").length;
    const succeeded = count - failed;
    await Promise.all(ids.map(id => deleteCachedBook(id).catch(() => {})));
    setSelected([]);
    setBooks(prev => prev.filter(b => !ids.includes(b.id)));
    if (failed > 0) toast.error(`تم حذف ${succeeded}، فشل ${failed}`);
    else toast.success(`تم حذف ${count} كتاب`);
  };

  const uploadFile = async (e, field, setUploading) => {
    const file = e.target.files[0]; if (!file) return;

    const isPdf = field === "pdf_url";
    if (isPdf) {
      setPdfUploading(true);
      setPdfProgress(0);
      setPdfProgressInfo(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
    } else {
      setUploading(true);
    }

    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setForm(p => {
        const next = { ...p, [field]: file_url };
        // Auto-fill the title from the PDF filename if the title is still empty
        if (isPdf && !p.title) {
          const derived = file.name.replace(/\.pdf$/i, "").replace(/[-_+]+/g, " ").trim();
          if (derived) next.title = derived;
        }
        return next;
      });
      toast.success("تم رفع " + (isPdf ? "الملف" : "الغلاف") + " ✓");
    } catch (err) {
      toast.error("فشل الرفع: " + (err?.message || "خطأ غير معروف"));
    } finally {
      if (isPdf) {
        setPdfUploading(false);
        setPdfProgress(0);
        setPdfProgressInfo("");
        setPdfSpeed("");
      } else {
        setUploading(false);
      }
      e.target.value = "";
    }
  };

  const handleAutoUploadFromUrl = async (url) => {
    if (!url || (!url.startsWith("http://") && !url.startsWith("https://"))) return;
    if (url.includes("base44") || url.startsWith("blob:")) return;
    setPdfUploading(true);
    setPdfProgressInfo("جاري جلب ورفع الملف من الرابط...");
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch");
      const blob = await res.blob();
      const filename = url.split("/").pop().split("?")[0] || "book.pdf";
      const file = new File([blob], filename, { type: "application/pdf" });

      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setForm(p => ({
        ...p,
        pdf_url: file_url,
        title: p.title || titleFromPdfUrl(url)
      }));
      toast.success("تم جلب ورفع ملف PDF تلقائياً من الرابط ✓");
    } catch (err) {
      toast.info("تم حفظ الرابط المباشر (تعذر الجلب المباشر بسبب قيود CORS، الرابط يعمل مباشرة)");
      setForm(p => ({
        ...p,
        pdf_url: url,
        title: p.title || titleFromPdfUrl(url)
      }));
    } finally {
      setPdfUploading(false);
      setPdfProgressInfo("");
    }
  };

  const toggleSelect = (id) => setSelected(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id]);

  return (
    <div className="space-y-5" dir="rtl">
      {/* Header */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-black text-base">الكتب — <span className="text-primary">{books.length}</span></h2>
          <button onClick={loadBooks} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><RefreshCw className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="flex gap-2">
          {selected.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="rounded-xl gap-1.5">
              <Trash2 className="w-3.5 h-3.5" /> حذف ({selected.length})
            </Button>
          )}
          <Button onClick={openAdd} className="rounded-xl gap-1.5" size="sm">
            <BookPlus className="w-3.5 h-3.5" /> إضافة كتاب
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." className="pr-9 rounded-xl h-9" />
        </div>
        {["all","featured","pdf","no_pdf"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 whitespace-nowrap transition-all ${filter===f?"border-primary bg-primary/10 text-primary":"border-border text-muted-foreground hover:border-primary/30"}`}>
            {f==="all"?"الكل":f==="featured"?"⭐ مميز":f==="pdf"?"PDF ✓":"بدون PDF"}
          </button>
        ))}
      </div>

      {/* Book List */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading
          ? <div className="flex justify-center py-12"><div className="w-7 h-7 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>
          : <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
              {filtered.map(book => (
                <div key={book.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                  <input type="checkbox" checked={selected.includes(book.id)} onChange={() => toggleSelect(book.id)} className="rounded shrink-0" />
                  <div className="w-9 h-11 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0 border border-border">
                    {book.cover_image ? <img src={book.cover_image} alt="" className="w-full h-full object-cover" /> : <BookOpen className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{book.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{book.author} · {book.category}</p>
                    <div className="flex gap-1.5 mt-0.5">
                      {book.pdf_url && <span className="text-[10px] text-green-600">✓ PDF</span>}
                      {book.is_featured && <span className="text-[10px] text-amber-600">⭐ مميز</span>}
                      {book.status === "draft" && <span className="text-[10px] text-amber-500">مسودة</span>}
                      {book.status === "hidden" && <span className="text-[10px] text-red-500">مخفي</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(book)} className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"><Pencil className="w-3.5 h-3.5 text-primary" /></button>
                    <button onClick={() => handleDelete(book)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <p className="text-center text-sm text-muted-foreground py-10">لا توجد نتائج</p>}
            </div>
        }
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle>{editBook ? "تعديل الكتاب" : "إضافة كتاب جديد"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">العنوان *</Label><Input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} className="mt-1" /></div>
              <div><Label className="text-xs">المؤلف *</Label><Input value={form.author} onChange={e=>setForm(p=>({...p,author:e.target.value}))} className="mt-1" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">التصنيف</Label>
                <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} className="mt-1 w-full h-9 rounded-md border border-input bg-background text-foreground px-3 text-sm">
                  {categories.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <Label className="text-xs">الحالة</Label>
                <select value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))} className="mt-1 w-full h-9 rounded-md border border-input bg-background text-foreground px-3 text-sm">
                  {STATUS_OPTIONS.map(s=><option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div><Label className="text-xs">الصفحات</Label><Input type="number" value={form.pages_count} onChange={e=>setForm(p=>({...p,pages_count:e.target.value}))} className="mt-1" /></div>
            </div>
            <div><Label className="text-xs">الوصف</Label><Textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} rows={3} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">غلاف الكتاب</Label>
                <div className="flex items-center gap-3 mt-1">
                  <div className="w-12 h-16 rounded-lg bg-muted border border-border overflow-hidden flex items-center justify-center shrink-0">
                    {form.cover_image
                      ? <img src={form.cover_image} alt="غلاف" className="w-full h-full object-cover" />
                      : <BookOpen className="w-4 h-4 text-muted-foreground" />}
                  </div>
                  <label className="cursor-pointer flex-1">
                    <input type="file" accept="image/*" onChange={e=>uploadFile(e,"cover_image",setCoverUploading)} className="sr-only" />
                    <div className={`flex items-center justify-center gap-1 h-9 rounded-xl border-2 border-dashed transition-colors ${form.cover_image?"border-primary bg-primary/5":"border-border hover:border-primary/40"}`}>
                      {coverUploading ? <><div className="w-3 h-3 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /><span className="text-xs text-primary">جاري الرفع...</span></> : form.cover_image ? <><Check className="w-3.5 h-3.5 text-primary"/><span className="text-xs text-primary">تم الرفع</span></> : <><Upload className="w-3.5 h-3.5 text-muted-foreground"/><span className="text-xs text-muted-foreground">رفع غلاف</span></>}
                    </div>
                  </label>
                </div>
              </div>
              <div>
                <Label className="text-xs">ملف PDF</Label>
                <label className="cursor-pointer block mt-1">
                  <input type="file" accept=".pdf" onChange={e=>uploadFile(e,"pdf_url",setPdfUploading)} className="sr-only" />
                  <div className={`flex items-center justify-center gap-1 h-9 rounded-xl border-2 border-dashed transition-colors ${form.pdf_url?"border-primary bg-primary/5":"border-border hover:border-primary/40"}`}>
                    {pdfUploading
                      ? <><div className="w-3 h-3 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /><span className="text-xs text-primary tabular-nums">{pdfProgress}% · {pdfProgressInfo} · {pdfSpeed}</span></>
                      : form.pdf_url
                        ? <><Check className="w-3.5 h-3.5 text-primary"/><span className="text-xs text-primary">PDF ✓</span></>
                        : <><Upload className="w-3.5 h-3.5 text-muted-foreground"/><span className="text-xs text-muted-foreground">رفع PDF</span></>}
                  </div>
                  {pdfUploading && (
                    <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-300" style={{ width: `${pdfProgress}%` }} />
                    </div>
                  )}
                </label>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              <Input
                value={form.pdf_url}
                onChange={e=>{
                  const val = e.target.value;
                  setForm(p=>({...p, pdf_url:val, title: p.title || titleFromPdfUrl(val)}));
                }}
                onBlur={e=>{
                  const val = e.target.value.trim();
                  if (val && (val.startsWith("http://") || val.startsWith("https://")) && !val.includes("base44")) {
                    handleAutoUploadFromUrl(val);
                  }
                }}
                placeholder="أو رابط PDF مباشر — يُرفع تلقائياً ويُستخرج العنوان"
                className="text-xs h-8 flex-1"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!form.pdf_url || pdfUploading || form.pdf_url.startsWith("blob:") || form.pdf_url.includes("base44")}
                onClick={() => handleAutoUploadFromUrl(form.pdf_url)}
                className="text-xs h-8 shrink-0 gap-1 rounded-lg"
              >
                <Upload className="w-3.5 h-3.5" /> رفع تلقائي
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
              <Label className="text-sm cursor-pointer">كتاب مميز ⭐</Label>
              <Switch checked={form.is_featured} onCheckedChange={v=>setForm(p=>({...p,is_featured:v}))} />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl h-11 font-bold gap-2">
              {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>جاري الحفظ...</> : editBook ? "حفظ التعديلات" : "إضافة الكتاب"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}