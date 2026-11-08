import { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useT } from "@/lib/i18n";
import { onContentChange, getSyncStatus } from "@/lib/contentSyncEngine";

/**
 * SyncStatusBadge — Shows a subtle sync indicator in the corner.
 * - Spinning icon while syncing
 * - Green check briefly when sync completes with changes
 * - Gray cloud when idle/online
 * - Gray cloud-off when offline
 * Auto-hides after a few seconds when idle.
 */
export default function SyncStatusBadge() {
  const t = useT();
  const [status, setStatus] = useState(getSyncStatus());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const unsub = onContentChange((event) => {
      if (event.type === "status") setStatus(event.status);
      if (event.type === "sync_complete") {
        const r = event.result;
        const hasChanges = r && Object.values(r).some(
          (v) => v && !v.error && (v.new > 0 || v.updated > 0 || v.deleted > 0)
        );
        if (hasChanges) {
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        }
      }
    });

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      unsub();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Nothing to show when idle — the app looks identical online and offline
  if (!status.isSyncing && !showSuccess && !status.error) return null;

  return (
    <AnimatePresence>
      
















      
    </AnimatePresence>);

}