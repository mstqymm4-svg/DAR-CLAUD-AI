import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { migrateLegacySettings } from '@/lib/settingsStore'

// Suppress harmless ResizeObserver loop & Base44 preview 404 errors globally
window.addEventListener('error', (e) => {
  const msg = String(e.message || '');
  if (msg.includes('ResizeObserver') || msg.includes('[Base44 SDK Error]') || (msg.includes('Base44') && msg.includes('404'))) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (e) => {
  const msg = String(e.reason?.message || e.reason || '');
  if (msg.includes('[Base44 SDK Error]') || (msg.includes('Base44') && msg.includes('404'))) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

// Migrate old dev_* localStorage keys to new system
migrateLegacySettings();

// Apply dark mode instantly before render (from new key, fallback old key)
try {
  const newDark = localStorage.getItem("devs_dark_mode");
  const oldDark = localStorage.getItem("dev_dark_mode");
  if ((newDark || oldDark) === "true") {
    document.documentElement.classList.add("dark");
  }
} catch(e) {}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)