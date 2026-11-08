import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, BookOpen, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import PageLogoLoader from "@/components/PageLogoLoader";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

const categoryOptions = [
  "القرآن وعلومه",
  "الحديث الشريف",
  "الفقه الإسلامي",
  "السيرة النبوية",
  "العقيدة",
  "التزكية والرقائق",
  "التاريخ الإسلامي",
  "أخرى",
];

const emptyBook = {
  title: "",
  author: "",
  category: "القرآن وعلومه",
  description: "",
  cover_image: "",
  pages_count: "",
  language: "اورد",
  pdf_url: "",
  is_featured: false,
  rating: 0,
};

export default function Admin() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [form, setForm] = useState(emptyBook);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    const allBooks = await base44.entities.Book.list('-created_date', 1000);
    setBooks(allBooks);
    setLoading(false);
  };

  const openCreate = () => {
    setEditingBook(null);
    setForm(emptyBook);
    setDialogOpen(true);
  };

  const openEdit = (book) => {
    setEditingBook(book);
    setForm({
      title: book.title || "",
      author: book.author || "",
      category: book.category || "القرآن وعلومه",
      description: book.description || "",
      cover_image: book.cover_image || "",
      pages_count: book.pages_count || "",
      language: book.language || "اورد",
      pdf_url: book.pdf_url || "",
      is_featured: book.is_featured || false,
      rating: book.rating || 0,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.author || !form.category) {
      toast.error("يرجى ملء الحقول المطلوبة");
      return;
    }
    setSaving(true);
    const data = {
      ...form,
      pages_count: form.pages_count ? Number(form.pages_count) : null,
      rating: Number(form.rating) || 0,
    };

    if (editingBook) {
      await base44.entities.Book.update(editingBook.id, data);
      toast.success("تم تحديث الكتاب");
    } else {
      await base44.entities.Book.create(data);
      toast.success("تمت إضافة الكتاب");
    }

    setDialogOpen(false);
    setSaving(false);
    loadBooks();
  };

  const handleDelete = async (book) => {
    if (!confirm(`هل أنت متأكد من حذف "${book.title}"؟`)) return;
    await base44.entities.Book.delete(book.id);
    toast.success("تم حذف الكتاب");
    loadBooks();
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (type === "cover") setUploadingCover(true);
    else setUploadingPdf(true);

    const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
    
    if (type === "cover") {
      setForm((prev) => ({ ...prev, cover_image: file_url }));
      setUploadingCover(false);
    } else {
      setForm((prev) => ({ ...prev, pdf_url: file_url }));
      setUploadingPdf(false);
    }
  };

  if (loading) {
    return (
      <PageLogoLoader />
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">إدارة الكتب</h1>
          <p className="text-sm text-muted-foreground mt-1">{books.length} كتاب في المكتبة</p>
        </div>
        <Button onClick={openCreate} className="gap-2 rounded-xl">
          <Plus className="w-4 h-4" />
          إضافة كتاب
        </Button>
      </div>

      {/* Books Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {books.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">لا توجد كتب بعد</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {books.map((book) => (
              <div key={book.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                <div className="w-12 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                  {book.cover_image ? (
                    <img src={book.cover_image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm text-foreground truncate">{book.title}</h3>
                  <p className="text-xs text-muted-foreground">{book.author} · {book.category}</p>
                </div>
                {book.is_featured && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground font-medium shrink-0">
                    مميز
                  </span>
                )}
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(book)}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Pencil className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleDelete(book)}
                    className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editingBook ? "تعديل الكتاب" : "إضافة كتاب جديد"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>عنوان الكتاب *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="أدخل عنوان الكتاب"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>المؤلف *</Label>
              <Input
                value={form.author}
                onChange={(e) => setForm((p) => ({ ...p, author: e.target.value }))}
                placeholder="أدخل اسم المؤلف"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>التصنيف *</Label>
              <Select value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>الوصف</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="أدخل وصف الكتاب"
                rows={4}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>صورة الغلاف</Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  value={form.cover_image}
                  onChange={(e) => setForm((p) => ({ ...p, cover_image: e.target.value }))}
                  placeholder="رابط الصورة أو ارفع ملف"
                  className="flex-1"
                />
                <label className="shrink-0">
                  <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "cover")} className="hidden" />
                  <Button type="button" variant="outline" size="icon" className="cursor-pointer" asChild>
                    <span>{uploadingCover ? <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}</span>
                  </Button>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>عدد الصفحات</Label>
                <Input
                  type="number"
                  value={form.pages_count}
                  onChange={(e) => setForm((p) => ({ ...p, pages_count: e.target.value }))}
                  placeholder="0"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>التقييم (0-5)</Label>
                <Input
                  type="number"
                  min={0}
                  max={5}
                  step={0.5}
                  value={form.rating}
                  onChange={(e) => setForm((p) => ({ ...p, rating: e.target.value }))}
                  className="mt-1.5"
                />
              </div>
            </div>
            <div>
              <Label>اللغة</Label>
              <Select value={form.language} onValueChange={(v) => setForm((p) => ({ ...p, language: v }))}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["العربية", "الإنجليزية", "الفرنسية", "الأوردو", "أخرى"].map((lang) => (
                    <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>رابط PDF</Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  value={form.pdf_url}
                  onChange={(e) => setForm((p) => ({ ...p, pdf_url: e.target.value }))}
                  placeholder="رابط ملف PDF أو ارفع ملف"
                  className="flex-1"
                />
                <label className="shrink-0">
                  <input type="file" accept=".pdf" onChange={(e) => handleFileUpload(e, "pdf")} className="hidden" />
                  <Button type="button" variant="outline" size="icon" className="cursor-pointer" asChild>
                    <span>{uploadingPdf ? <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}</span>
                  </Button>
                </label>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>كتاب مميز</Label>
              <Switch
                checked={form.is_featured}
                onCheckedChange={(v) => setForm((p) => ({ ...p, is_featured: v }))}
              />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full h-12 rounded-xl font-bold">
              {saving ? "جاري الحفظ..." : editingBook ? "تحديث الكتاب" : "إضافة الكتاب"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}