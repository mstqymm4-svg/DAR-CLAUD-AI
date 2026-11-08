import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, GripVertical, Upload, Save,
  Instagram, Facebook, Youtube, Globe, Mail, Link as LinkIcon,
} from "lucide-react";
import { WhatsAppIcon, TelegramIcon, XIcon } from "@/components/BrandIcons";

const CHANNEL_TYPES = [
  { value: "whatsapp",   label: "واتساب",   icon: WhatsAppIcon,  color: "text-green-500", bg: "bg-green-500/10" },
  { value: "instagram",  label: "إنستغرام",  icon: Instagram,     color: "text-pink-500", bg: "bg-pink-500/10" },
  { value: "facebook",   label: "فيسبوك",   icon: Facebook,      color: "text-blue-500", bg: "bg-blue-500/10" },
  { value: "telegram",   label: "تيليجرام",  icon: TelegramIcon,  color: "text-sky-500",  bg: "bg-sky-500/10" },
  { value: "youtube",    label: "يوتيوب",   icon: Youtube,       color: "text-red-500",  bg: "bg-red-500/10" },
  { value: "twitter",    label: "X",        icon: XIcon,          color: "text-gray-700 dark:text-gray-300", bg: "bg-gray-500/10" },
  { value: "website",    label: "موقع",      icon: Globe,         color: "text-indigo-500", bg: "bg-indigo-500/10" },
  { value: "email",      label: "بريد",      icon: Mail,          color: "text-amber-500", bg: "bg-amber-500/10" },
  { value: "custom",     label: "مخصص",      icon: LinkIcon,      color: "text-purple-500", bg: "bg-purple-500/10" },
];

export function getChannelTypeInfo(type) {
  return CHANNEL_TYPES.find((t) => t.value === type) || CHANNEL_TYPES[CHANNEL_TYPES.length - 1];
}

export default function DevSocialChannels() {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: "", channel_type: "whatsapp", url: "", icon_url: "",
    description: "", sort_order: 0, visible: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const data = await base44.entities.SocialChannel.list("sort_order", 200);
    setChannels(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.name || !form.url) { toast.error("أدخل الاسم والرابط"); return; }
    try {
      if (editing) {
        await base44.entities.SocialChannel.update(editing.id, form);
        toast.success("تم تحديث القناة");
      } else {
        await base44.entities.SocialChannel.create(form);
        toast.success("تمت إضافة القناة");
      }
      setShowForm(false); setEditing(null);
      setForm({ name: "", channel_type: "whatsapp", url: "", icon_url: "", description: "", sort_order: 0, visible: true });
      load();
    } catch (e) { toast.error("فشل الحفظ"); }
  };

  const handleEdit = (ch) => {
    setEditing(ch);
    setForm({
      name: ch.name, channel_type: ch.channel_type, url: ch.url,
      icon_url: ch.icon_url || "", description: ch.description || "",
      sort_order: ch.sort_order || 0, visible: ch.visible,
    });
    setShowForm(true);
  };

  const handleToggleVisible = async (ch) => {
    await base44.entities.SocialChannel.update(ch.id, { visible: !ch.visible });
    load();
  };

  const handleDelete = async (ch) => {
    if (!confirm(`حذف "${ch.name}"؟`)) return;
    await base44.entities.SocialChannel.delete(ch.id);
    toast.success("تم الحذف");
    load();
  };

  const handleUploadIcon = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      setForm((prev) => ({ ...prev, icon_url: file_url }));
      toast.success("تم رفع الصورة");
    } catch (e) { toast.error("فشل الرفع"); }
    setUploading(false);
  };

  const handleMove = async (ch, dir) => {
    const idx = channels.findIndex((c) => c.id === ch.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= channels.length) return;
    const swapCh = channels[swapIdx];
    await base44.entities.SocialChannel.update(ch.id, { sort_order: swapCh.sort_order });
    await base44.entities.SocialChannel.update(swapCh.id, { sort_order: ch.sort_order });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">قنوات التواصل الاجتماعي ({channels.length})</h3>
        <Button size="sm" onClick={() => {
          setEditing(null);
          setForm({ name: "", channel_type: "whatsapp", url: "", icon_url: "", description: "", sort_order: channels.length, visible: true });
          setShowForm(true);
        }}>
          <Plus className="w-4 h-4 ml-1" /> إضافة قناة
        </Button>
      </div>

      {showForm && (
        <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">اسم القناة</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="دار العلوم واتساب" className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">نوع القناة</Label>
              <Select value={form.channel_type} onValueChange={(v) => setForm({ ...form, channel_type: v })}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHANNEL_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">رابط القناة</Label>
            <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://..." className="h-9 text-sm" />
          </div>
          <div>
            <Label className="text-xs">صورة/أيقونة القناة</Label>
            <div className="flex items-center gap-2">
              {form.icon_url && <img src={form.icon_url} alt="icon" className="w-10 h-10 rounded-lg object-cover border border-border" />}
              <label className="cursor-pointer flex-1">
                <input type="file" accept="image/*" onChange={handleUploadIcon} className="hidden" />
                <div className="flex items-center justify-center gap-2 h-9 rounded-lg border-2 border-dashed border-border hover:border-primary/50 text-xs text-muted-foreground">
                  {uploading ? "جاري الرفع..." : <><Upload className="w-3.5 h-3.5" /> رفع صورة</>}
                </div>
              </label>
            </div>
          </div>
          <div>
            <Label className="text-xs">الوصف</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="وصف مختصر" className="text-sm min-h-[60px]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">ترتيب الظهور</Label>
              <Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                className="h-9 text-sm" />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch checked={form.visible} onCheckedChange={(v) => setForm({ ...form, visible: v })} />
              <Label className="text-xs">{form.visible ? "ظاهرة" : "مخفية"}</Label>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}><Save className="w-4 h-4 ml-1" /> حفظ</Button>
            <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setEditing(null); }}>إلغاء</Button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-center text-sm text-muted-foreground py-8">جاري التحميل...</p>
      ) : channels.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">لا توجد قنوات بعد</p>
      ) : (
        <div className="space-y-2">
          {channels.map((ch) => {
            const typeInfo = getChannelTypeInfo(ch.channel_type);
            const Icon = typeInfo.icon;
            return (
              <div key={ch.id} className={`flex items-center gap-3 bg-card border border-border rounded-xl p-3 ${!ch.visible ? "opacity-50" : ""}`}>
                <div className="flex flex-col">
                  <button onClick={() => handleMove(ch, -1)} className="text-muted-foreground hover:text-foreground"><GripVertical className="w-3 h-3" /></button>
                </div>
                <div className={`w-10 h-10 rounded-lg ${typeInfo.bg} flex items-center justify-center shrink-0`}>
                  {ch.icon_url
                    ? <img src={ch.icon_url} alt={ch.name} className="w-full h-full rounded-lg object-cover" />
                    : <Icon className={`w-5 h-5 ${typeInfo.color}`} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{ch.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{ch.url}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-muted text-muted-foreground">{typeInfo.label}</span>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleToggleVisible(ch)}>
                  {ch.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(ch)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDelete(ch)}>
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}