import { useRef, useState, useCallback } from "react";

const PULL_THRESHOLD = 70;
const MAX_PULL = 100;

/**
 * Basic pull-to-refresh wrapper.
 * Activates only when the page is scrolled to the top (scrollY === 0).
 * Calls onRefresh (which should return a promise) when the user pulls down
 * past the threshold.
 */
export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const onTouchStart = useCallback(
    (e) => {
      if (window.scrollY > 0 || refreshing) return;
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    },
    [refreshing]
  );

  const onTouchMove = useCallback(
    (e) => {
      if (!pulling.current || refreshing) return;
      const diff = e.touches[0].clientY - startY.current;
      if (diff <= 0) {
        setPullDistance(0);
        return;
      }
      const resisted = Math.min(diff * 0.4, MAX_PULL);
      setPullDistance(resisted);
    },
    [refreshing]
  );

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;

    if (pullDistance >= PULL_THRESHOLD) {
      setRefreshing(true);
      setPullDistance(0);
      try {
        await onRefresh();
      } catch (e) {
        /* ignore */
      }
      setRefreshing(false);
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, onRefresh, refreshing]);

  const showIndicator = pullDistance > 0 || refreshing;
  const indicatorHeight = refreshing ? PULL_THRESHOLD : pullDistance;

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      {showIndicator && (
        <div
          className="flex items-center justify-center overflow-hidden"
          style={{ height: indicatorHeight }}
        >
          <div
            className={`w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full ${
              refreshing ? "animate-spin" : ""
            }`}
          />
        </div>
      )}
      <div
        style={{
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: pulling.current ? "none" : "transform 0.2s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}