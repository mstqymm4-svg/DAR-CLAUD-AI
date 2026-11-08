import { useEffect, useState, useCallback, useRef } from "react";
import { onContentChange, getSyncStatus, forceSyncNow } from "@/lib/contentSyncEngine";

/**
 * useContentSync — React hook for subscribing to content sync events.
 *
 * Returns:
 * - syncStatus: { isSyncing, lastSync, lastResult, error }
 * - changedEntities: Set of entity names that changed since last render
 * - refresh: manually trigger a sync
 * - lastChangeEvent: the last content_changed event
 */
export function useContentSync() {
  const [syncStatus, setSyncStatus] = useState(getSyncStatus());
  const [lastChangeEvent, setLastChangeEvent] = useState(null);
  const [changeCount, setChangeCount] = useState(0);

  useEffect(() => {
    const unsub = onContentChange((event) => {
      if (event.type === "status") {
        setSyncStatus(event.status);
      } else if (event.type === "content_changed") {
        setLastChangeEvent(event);
        setChangeCount((c) => c + 1);
      }
    });
    return unsub;
  }, []);

  const refresh = useCallback(() => {
    forceSyncNow().catch(() => {});
  }, []);

  return { syncStatus, lastChangeEvent, changeCount, refresh };
}

/**
 * useContentRefresh — Hook for pages that display content lists.
 * Calls `onContentChanged` whenever content of the specified entities changes.
 *
 * @param {string[]} entities — e.g. ["books"], ["videos"], ["channels"]
 * @param {Function} onContentChanged — callback to re-fetch data
 */
export function useContentRefresh(entities, onContentChanged) {
  const savedCallback = useRef(onContentChanged);

  useEffect(() => {
    savedCallback.current = onContentChanged;
  }, [onContentChanged]);

  useEffect(() => {
    const unsub = onContentChange((event) => {
      if (event.type === "content_changed" && entities.includes(event.entity)) {
        savedCallback.current?.();
      }
      // Also refresh on sync_complete if there were any changes
      if (event.type === "sync_complete" && event.result) {
        const hasAnyChange = entities.some((ent) => {
          const r = event.result[ent];
          return r && !r.error && (r.new > 0 || r.updated > 0 || r.deleted > 0);
        });
        if (hasAnyChange) savedCallback.current?.();
      }
    });
    return unsub;
  }, [entities.join(",")]);
}