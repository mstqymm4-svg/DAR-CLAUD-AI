/**
 * settingsStore — permanent settings management
 * 
 * Flow:
 *  1. On app start → load from DB → apply + cache in localStorage
 *  2. On change    → apply instantly + save to DB with debounce
 *  3. On DB save   → dispatch "app-settings-changed" event so all components re-render
 *  4. If DB fails  → localStorage backup keeps it working + retry
 */
import { entities } from "@/lib/dataSource";

// ─── Default settings ─────────────────────────────────────────────────────────
export const DEFAULT_SETTINGS = {
  app_name:          "المكتبة الدينية",
  app_subtitle:      "نور العلم والمعرفة",
  logo_url:          "https://media.base44.com/images/public/69c8e483a69a0d215eee4ef7/6482533e8_IMG_2785.png",
  // Colors (HSL strings)
  color_bg:          "",
  color_fg:          "",
  color_primary:     "",
  color_secondary:   "",
  color_accent:      "",
  color_card:        "",
  color_border:       "",
  color_button:       "",
  // Dark mode colors (HSL strings)
  color_dark_bg:      "",
  color_dark_fg:      "",
  color_dark_primary: "",
  color_dark_secondary: "",
  color_dark_accent:  "",
  color_dark_card:    "",
  color_dark_border:  "",
  color_dark_button:  "",
  // Fonts per role
  font_body:         "",
  font_heading:      "",
  font_title:        "",
  font_nav:          "",
  font_button:       "",
  // Hero background
  hero_bg_type:      "gradient_anim",
  hero_bg_url:       "",
  hero_bg_opacity:   "100",
  hero_bg_blur:      "0",
  hero_bg_brightness:"100",
  hero_bg_contrast:  "100",
  hero_bg_saturation:"100",
  hero_overlay_color:"#000000",
  hero_overlay_alpha:"30",
  hero_anim_speed:   "5",
  hero_zoom:         "false",
  hero_parallax:     "false",
  hero_title:        "",
  hero_subtitle:     "",
  hero_btn_text:     "",
  hero_btn_link:     "/books",
  hero_grad_from:    "#134e2a",
  hero_grad_to:      "#1a6b3c",
  hero_slideshow_urls:"[]",
  hero_slide_transition:"fade",
  hero_slide_duration:"4",
  hero_video_autoplay:"true",
  hero_video_loop:   "true",
  hero_video_mute:   "true",
  hero_video_brightness:"100",
  hero_video_mobile: "true",
  hero_video_speed:  "1",
  hero_lottie_url:   "",
  hero_custom_html:  "",
  hero_bg_preset:    "",
  // Fonts
  font_size:         "16",
  line_height:       "1.6",
  letter_spacing:    "0",
  custom_fonts:      "[]",
  // Cards
  card_radius:       "16",
  card_padding:      "16",
  card_gap:          "16",
  card_style:        "modern",
  card_shadow:       "md",
  card_hover:        "lift",
  // UI
  ui_radius:         "12",
  // Nav
  nav_items:         "",
  // Misc
  youtube_url:       "",
  youtube_label:     "قناتنا على يوتيوب",
  youtube_sub:       "تابعونا على قناتنا لمزيد من المحتوى الإسلامي",
  app_lang:          "ar",
  dark_mode:         "false",
  theme_mode:        "light",  // light | dark | auto
  show_dev_nav:      "true",
  categories:        "",
  offline_mode:      "true",
  // Contact page
  contact_email:       "",
  contact_phone:       "",
  contact_address:     "",
  contact_intro:       "",
  contact_show_form:   "true",
  contact_telegram_url:"",
  contact_instagram_url:"",
};

// ─── localStorage helpers ─────────────────────────────────────────────────────
const LS_PREFIX = "devs_";
const ls = {
  get: (k)    => { try { return localStorage.getItem(LS_PREFIX + k); } catch(e) { return null; } },
  set: (k, v) => { try { localStorage.setItem(LS_PREFIX + k, v); }    catch(e) {} },
  getAll: ()  => {
    const result = {};
    Object.keys(DEFAULT_SETTINGS).forEach(k => {
      const v = ls.get(k);
      if (v !== null) result[k] = v;
    });
    return result;
  },
  setAll: (obj) => { Object.entries(obj).forEach(([k,v]) => ls.set(k, v)); },
};

// ─── DB helpers ───────────────────────────────────────────────────────────────
async function dbGetAll() {
  try {
    const rows = await entities.AppSettings.list('-updated_date', 200);
    const map = {};
    rows.forEach(r => { if (r.setting_key) map[r.setting_key] = r.setting_value || ""; });
    return map;
  } catch(e) { return null; }
}

async function dbSet(key, value, previousValue, userEmail) {
  try {
    const rows = await entities.AppSettings.filter({ setting_key: key });
    if (rows && rows.length > 0) {
      await entities.AppSettings.update(rows[0].id, {
        setting_value: value,
        previous_value: previousValue,
        changed_by: userEmail || "admin",
      });
    } else {
      await entities.AppSettings.create({
        setting_key: key,
        setting_value: value,
        setting_type: "text",
        changed_by: userEmail || "admin",
        previous_value: previousValue,
      });
    }
    return true;
  } catch(e) { return false; }
}

// ─── In-memory cache ──────────────────────────────────────────────────────────
let _cache = { ...DEFAULT_SETTINGS };
let _userEmail = "";

// ─── Apply settings to DOM ────────────────────────────────────────────────────
import { FONT_PRESETS, FONT_ROLES } from "@/lib/fontConstants";

function applyColorVar(cssVar, hslValue) {
  if (hslValue) document.documentElement.style.setProperty(cssVar, hslValue);
  else document.documentElement.style.removeProperty(cssVar);
}

export function applySettingsToDom(settings) {
  // Dark mode — resolve first so custom colors can be skipped in dark mode
  const themeMode = settings.theme_mode || (settings.dark_mode === "true" ? "dark" : "light");
  const systemDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
  const resolvedDark = themeMode === "dark" ? true : themeMode === "light" ? false : systemDark;
  document.documentElement.classList.toggle("dark", resolvedDark);

  // Colors — only apply custom overrides in light mode; in dark mode let CSS dark vars take effect
  const colorVars = ["--background","--foreground","--card","--popover","--accent","--secondary","--border","--input","--primary","--ring","--sidebar-primary"];
  if (!resolvedDark) {
    applyColorVar("--background",      settings.color_bg);
    applyColorVar("--foreground",      settings.color_fg);
    applyColorVar("--card",            settings.color_card);
    applyColorVar("--popover",         settings.color_card);
    applyColorVar("--accent",          settings.color_accent);
    applyColorVar("--secondary",       settings.color_secondary);
    applyColorVar("--border",          settings.color_border);
    applyColorVar("--input",           settings.color_border);
    if (settings.color_primary) {
      applyColorVar("--primary",         settings.color_primary);
      applyColorVar("--ring",            settings.color_primary);
      applyColorVar("--sidebar-primary", settings.color_primary);
    } else {
      colorVars.forEach(v => document.documentElement.style.removeProperty(v));
    }
  } else {
    // Dark mode — apply the dark custom overrides (removed automatically when empty)
    applyColorVar("--background",      settings.color_dark_bg);
    applyColorVar("--foreground",      settings.color_dark_fg);
    applyColorVar("--card",            settings.color_dark_card);
    applyColorVar("--popover",         settings.color_dark_card);
    applyColorVar("--accent",          settings.color_dark_accent);
    applyColorVar("--secondary",       settings.color_dark_secondary);
    applyColorVar("--border",          settings.color_dark_border);
    applyColorVar("--input",           settings.color_dark_border);
    applyColorVar("--primary",         settings.color_dark_primary);
    applyColorVar("--ring",            settings.color_dark_primary);
    applyColorVar("--sidebar-primary", settings.color_dark_primary);
  }

  // Fonts
  FONT_ROLES.forEach(role => {
    const fontKey = `font_${role.key}`;
    const fontName = settings[fontKey];
    if (fontName) {
      const preset = FONT_PRESETS.find(f => f.name === fontName);
      if (preset) {
        const linkId = `sf-font-${preset.name.replace(/\s+/g,"-")}`;
        if (!document.getElementById(linkId)) {
          const link = document.createElement("link");
          link.id = linkId; link.rel = "stylesheet"; link.href = preset.url;
          document.head.appendChild(link);
        }
        document.documentElement.style.setProperty(role.cssVar, preset.value);
      }
    } else {
      document.documentElement.style.removeProperty(role.cssVar);
    }
  });

  // Font size
  const size = settings.font_size;
  if (size && size !== "16") document.documentElement.style.setProperty("font-size", `${size}px`);
  else document.documentElement.style.removeProperty("font-size");
}

// ─── Dispatch change event ────────────────────────────────────────────────────
function dispatchChange() {
  window.dispatchEvent(new CustomEvent("app-settings-changed", { detail: { ..._cache } }));
  // Also fire storage event for Layout compatibility
  window.dispatchEvent(new Event("storage"));
}

// ─── Debounce save queue ──────────────────────────────────────────────────────
const _saveTimers = {};
const _pendingSaves = {};
let _saveStatus = "idle"; // idle | saving | saved | error
const _statusListeners = [];

function emitStatus(s) {
  _saveStatus = s;
  _statusListeners.forEach(fn => fn(s));
}

export function onSaveStatus(fn) {
  _statusListeners.push(fn);
  return () => { const i = _statusListeners.indexOf(fn); if (i>=0) _statusListeners.splice(i,1); };
}

export function getSaveStatus() { return _saveStatus; }

async function flushSave(key) {
  const value = _pendingSaves[key];
  delete _pendingSaves[key];
  const previous = ls.get(key) || "";
  ls.set(key, value);
  emitStatus("saving");
  const ok = await dbSet(key, value, previous, _userEmail);
  if (!ok) {
    // retry once
    await new Promise(r => setTimeout(r, 1000));
    const ok2 = await dbSet(key, value, previous, _userEmail);
    emitStatus(ok2 ? "saved" : "error");
  } else {
    emitStatus("saved");
  }
  setTimeout(() => { if (_saveStatus === "saved") emitStatus("idle"); }, 2500);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Get a setting value */
export function getSetting(key) {
  return _cache[key] ?? DEFAULT_SETTINGS[key] ?? "";
}

/** Update a setting: applies instantly + saves to DB */
export function setSetting(key, value) {
  const strVal = String(value);
  _cache[key] = strVal;
  applySettingsToDom(_cache);
  dispatchChange();

  // Debounced DB save
  clearTimeout(_saveTimers[key]);
  _pendingSaves[key] = strVal;
  _saveTimers[key] = setTimeout(() => flushSave(key), 500);
}

/** Update multiple settings at once */
export function setSettings(obj) {
  Object.entries(obj).forEach(([k,v]) => { _cache[k] = String(v); });
  applySettingsToDom(_cache);
  dispatchChange();
  Object.entries(obj).forEach(([k,v]) => {
    clearTimeout(_saveTimers[k]);
    _pendingSaves[k] = String(v);
    _saveTimers[k] = setTimeout(() => flushSave(k), 500);
  });
}

/** Load settings on app start — DB + localStorage merge (user edits in cached win) */
export async function loadSettings(userEmail) {
  _userEmail = userEmail || "";
  // 1. Apply localStorage immediately (fast path)
  const cached = ls.getAll();
  _cache = { ...DEFAULT_SETTINGS, ...cached };
  applySettingsToDom(_cache);
  dispatchChange();

  // 2. Load from DB and merge without clobbering user customization
  const dbData = await dbGetAll();
  if (dbData && Object.keys(dbData).length > 0) {
    // dbData applied first, but cached user custom values take precedence
    const merged = { ...DEFAULT_SETTINGS, ...dbData };
    Object.entries(cached).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") {
        merged[k] = String(v);
      }
    });
    _cache = merged;
    ls.setAll(_cache);
    applySettingsToDom(_cache);
    dispatchChange();
  }
  return _cache;
}

/** Get all current settings */
export function getAllSettings() { return { ..._cache }; }

// ─── Subscribe to settings changes ────────────────────────────────────────────
export function subscribeToSettings(callback) {
  const handler = (e) => callback(e.detail || getAllSettings());
  window.addEventListener("app-settings-changed", handler);
  return () => window.removeEventListener("app-settings-changed", handler);
}

// ─── Legacy localStorage keys migration ───────────────────────────────────────
// Migrate old dev_* keys to new system on first run
export function migrateLegacySettings() {
  const legacyMap = {
    "dev_app_name":      "app_name",
    "dev_app_subtitle":  "app_subtitle",
    "dev_logo_url":      "logo_url",
    "dev_bg":            "color_bg",
    "dev_fg":            "color_fg",
    "dev_primary":       "color_primary",
    "dev_accent":        "color_accent",
    "dev_card":          "color_card",
    "dev_font_body":     "font_body",
    "dev_font_heading":  "font_heading",
    "dev_font_title":    "font_title",
    "dev_font_nav":      "font_nav",
    "dev_font_button":   "font_button",
    "dev_font_size":     "font_size",
    "dev_youtube_url":   "youtube_url",
    "dev_youtube_label": "youtube_label",
    "dev_youtube_sub":   "youtube_sub",
    "dev_app_lang":      "app_lang",
    "dev_dark_mode":     "dark_mode",
    "dev_show_dev_nav":  "show_dev_nav",
    "dev_categories":    "categories",
  };
  let migrated = false;
  Object.entries(legacyMap).forEach(([oldKey, newKey]) => {
    try {
      const v = localStorage.getItem(oldKey);
      if (v !== null && !ls.get(newKey)) {
        ls.set(newKey, v);
        migrated = true;
      }
    } catch(e) {}
  });
  if (migrated) ls.set("_migrated", "1");
}