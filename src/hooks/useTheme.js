/**
 * useTheme — React hook for the theme engine
 * Usage: const { mode, isDark, setMode } = useTheme();
 */
import { useState, useEffect } from "react";
import {
  getThemeState,
  setThemeMode,
  subscribeToTheme,
  initThemeEngine,
} from "@/lib/themeEngine";

let _initialized = false;

export function useTheme() {
  const [state, setState] = useState(() => getThemeState());

  useEffect(() => {
    if (!_initialized) {
      initThemeEngine();
      _initialized = true;
    }
    // Sync with external changes
    const unsub = subscribeToTheme(({ mode, isDark }) => {
      setState({ mode, isDark });
    });
    // Ensure DOM is in sync with current state
    setState(getThemeState());
    return unsub;
  }, []);

  const setMode = (mode) => {
    const isDark = setThemeMode(mode);
    setState({ mode, isDark });
  };

  return { ...state, setMode };
}