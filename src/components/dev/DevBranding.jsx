import { useState, useEffect } from "react";
import { uploads } from "@/lib/uploadFacade";
import { Image, Upload, Check, BookOpen, Youtube, ExternalLink, Sparkles, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getSetting, setSettings, setSetting, subscribeToSettings } from "@/lib/settingsStore";

export default function DevBranding() {
  const [logoUrl, setLogoUrl]       = useState(() => getSetting("logo_url"));
  const [appName, setAppName]       = useState(() => getSetting("app_name") || "المكتبة الدينية");
  const [appSubtitle, setAppSubtitle] = useState(() => getSetting("app_subtitle") || "نور العلم والمعرفة");
  const [youtubeUrl, setYoutubeUrl] = useState(() => getSetting("youtube_url"));
  const [youtubeLabel, setYoutubeLabel] = useState(() => getSetting("youtube_label") || "قناتنا على يوتيوب");
  const [youtubeSub, setYoutubeSub] = useState(() => getSetting("youtube_sub") || "تابعونا على قناتنا لمزيد من المحتوى الإسلامي");
  const [uploading, setUploading]   = useState(false);
  const [saved, setSaved]           = useState(false);

  useEffect(() => {
    const unsub = subscribeToSettings((s) => {
      setLogoUrl(s.logo_url || "");
      setAppName(s.app_name || "المكتبة الدينية");
      setAppSubtitle(s.app_subtitle || "نور العلم والمعرفة");
      setYoutubeUrl(s.youtube_url || "");
      setYoutubeLabel(s.youtube_label || "قناتنا على يوتيوب");
      setYoutubeSub(s.youtube_sub || "تابعونا على قناتنا لمزيد من المحتوى الإسلامي");
    });
    return unsub;
  }, []);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await uploads.upload({ file, kind: "misc" });
      setLogoUrl(file_url);
      setSetting("logo_url", file_url);
      toast.success("تم رفع الشعار ✓");
    } catch {
      toast.error("فشل رفع الشعار — حاول مرة أخرى");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = () => {
    setSettings({ app_name: appName, app_subtitle: appSubtitle, youtube_url: youtubeUrl, youtube_label: youtubeLabel, youtube_sub: youtubeSub });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast.success("تم حفظ الهوية البصرية ✓");
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Live Preview */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-bold text-sm mb-4 flex items-center gap-2"><Eye className="w-4 h-4 text-primary" /> معاينة الهيدر</h3>
        <div className="bg-background border border-border rounded-xl p-4 flex items-center gap-3 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center overflow-hidden shrink-0">
            {logoUrl ? <img src={logoUrl} alt="logo" className="w-full h-full object-cover" /> : <BookOpen className="w-6 h-6 text-primary-foreground" />}
          </div>
          <div>
            <p className="font-bold text-base leading-tight">{appName}</p>
            <p className="text-xs text-muted-foreground">{appSubtitle}</p>
          </div>
        </div>
      </div>

      {/* Logo Upload */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2"><Image className="w-4 h-4 text-primary" /> الشعار</h3>
        <div className="flex gap-4 items-start">
          <div className="w-20 h-20 rounded-2xl border-2 border-border bg-muted flex items-center justify-center overflow-hidden shrink-0">
            {logoUrl ? <img src={logoUrl} alt="logo" className="w-full h-full object-cover" /> : <BookOpen className="w-8 h-8 text-muted-foreground" />}
          </div>
          <div className="flex-1 space-y-2">
            <label className="cursor-pointer block">
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              <div className={`flex items-center justify-center gap-2 h-11 rounded-xl border-2 border-dashed transition-colors ${uploading?"border-primary":"border-border hover:border-primary/50"}`}>
                {uploading
                  ? <><div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" /><span className="text-sm text-muted-foreground">جاري الرفع...</span></>
                  : <><Upload className="w-4 h-4 text-muted-foreground" /><span className="text-sm text-muted-foreground">رفع شعار جديد</span></>}
              </div>
            </label>
            <Input value={logoUrl} onChange={e=>setLogoUrl(e.target.value)} onBlur={()=>setSetting("logo_url",logoUrl)} placeholder="أو أدخل رابط الصورة" className="text-xs h-9" dir="ltr" />
            {logoUrl && <button onClick={()=>{setLogoUrl(""); setSetting("logo_url","");}} className="text-xs text-destructive hover:underline">حذف الشعار</button>}
          </div>
        </div>
      </div>

      {/* App Name */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> اسم التطبيق</h3>
        <div>
          <Label className="text-xs">الاسم الرئيسي</Label>
          <Input value={appName} onChange={e=>setAppName(e.target.value)} className="mt-1.5" placeholder="المكتبة الدينية" />
        </div>
        <div>
          <Label className="text-xs">الوصف الفرعي</Label>
          <Input value={appSubtitle} onChange={e=>setAppSubtitle(e.target.value)} className="mt-1.5" placeholder="نور العلم والمعرفة" />
        </div>
      </div>

      {/* YouTube */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shrink-0">
            <Youtube className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-bold text-sm">إعدادات يوتيوب</h3>
        </div>
        <div>
          <Label className="text-xs">رابط القناة</Label>
          <div className="relative mt-1.5">
            <Youtube className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
            <Input value={youtubeUrl} onChange={e=>setYoutubeUrl(e.target.value)} className="pr-9" placeholder="https://youtube.com/@channel" dir="ltr" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">نص العنوان</Label><Input value={youtubeLabel} onChange={e=>setYoutubeLabel(e.target.value)} className="mt-1.5" /></div>
          <div><Label className="text-xs">نص الوصف</Label><Input value={youtubeSub} onChange={e=>setYoutubeSub(e.target.value)} className="mt-1.5" /></div>
        </div>
        {/* Preview */}
        {youtubeUrl && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200/50 dark:border-red-800/30">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shrink-0"><Youtube className="w-4 h-4 text-white" /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{youtubeLabel}</p>
              <p className="text-xs text-muted-foreground truncate">{youtubeSub}</p>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>
        )}
      </div>

      <Button onClick={handleSave} className={`w-full h-12 rounded-xl font-bold gap-2 transition-all ${saved?"bg-green-600 hover:bg-green-700":""}`}>
        {saved ? <><Check className="w-4 h-4" />تم الحفظ!</> : <><Image className="w-4 h-4" />حفظ الهوية البصرية</>}
      </Button>
    </div>
  );
}