import { useState, useEffect } from "react";
import {
  Shield, Lock, Eye, EyeOff,
  LayoutDashboard, BookOpen, Type, Palette, Layers, Sliders,
  Navigation, Image, Users, HardDrive, Archive, Activity, Zap, Settings, ChevronRight, Moon, Sun, Menu, X,
  ImagePlay, GalleryHorizontal, Paintbrush, Share2, Video, WifiOff, Wrench, FlaskConical, MessageCircle, Search,
  Cloud, CloudUpload, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { subscribeToSettings } from "@/lib/settingsStore";
import { setThemeMode, getThemeState } from "@/lib/themeEngine";
import { base44 } from "@/api/base44Client";
import { forceSyncNow } from "@/lib/contentSyncEngine";

// ─── Section Components ───────────────────────────────────────────────────────
import DevDashboard from "@/components/dev/DevDashboard";
import DevBooks from "@/components/dev/DevBooks";
import DevFonts from "@/components/dev/DevFonts";
import DevColors from "@/components/dev/DevColors";
import DevCards from "@/components/dev/DevCards";
import DevAppDesign from "@/components/dev/DevAppDesign";
import DevNavigation from "@/components/dev/DevNavigation";
import DevBranding from "@/components/dev/DevBranding";
import DevUsers from "@/components/dev/DevUsers";
import DevStorage from "@/components/dev/DevStorage";
import DevBackup from "@/components/dev/DevBackup";
import DevLogs from "@/components/dev/DevLogs";
import DevSecurity from "@/components/dev/DevSecurity";
import DevPerformance from "@/components/dev/DevPerformance";
import DevSystemSettings from "@/components/dev/DevSystemSettings";
import DevBackgroundLibrary from "@/components/dev/DevBackgroundLibrary";
import DevBackgroundManager from "@/components/dev/DevBackgroundManager";
import DevTheme from "@/components/dev/DevTheme";
import DevSocialChannels from "@/components/dev/DevSocialChannels";
import DevVideos from "@/components/dev/DevVideos";
import DevContactSettings from "@/components/dev/DevContactSettings";
import DevOffline from "@/components/dev/DevOffline";
import DevMaintenance from "@/components/dev/DevMaintenance";
import DevTesting from "@/components/dev/DevTesting";

// ─── Font / Color exports (used by settingsStore) ─────────────────────────────
export { FONT_PRESETS, FONT_ROLES } from "@/lib/fontConstants";

// ─── Password ─────────────────────────────────────────────────────────────────
const DEV_PASSWORD_KEY = "dev_panel_password";
const DEFAULT_PASSWORD = "42891";
const getPassword = () => {
  try { return localStorage.getItem(DEV_PASSWORD_KEY) || DEFAULT_PASSWORD; } catch(e) { return DEFAULT_PASSWORD; }
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "dashboard",    label: "لوحة التحكم",      icon: LayoutDashboard },
  { id: "books",        label: "إدارة الكتب",       icon: BookOpen },
  { id: "fonts",        label: "إدارة الخطوط",      icon: Type },
  { id: "colors",       label: "الألوان والثيمات",   icon: Palette },
  { id: "cards",        label: "البطاقات والمكونات", icon: Layers },
  { id: "app_design",   label: "تصميم التطبيق",     icon: Sliders },
  { id: "navigation",   label: "إدارة التنقل",      icon: Navigation },
  { id: "branding",     label: "الشعار والهوية",     icon: Image },
  { id: "users",        label: "إدارة المستخدمين",   icon: Users },
  { id: "storage",      label: "إدارة التخزين",      icon: HardDrive },
  { id: "backup",       label: "النسخ الاحتياطي",    icon: Archive },
  { id: "logs",         label: "سجلات النشاط",       icon: Activity },
  { id: "security",     label: "مركز الأمان",        icon: Shield },
  { id: "performance",  label: "مركز الأداء",        icon: Zap },
  { id: "system",       label: "إعدادات النظام",     icon: Settings },
  { id: "theme",        label: "نظام الثيمات",        icon: Paintbrush },
  { id: "background",   label: "إدارة الخلفيات",     icon: ImagePlay },
  { id: "bg_library",   label: "مكتبة الخلفيات",     icon: GalleryHorizontal },
  { id: "social",        label: "قنوات التواصل",        icon: Share2 },
  { id: "videos",        label: "إدارة الفيديوهات",      icon: Video },
  { id: "contact",       label: "إدارة صفحة التواصل",   icon: MessageCircle },
  { id: "offline",       label: "إدارة وضع عدم الاتصال",  icon: WifiOff },
  { id: "maintenance",   label: "أدوات الصيانة",           icon: Wrench },
  { id: "testing",       label: "أدوات الاختبار",          icon: FlaskConical },
];

const TAB_GROUPS = [
  { title: "المحتوى", ids: ["books", "videos", "social", "contact"] },
  { title: "التصميم والمظهر", ids: ["fonts", "colors", "cards", "app_design", "theme", "branding", "navigation", "background", "bg_library"] },
  { title: "النظام والأدوات", ids: ["users", "storage", "backup", "logs", "security", "performance", "system", "offline", "maintenance", "testing"] },
];

export default function DevPanel() {
  const [unlocked, setUnlocked]           = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPwd, setShowPwd]             = useState(false);
  const [activeTab, setActiveTab]         = useState("dashboard");
  const [sidebarOpen, setSidebarOpen]     = useState(() => typeof window !== "undefined" && window.innerWidth >= 768);
  const [tabSearch, setTabSearch]         = useState("");
  const [darkMode, setDarkMode]           = useState(() => getThemeState().isDark);
  const [fbUser, setFbUser]               = useState(null);
  const [syncingCloud, setSyncingCloud]   = useState(false);

  // Sync dark mode
  useEffect(() => {
    const unsub = subscribeToSettings(() => setDarkMode(getThemeState().isDark));
    return unsub;
  }, []);

  useEffect(() => {
    let active = true;
    base44.auth.me()
      .then((u) => { if (active) setFbUser(u); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const handleSyncCloud = async () => {
    setSyncingCloud(true);
    try {
      await forceSyncNow();
      toast.success("تمت المزامنة بنجاح وحفظ كافة التعديلات ✓");
    } catch (e) {
      toast.error("حدث خطأ أثناء المزامنة: " + (e?.message || ""));
    } finally {
      setSyncingCloud(false);
    }
  };

  const handleGoogleAuth = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  const handleUnlock = () => {
    if (passwordInput === getPassword()) setUnlocked(true);
    else toast.error("كلمة المرور غير صحيحة");
  };

  const handleToggleDark = () => {
    setThemeMode(getThemeState().isDark ? "light" : "dark");
  };

  // ── Lock screen ──
  if (!unlocked) return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/10 mb-4 rounded-2xl w-20 h-20 flex items-center justify-center ring-4 ring-primary/20">
            <Shield className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-black">مركز التحكم</h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">لوحة المطور المتقدمة — Enterprise Edition</p>
        </div>
        <div className="space-y-4">
          <div className="relative">
            <Input type={showPwd ? "text" : "password"} value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleUnlock()}
              placeholder="كلمة المرور" className="h-12 rounded-xl pl-10 text-center text-lg tracking-widest" />
            <button onClick={() => setShowPwd(!showPwd)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Button onClick={handleUnlock} className="w-full h-12 rounded-xl font-bold text-base gap-2">
            <Shield className="w-4 h-4" /> دخول إلى مركز التحكم
          </Button>
        </div>
      </motion.div>
    </div>
  );

  const ActiveSection = {
    dashboard:   DevDashboard,
    books:       DevBooks,
    fonts:       DevFonts,
    colors:      DevColors,
    cards:       DevCards,
    app_design:  DevAppDesign,
    navigation:  DevNavigation,
    branding:    DevBranding,
    users:       DevUsers,
    storage:     DevStorage,
    backup:      DevBackup,
    logs:        DevLogs,
    security:    DevSecurity,
    performance:  DevPerformance,
    system:       DevSystemSettings,
    theme:        DevTheme,
    background:   DevBackgroundManager,
    bg_library:   DevBackgroundLibrary,
    social:        DevSocialChannels,
    videos:        DevVideos,
    contact:       DevContactSettings,
    offline:       DevOffline,
    maintenance:   DevMaintenance,
    testing:       DevTesting,
  }[activeTab] || DevDashboard;

  return (
    <div className="flex h-screen overflow-hidden bg-background" dir="rtl">
      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="shrink-0 fixed md:relative inset-y-0 right-0 bg-card border-l border-border flex flex-col overflow-hidden z-40 shadow-2xl md:shadow-none"
            style={{ width: 256 }}
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black truncate">مركز التحكم</p>
                  <p className="text-[10px] text-muted-foreground">Enterprise Edition</p>
                </div>
              </div>
            </div>

            {/* Tab Search */}
            <div className="px-3 pt-3 pb-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  value={tabSearch}
                  onChange={(e) => setTabSearch(e.target.value)}
                  placeholder="بحث سريع في الأقسام..."
                  className="w-full h-9 rounded-lg bg-muted border border-border pr-9 pl-3 text-xs outline-none focus:ring-1 focus:ring-primary/40 text-right" />
              </div>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
              {(() => {
                const q = tabSearch.trim();
                const select = (id) => {
                  setActiveTab(id);
                  if (window.innerWidth < 768) setSidebarOpen(false);
                };
                const TabBtn = ({ tab }) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button onClick={() => select(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-right ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}>
                      <tab.icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-right truncate">{tab.label}</span>
                      {isActive && <ChevronRight className="w-3 h-3 shrink-0 rotate-180" />}
                    </button>
                  );
                };
                if (q) {
                  const found = TABS.filter(tab => tab.label.includes(q));
                  return found.length > 0
                    ? found.map(tab => <TabBtn key={tab.id} tab={tab} />)
                    : <p className="text-center text-xs text-muted-foreground py-6">لا توجد نتائج</p>;
                }
                return (
                  <>
                    <TabBtn tab={TABS[0]} />
                    {TAB_GROUPS.map(group => (
                      <div key={group.title}>
                        <p className="text-[10px] font-bold text-muted-foreground/70 px-3 pt-4 pb-1">{group.title}</p>
                        {group.ids.map(id => {
                          const tab = TABS.find(t => t.id === id);
                          return tab ? <TabBtn key={tab.id} tab={tab} /> : null;
                        })}
                      </div>
                    ))}
                  </>
                );
              })()}
            </nav>

            {/* Sidebar Footer */}
            <div className="p-3 border-t border-border space-y-2">
              <button onClick={handleToggleDark}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span>{darkMode ? "الوضع النهاري" : "الوضع الليلي"}</span>
              </button>
              <button onClick={() => { setUnlocked(false); setPasswordInput(""); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                <Lock className="w-4 h-4" />
                <span>قفل اللوحة</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/40 z-30" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-card border-b border-border px-4 py-3 flex items-center gap-3 shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-muted transition-colors">
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-2">
            {(() => { const t = TABS.find(t => t.id === activeTab); return t ? <><t.icon className="w-4 h-4 text-primary" /><h1 className="font-bold text-sm">{t.label}</h1></> : null; })()}
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncCloud}
              disabled={syncingCloud}
              className="h-8 text-xs gap-1.5"
              title="مزامنة التعديلات سحابياً"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingCloud ? "animate-spin text-primary" : ""}`} />
              <span className="hidden sm:inline">مزامنة سحابية</span>
            </Button>
            {fbUser ? (
              <span className="text-[11px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1.5 font-medium">
                <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden md:inline">{fbUser.email}</span>
                <span className="md:hidden">متصل سحابياً</span>
              </span>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGoogleAuth}
                className="h-8 text-xs gap-1.5 text-primary border border-primary/20 hover:bg-primary/10"
                title="تسجيل الدخول كمسؤول لتفعيل المزامنة السحابية المباشرة مع Firebase"
              >
                <CloudUpload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ربط حساب Google السحابي</span>
              </Button>
            )}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">حفظ فوري</span>
            </div>
          </div>
        </header>

        {/* Section Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <ActiveSection />
        </main>
      </div>
    </div>
  );
}