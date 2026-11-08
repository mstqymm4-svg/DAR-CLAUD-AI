/**
 * Theme Engine — Professional dark/light/auto mode management
 * 
 * Flow:
 * 1. On load → read from DB (via settingsStore) → apply to DOM
 * 2. On change → apply instantly to DOM → save to DB
 * 3. Auto mode → follows system preference in real-time
 */
import { getSetting, setSetting, subscribeToSettings } from "@/lib/settingsStore";

// ── Listeners ──────────────────────────────────────────────────────────────────
const _listeners = [];
let _mediaQuery = null;
let _currentMode = "light"; // light | dark | auto

function notifyListeners(mode, isDark) {
  _listeners.forEach(fn => fn({ mode, isDark }));
}

function applyTheme(isDark) {
  const root = document.documentElement;
  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

function getSystemIsDark() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

function resolveIsDark(mode) {
  if (mode === "dark")  return true;
  if (mode === "light") return false;
  return getSystemIsDark(); // auto
}

// ── Media query listener for auto mode ────────────────────────────────────────
function setupMediaQuery() {
  if (_mediaQuery) {
    _mediaQuery.removeEventListener("change", onSystemChange);
  }
  _mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
  _mediaQuery?.addEventListener("change", onSystemChange);
}

function onSystemChange(e) {
  if (_currentMode === "auto") {
    applyTheme(e.matches);
    notifyListeners("auto", e.matches);
  }
}

// ── Public API ─────────────────────────────────────────────────────────────────

/** Initialize — call once on app start */
export function initThemeEngine() {
  setupMediaQuery();

  // Read from settingsStore (already loaded from DB by loadSettings)
  const rawMode = getSetting("theme_mode") || (getSetting("dark_mode") === "true" ? "dark" : "light");
  _currentMode = rawMode;
  const isDark = resolveIsDark(rawMode);
  applyTheme(isDark);

  // Subscribe to remote changes (e.g. another tab)
  subscribeToSettings((s) => {
    const newMode = s.theme_mode || (s.dark_mode === "true" ? "dark" : "light");
    if (newMode !== _currentMode) {
      _currentMode = newMode;
      const dark = resolveIsDark(newMode);
      applyTheme(dark);
      notifyListeners(newMode, dark);
    }
  });

  return { mode: _currentMode, isDark };
}

/** Get current theme mode */
export function getThemeMode() { return _currentMode; }

/** Get resolved isDark boolean */
export function getIsDark() { return resolveIsDark(_currentMode); }

/** Set theme mode: 'light' | 'dark' | 'auto' */
export function setThemeMode(mode) {
  _currentMode = mode;
  const isDark = resolveIsDark(mode);
  applyTheme(isDark);
  notifyListeners(mode, isDark);

  // Persist both keys for backward compat
  setSetting("theme_mode", mode);
  setSetting("dark_mode", String(isDark));

  return isDark;
}

/** Subscribe to theme changes */
export function subscribeToTheme(callback) {
  _listeners.push(callback);
  return () => {
    const i = _listeners.indexOf(callback);
    if (i >= 0) _listeners.splice(i, 1);
  };
}

/** Hook-friendly: returns current state */
export function getThemeState() {
  return {
    mode: _currentMode,
    isDark: resolveIsDark(_currentMode),
  };
}