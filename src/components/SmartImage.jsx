import { useState, useEffect } from "react";
import { getCachedImageBlobUrl } from "@/lib/offlineDB";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

/**
 * SmartImage — displays images with offline support.
 * If offline and image is cached in IndexedDB, shows blob URL.
 * If online, shows original URL.
 * Falls back to fallback element if image fails to load.
 */
export default function SmartImage({ src, alt = "", className = "", fallback: Fallback = null, ...props }) {
  const [imgSrc, setImgSrc] = useState(src);
  const [failed, setFailed] = useState(false);
  const { isOnline } = useOnlineStatus();

  useEffect(() => {
    setImgSrc(src);
    setFailed(false);

    // If offline, try to get cached version
    if (!isOnline && src) {
      getCachedImageBlobUrl(src).then((blobUrl) => {
        if (blobUrl) setImgSrc(blobUrl);
      });
    }
  }, [src, isOnline]);

  if (failed || !imgSrc) {
    return Fallback ? <Fallback /> : null;
  }

  return (
    <img
      src={imgSrc}
      alt={alt}
      loading="lazy"
      className={className}
      onError={() => setFailed(true)}
      {...props}
    />
  );
}