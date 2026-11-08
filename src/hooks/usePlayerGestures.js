import { useRef, useState, useCallback } from "react";

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

/**
 * Touch gestures for the video player:
 * - Double-tap left/right half: skip -/+10s (with ripple feedback)
 * - Horizontal drag: scrub with a seek preview (committed on release)
 * - Vertical drag: left half adjusts screen brightness, right half adjusts volume
 */
export function usePlayerGestures({ player, duration, getCurrentTime }) {
  const [seekPreview, setSeekPreview] = useState(null); // { time, delta }
  const [adjust, setAdjust] = useState(null); // { type: 'volume'|'brightness', value }
  const [ripple, setRipple] = useState(null); // { side, key }
  const [brightness, setBrightness] = useState(1);

  const touch = useRef(null);
  const lastTap = useRef({ t: 0, side: "" });
  const clearTimer = useRef(null);
  const brightRef = useRef(1);

  const clearFeedback = useCallback(() => {
    if (clearTimer.current) clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => {
      setSeekPreview(null);
      setAdjust(null);
    }, 600);
  }, []);

  const onTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return;
    if (clearTimer.current) {
      clearTimeout(clearTimer.current);
      clearTimer.current = null;
    }
    let vol = 100;
    try { vol = player?.getVolume?.() ?? 100; } catch {}
    touch.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: getCurrentTime() || 0,
      volume: vol,
      bright: brightRef.current,
      mode: null,
      target: null,
      w: e.currentTarget.clientWidth || window.innerWidth,
      h: e.currentTarget.clientHeight || window.innerHeight,
    };
  }, [player, getCurrentTime]);

  const onTouchMove = useCallback((e) => {
    const st = touch.current;
    if (!st || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - st.x;
    const dy = e.touches[0].clientY - st.y;

    if (!st.mode) {
      if (Math.abs(dx) > 34 && Math.abs(dx) > Math.abs(dy)) st.mode = "seek";
      else if (Math.abs(dy) > 34) st.mode = st.x < st.w / 2 ? "brightness" : "volume";
    }
    if (!st.mode) return;

    if (st.mode === "seek") {
      const ratio = clamp(dx / (st.w * 0.9), -1, 1);
      const span = duration || 0;
      st.target = clamp(st.time + ratio * span, 0, span || st.time);
      setSeekPreview({ time: st.target, delta: st.target - st.time });
      setAdjust(null);
    } else if (st.mode === "brightness") {
      const v = clamp(st.bright - dy / (st.h * 0.7), 0.25, 1);
      brightRef.current = v;
      setBrightness(v);
      setAdjust({ type: "brightness", value: Math.round(v * 100) });
      setSeekPreview(null);
    } else {
      const v = clamp(st.volume - (dy / (st.h * 0.6)) * 100, 0, 100);
      try {
        player?.setVolume?.(v);
        player?.unMute?.();
      } catch {}
      setAdjust({ type: "volume", value: Math.round(v) });
      setSeekPreview(null);
    }
  }, [player, duration]);

  const onTouchEnd = useCallback(() => {
    const st = touch.current;
    touch.current = null;
    if (!st) return;

    if (st.mode === "seek" && st.target != null) {
      try { player?.seekTo(st.target, true); } catch {}
      clearFeedback();
      return;
    }
    if (st.mode) {
      clearFeedback();
      return;
    }

    // Tap → double-tap skip
    const now = Date.now();
    const side = st.x < st.w / 2 ? "left" : "right";
    if (now - lastTap.current.t < 300 && lastTap.current.side === side) {
      lastTap.current = { t: 0, side: "" };
      const target = clamp(getCurrentTime() + (side === "left" ? -10 : 10), 0, duration || 1e9);
      try { player?.seekTo(target, true); } catch {}
      setRipple({ side, key: now });
      setTimeout(() => setRipple(null), 550);
    } else {
      lastTap.current = { t: now, side };
    }
  }, [player, duration, getCurrentTime, clearFeedback]);

  return { onTouchStart, onTouchMove, onTouchEnd, seekPreview, adjust, ripple, brightness };
}