import { Outlet, Link, useLocation } from "react-router-dom";
import { BookOpen, Home, Code, MessageCircle, User } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { base44 } from "@/api/base44Client";
import { useT } from "@/lib/i18n";
import { getSetting, subscribeToSettings } from "@/lib/settingsStore";
import { getAccountEmail, getAvatarUrl } from "@/lib/activeUser";
import { NAV_ICONS, DEFAULT_NAV_ITEMS, readNavItems } from "@/lib/navConfig";

export default function Layout() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const t = useT();

  const [showDevNav, setShowDevNav] = useState(() => getSetting("show_dev_nav") !== "false");
  const [logoUrl, setLogoUrl] = useState(() => getSetting("logo_url"));
  const [appNameOverride, setAppNameOverride] = useState(() => getSetting("app_name"));
  const [appSubtitleOverride, setAppSubtitleOverride] = useState(() => getSetting("app_subtitle"));
  const [navConfig, setNavConfig] = useState(() => readNavItems());

  useEffect(() => {
    const unsub = subscribeToSettings((s) => {
      setShowDevNav(s.show_dev_nav !== "false");
      setLogoUrl(s.logo_url || "");
      setAppNameOverride(s.app_name || "");
      setAppSubtitleOverride(s.app_subtitle || "");
      setNavConfig(readNavItems(s.nav_items));
    });
    const handler = () => setShowDevNav(getSetting("show_dev_nav") !== "false");
    const avatarHandler = () => setAvatarUrl(getAvatarUrl(getAccountEmail(null)));
    window.addEventListener("storage", handler);
    window.addEventListener("dau-avatar-change", avatarHandler);
    return () => {unsub();window.removeEventListener("storage", handler);window.removeEventListener("dau-avatar-change", avatarHandler);};
  }, []);

  // Order, labels and visibility come from the developer panel (إدارة التنقل)
  // When a standard labelKey exists, we respect the current active language translation
  const navItems = [
    ...navConfig
      .filter((item) => item.visible !== false)
      .map((item) => {
        const defaultMatch = DEFAULT_NAV_ITEMS.find((d) => d.id === item.id);
        const isDefaultLabel = !item.label || (defaultMatch && defaultMatch.label === item.label);
        const label = isDefaultLabel && item.labelKey && t[item.labelKey]
          ? t[item.labelKey]
          : (t[item.labelKey] || item.label || item.id);
        return {
          path: item.path,
          icon: NAV_ICONS[item.icon] || Home,
          label,
        };
      }),
    ...(showDevNav ? [{ path: "/dev", icon: Code, label: "Dev" }] : []),
  ];


  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      if (u) setAvatarUrl(getAvatarUrl(getAccountEmail(u)));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("dir", t.dir || "rtl");
    html.setAttribute("lang", t.langCode || "ar");
    if (t.fontFamily) {
      html.style.setProperty("--font-app", t.fontFamily);
      document.body.style.fontFamily = t.fontFamily;
    }
  }, [t.dir, t.langCode, t.fontFamily]);

  return (
    <div dir={t.dir} lang={t.langCode} className="min-h-screen bg-background" style={{ fontFamily: t.fontFamily }}>
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-2xl border-b border-border safe-area-top shadow-sm shadow-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 group-hover:shadow-lg group-hover:shadow-primary/30 transition-all">
                {logoUrl ?
                <img src={logoUrl} alt="logo" className="w-full h-full object-cover" /> :
                <BookOpen className="w-5 h-5 text-primary-foreground" />}
              </div>
              <div>
                <h1 className="text-foreground text-xl font-bold leading-tight">{appNameOverride || t.appName}</h1>
                <p className="text-[10px] text-muted-foreground -mt-0.5">{appSubtitleOverride || t.appSubtitle}</p>
              </div>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative flex items-center gap-2 text-sm font-medium transition-all duration-200 pt-2 pr-4 pl-4 pb-2 rounded-[2px_16px_2px_16px] ${
                    isActive ?
                    "bg-primary text-primary-foreground shadow-md shadow-primary/20" :
                    "text-muted-foreground hover:text-foreground hover:bg-muted"}`
                    }>
                    
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>);

              })}
            </nav>
            <Link to="/settings" aria-label={t.navSettings} className="shrink-0 p-1.5 rounded-full hover:bg-muted transition-colors">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-primary/10 border border-primary/20 flex items-center justify-center">
                {avatarUrl ?
                <img src={avatarUrl} alt={t.profile} className="w-full h-full object-cover" /> :
                <User className="w-4 h-4 text-primary" />}
              </div>
            </Link>
            

            
          </div>
        </div>
      </header>

      {/* Main Content */}
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="pb-24 md:pb-8">
        
        <Outlet />
      </motion.main>

      {/* Bottom Nav — Mobile Only */}
      <nav id="bottom-nav" className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-2xl border-t border-border shadow-lg shadow-black/5 transition-transform duration-300">
        <div className="flex items-center justify-around py-1.5 px-2 safe-area-bottom">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 ${
                isActive ? "text-primary" : "text-muted-foreground"}`
                }>
                
                




                
                <item.icon className={`w-5 h-5 transition-transform ${isActive ? "fill-primary/20 scale-110" : ""}`} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>);

          })}
        </div>
      </nav>

      {/* Footer — Desktop Only */}
      <footer className="hidden md:block border-t border-border bg-card/50 mt-auto">
       <div className="max-w-7xl sm:px-6 lg:px-8 py-6 px-6">
         <div className="flex items-center justify-between">
           <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} {appNameOverride || t.appName}</p>
           <nav className="flex items-center gap-5">
             <Link to="/about" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">{t.aboutTitle} 


              </Link>
             <Link to="/contact" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
               <MessageCircle className="w-3.5 h-3.5" />
               {t.contactTitle}
             </Link>
           </nav>
         </div>
       </div>
      </footer>
      </div>);

}