import { useState } from "react";
import { Shield, KeyRound, Check, Eye, EyeOff, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const DEV_PASSWORD_KEY = "dev_panel_password";
const DEFAULT_PASSWORD = "42891";
const getPassword = () => { try { return localStorage.getItem(DEV_PASSWORD_KEY) || DEFAULT_PASSWORD; } catch(e) { return DEFAULT_PASSWORD; } };

export default function DevSecurity() {
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd]         = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [saved, setSaved]             = useState(false);

  const handleChange = () => {
    if (currentPwd !== getPassword()) { toast.error("كلمة المرور الحالية خاطئة"); return; }
    if (newPwd.length < 4)            { toast.error("كلمة المرور قصيرة (4 أحرف على الأقل)"); return; }
    if (newPwd !== confirmPwd)        { toast.error("كلمتا المرور غير متطابقتين"); return; }
    try { localStorage.setItem(DEV_PASSWORD_KEY, newPwd); } catch(e) {}
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    toast.success("تم تغيير كلمة المرور بنجاح ✓");
    setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
  };

  return (
    <div className="space-y-5" dir="rtl">
      {/* Status */}
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
          <Shield className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p className="font-bold text-sm text-green-800 dark:text-green-300">اللوحة محمية بكلمة مرور</p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">لا يمكن الوصول بدون كلمة المرور الصحيحة</p>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-sm flex items-center gap-2"><KeyRound className="w-4 h-4 text-primary" /> تغيير كلمة مرور اللوحة</h3>
        
        <div>
          <Label className="text-xs">كلمة المرور الحالية</Label>
          <div className="relative mt-1.5">
            <Input type={showCurrent?"text":"password"} value={currentPwd} onChange={e=>setCurrentPwd(e.target.value)} className="pl-10" />
            <button onClick={()=>setShowCurrent(!showCurrent)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <Label className="text-xs">كلمة المرور الجديدة</Label>
          <div className="relative mt-1.5">
            <Input type={showNew?"text":"password"} value={newPwd} onChange={e=>setNewPwd(e.target.value)} className="pl-10" />
            <button onClick={()=>setShowNew(!showNew)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {newPwd.length > 0 && (
            <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full transition-all ${newPwd.length < 6 ? "w-1/3 bg-red-500" : newPwd.length < 10 ? "w-2/3 bg-amber-500" : "w-full bg-green-500"}`} />
            </div>
          )}
        </div>

        <div>
          <Label className="text-xs">تأكيد كلمة المرور الجديدة</Label>
          <Input type="password" value={confirmPwd} onChange={e=>setConfirmPwd(e.target.value)} className="mt-1.5" />
          {confirmPwd && newPwd !== confirmPwd && <p className="text-xs text-destructive mt-1">كلمتا المرور غير متطابقتين</p>}
        </div>

        <Button onClick={handleChange} className={`w-full rounded-xl h-11 font-bold gap-2 transition-all ${saved?"bg-green-600 hover:bg-green-700":""}`}>
          {saved ? <><Check className="w-4 h-4" />تم التغيير!</> : <><KeyRound className="w-4 h-4" />تغيير كلمة المرور</>}
        </Button>
      </div>

      {/* Tips */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
        <h3 className="font-bold text-sm flex items-center gap-2"><Lock className="w-4 h-4 text-primary" /> نصائح الأمان</h3>
        {[
          "استخدم كلمة مرور قوية تحتوي على أرقام وحروف",
          "لا تشارك كلمة المرور مع أحد",
          "غيّر كلمة المرور بانتظام",
          "اقفل اللوحة عند الانتهاء من العمل",
        ].map((tip, i) => (
          <p key={i} className="text-xs text-muted-foreground flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span> {tip}
          </p>
        ))}
      </div>
    </div>
  );
}