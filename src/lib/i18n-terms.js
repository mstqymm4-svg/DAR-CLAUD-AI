// ─── Localised labels for stored data values (categories & book languages) ───
// The stored value stays Arabic (the entity enum); only the label shown changes.

const CATEGORY_LABELS = {
  "الكل": { en: "All", fr: "Tout", ur: "سب", hi: "सभी", tr: "Tümü" },
  "القرآن وعلومه": { en: "Quran & its Sciences", fr: "Coran et ses sciences", ur: "قرآن و علومِ قرآن", hi: "क़ुरआन और उसके विज्ञान", tr: "Kur'an ve İlimleri" },
  "الحديث الشريف": { en: "Noble Hadith", fr: "Hadith noble", ur: "حدیث شریف", hi: "हदीस शरीफ़", tr: "Şerif Hadis" },
  "الفقه الإسلامي": { en: "Islamic Jurisprudence", fr: "Jurisprudence islamique", ur: "اسلامی فقہ", hi: "इस्लामी फ़िक़्ह", tr: "İslam Fıkhı" },
  "السيرة النبوية": { en: "Prophetic Biography", fr: "Biographie du Prophète", ur: "سیرتِ نبوی", hi: "सीरत-ए-नबवी", tr: "Siyer-i Nebi" },
  "العقيدة": { en: "Creed (Aqeedah)", fr: "Croyance (Aqida)", ur: "عقیدہ", hi: "अक़ीदा", tr: "Akide" },
  "التزكية والرقائق": { en: "Purification of the Soul", fr: "Purification de l'âme", ur: "تزکیہ و رقائق", hi: "आत्म-शुद्धि", tr: "Tezkiye ve Rekaik" },
  "التاريخ الإسلامي": { en: "Islamic History", fr: "Histoire islamique", ur: "اسلامی تاریخ", hi: "इस्लामी इतिहास", tr: "İslam Tarihi" },
  "أخرى": { en: "Other", fr: "Autre", ur: "دیگر", hi: "अन्य", tr: "Diğer" },
};

const BOOK_LANG_LABELS = {
  "الكل": { en: "All", fr: "Tout", ur: "سب", hi: "सभी", tr: "Tümü" },
  "العربية": { en: "Arabic", fr: "Arabe", ur: "عربی", hi: "अरबी", tr: "Arapça" },
  "الإنجليزية": { en: "English", fr: "Anglais", ur: "انگریزی", hi: "अंग्रेज़ी", tr: "İngilizce" },
  "الفرنسية": { en: "French", fr: "Français", ur: "فرانسیسی", hi: "फ़्रांसीसी", tr: "Fransızca" },
  "الأوردو": { en: "Urdu", fr: "Ourdou", ur: "اردو", hi: "उर्दू", tr: "Urduca" },
  "الهندية": { en: "Hindi", fr: "Hindi", ur: "ہندی", hi: "हिंदी", tr: "Hintçe" },
  "التركية": { en: "Turkish", fr: "Turc", ur: "ترکی", hi: "तुर्की", tr: "Türkçe" },
  "أخرى": { en: "Other", fr: "Autre", ur: "دیگر", hi: "अन्य", tr: "Diğer" },
};

const pick = (map, value, lang) => {
  if (!value) return value;
  if (!lang || lang === "ar") return value;
  return map[value]?.[lang] || value;
};

export const catLabel = (value, lang) => pick(CATEGORY_LABELS, value, lang);
export const bookLangLabel = (value, lang) => pick(BOOK_LANG_LABELS, value, lang);
export const BOOK_LANG_VALUES = Object.keys(BOOK_LANG_LABELS).filter((v) => v !== "أخرى");