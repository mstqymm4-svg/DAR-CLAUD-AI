import { useState, useEffect } from "react";
import { MessageCircle, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { getSetting, setSetting, onSaveStatus } from "@/lib/settingsStore";

const FIELDS = [
  { key: "contact_email", label: "البريد الإلكتروني للتواصل", placeholder: "support@example.com" },
  { key: "contact_phone", label: "رقم الهاتف", placeholder: "+966..." },
  { key: "contact_address", label: "العنوان", placeholder: "المدينة، الدولة" },
  { key: "whatsapp_url", label: "رابط واتساب", placeholder: "https://wa.me/..." },
  { key: "contact_telegram_url", label: "رابط تيليجرام", placeholder: "https://t.me/..." },
  { key: "contact_instagram_url", label: "رابط إنستغرام", placeholder: "https://instagram.com/..." },
];

export default function DevContactSettings() {
  const [, force] = useState(0);
  const [status, setStatus] = useState(getSetting("__status") || "idle");
  const [showForm, setShowForm] = useState(getSetting("contact_show_form") !== "false");
  const [intro, setIntro] = useState(getSetting("contact_intro") || "");

  useEffect(() => {
    const unsub = onSaveStatus((s) => setStatus(s));
    return unsub;
  }, []);

  const update = (key, value) => {
    setSetting(key, value);
    force((n) => n + 1);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-black">إدارة صفحة تواصل معنا</h2>
          <p className="text-xs text-muted-foreground">تحكم في قنوات التواصل والنموذج الظاهر للزوار</p>
        </div>
      </div>

      <div className="space-y-4 bg-card border border-border rounded-2xl p-5">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="text-sm font-medium text-foreground mb-1.5 block">{f.label}</label>
            <Input
              defaultValue={getSetting(f.key) || ""}
              placeholder={f.placeholder}
              onBlur={(e) => update(f.key, e.target.value)}
              className="w-full"
            />
          </div>
        ))}

        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">نص المقدمة</label>
          <Textarea
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            onBlur={(e) => update("contact_intro", e.target.value)}
            rows={3}
            placeholder="نص يظهر تحت العنوان في صفحة التواصل"
            className="w-full resize-none"
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border p-3">
          <div>
            <p className="text-sm font-medium">إظهار نموذج المراسلة</p>
            <p className="text-xs text-muted-foreground">عطّله إذا كنت تعتمد على القنوات فقط</p>
          </div>
          <Switch
            checked={showForm}
            onCheckedChange={(v) => { setShowForm(v); update("contact_show_form", String(v)); }}
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Save className="w-3.5 h-3.5" />
          <span>
            {status === "saving" ? "جارٍ الحفظ…" : status === "error" ? "تعذّر الحفظ — سنحاول مجددًا" : "يُحفظ تلقائيًا"}
          </span>
        </div>
      </div>
    </div>
  );
}