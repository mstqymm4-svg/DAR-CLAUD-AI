import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email);
    } catch {
      // Always show success
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <AuthLayout
      icon={Mail}
      title="استعادة كلمة المرور"
      subtitle="أدخل بريدك الإلكتروني وسنرسل لك رابطاً لاستعادة حسابك"
      footer={
        <Link to="/login" className="text-primary font-bold hover:underline inline-flex items-center gap-1">
          <ArrowRight className="w-3.5 h-3.5" />
          <span>العودة لتسجيل الدخول</span>
        </Link>
      }
    >
      {sent ? (
        <div className="text-center py-4 space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <p className="text-sm text-foreground font-medium">
            إذا كان هناك حساب مرتبط بهذا البريد، فستصلك تعليمات استعادة كلمة المرور في غضون دقائق.
          </p>
          <p className="text-xs text-muted-foreground" dir="ltr">
            {email}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 text-start">
            <Label htmlFor="email" className="text-xs font-bold">البريد الإلكتروني</Label>
            <div className="relative">
              <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                autoFocus
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                <span>جاري إرسال الرابط...</span>
              </>
            ) : (
              <span>إرسال رابط الاستعادة</span>
            )}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
