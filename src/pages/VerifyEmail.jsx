import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  Mail,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Lock,
  ArrowLeft,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { getAccountEmail, setAccountEmail } from "@/lib/activeUser";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Steps: 'email' | 'otp' | 'success'
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [remainingAttempts, setRemainingAttempts] = useState(5);

  const otpInputsRef = useRef([]);

  // Auto-fill active user email on mount if available
  useEffect(() => {
    const queryEmail = searchParams.get("email");
    if (queryEmail) {
      setEmail(queryEmail);
      return;
    }

    base44.auth
      .me()
      .then((u) => {
        const userEmail = getAccountEmail(u) || u?.email;
        if (userEmail) {
          setEmail(userEmail);
        }
      })
      .catch(() => {});
  }, [searchParams]);

  // Resend countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Focus first OTP input when entering OTP step
  useEffect(() => {
    if (step === "otp" && otpInputsRef.current[0]) {
      otpInputsRef.current[0].focus();
    }
  }, [step]);

  // ───────────────────────────────────────────────────────────────────────────
  // Handle Send OTP
  // ───────────────────────────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMsg("يرجى إدخال البريد الإلكتروني");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMsg("صيغة البريد الإلكتروني غير صحيحة");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorText = data.error || "حدث خطأ أثناء إرسال رمز التحقق";
        setErrorMsg(errorText);
        toast.error(errorText);
        if (data.retryAfter) {
          setCountdown(data.retryAfter);
        }
        return;
      }

      toast.success(data.message || "تم إرسال رمز التحقق بنجاح");
      if (data.code) {
        toast(`رمز التحقق: ${data.code}`, { icon: "🔑", duration: 8000 });
      }
      setStep("otp");
      setCountdown(60); // 60 seconds cooldown
      setOtp(["", "", "", "", "", ""]);
      setRemainingAttempts(5);
    } catch (err) {
      setErrorMsg("تعذر الاتصال بالخادم، يرجى المحاولة مرة أخرى.");
      toast.error("تعذر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Handle Resend OTP
  // ───────────────────────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (countdown > 0 || resending) return;
    setErrorMsg("");
    setResending(true);

    try {
      const res = await fetch("/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorText = data.error || "تعذر إعادة إرسال الرمز";
        setErrorMsg(errorText);
        toast.error(errorText);
        if (data.retryAfter) {
          setCountdown(data.retryAfter);
        }
        return;
      }

      toast.success("تم إرسال رمز تحقق جديد بنجاح ✓");
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      setRemainingAttempts(5);
      if (otpInputsRef.current[0]) otpInputsRef.current[0].focus();
    } catch (err) {
      toast.error("فشل في إعادة الإرسال");
    } finally {
      setResending(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Handle OTP Digit Input & Pasting
  // ───────────────────────────────────────────────────────────────────────────
  const handleOtpChange = (index, value) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, "");

    const newOtp = [...otp];
    if (cleaned.length > 1) {
      // User pasted multiple characters into a single box
      const digits = cleaned.slice(0, 6).split("");
      digits.forEach((d, i) => {
        newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(digits.length, 5);
      if (otpInputsRef.current[nextIndex]) {
        otpInputsRef.current[nextIndex].focus();
      }
      return;
    }

    newOtp[index] = cleaned;
    setOtp(newOtp);

    // Auto-advance to next input
    if (cleaned && index < 5 && otpInputsRef.current[index + 1]) {
      otpInputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace: clear and jump to previous input
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0 && otpInputsRef.current[index - 1]) {
        otpInputsRef.current[index - 1].focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").trim();
    const digits = pastedData.replace(/\D/g, "").slice(0, 6).split("");

    if (digits.length > 0) {
      const newOtp = ["", "", "", "", "", ""];
      digits.forEach((d, i) => {
        newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(digits.length, 5);
      if (otpInputsRef.current[nextIndex]) {
        otpInputsRef.current[nextIndex].focus();
      }
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Handle Verify OTP
  // ───────────────────────────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");

    const fullCode = otp.join("");
    if (fullCode.length !== 6) {
      setErrorMsg("يرجى إدخال جميع أرقام الرمز الستة");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: fullCode,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        const errorText = data.error || "رمز التحقق غير صحيح";
        setErrorMsg(errorText);
        toast.error(errorText);

        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
        }

        // If expired or exceeded, clear otp boxes
        if (errorText.includes("طلب رمز جديد")) {
          setOtp(["", "", "", "", "", ""]);
        }
        return;
      }

      // Link email and mark verified in localStorage, notify listeners
      const em = email.trim().toLowerCase();
      try {
        setAccountEmail(em);
        localStorage.setItem(`email_verified_${em}`, "1");
        window.dispatchEvent(new Event("dau-email-verified"));
        window.dispatchEvent(new Event("dau-email-change"));
      } catch (err) {}

      toast.success(data.message || "تم التحقق من البريد بنجاح ✓");
      setStep("success");
    } catch (err) {
      setErrorMsg("تعذر الاتصال بالخادم للتحقق من الرمز");
      toast.error("تعذر الاتصال بالخادم");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden"
      >
        {/* Top Decorative Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/settings"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
            <span>العودة للإعدادات</span>
          </Link>

          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
            دار العلوم
          </span>
        </div>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* STEP 1: Email Input                                                 */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {step === "email" && (
            <motion.div
              key="step-email"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.25 }}
            >
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <Mail className="w-7 h-7" />
                </div>
                <h1 className="text-xl font-bold text-foreground">
                  التحقق من البريد الإلكتروني
                </h1>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  أدخل بريدك الإلكتروني لاستلام رمز تحقق فوري (OTP) لحماية حسابك
                </p>
              </div>

              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    البريد الإلكتروني
                  </label>
                  <div className="relative group">
                    <Mail className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                      type="email"
                      dir="ltr"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      required
                      className="pr-10 h-11 rounded-xl bg-background border-border text-sm focus-visible:border-primary text-left"
                    />
                  </div>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/80 text-[11px] text-muted-foreground leading-relaxed flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    يُرسل الرمز مباشرة عبر خادم Gmail الرسمي لدار العلوم، وصالح للاستخدام لمدة 10 دقائق.
                  </span>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="w-full h-11 rounded-[4px_20px_4px_20px] font-bold text-sm gap-2 mt-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري إرسال الرمز...</span>
                    </>
                  ) : (
                    <>
                      <span>إرسال رمز التحقق</span>
                      <ArrowLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          )}

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* STEP 2: OTP Input (6 digits)                                      */}
          {/* ───────────────────────────────────────────────────────────────── */}
          {step === "otp" && (
            <motion.div
              key="step-otp"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.25 }}
            >
              <div className="text-center mb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3 shadow-xs">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h1 className="text-xl font-bold text-foreground">
                  أدخل رمز التحقق
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  تم إرسال رمز التحقق المكون من 6 أرقام إلى:
                </p>
                <div className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-lg bg-muted text-xs font-mono font-medium text-foreground">
                  <span dir="ltr">{email}</span>
                  <button
                    onClick={() => {
                      setStep("email");
                      setErrorMsg("");
                    }}
                    className="text-primary hover:underline font-sans text-[11px] mr-1"
                  >
                    (تعديل)
                  </button>
                </div>
              </div>

              <form onSubmit={handleVerifyOtp} className="space-y-5">
                {/* 6 Digit Inputs */}
                <div
                  className="flex items-center justify-center gap-2 sm:gap-2.5 my-2"
                  dir="ltr"
                  onPaste={handlePaste}
                >
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputsRef.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      disabled={loading}
                      className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border-2 border-border bg-background focus:border-primary focus:bg-primary/5 focus:outline-none transition-all duration-200"
                    />
                  ))}
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Resend Timer & Counter */}
                <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                  <div>
                    {countdown > 0 ? (
                      <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                        <span>إعادة الإرسال بعد:</span>
                        <span className="font-mono font-bold text-primary">
                          {Math.floor(countdown / 60)}:
                          {(countdown % 60).toString().padStart(2, "0")}
                        </span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={resending}
                        className="text-primary font-bold hover:underline flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
                        <span>إعادة إرسال الرمز</span>
                      </button>
                    )}
                  </div>

                  <span className="text-[11px] opacity-75">
                    صلاحية الرمز: 10 دقائق
                  </span>
                </div>

                <Button
                  type="submit"
                  disabled={loading || otp.join("").length !== 6}
                  className="w-full h-11 rounded-[4px_20px_4px_20px] font-bold text-sm gap-2"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري التحقق...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تأكيد الرمز</span>
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          )}

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* STEP 3: Success Screen                                            */}
          {/* ───────────────────────────────────────────────────────────────── */}
          {step === "success" && (
            <motion.div
              key="step-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="text-center py-4 space-y-4"
            >
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h1 className="text-xl font-bold text-foreground">
                  تم تأكيد البريد بنجاح!
                </h1>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  تم التحقق من بريدك الإلكتروني (<span dir="ltr" className="font-mono font-medium">{email}</span>) وأصبح حسابك مؤكداً ومحمياً.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 font-medium flex items-center justify-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>حسابك الآن يحمل شارة الحماية المعتمدة في دار العلوم</span>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => navigate("/settings")}
                  className="w-full h-11 rounded-[4px_20px_4px_20px] font-bold text-sm gap-2"
                >
                  <span>العودة إلى الإعدادات</span>
                  <ArrowLeft className="w-4 h-4 rtl:rotate-0 ltr:rotate-180" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
