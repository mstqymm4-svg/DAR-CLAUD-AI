import React, { useEffect, useState } from "react";
import PageTransitionLoader from "@/components/loader/PageTransitionLoader";

/**
 * Page-transition loader wrapper — shows the assembling logo animation while
 * the next page is loading. Delayed slightly so instant pages never flicker.
 */
export default function PageLogoLoader({ overlay = false, delay = 120 }) {
  const [show, setShow] = useState(delay === 0);

  useEffect(() => {
    if (delay === 0) return;
    const t = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  if (!show) return <div className="min-h-[60vh] w-full bg-background" />;

  return <PageTransitionLoader inline={!overlay} />;
}