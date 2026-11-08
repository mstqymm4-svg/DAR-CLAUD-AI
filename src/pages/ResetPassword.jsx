import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, Loader2, AlertTriangle } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { toast } from "sonner";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("oobCode") || searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين، يرجى التأكد");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken, newPassword });
      toast.success("تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.");
      window.location.href = "/login";
    } catch (err) {
      setError(err.message || "تعذر إعادة تعيين كلمة المرور، قد يكون الرابط منتهي الصلاحية");
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <AuthLayout
        icon={AlertTriangle}
        title="رابط الاستعادة غير صالح"
        subtitle="يبدو أن رابط استعادة كلمة المرور غير مكتمل أو منتهي الصلاحية"
        footer={
          <Link to="/forgot-password" className="text-primary font-bold hover:underline">
            طلب رابط استعادة جديد
          </Link>
        }
      >
        <p className="text-xs text-foreground text-center leading-relaxed">
          يرجى طلب رابط استعادة جديد من صفحة استعادة كلمة المرور.
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Lock}
      title="كلمة مرور جديدة"
      subtitle="أدخل كلمة المرور الجديدة الخاصة بحسابك"
    >
      {error && (
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5 text-start">
          <Label htmlFor="password" className="text-xs font-bold">كلمة المرور الجديدة</Label>
          <div className="relative">
            <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              autoFocus
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="ps-10 h-11 rounded-xl"
              dir="ltr"
              required
            />
          </div>
        </div>
        <div className="space-y-1.5 text-start">
          <Label htmlFor="confirm" className="text-xs font-bold">تأكيد كلمة المرور</Label>
          <div className="relative">
            <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="ps-10 h-11 rounded-xl"
              dir="ltr"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full h-11 font-bold rounded-[4px_20px_4px_20px] shadow-xs" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 ms-2 animate-spin" />
              <span>جاري الحفظ...</span>
            </>
          ) : (
            <span>حفظ كلمة المرور الجديدة</span>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
