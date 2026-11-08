import { Home, BookOpen, Video, Heart, Settings, Info, MessageCircle, Code } from "lucide-react";
import { getSetting } from "@/lib/settingsStore";

// Single source of truth for the app's navigation bar.
// `labelKey` maps to the i18n dictionary; an admin-set `label` overrides it.
export const NAV_ICONS = { Home, BookOpen, Video, Heart, Settings, Info, MessageCircle, Code };

export const DEFAULT_NAV_ITEMS = [
  { id: "home",      path: "/",          icon: "Home",          labelKey: "navHome",      label: "الرئيسية",  visible: true },
  { id: "books",     path: "/books",     icon: "BookOpen",      labelKey: "navBooks",     label: "المكتبة",   visible: true },
  { id: "videos",    path: "/videos",    icon: "Video",         labelKey: "navVideos",    label: "الفيديوهات", visible: true },
  { id: "favorites", path: "/favorites", icon: "Heart",         labelKey: "navFav",       label: "المفضلة",   visible: true },
  { id: "settings",  path: "/settings",  icon: "Settings",      labelKey: "navSettings",  label: "الإعدادات", visible: true },
  { id: "about",     path: "/about",     icon: "Info",          labelKey: "aboutTitle",   label: "من نحن",    visible: false },
  { id: "contact",   path: "/contact",   icon: "MessageCircle", labelKey: "contactTitle", label: "تواصل معنا", visible: false },
];

/** Read the admin-configured nav items, falling back to the defaults. */
export function readNavItems(rawValue) {
  const raw = rawValue !== undefined ? rawValue : getSetting("nav_items");
  try {
    const parsed = JSON.parse(raw || "null");
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_NAV_ITEMS;
    // Merge so newly supported pages appear (hidden) for existing installs
    const known = new Set(parsed.map(i => i.id));
    const merged = parsed.map(item => {
      const base = DEFAULT_NAV_ITEMS.find(d => d.id === item.id);
      return base ? { ...base, ...item } : item;
    }).filter(item => item.path && item.icon && item.id !== "dev" && item.id !== "gmail"); // the Dev link is handled separately
    DEFAULT_NAV_ITEMS.forEach(d => {
      if (!known.has(d.id)) merged.push({ ...d, visible: false });
    });
    return merged;
  } catch (e) {
    return DEFAULT_NAV_ITEMS;
  }
}