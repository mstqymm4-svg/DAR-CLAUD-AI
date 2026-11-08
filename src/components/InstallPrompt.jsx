import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share, Plus } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function InstallPrompt() {
  const t = useT();
  const deferredRef = useRef(null);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Already installed as PWA? → do nothing
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem("pwa_auto_attempted") === "true") return;

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandaloneIOS = window.navigator.standalone === true;

    if (isIOS && !isStandaloneIOS) {
      // iOS doesn't support auto-prompt — show instructions after a brief moment
      const t = setTimeout(() => setShowIOSGuide(true), 1500);
      return () => clearTimeout(t);
    }

    // Android/Chrome: capture beforeinstallprompt, then fire on first interaction
    const capturePrompt = (e) => {
      e.preventDefault();
      deferredRef.current = e;
    };

    const triggerOnFirstInteraction = () => {
      if (!deferredRef.current) return;
      // Must be called from a user gesture
      deferredRef.current.prompt();
      deferredRef.current = null;
      localStorage.setItem("pwa_auto_attempted", "true");
      cleanup();
    };

    function cleanup() {
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      document.removeEventListener("click", triggerOnFirstInteraction);
      document.removeEventListener("touchend", triggerOnFirstInteraction);
    }

    window.addEventListener("beforeinstallprompt", capturePrompt);
    // Fire automatically on every tap/click until the prompt is shown
    document.addEventListener("click", triggerOnFirstInteraction);
    document.addEventListener("touchend", triggerOnFirstInteraction);

    return cleanup;
  }, []);

  const dismissIOS = () => {
    setShowIOSGuide(false);
    localStorage.setItem("pwa_auto_attempted", "true");
  };

  return (
    <AnimatePresence>
      {showIOSGuide && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          onClick={dismissIOS}
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-card rounded-2xl shadow-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Plus className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-base font-bold mb-1">{t.installTitle}</h3>
              <p className="text-xs text-muted-foreground">{t.installSub}</p>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">1</span>
                <p className="text-xs">{t.installStep1}</p>
                <Share className="w-4 h-4 text-primary mr-auto" />
              </div>
              <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">2</span>
                <p className="text-xs">{t.installStep2}</p>
                <Plus className="w-4 h-4 text-primary mr-auto" />
              </div>
            </div>

            <button
              onClick={dismissIOS}
              className="w-full bg-primary text-primary-foreground text-sm font-bold py-2.5 rounded-xl hover:bg-primary/90 active:scale-95 transition-all"
            >
              {t.installOk}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}