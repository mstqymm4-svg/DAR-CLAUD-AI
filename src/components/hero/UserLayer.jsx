import { useEffect, useRef } from "react";

// ── No-code user-defined layers: pick a shape, a color, density & speed ────────

export const USER_LAYER_EFFECTS = [
  { id: "particles", label: "جزيئات",  icon: "✨" },
  { id: "stars",     label: "نجوم",    icon: "⭐" },
  { id: "snow",      label: "ثلج",     icon: "❄" },
  { id: "rain",      label: "مطر",      icon: "🌧" },
  { id: "fireflies", label: "يراعات",  icon: "🟢" },
  { id: "bubbles",   label: "فقاعات",  icon: "🫧" },
];

const hexToRgb = (hex) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "#ffffff");
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [255, 255, 255];
};

function ParamCanvas({ kind, color, density = 60, speed = 5 }) {
  const canvasRef = useRef();
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf, t = 0;
    const [r, g, b] = hexToRgb(color);
    const rgb = `${r},${g},${b}`;
    const n = Math.max(10, Math.round(Number(density) || 60));
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);
    const W = () => canvas.width;
    const H = () => canvas.height;

    const spawn = () => {
      switch (kind) {
        case "particles": return { x: Math.random() * W(), y: Math.random() * H(), r: Math.random() * 3 + 1, dx: (Math.random() - 0.5) * speed * 0.4, dy: (Math.random() - 0.5) * speed * 0.4, a: Math.random() * 0.6 + 0.3 };
        case "stars":     return { x: Math.random(), y: Math.random(), r: Math.random() * 2 + 0.6, tw: Math.random() * Math.PI * 2 };
        case "snow":      return { x: Math.random() * W(), y: Math.random() * H(), r: Math.random() * 3 + 1, dy: (Math.random() * 0.8 + 0.4) * speed * 0.5, dx: Math.random() * 0.6 - 0.3, a: Math.random() * 0.5 + 0.4 };
        case "rain":      return { x: Math.random() * W(), y: Math.random() * H(), len: Math.random() * 14 + 8, dy: (Math.random() * 3 + 4) * speed * 0.5, a: Math.random() * 0.35 + 0.2 };
        case "fireflies": return { x: Math.random() * W(), y: Math.random() * H(), r: Math.random() * 2.5 + 1, ang: Math.random() * Math.PI * 2, pu: Math.random() * Math.PI * 2 };
        case "bubbles":   return { x: Math.random() * W(), y: Math.random() * H(), r: Math.random() * 12 + 6, dy: (Math.random() + 1.2) * speed * 0.5, a: Math.random() * 0.3 + 0.15 };
        default: return null;
      }
    };
    const items = Array.from({ length: n }, spawn).filter(Boolean);

    const draw = () => {
      ctx.clearRect(0, 0, W(), H());
      t += 0.02 * speed;
      items.forEach(p => {
        if (kind === "particles") {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb},${p.a})`; ctx.fill();
          p.x += p.dx; p.y += p.dy;
          if (p.x < 0) p.x = W(); if (p.x > W()) p.x = 0;
          if (p.y < 0) p.y = H(); if (p.y > H()) p.y = 0;
        } else if (kind === "stars") {
          const a = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + p.tw));
          ctx.beginPath(); ctx.arc(p.x * W(), p.y * H(), p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb},${a})`; ctx.fill();
        } else if (kind === "snow") {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb},${p.a})`; ctx.fill();
          p.y += p.dy; p.x += p.dx + Math.sin(p.y / 30) * 0.4;
          if (p.y > H()) { p.y = -5; p.x = Math.random() * W(); }
          if (p.x < 0) p.x = W(); if (p.x > W()) p.x = 0;
        } else if (kind === "rain") {
          ctx.strokeStyle = `rgba(${rgb},${p.a})`; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 2, p.y + p.len); ctx.stroke();
          p.y += p.dy;
          if (p.y > H()) { p.y = -p.len; p.x = Math.random() * W(); }
        } else if (kind === "fireflies") {
          p.ang += (Math.random() - 0.5) * 0.3;
          p.x += Math.cos(p.ang) * speed * 0.3; p.y += Math.sin(p.ang) * speed * 0.3;
          if (p.x < 0) p.x = W(); if (p.x > W()) p.x = 0;
          if (p.y < 0) p.y = H(); if (p.y > H()) p.y = 0;
          const a = 0.25 + 0.75 * Math.abs(Math.sin(t * 3 + p.pu));
          const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
          gr.addColorStop(0, `rgba(${rgb},${a})`);
          gr.addColorStop(1, `rgba(${rgb},0)`);
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
          ctx.fillStyle = gr; ctx.fill();
        } else if (kind === "bubbles") {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${rgb},0.06)`;
          ctx.strokeStyle = `rgba(${rgb},${p.a + 0.15})`; ctx.lineWidth = 1;
          ctx.fill(); ctx.stroke();
          p.y -= p.dy; p.x += Math.sin(t * 2 + p.r) * 0.3;
          if (p.y < -p.r * 2) { p.y = H() + p.r; p.x = Math.random() * W(); }
        }
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [kind, color, density, speed]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

export default function UserLayer({ cfg }) {
  if (!cfg?.effect || !USER_LAYER_EFFECTS.some(e => e.id === cfg.effect)) return null;
  return <ParamCanvas kind={cfg.effect} color={cfg.color} density={cfg.density} speed={cfg.speed} />;
}