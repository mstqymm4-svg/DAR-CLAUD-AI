// Standalone font constants — no settingsStore import to avoid circular dependency
export const FONT_PRESETS = [
  { name: "Tajawal",              label: "تجوّل",             category: "حديث",    url: "https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800;900&display=swap",             value: "'Tajawal', sans-serif" },
  { name: "Cairo",                label: "القاهرة",            category: "حديث",    url: "https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap",                   value: "'Cairo', sans-serif" },
  { name: "IBM Plex Sans Arabic", label: "IBM بلكس",          category: "حديث",    url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;600;700&display=swap",        value: "'IBM Plex Sans Arabic', sans-serif" },
  { name: "Readex Pro",           label: "ريدكس برو",          category: "حديث",    url: "https://fonts.googleapis.com/css2?family=Readex+Pro:wght@300;400;600;700&display=swap",                  value: "'Readex Pro', sans-serif" },
  { name: "Noto Sans Arabic",     label: "نوتو سانس",          category: "حديث",    url: "https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;600;700&display=swap",            value: "'Noto Sans Arabic', sans-serif" },
  { name: "Almarai",              label: "المرعي",             category: "حديث",    url: "https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&display=swap",                     value: "'Almarai', sans-serif" },
  { name: "Rubik",                label: "روبيك",              category: "حديث",    url: "https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;700&display=swap",                       value: "'Rubik', sans-serif" },
  { name: "Noto Nastaliq Urdu",   label: "نستعلیق اردو",      category: "أوردو",   url: "https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap",                  value: "'Noto Nastaliq Urdu', serif" },
  { name: "Gulzar",               label: "گلزار",              category: "أوردو",   url: "https://fonts.googleapis.com/css2?family=Gulzar&display=swap",                                           value: "'Gulzar', serif" },
  { name: "Amiri",                label: "أميري",              category: "كلاسيكي", url: "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap",                               value: "'Amiri', serif" },
  { name: "Noto Naskh Arabic",    label: "نوتو نسخ",          category: "كلاسيكي", url: "https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap",                   value: "'Noto Naskh Arabic', serif" },
  { name: "Scheherazade New",     label: "شهرزاد",             category: "كلاسيكي", url: "https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;700&display=swap",                    value: "'Scheherazade New', serif" },
  { name: "Mirza",                label: "ميرزا",              category: "كلاسيكي", url: "https://fonts.googleapis.com/css2?family=Mirza:wght@400;500;600;700&display=swap",                      value: "'Mirza', cursive" },
  { name: "Lateef",               label: "لطيف",               category: "قرآني",   url: "https://fonts.googleapis.com/css2?family=Lateef&display=swap",                                           value: "'Lateef', serif" },
  { name: "Reem Kufi",            label: "ريم كوفي",           category: "زخرفي",   url: "https://fonts.googleapis.com/css2?family=Reem+Kufi:wght@400;500;600;700&display=swap",                  value: "'Reem Kufi', sans-serif" },
  { name: "Aref Ruqaa",           label: "عارف رقعة",          category: "زخرفي",   url: "https://fonts.googleapis.com/css2?family=Aref+Ruqaa:wght@400;700&display=swap",                         value: "'Aref Ruqaa', serif" },
  { name: "El Messiri",           label: "المسيري",            category: "زخرفي",   url: "https://fonts.googleapis.com/css2?family=El+Messiri:wght@400;500;600;700&display=swap",                 value: "'El Messiri', sans-serif" },
];

export const FONT_ROLES = [
  { key: "body",    label: "النص العام",    cssVar: "--font-tajawal", sample: "بسم الله الرحمن الرحيم" },
  { key: "heading", label: "العناوين",      cssVar: "--font-heading", sample: "المكتبة الإسلامية" },
  { key: "title",   label: "أسماء الكتب",  cssVar: "--font-title",   sample: "صحيح البخاري — الإمام البخاري" },
  { key: "nav",     label: "شريط التنقل",  cssVar: "--font-nav",     sample: "الرئيسية" },
  { key: "button",  label: "الأزرار",       cssVar: "--font-button",  sample: "تصفح المكتبة" },
];