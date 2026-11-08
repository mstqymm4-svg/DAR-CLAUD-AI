import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Bell,
  Moon,
  Sun,
  Globe,
  LogOut,
  Save,
  Languages,
  Info,
  Mail,
  ShieldCheck,
  AlertCircle,
  Lock,
  User,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MobileSelect } from "@/components/ui/mobile-select";
import SettingRow from "@/components/SettingRow";
import ProfileCard from "@/components/ProfileCard";
import SettingsCard from "@/components/settings/SettingsCard";
import MobileHeader from "@/components/MobileHeader";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { useT } from "@/lib/i18n";
import { bookLangLabel, BOOK_LANG_VALUES } from "@/lib/i18n-terms";
import { getAccountEmail } from "@/lib/activeUser";
import { setThemeMode, getThemeState, subscribeToTheme } from "@/lib/themeEngine";
import { PageSpinner } from "@/components/Skeleton";

const ls = {
  get: (k, fb = "") => {
    try {
      return localStorage.getItem(k) || fb;
    } catch (e) {
      return fb;
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch (e) {}
  },
};

const GroupLabel = ({ children }) => (
  <p className="px-1 pt-1 text-[11px] font-bold text-muted-foreground">{children}</p>
);

export default function Settings() {
  const t = useT();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [darkMode, setDarkMode] = useState(() => getThemeState().isDark);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState("العربية");
  const [appLang, setAppLang] = useState(() => ls.get("dev_app_lang", "ar"));
  const [verified, setVerified] = useState(false);

  // Accordion state: every card is collapsed by default, opens only on click
  const [openSections, setOpenSections] = useState({
    profile: false,
    appearance: false,
    preferences: false,
    appLang: false,
    security: false,
    about: false,
    danger: false,
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const expandAll = () => {
    setOpenSections({
      profile: true,
      appearance: true,
      preferences: true,
      appLang: true,
      security: true,
      about: true,
      danger: true,
    });
  };

  const collapseAll = () => {
    setOpenSections({
      profile: false,
      appearance: false,
      preferences: false,
      appLang: false,
      security: false,
      about: false,
      danger: false,
    });
  };

  const isAllOpen = Object.values(openSections).every(Boolean);
  const isAllClosed = Object.values(openSections).every((v) => !v);

  useEffect(() => {
    loadUser();
    const unsub = subscribeToTheme(({ isDark }) => setDarkMode(isDark));
    const onVerified = () => {
      const em = getAccountEmail();
      try {
        setVerified(!!em && localStorage.getItem(`email_verified_${em}`) === "1");
      } catch {}
    };
    window.addEventListener("dau-email-verified", onVerified);
    return () => {
      unsub();
      window.removeEventListener("dau-email-verified", onVerified);
    };
  }, []);

  const loadUser = async () => {
    const u = await base44.auth.me().catch(() => null);
    if (u) {
      setNotifications(u.notifications_enabled ?? true);
      setLanguage(u.preferred_language || "العربية");
    }
    const em = getAccountEmail(u) || u?.email;
    try {
      setVerified(!!em && localStorage.getItem(`email_verified_${em}`) === "1");
    } catch (e) {}
    setLoading(false);
  };

  const handleToggleDark = (val) => {
    setDarkMode(val);
    setThemeMode(val ? "dark" : "light");
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    await base44.auth.updateMe({
      notifications_enabled: notifications,
      preferred_language: language,
    });
    toast.success(t.savePreferences + " ✓");
    setSaving(false);
  };

  const handleSaveAppLang = () => {
    ls.set("dev_app_lang", appLang);
    window.dispatchEvent(new Event("app-lang-change"));
    toast.success(t.applyLang + " ✓");
  };

  const handleLogout = () => {
    try {
      base44.auth.logout("/");
    } catch (e) {
      console.error("Logout failed:", e);
    }
    setTimeout(() => {
      try {
        localStorage.removeItem("base44_access_token");
        localStorage.removeItem("token");
        localStorage.removeItem("dar_mock_user");
      } catch (e) {}
      window.location.replace("/");
    }, 600);
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <MobileHeader title={t.settings} />

      {/* Page header */}
      <div className="flex flex-col gap-4 mb-7">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <SlidersHorizontal className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-foreground leading-tight">{t.settings}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{t.settingsSub}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>7 مجموعات إعدادات</span>
          </span>

          <div className="inline-flex items-center rounded-full border border-border bg-muted/40 p-1">
            <button
              type="button"
              onClick={expandAll}
              disabled={isAllOpen}
              className={`px-3 h-7 rounded-full text-[11px] font-bold transition-colors disabled:opacity-40 ${
                isAllOpen ? "text-muted-foreground" : "text-primary hover:bg-card"
              }`}
            >
              فتح الكل
            </button>
            <button
              type="button"
              onClick={collapseAll}
              disabled={isAllClosed}
              className={`px-3 h-7 rounded-full text-[11px] font-bold transition-colors disabled:opacity-40 ${
                isAllClosed ? "text-muted-foreground" : "text-primary hover:bg-card"
              }`}
            >
              طي الكل
            </button>
          </div>
        </div>
      </div>

      {/* ─── الحساب والتخصيص ─────────────────────────────────────────── */}
      <div className="space-y-3 mb-6">
        <GroupLabel>الحساب والتخصيص</GroupLabel>

        <SettingsCard
          icon={<User className="w-5 h-5" />}
          title="الملف الشخصي والصورة"
          description="تعديل الاسم، الصورة الشخصية، وتوثيق البريد الإلكتروني"
          tone="primary"
          open={openSections.profile}
          onToggle={() => toggleSection("profile")}
          badge={
            verified ? (
              <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold border border-emerald-500/20">
                موثّق ✓
              </span>
            ) : null
          }
        >
          <div className="-mt-1">
            <ProfileCard />
          </div>
        </SettingsCard>

        <SettingsCard
          icon={darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          title={`${t.appearance} والسمة`}
          description="الوضع الليلي والنهاري ومظهر التطبيق"
          tone="amber"
          open={openSections.appearance}
          onToggle={() => toggleSection("appearance")}
          badge={
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
              {darkMode ? "داكن 🌙" : "فاتح ☀️"}
            </span>
          }
        >
          <SettingRow
            title={t.darkMode}
            description={t.darkModeSub}
            control={
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-muted-foreground" />
                <Switch checked={darkMode} onCheckedChange={handleToggleDark} />
                <Moon className="w-4 h-4 text-muted-foreground" />
              </div>
            }
          />

          {/* Quick visual mode selectors */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleToggleDark(false)}
              className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${
                !darkMode
                  ? "border-primary bg-primary/5 shadow-2xs"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                <Sun className="w-4 h-4" />
              </div>
              <div className="text-start">
                <p className="text-xs font-bold text-foreground">الوضع النهاري</p>
                <p className="text-[10px] text-muted-foreground">سطوع ووضوح للقراءة</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleToggleDark(true)}
              className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all ${
                darkMode
                  ? "border-primary bg-primary/5 shadow-2xs"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center shrink-0">
                <Moon className="w-4 h-4" />
              </div>
              <div className="text-start">
                <p className="text-xs font-bold text-foreground">الوضع الليلي</p>
                <p className="text-[10px] text-muted-foreground">مريح للعينين في الظلام</p>
              </div>
            </button>
          </div>
        </SettingsCard>

        <SettingsCard
          icon={<Globe className="w-5 h-5" />}
          title={`${t.preferences} والتنبيهات`}
          description="إشعارات الكتب الجديدة ولغة تصفية المحتوى"
          tone="blue"
          open={openSections.preferences}
          onToggle={() => toggleSection("preferences")}
          badge={
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold">
              {language}
            </span>
          }
        >
          <SettingRow
            icon={<Bell className="w-4 h-4 text-primary" />}
            title={t.notifications}
            description={t.notificationsSub}
            control={
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            }
          />

          <div className="pt-4 border-t border-border/60">
            <Label className="text-xs font-bold">{t.preferredLang}</Label>
            <p className="text-xs text-muted-foreground mt-0.5 mb-2">
              {t.preferredLangSub}
            </p>
            <MobileSelect
              value={language}
              onValueChange={setLanguage}
              placeholder={t.preferredLangPlaceholder}
              triggerClassName="mt-1"
              options={BOOK_LANG_VALUES.map((v) => ({
                value: v,
                label: bookLangLabel(v, t.langCode),
              }))}
            />
          </div>

          <Button
            onClick={handleSavePreferences}
            disabled={saving}
            className="gap-2 rounded-[4px_20px_4px_20px] w-full sm:w-auto text-xs h-10 shadow-xs"
          >
            <Save className="w-4 h-4" /> {t.savePreferences}
          </Button>
        </SettingsCard>

        <SettingsCard
          icon={<Languages className="w-5 h-5" />}
          title={t.appLangTitle}
          description={t.appLangSub}
          tone="purple"
          open={openSections.appLang}
          onToggle={() => toggleSection("appLang")}
          badge={
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold uppercase">
              {appLang}
            </span>
          }
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {[
              { code: "ar", name: "العربية", flag: "🇸🇦" },
              { code: "en", name: "English", flag: "🇬🇧" },
              { code: "fr", name: "Français", flag: "🇫🇷" },
              { code: "ur", name: "اردو", flag: "🇵🇰" },
              { code: "hi", name: "हिंदी", flag: "🇮🇳" },
              { code: "tr", name: "Türkçe", flag: "🇹🇷" },
            ].map(({ code, name, flag }) => (
              <label
                key={code}
                className={`flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  appLang === code
                    ? "border-primary bg-primary/10 shadow-2xs font-bold"
                    : "border-border/70 hover:border-primary/40 hover:bg-card"
                }`}
              >
                <input
                  type="radio"
                  name="appLang"
                  value={code}
                  checked={appLang === code}
                  onChange={() => setAppLang(code)}
                  className="hidden"
                />
                <span className="text-base">{flag}</span>
                <span className="text-xs flex-1">{name}</span>
                {appLang === code && <div className="w-2 h-2 rounded-full bg-primary" />}
              </label>
            ))}
          </div>

          <Button
            onClick={handleSaveAppLang}
            className="gap-2 w-full sm:w-auto rounded-[4px_20px_4px_20px] text-xs h-10 shadow-xs"
          >
            <Save className="w-4 h-4" /> {t.applyLang}
          </Button>
        </SettingsCard>
      </div>

      {/* ─── الأمان والدعم ───────────────────────────────────────────── */}
      <div className="space-y-3 mb-6">
        <GroupLabel>الأمان والدعم</GroupLabel>

        <SettingsCard
          icon={<ShieldCheck className="w-5 h-5" />}
          title={`${t.securityTitle} والخصوصية`}
          description="حماية البيانات وربط وتوثيق البريد الإلكتروني"
          tone="emerald"
          open={openSections.security}
          onToggle={() => toggleSection("security")}
          badge={
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                verified
                  ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 border-amber-500/20"
              }`}
            >
              {verified ? "موثّق ومحمي ✓" : "غير موثّق"}
            </span>
          }
        >
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/60">
            {verified ? (
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p
                className={`text-xs font-bold ${
                  verified
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {verified ? t.securityVerified : t.securityUnverified}
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {verified
                  ? "بريدك الإلكتروني محمي ومربوط بحسابك بنجاح. تتم مزامنة إشاراتك المرجعية ومفضلاتك بأمان."
                  : "قم بتأكيد بريدك الإلكتروني لحماية بياناتك والتمكن من استعادة حسابك والمزامنة في أي وقت."}
              </p>
              {!verified && (
                <Link
                  to="/verify-email"
                  className="inline-flex items-center gap-1.5 mt-3 px-3.5 py-1.5 rounded-[4px_20px_4px_20px] bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all shadow-xs"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>توثيق البريد برمز OTP الآن</span>
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border/60">
            <Lock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t.securityPrivacySub}
            </p>
          </div>
        </SettingsCard>

        <SettingsCard
          icon={<Info className="w-5 h-5" />}
          title={`${t.aboutTitle} والتواصل والدعم`}
          description="معلومات الإصدار، فريق التطوير، وقنوات المساعدة"
          tone="teal"
          open={openSections.about}
          onToggle={() => toggleSection("about")}
          badge={
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold">
              v2.5.0
            </span>
          }
        >
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t.aboutContactSub}
          </p>

          <div className="grid grid-cols-2 gap-2.5">
            <Link
              to="/about"
              className="flex items-center justify-center gap-2 py-3 bg-primary/10 text-primary font-bold text-xs hover:bg-primary/15 transition-colors rounded-[4px_20px_4px_20px] shadow-2xs"
            >
              <Info className="w-4 h-4" /> <span>{t.aboutTitle}</span>
            </Link>
            <Link
              to="/contact"
              className="flex items-center justify-center gap-2 py-3 bg-primary/10 text-primary font-bold text-xs hover:bg-primary/15 transition-colors rounded-[4px_20px_4px_20px] shadow-2xs"
            >
              <Mail className="w-4 h-4" /> <span>{t.contactTitle}</span>
            </Link>
          </div>
        </SettingsCard>
      </div>

      {/* ─── إدارة الحساب ────────────────────────────────────────────── */}
      <div className="space-y-3">
        <GroupLabel>الجلسة</GroupLabel>

        <SettingsCard
          icon={<LogOut className="w-5 h-5" />}
          title="الجلسة وتسجيل الخروج"
          description="الخروج من حسابك على هذا الجهاز"
          tone="destructive"
          danger
          open={openSections.danger}
          onToggle={() => toggleSection("danger")}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/60">
            <div>
              <p className="text-xs font-bold text-foreground">{t.logout}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{t.logoutSub}</p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2 rounded-[4px_20px_4px_20px] text-xs h-9 self-start sm:self-auto"
            >
              <LogOut className="w-3.5 h-3.5" /> <span>{t.logout}</span>
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground leading-relaxed">
            لحذف حسابك ومسح بياناتك نهائياً، استخدم زر «{t.deleteAccount}» داخل بطاقة الملف الشخصي.
          </p>
        </SettingsCard>
      </div>
    </div>
  );
}