import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { safeReturnTo } from "@/lib/authReturnTo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const returnTo = safeReturnTo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = returnTo;
    } catch (err) {
      setError(err.message || "البريد الإلكتروني أو كلمة المرور غير صحيحة");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", returnTo);
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="مرحباً بعودتك"
      subtitle="تسجيل الدخول إلى حسابك في دار العلوم"
      footer={
        <>
          ليس لديك حساب بعد؟{" "}
          <Link
            to={"/register" + (returnTo !== "/" ? "?returnTo=" + encodeURIComponent(returnTo) : "")}
            className="text-primary font-bold hover:underline"
          >
            إنشاء حساب جديد
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
          <span className="bg-card px-3 text-muted-foreground font-medium">أو عبر البريد</span>
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-bold">كلمة المرور</Label>
            <Link to="/forgot-password" className="text-xs text-primary font-bold hover:underline">
              نسيت كلمة المرور؟
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" aria-hidden="true" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              <span>جاري تسجيل الدخول...</span>
            </>
          ) : (
            <span>تسجيل الدخول</span>
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}
