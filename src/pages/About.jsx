import { motion } from "framer-motion";
import {
  BookOpen, Globe, Smartphone, Sparkles,
  Users, Languages, ShieldCheck, Library, WifiOff, Star, Download } from
"lucide-react";
import { useT } from "@/lib/i18n";
import { getSetting } from "@/lib/settingsStore";

export default function About() {
  const t = useT();
  const appName = getSetting("app_name") || t.appName || "دار العلوم";
  const appSubtitle = getSetting("app_subtitle") || t.appSubtitle;
  const logoUrl = getSetting("logo_url");

  const features = [
  { icon: BookOpen, title: t.feat1Title, desc: t.feat1Desc, color: "text-primary" },
  { icon: Globe, title: t.feat2Title, desc: t.feat2Desc, color: "text-accent" },
  { icon: Smartphone, title: t.feat3Title, desc: t.feat3Desc, color: "text-primary" },
  { icon: WifiOff, title: t.featOfflineTitle, desc: t.featOfflineDesc, color: "text-accent" },
  { icon: Languages, title: t.featLangsTitle, desc: t.featLangsDesc, color: "text-primary" },
  { icon: Download, title: t.featDownloadTitle, desc: t.featDownloadDesc, color: "text-accent" }];


  const stats = [
  { icon: Library, value: "+500", label: t.statBooks },
  { icon: BookOpen, value: "+50", label: t.statVideos },
  { icon: Globe, value: "5", label: t.statLangs }];


  const values = [
  { icon: ShieldCheck, title: t.valueAuthenticity, desc: t.valueAuthenticityDesc },
  { icon: Star, title: t.valueQuality, desc: t.valueQualityDesc },
  { icon: Users, title: t.valueAccess, desc: t.valueAccessDesc }];


  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8" dir="rtl">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-accent/10 p-8 sm:p-10 mb-8">
          <div className="absolute top-4 left-6 text-6xl opacity-10 select-none">﷽</div>
          <div className="relative flex flex-col items-center text-center gap-4">
            {logoUrl &&
            <img src={logoUrl} alt={appName} className="w-20 h-20 object-contain rounded-2xl shadow-md" />
            }
            <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="w-3.5 h-3.5" /> {t.aboutEyebrow}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-foreground">{t.aboutTitle}</h1>
            {appSubtitle && <p className="text-sm sm:text-base text-muted-foreground max-w-xl">{appSubtitle}</p>}
          </div>
        </div>

        {/* Intro */}
        <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none">
          <p className="text-foreground leading-relaxed text-base sm:text-lg">
            {t.aboutP1.replace("{appName}", appName)}
          </p>
          <p className="text-muted-foreground leading-relaxed mt-4">{t.aboutP2}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-8">
          {stats.map((s, i) =>
          <div key={i} className="bg-card border border-border rounded-2xl p-4 text-center">
              <s.icon className="w-6 h-6 text-primary mx-auto mb-1.5" />
              <p className="text-xl font-black text-foreground">{s.value}</p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          )}
        </div>

        {/* Features */}
        

        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) =>
          <div key={i} className="bg-card border border-border rounded-2xl p-5 hidden">
              <f.icon className={`w-8 h-8 ${f.color} mb-2`} />
              <h3 className="font-bold text-sm text-foreground">{f.title}</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
            </div>
          )}
        </div>

        {/* Values */}
        

        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {values.map((v, i) =>
          <div key={i} className="bg-card border border-border rounded-2xl p-5 text-center hidden">
              <v.icon className="w-8 h-8 text-accent mx-auto mb-2" />
              <h3 className="font-bold text-sm text-foreground">{v.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{v.desc}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        






        
      </motion.div>
    </div>);

}