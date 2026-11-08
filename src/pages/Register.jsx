import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Mail, Lock, Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { toast } from "sonner";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين، يرجى التأكد");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
      toast.success("تم إرسال رمز التحقق إلى بريدك الإلكتروني");
    } catch (err) {
      setError(err.message || "تعذر إنشاء الحساب، يرجى المحاولة لاحقاً");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      toast.success("تم التحقق من الحساب بنجاح!");
      window.location.href = safeReturnTo();
    } catch (err) {
      setError(err.message || "رمز التحقق غير صحيح، يرجى إعادة المحاولة");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast.success("تم إرسال رمز تحقق جديد إلى بريدك بنجاح");
    } catch (err) {
      setError(err.message || "تعذر إعادة إرسال الرمز");
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", safeReturnTo());
  };

  if (showOtp) {
    return (
      <AuthLayout
        icon={Mail}
        title="تأكيد البريد الإلكتروني"
        subtitle={`أرسلنا رمز التحقق المكون من 6 أرقام إلى ${email}`}
      >
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium">
            {error}
          </div>
        )}
        <div className="flex justify-center mb-6" dir="ltr">
          <InputOTP
            maxLength={6}
            value={otpCode}
            onChange={setOtpCode}
            autoFocus
            autoComplete="one-time-code"
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button
          className="w-full h-11 font-bold rounded-[4px_20px_4px_20px] shadow-xs"
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 ms-2 animate-spin" />
              <span>جاري التحقق...</span>
            </>
          ) : (
            <span>تأكيد الرمز والمتابعة</span>
          )}
        </Button>
        <p className="text-center text-xs text-muted-foreground mt-4">
          لم يصلك الرمز؟{" "}
          <button onClick={handleResend} className="text-primary font-bold hover:underline">
            إعادة إرسال الرمز
          </button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={UserPlus}
      title="إنشاء حساب جديد"
      subtitle="انضم إلى منصة دار العلوم للوصول إلى كافة الميزات"
      footer={
        <>
          لديك حساب بالفعل؟{" "}
          <Link
            to={"/login" + (safeReturnTo() !== "/" ? "?returnTo=" + encodeURIComponent(safeReturnTo()) : "")}
            className="text-primary font-bold hover:underline"
          >
            تسجيل الدخول
          </Link>
        </>
      }
    >
      <Button
        variant="outline"
        className="w-full h-12 text-sm font-bold mb-6 gap-2 rounded-xl"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-5 h-5 ms-1" />
        <span>المتابعة عبر Google</span>
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground font-medium">أو بالبريد</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-destructive/10 text-destructive text-xs font-medium">
          {error}
        </div>
      )}

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

        <div className="space-y-1.5 text-start">
          <Label htmlFor="password" className="text-xs font-bold">كلمة المرور</Label>
          <div className="relative">
            <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              <span>جاري إنشاء الحساب...</span>
            </>
          ) : (
            <span>إنشاء الحساب</span>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
