// ─── Persistent localStorage wrapper ───────────────────────────────────────
// All dev-panel settings are saved here and never lost between sessions.

export const ls = {
  get: (k, fb = null) => {
    try { const v = localStorage.getItem(k); return v !== null ? v : fb; } catch(e) { return fb; }
  },
  set: (k, v) => {
    try { localStorage.setItem(k, v); } catch(e) {}
  },
  getJson: (k, fb = null) => {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch(e) { return fb; }
  },
  setJson: (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch(e) {}
  },
  remove: (k) => { try { localStorage.removeItem(k); } catch(e) {} },
  clear: () => { try { localStorage.clear(); } catch(e) {} },
};

// ─── Dark mode ───────────────────────────────────────────────────────────────
export function applyDarkMode(enabled) {
  document.documentElement.classList.toggle("dark", enabled);
  ls.set("dev_dark_mode", String(enabled));
}

export function getStoredDarkMode() {
  return ls.get("dev_dark_mode") === "true";
}

// ─── Colors ──────────────────────────────────────────────────────────────────
export function applyStoredColors() {
  const map = {
    "--background": ls.get("dev_bg"),
    "--foreground": ls.get("dev_fg"),
    "--primary": ls.get("dev_primary"),
    "--ring": ls.get("dev_primary"),
    "--sidebar-primary": ls.get("dev_primary"),
    "--accent": ls.get("dev_accent"),
    "--card": ls.get("dev_card"),
    "--popover": ls.get("dev_card"),
  };
  Object.entries(map).forEach(([k, v]) => { if (v) document.documentElement.style.setProperty(k, v); });
}

export function applyColors({ bg, fg, primary, accent, card }) {
  if (bg)      { document.documentElement.style.setProperty("--background", bg); ls.set("dev_bg", bg); }
  if (fg)      { document.documentElement.style.setProperty("--foreground", fg); ls.set("dev_fg", fg); }
  if (primary) {
    ["--primary", "--ring", "--sidebar-primary"].forEach(v => document.documentElement.style.setProperty(v, primary));
    ls.set("dev_primary", primary);
  }
  if (accent)  { document.documentElement.style.setProperty("--accent", accent); ls.set("dev_accent", accent); }
  if (card)    {
    ["--card", "--popover"].forEach(v => document.documentElement.style.setProperty(v, card));
    ls.set("dev_card", card);
  }
}

// ─── Fonts ───────────────────────────────────────────────────────────────────
export const FONT_ROLES = [
  { key: "body",    label: "النص العام",    desc: "جميع نصوص الصفحة",        cssVar: "--font-tajawal", sample: "بسم الله الرحمن الرحيم" },
  { key: "heading", label: "العناوين",      desc: "العناوين الكبيرة (h1,h2)", cssVar: "--font-heading", sample: "المكتبة الإسلامية" },
  { key: "title",   label: "أسماء الكتب",  desc: "عناوين الكتب في البطاقات", cssVar: "--font-title",   sample: "صحيح البخاري" },
  { key: "nav",     label: "شريط التنقل",  desc: "روابط وأزرار التنقل",      cssVar: "--font-nav",     sample: "الرئيسية" },
  { key: "button",  label: "الأزرار",       desc: "نصوص الأزرار",            cssVar: "--font-button",  sample: "تصفح المكتبة" },
];

export const FONT_PRESETS = [
  { name: "Tajawal",              label: "تجوّل",           category: "حديث",    url: "https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap",                     value: "'Tajawal', sans-serif" },
  { name: "Cairo",                label: "القاهرة",          category: "حديث",    url: "https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap",                           value: "'Cairo', sans-serif" },
  { name: "IBM Plex Sans Arabic", label: "IBM بلكس",        category: "حديث",    url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;600;700&display=swap",                value: "'IBM Plex Sans Arabic', sans-serif" },
  { name: "Readex Pro",           label: "ريدكس برو",        category: "حديث",    url: "https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300;400;600;700&display=swap",                          value: "'Readex Pro', sans-serif" },
  { name: "Noto Sans Arabic",     label: "نوتو سانس",        category: "حديث",    url: "https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;600;700&display=swap",                    value: "'Noto Sans Arabic', sans-serif" },
  { name: "Almarai",              label: "المرعي",           category: "حديث",    url: "https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap",                             value: "'Almarai', sans-serif" },
  { name: "Rubik",                label: "روبيك",            category: "حديث",    url: "https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;700&display=swap",                               value: "'Rubik', sans-serif" },
  { name: "Gulzar",               label: "گلزار (اردو)",     category: "أوردو",   url: "https://fonts.googleapis.com/css2?family=Gulzar&display=swap",                                                   value: "'Gulzar', serif" },
  { name: "Noto Nastaliq Urdu",   label: "نستعلیق (اردو)",  category: "أوردو",   url: "https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap",                          value: "'Noto Nastaliq Urdu', serif" },
  { name: "Jameel Noori Nastaleeq", label: "نوری نستعلیق",  category: "أوردو",   url: "https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap",                          value: "'Noto Nastaliq Urdu', serif" },
  { name: "Amiri",                label: "أميري",            category: "كلاسيكي", url: "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap",                                       value: "'Amiri', serif" },
  { name: "Noto Naskh Arabic",    label: "نوتو نسخ",        category: "كلاسيكي", url: "https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap",                           value: "'Noto Naskh Arabic', serif" },
  { name: "Scheherazade New",     label: "شهرزاد",           category: "كلاسيكي", url: "https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&display=swap",                            value: "'Scheherazade New', serif" },
  { name: "Mirza",                label: "ميرزا",            category: "كلاسيكي", url: "https://fonts.googleapis.com/css2?family=Mirza:wght@400;500;600;700&display=swap",                               value: "'Mirza', cursive" },
  { name: "Lateef",               label: "لطيف",             category: "قرآني",   url: "https://fonts.googleapis.com/css2?family=Lateef&display=swap",                                                    value: "'Lateef', serif" },
  { name: "Noto Naskh Quran",     label: "نسخ قرآني",        category: "قرآني",   url: "https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400&display=swap",                               value: "'Noto Naskh Arabic', serif" },
  { name: "Reem Kufi",            label: "ريم كوفي",         category: "زخرفي",   url: "https://fonts.googleapis.com/css2?family=Reem+Kufi:wght@400;500;600;700&display=swap",                           value: "'Reem Kufi', sans-serif" },
  { name: "Aref Ruqaa",           label: "عارف رقعة",        category: "زخرفي",   url: "https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&display=swap",                                  value: "'Aref Ruqaa', serif" },
  { name: "El Messiri",           label: "المسيري",          category: "زخرفي",   url: "https://fonts.googleapis.com/css2?family=El+Messiri:wght@400;500;600;700&display=swap",                          value: "'El Messiri', sans-serif" },
];

export function injectRoleFont(role, preset) {
  const linkId = `dev-font-link-${preset.name.replace(/\s+/g, "-")}`;
  if (!document.getElementById(linkId)) {
    const link = document.createElement("link");
    link.id = linkId; link.rel = "stylesheet"; link.href = preset.url;
    document.head.appendChild(link);
  }
  document.documentElement.style.setProperty(role.cssVar, preset.value);
  ls.set(`dev_font_${role.key}`, preset.name);
}

export function applyStoredFont() {
  FONT_ROLES.forEach(role => {
    const stored = ls.get(`dev_font_${role.key}`);
    if (stored) {
      const preset = FONT_PRESETS.find(f => f.name === stored);
      if (preset) injectRoleFont(role, preset);
    }
  });
  const storedSize = ls.get("dev_font_size");
  if (storedSize) document.documentElement.style.setProperty("font-size", `${storedSize}px`);
}