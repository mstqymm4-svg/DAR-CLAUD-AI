import { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  Loader2,
  Mail,
  Send,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  KeyRound,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiUrl } from "@/lib/apiBase";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function EmailVerification({
  currentEmail = "",
  isVerified = false,
  onVerifiedSuccess,
  onCancel,
}) {
  const [email, setEmail] = useState(currentEmail || "");
  const [step, setStep] = useState("input"); // 'input' | 'otp' | 'success'
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const [lastGeneratedCode, setLastGeneratedCode] = useState("");
  const [isWrong, setIsWrong] = useState(false);

  const otpInputsRef = useRef([]);

  useEffect(() => {
    if (currentEmail && !isVerified) {
      setEmail(currentEmail);
    }
  }, [currentEmail, isVerified]);

  // Resend countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Auto focus first OTP input when reaching 'otp' step
  useEffect(() => {
    if (step === "otp" && otpInputsRef.current[0]) {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  // ───────────────────────────────────────────────────────────────────────────
  // Send OTP
  // ───────────────────────────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setIsWrong(false);

    const targetEmail = email.trim().toLowerCase();
    if (!targetEmail) {
      setErrorMsg("يرجى إدخال البريد الإلكتروني");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail)) {
      setErrorMsg("صيغة البريد الإلكتروني غير صحيحة، تأكد من كتابته بشكل سليم");
      return;
    }

    setSending(true);
    try {
      const res = await fetch(apiUrl("/api/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        const errorText = data.error || "تعذر إرسال رمز التحقق، يرجى المحاولة لاحقاً.";
        setErrorMsg(errorText);
        toast.error(errorText);
        if (data.retryAfter) {
          setCountdown(data.retryAfter);
        }
        return;
      }

      toast.success(data.message || `تم إرسال رمز التحقق إلى ${targetEmail}`);
      if (data.code) {
        setLastGeneratedCode(data.code);
        toast(`رمز التحقق السريع: ${data.code}`, {
          icon: "🔑",
          duration: 9000,
          action: {
            label: "تعبئة الرمز",
            onClick: () => handleFillCode(data.code),
          },
        });
      }
      setStep("otp");
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      setRemainingAttempts(5);
    } catch {
      setErrorMsg("تعذر الاتصال بالخادم، يرجى التحقق من اتصال الإنترنت.");
      toast.error("تعذر الاتصال بالخادم");
    } finally {
      setSending(false);
    }
  };

  const handleFillCode = (codeStr) => {
    if (!codeStr || codeStr.length !== 6) return;
    const digits = codeStr.split("");
    setOtp(digits);
    setIsWrong(false);
    setErrorMsg("");
    if (otpInputsRef.current[5]) {
      otpInputsRef.current[5].focus();
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Resend OTP
  // ───────────────────────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if ((countdown > 0 && remainingAttempts > 0) || sending) return;
    setErrorMsg("");
    setIsWrong(false);
    setSending(true);

    try {
      const targetEmail = email.trim().toLowerCase();
      const res = await fetch(apiUrl("/api/send-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = await res.json().catch(() => ({}));

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
      if (data.code) {
        setLastGeneratedCode(data.code);
        toast(`رمز التحقق الجديد: ${data.code}`, {
          icon: "🔑",
          duration: 9000,
          action: {
            label: "تعبئة الرمز",
            onClick: () => handleFillCode(data.code),
          },
        });
      }
      setCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      setRemainingAttempts(5);
      if (otpInputsRef.current[0]) otpInputsRef.current[0].focus();
    } catch {
      toast.error("فشل في إعادة إرسال الرمز");
    } finally {
      setSending(false);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // OTP Inputs handling
  // ───────────────────────────────────────────────────────────────────────────
  const handleDigitChange = (index, value) => {
    const cleaned = value.replace(/\D/g, "");
    const newOtp = [...otp];
    setIsWrong(false);
    setErrorMsg("");

    if (!cleaned) {
      newOtp[index] = "";
      setOtp(newOtp);
      return;
    }

    newOtp[index] = cleaned[cleaned.length - 1];
    setOtp(newOtp);

    // Auto advance
    if (cleaned && index < 5 && otpInputsRef.current[index + 1]) {
      otpInputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0 && otpInputsRef.current[index - 1]) {
        otpInputsRef.current[index - 1].focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (pasted.length > 0) {
      const digits = pasted.slice(0, 6).split("");
      const newOtp = [...otp];
      digits.forEach((d, i) => {
        if (i < 6) newOtp[i] = d;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(digits.length, 5);
      if (otpInputsRef.current[nextIndex]) {
        otpInputsRef.current[nextIndex].focus();
      }
    }
  };

  // ───────────────────────────────────────────────────────────────────────────
  // Verify OTP
  // ───────────────────────────────────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg("");
    setIsWrong(false);

    const fullCode = otp.join("");
    if (fullCode.length !== 6) {
      setErrorMsg("يرجى إدخال جميع أرقام الرمز الستة كاملة");
      setIsWrong(true);
      return;
    }

    const targetEmail = email.trim().toLowerCase();
    setVerifying(true);

    try {
      const res = await fetch(apiUrl("/api/verify-otp"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          otp: fullCode,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setIsWrong(true);
        const errorText = data.error || "رمز التحقق غير صحيح، يرجى التأكد وإعادة المحاولة";
        setErrorMsg(errorText);
        toast.error(errorText);

        const newRemaining = data.remainingAttempts !== undefined ? data.remainingAttempts : remainingAttempts - 1;
        setRemainingAttempts(Math.max(0, newRemaining));

        // Clear boxes on failure so user can re-type
        setOtp(["", "", "", "", "", ""]);
        if (otpInputsRef.current[0]) {
          otpInputsRef.current[0].focus();
        }
        return;
      }

      setStep("success");
      toast.success("تم التحقق من الرمز وتوثيق البريد بنجاح ✓");

      if (onVerifiedSuccess) {
        onVerifiedSuccess(targetEmail);
      }
    } catch {
      setErrorMsg("تعذر الاتصال بالخادم للتحقق من الرمز");
      toast.error("تعذر الاتصال بالخادم");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="rounded-2xl border border-primary/25 bg-gradient-to-b from-primary/[0.04] to-card p-4 sm:p-5 shadow-xs">
      <AnimatePresence mode="wait">
        {/* STEP 1: Enter Email to Send OTP */}
        {step === "input" && (
          <motion.div
            key="step-input"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-xs">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    ربط وتوثيق البريد الإلكتروني (رمز التحقق)
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    يتم إرسال رمز مكوّن من 6 أرقام لتأكيد الملكية وحماية بياناتك
                  </p>
                </div>
              </div>

              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
                  title="إلغاء"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <form onSubmit={handleSendOtp} className="space-y-3">
              <div className="relative">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMsg("");
                  }}
                  placeholder="أدخل بريدك الإلكتروني (مثل name@example.com)"
                  className="text-start h-11 rounded-xl bg-background pe-10 font-sans"
                  dir="ltr"
                  disabled={sending}
                />
                <Mail className="w-4 h-4 text-muted-foreground absolute end-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </motion.div>
              )}

              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  disabled={sending || !email.trim()}
                  className="flex-1 h-10 rounded-[4px_20px_4px_20px] font-bold text-xs gap-2 shadow-xs"
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري إرسال الرمز...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>إرسال رمز التحقق</span>
                    </>
                  )}
                </Button>

                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={sending}
                    className="rounded-[4px_20px_4px_20px] text-xs h-10 px-4"
                  >
                    إلغاء
                  </Button>
                )}
              </div>
            </form>
          </motion.div>
        )}

        {/* STEP 2: Enter 6-digit OTP */}
        {step === "otp" && (
          <motion.div
            key="step-otp"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 shadow-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <span>أدخل رمز التحقق (6 أرقام)</span>
                    {lastGeneratedCode && (
                      <button
                        type="button"
                        onClick={() => handleFillCode(lastGeneratedCode)}
                        className="text-[11px] text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1 transition-colors"
                        title="تعبئة الرمز التلقائي"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>تعبئة سريعة ({lastGeneratedCode})</span>
                      </button>
                    )}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                    <span>أُرسل إلى:</span>
                    <span dir="ltr" className="font-mono font-bold text-foreground">
                      {email}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setStep("input");
                        setErrorMsg("");
                        setIsWrong(false);
                      }}
                      className="text-primary hover:underline font-bold text-[11px] me-1"
                    >
                      (تعديل البريد)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 6 Digits Boxes */}
            <div
              className={`flex items-center justify-center gap-2 my-3 transition-transform ${
                isWrong ? "animate-shake" : ""
              }`}
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
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  disabled={verifying || remainingAttempts <= 0}
                  className={`w-10 sm:w-11 h-12 text-center text-xl font-bold rounded-xl border-2 bg-background transition-all ${
                    isWrong
                      ? "border-destructive bg-destructive/5 text-destructive focus:border-destructive"
                      : digit
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border text-foreground focus:border-primary focus:bg-primary/5"
                  } focus:outline-none`}
                />
              ))}
            </div>

            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="flex-1 font-medium">{errorMsg}</span>
              </motion.div>
            )}

            {/* Attempts badge & Timer */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground px-1 py-1 bg-muted/40 rounded-xl p-2.5 border border-border/50">
              {/* Attempt state */}
              <div className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-[11px] font-medium">عدد المحاولات:</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                    remainingAttempts >= 4
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : remainingAttempts >= 2
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      : remainingAttempts === 1
                      ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 animate-pulse"
                      : "bg-destructive/15 text-destructive border-destructive/30"
                  }`}
                >
                  {remainingAttempts > 0
                    ? `متبقي ${remainingAttempts} من 5`
                    : "استنفدت المحاولات"}
                </span>
              </div>

              {/* Countdown or Resend */}
              <div>
                {remainingAttempts <= 0 ? (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={sending}
                    className="text-primary font-bold hover:underline flex items-center gap-1 text-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${sending ? "animate-spin" : ""}`} />
                    <span>طلب رمز جديد الآن</span>
                  </button>
                ) : countdown > 0 ? (
                  <span className="flex items-center gap-1 text-[11px]">
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
                    disabled={sending}
                    className="text-primary font-bold hover:underline flex items-center gap-1 text-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${sending ? "animate-spin" : ""}`} />
                    <span>إعادة إرسال الرمز</span>
                  </button>
                )}
              </div>
            </div>

            {/* Actions */}
            {remainingAttempts > 0 ? (
              <Button
                type="button"
                onClick={handleVerifyOtp}
                disabled={verifying || otp.join("").length !== 6}
                className="w-full h-10 rounded-[4px_20px_4px_20px] font-bold text-xs gap-2 shadow-xs"
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري التحقق من الرمز...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>تأكيد الرمز وربط البريد بالحساب</span>
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleResendOtp}
                disabled={sending}
                variant="default"
                className="w-full h-10 rounded-[4px_20px_4px_20px] font-bold text-xs gap-2 shadow-xs"
              >
                <RefreshCw className="w-4 h-4" />
                <span>طلب رمز جديد وتصفير المحاولات</span>
              </Button>
            )}
          </motion.div>
        )}

        {/* STEP 3: Success Notification */}
        {step === "success" && (
          <motion.div
            key="step-success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-3 space-y-2.5"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs border border-emerald-500/20">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-foreground">
              تم توثيق البريد وربطه بنجاح!
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
              أصبح بريدك الإلكتروني (<span dir="ltr" className="font-mono font-bold text-foreground">{email}</span>) مرتبطاً بملفك الشخصي ومفعّلاً لكافة ميزات المزامنة السحابية.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
