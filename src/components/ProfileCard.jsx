import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Heart,
  Download,
  BookOpen,
  Loader2,
  Save,
  Activity,
  Eye,
  Lock,
  ShieldCheck,
  Mail,
  RefreshCw,
  Sparkles,
  Upload,
  Check,
  X,
  User,
  Trash2,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import EmailVerification from "@/components/EmailVerification";
import ProfileStatChip from "@/components/profile/ProfileStatChip";
import RecentReadsList from "@/components/profile/RecentReadsList";
import ProfileQuickLinks from "@/components/profile/ProfileQuickLinks";
import { AVATAR_PRESETS } from "@/lib/avatarPresets";
import { useT } from "@/lib/i18n";
import { toast } from "sonner";
import {
  getAccountEmail,
  setAccountEmail,
  getDownloadedBookIds,
  getAvatarUrl,
  setAvatarUrl,
  getWatchedVideoIds,
} from "@/lib/activeUser";
import { getFavoriteIds, getBook } from "@/lib/offlineSync";

const FULL_NAME_KEY = "dau_full_name";

const initials = (name, email) => {
  const src = (name || email || "").trim();
  return src ? src[0].toUpperCase() : "•";
};

export default function ProfileCard() {
  const t = useT();
  const fileRef = useRef(null);
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState(() => {
    try {
      return localStorage.getItem(FULL_NAME_KEY) || "";
    } catch {
      return "";
    }
  });

  const [linkedEmail, setLinkedEmail] = useState(() => getAccountEmail());
  const [avatar, setAvatar] = useState(() => getAvatarUrl(getAccountEmail()));
  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [stats, setStats] = useState({ favs: 0, dls: 0, reading: 0, watched: 0 });
  const [recentReads, setRecentReads] = useState([]);
  const [verified, setVerified] = useState(() => {
    const em = getAccountEmail();
    try {
      return !!em && localStorage.getItem(`email_verified_${em}`) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    load();
  }, []);

  // Listen for email verification events across the app
  useEffect(() => {
    const onVerified = () => {
      const em = getAccountEmail(user);
      if (em) {
        setLinkedEmail(em);
        try {
          setVerified(localStorage.getItem(`email_verified_${em}`) === "1");
        } catch {}
      }
    };
    const onAvatarChange = () => {
      const em = getAccountEmail(user);
      setAvatar(getAvatarUrl(em));
    };
    window.addEventListener("dau-email-verified", onVerified);
    window.addEventListener("dau-email-change", onVerified);
    window.addEventListener("dau-avatar-change", onAvatarChange);
    return () => {
      window.removeEventListener("dau-email-verified", onVerified);
      window.removeEventListener("dau-email-change", onVerified);
      window.removeEventListener("dau-avatar-change", onAvatarChange);
    };
  }, [user]);

  const load = async () => {
    const rawUser = await base44.auth.me().catch(() => null);
    const u =
      rawUser && typeof rawUser === "object" && (rawUser.email || rawUser.full_name)
        ? rawUser
        : null;
    setUser(u);

    let savedName = "";
    try {
      savedName = localStorage.getItem(FULL_NAME_KEY) || "";
    } catch {}
    const nameToUse = u?.full_name || savedName || "";
    if (nameToUse) setFullName(nameToUse);

    const em = getAccountEmail(u);
    if (em) {
      setLinkedEmail(em);
      setAvatar(getAvatarUrl(em));
      try {
        setVerified(localStorage.getItem(`email_verified_${em}`) === "1");
      } catch {
        setVerified(false);
      }
    }
    refreshStats(em);
    loadRecentReads();
  };

  const refreshStats = async (email) => {
    const favs = await getFavoriteIds(email).catch(() => []);
    let reading = 0;
    try {
      reading = Object.keys(localStorage).filter((k) => k.startsWith("lastpage_")).length;
    } catch {}
    setStats({
      favs: favs.length,
      dls: getDownloadedBookIds(email).length,
      reading,
      watched: getWatchedVideoIds(email).length,
    });
  };

  const loadRecentReads = async () => {
    try {
      const entries = Object.keys(localStorage)
        .filter((k) => k.startsWith("lastpage_"))
        .map((k) => {
          const id = k.slice("lastpage_".length);
          return {
            id,
            page: Number(localStorage.getItem(k)) || 1,
            ts: Number(localStorage.getItem(`lastts_${id}`)) || 0,
          };
        })
        .sort((a, b) => b.ts - a.ts)
        .slice(0, 3);
      const books = await Promise.all(entries.map((e) => getBook(e.id).catch(() => null)));
      setRecentReads(entries.map((e, i) => ({ ...e, book: books[i] })).filter((r) => r.book));
    } catch {}
  };

  // Select a preset avatar
  const handleSelectPreset = (preset) => {
    const em = getAccountEmail(user) || linkedEmail.trim();
    setAvatarUrl(em, preset.url);
    setAvatar(preset.url);
    try {
      localStorage.setItem("dau_active_avatar", preset.url);
    } catch {}
    window.dispatchEvent(new Event("dau-avatar-change"));
    setShowAvatarPicker(false);
    toast.success(`تم اختيار صورة: ${preset.label} ✓`);
  };

  // Reset to initials
  const handleResetAvatar = () => {
    const em = getAccountEmail(user) || linkedEmail.trim();
    setAvatarUrl(em, "");
    setAvatar("");
    try {
      localStorage.removeItem("dau_active_avatar");
    } catch {}
    window.dispatchEvent(new Event("dau-avatar-change"));
    setShowAvatarPicker(false);
    toast.success("تمت استعادة الصورة الرمزية الافتراضية ✓");
  };

  // Custom photo upload
  const handleAvatarPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    // Check size limit (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 5 ميجابايت");
      return;
    }

    setUploading(true);
    try {
      // Create a local data URL for instantaneous offline access
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const localDataUrl = uploadEvent.target?.result;
        if (typeof localDataUrl === "string") {
          const em = getAccountEmail(user) || linkedEmail.trim();
          setAvatarUrl(em, localDataUrl);
          setAvatar(localDataUrl);
          try {
            localStorage.setItem("dau_active_avatar", localDataUrl);
          } catch {}
          window.dispatchEvent(new Event("dau-avatar-change"));
          setShowAvatarPicker(false);
          toast.success("تم تحديث صورتك الشخصية بنجاح ✓");
        }
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("تعذر تحميل الصورة، يرجى المحاولة مرة أخرى");
    } finally {
      setUploading(false);
    }
  };

  // Save Full Name
  const handleSaveName = async () => {
    const trimmed = fullName.trim();
    if (!trimmed) {
      toast.error("يرجى إدخال اسمك أولاً");
      return;
    }
    setSavingName(true);
    try {
      try {
        localStorage.setItem(FULL_NAME_KEY, trimmed);
      } catch {}
      base44.auth.updateMe({ full_name: trimmed }).catch(() => {});
      toast.success("تم حفظ الاسم بنجاح ✓");
    } finally {
      setSavingName(false);
    }
  };

  // Successful OTP verification callback: links email to profile
  const handleVerifiedSuccess = async (verifiedEmail) => {
    const prev = getAccountEmail(user);
    if (prev && prev !== verifiedEmail) {
      const av = getAvatarUrl(prev);
      if (av) setAvatarUrl(verifiedEmail, av);
    }

    setAccountEmail(verifiedEmail);
    setLinkedEmail(verifiedEmail);
    try {
      localStorage.setItem(`email_verified_${verifiedEmail}`, "1");
    } catch {}

    setVerified(true);
    setIsChangingEmail(false);

    base44.auth.updateMe({ email: verifiedEmail }).catch(() => {});

    try {
      window.dispatchEvent(new Event("dau-email-verified"));
      window.dispatchEvent(new Event("dau-email-change"));
    } catch {}

    await refreshStats(verifiedEmail);
    toast.success("تم ربط البريد الإلكتروني وتوثيق الحساب بنجاح ✓");
  };

  // Permanently close the account and wipe the user's stored data
  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await base44.functions.invoke("deleteAccountRequest", {});
    } catch (err) {
      setDeletingAccount(false);
      toast.error(t.deleteRequestFailed);
      return;
    }
    try {
      const prefixes = ["dau_", "lastpage_", "lastts_", "email_verified_"];
      Object.keys(localStorage)
        .filter((k) => prefixes.some((p) => k.startsWith(p)))
        .forEach((k) => localStorage.removeItem(k));
    } catch {}
    toast.success(t.deleteRequestSent);
    try {
      await base44.auth.logout("/");
    } catch {}
    window.location.replace("/");
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
      {/* Banner */}
      <div className="h-32 bg-gradient-to-l from-primary/35 via-primary/15 to-accent/20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_80%_20%,hsl(var(--accent)/0.4),transparent_60%)]" />
        <div className="absolute -bottom-8 -start-8 w-32 h-32 rounded-full bg-primary/10" />
        <div className="absolute top-3 end-10 w-14 h-14 rounded-full border-[3px] border-foreground/10" />
        <div className="absolute top-6 start-16 w-2 h-2 rounded-full bg-accent/50" />
        <div className="absolute bottom-4 end-1/3 w-1.5 h-1.5 rounded-full bg-primary/30" />
      </div>

      {/* Avatar + identity */}
      <div className="px-5 sm:px-6 -mt-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div className="relative self-start group">
            <div className="p-[3px] rounded-full bg-gradient-to-br from-primary via-accent to-primary shadow-lg">
              <div
                onClick={() => setShowAvatarPicker(true)}
                className="w-20 h-20 rounded-full ring-2 ring-card bg-primary/10 overflow-hidden flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-95"
                title="اضغط لتغيير الصورة الشخصية"
              >
                {avatar ? (
                  <img src={avatar} alt="الصورة الشخصية" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-black text-primary">
                    {initials(fullName, linkedEmail)}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setShowAvatarPicker(true)}
              disabled={uploading}
              title="تغيير الصورة الشخصية"
              className="absolute bottom-0 -end-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="pb-1 min-w-0 sm:text-end">
            <div className="flex items-center gap-1.5 sm:justify-end">
              <p className="font-bold text-base text-foreground truncate">
                {fullName || "مستخدم دار العلوم"}
              </p>
              {verified ? (
                <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>حساب موثّق</span>
                </span>
              ) : (
                <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/12 text-amber-600 dark:text-amber-400 text-[11px] font-bold border border-amber-500/20">
                  <span>غير موثّق</span>
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5" dir="ltr">
              {linkedEmail || "لا يوجد بريد إلكتروني مرتبط"}
            </p>
          </div>
        </div>
      </div>

      {/* Avatar Picker Modal */}
      <AnimatePresence>
        {showAvatarPicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-5 sm:px-6 pt-5 overflow-hidden"
          >
            <div className="p-4 rounded-2xl bg-muted/40 border border-primary/20 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-bold text-foreground">
                    اختر صورتك الشخصية
                  </h4>
                </div>
                <button
                  onClick={() => setShowAvatarPicker(false)}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Predefined Islamic Presets */}
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                {AVATAR_PRESETS.map((p) => {
                  const isSelected = avatar === p.url;
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all relative ${
                        isSelected
                          ? "border-primary bg-primary/10 shadow-xs scale-105"
                          : "border-border/60 hover:border-primary/40 hover:bg-card"
                      }`}
                    >
                      <img src={p.url} alt={p.label} className="w-11 h-11 rounded-full shadow-xs" />
                      <span className="text-[10px] font-medium text-foreground truncate w-full text-center">
                        {p.label}
                      </span>
                      {isSelected && (
                        <div className="absolute top-1 end-1 w-3.5 h-3.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Upload file or Reset */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarPick}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  className="rounded-[4px_20px_4px_20px] text-xs h-9 gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>رفع صورة من جهازك</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetAvatar}
                  className="rounded-[4px_20px_4px_20px] text-xs h-9 gap-1.5 text-muted-foreground hover:text-foreground"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>استعادة الحرف الأول الافتراضي</span>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Form Fields */}
      <div className="px-5 sm:px-6 pt-5 space-y-5">
        {/* Full Name */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold">{t.fullName}</Label>
          <div className="flex gap-2">
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="اكتب اسمك الكامل هنا..."
              className="rounded-xl bg-background text-sm font-medium"
            />
            <Button
              onClick={handleSaveName}
              disabled={savingName}
              className="gap-1.5 rounded-[4px_20px_4px_20px] shrink-0 text-xs px-4 shadow-xs"
            >
              {savingName ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>حفظ الاسم</span>
            </Button>
          </div>
        </div>

        {/* Linked Email Section */}
        <div className="space-y-2 pt-2 border-t border-border/60">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-primary" />
              <span>البريد الإلكتروني الموثق للحساب</span>
            </Label>
            {verified && !isChangingEmail && (
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>موثّق برمز تحقق OTP</span>
              </span>
            )}
          </div>

          {verified && !isChangingEmail ? (
            <div className="p-3.5 rounded-2xl bg-emerald-500/[0.05] border border-emerald-500/20 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate font-mono" dir="ltr">
                      {linkedEmail}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      مرتبط بالملف الشخصي وتعمل معه كافة ميزات المزامنة السحابية
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsChangingEmail(true)}
                  className="rounded-[4px_20px_4px_20px] text-xs h-8 px-3 shrink-0 gap-1.5 shadow-2xs"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>تغيير البريد</span>
                </Button>
              </div>
            </div>
          ) : (
            <EmailVerification
              currentEmail={linkedEmail}
              isVerified={verified}
              onVerifiedSuccess={handleVerifiedSuccess}
              onCancel={verified ? () => setIsChangingEmail(false) : null}
            />
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="px-5 sm:px-6 pt-6">
        <h3 className="flex items-center gap-2 text-sm font-bold text-foreground mb-3">
          <Activity className="w-4 h-4 text-primary" /> {t.myActivity}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <ProfileStatChip
            icon={<Heart className="w-4 h-4" />}
            value={stats.favs}
            label={t.accFavorites}
            tone="accent"
            delay={0}
          />
          <ProfileStatChip
            icon={<Download className="w-4 h-4" />}
            value={stats.dls}
            label={t.accOfflineBooks}
            tone="primary"
            delay={0.05}
          />
          <ProfileStatChip
            icon={<BookOpen className="w-4 h-4" />}
            value={stats.reading}
            label={t.booksRead}
            tone="success"
            delay={0.1}
          />
          <ProfileStatChip
            icon={<Eye className="w-4 h-4" />}
            value={stats.watched}
            label={t.watchedVideos}
            tone="muted"
            delay={0.15}
          />
        </div>
      </div>

      {/* Quick links */}
      <div className="px-5 sm:px-6 pt-4">
        <ProfileQuickLinks />
      </div>

      {/* Close account */}
      <div className="px-5 sm:px-6 pb-6 pt-5">
        <div className="p-4 rounded-2xl border border-destructive/25 bg-destructive/[0.04] space-y-3">
          <div className="flex items-start gap-2.5">
            <Trash2 className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-destructive">{t.deleteAccount}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                {t.deleteAccountSub}
              </p>
            </div>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={deletingAccount}
                className="gap-1.5 rounded-[4px_20px_4px_20px] text-xs h-9 shadow-2xs"
              >
                {deletingAccount ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{t.deleteAccount}</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t.deleteAccountConfirm}</AlertDialogTitle>
                <AlertDialogDescription>{t.deleteAccountWarning}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteAccount}>
                  {t.deletePermanently}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Recent reads */}
      {recentReads.length > 0 && (
        <div className="px-5 sm:px-6 pt-5 pb-6">
          <h3 className="flex items-center gap-2 text-sm font-bold text-foreground mb-3">
            <BookOpen className="w-4 h-4 text-primary" /> {t.lastRead}
          </h3>
          <RecentReadsList items={recentReads} />
        </div>
      )}
      {recentReads.length === 0 && <div className="pb-6" />}
    </div>
  );
}