import { useEffect, useRef } from "react";
import UserLayer from "./UserLayer";
import MediaLayer from "./MediaLayer";

// ── Canvas / CSS effect layers, composable on top of any hero background ──────

export function ParticlesCanvas({ speed }) {
  const canvasRef = useRef();
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    const particles = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      r: Math.random() * 3 + 1,
      dx: (Math.random() - 0.5) * speed * 0.4,
      dy: (Math.random() - 0.5) * speed * 0.4,
      alpha: Math.random() * 0.8 + 0.2
    }));
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,215,100,${p.alpha})`;
        ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [speed]);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

export function StarsCanvas({ speed }) {
  const canvasRef = useRef();
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf, t = 0;
    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 2 + 0.5,
      twinkle: Math.random() * Math.PI * 2
    }));
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.01 * speed;
      stars.forEach((s) => {
        const alpha = 0.4 + 0.6 * Math.abs(Math.sin(t + s.twinkle));
        ctx.beginPath();
        ctx.arc(s.x * canvas.width, s.y * canvas.height, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,200,${alpha})`;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [speed]);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

export function IslamicPatternSvg({ color2, speed }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="islamic" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <polygon points="40,5 75,25 75,55 40,75 5,55 5,25" fill="none" stroke={color2} strokeWidth="1.5" />
            <polygon points="40,15 65,28 65,52 40,65 15,52 15,28" fill="none" stroke={color2} strokeWidth="0.8" opacity="0.6" />
            <circle cx="40" cy="40" r="5" fill="none" stroke={color2} strokeWidth="1" />
            <line x1="40" y1="5" x2="40" y2="15" stroke={color2} strokeWidth="0.8" />
            <line x1="75" y1="25" x2="65" y2="28" stroke={color2} strokeWidth="0.8" />
            <line x1="75" y1="55" x2="65" y2="52" stroke={color2} strokeWidth="0.8" />
            <line x1="40" y1="75" x2="40" y2="65" stroke={color2} strokeWidth="0.8" />
            <line x1="5" y1="55" x2="15" y2="52" stroke={color2} strokeWidth="0.8" />
            <line x1="5" y1="25" x2="15" y2="28" stroke={color2} strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#islamic)"
          style={{ animation: `effSlide ${20 / speed}s linear infinite` }} />
      </svg>
      <style>{`@keyframes effSlide { from { transform: translate(0,0); } to { transform: translate(80px, 80px); } }`}</style>
    </div>);
}

export function WavesAnimation({ color2, speed }) {
  const dur = 6 / speed;
  return (
    <div className="absolute inset-0 overflow-hidden">
      {[1, 2, 3].map((i) =>
        <div key={i} className="absolute bottom-0 left-0 right-0"
          style={{
            height: `${30 + i * 10}%`,
            background: `${color2}${i === 1 ? "33" : i === 2 ? "22" : "15"}`,
            borderRadius: "100% 100% 0 0",
            animation: `effWave ${dur + i}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.3}s`
          }} />
      )}
      <style>{`@keyframes effWave { from { transform: translateX(-5%) scaleY(1); } to { transform: translateX(5%) scaleY(1.1); } }`}</style>
    </div>);
}

export function FloatingShapes({ color2, speed }) {
  const shapes = [
    { top: "10%", left: "5%", size: 60, shape: "hex", delay: 0 },
    { top: "70%", left: "8%", size: 40, shape: "diamond", delay: 1 },
    { top: "20%", right: "5%", size: 80, shape: "hex", delay: 0.5 },
    { top: "60%", right: "3%", size: 50, shape: "diamond", delay: 1.5 },
    { top: "40%", left: "15%", size: 30, shape: "circle", delay: 2 },
    { top: "50%", right: "12%", size: 35, shape: "circle", delay: 2.5 }];
  const dur = 4 / speed;
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {shapes.map((s, i) =>
        <div key={i} className="absolute opacity-20"
          style={{
            top: s.top, left: s.left, right: s.right,
            width: s.size, height: s.size,
            background: color2,
            borderRadius: s.shape === "circle" ? "50%" : s.shape === "diamond" ? "4px" : "20%",
            transform: s.shape === "diamond" ? "rotate(45deg)" : undefined,
            animation: `effFloat${i} ${dur + i * 0.5}s ease-in-out infinite`
          }} />
      )}
      <style>{shapes.map((_, i) =>
        `@keyframes effFloat${i} { 0%,100% { transform: translateY(0) rotate(${i * 30}deg); } 50% { transform: translateY(-20px) rotate(${i * 30 + 10}deg); } }`
      ).join("")}</style>
    </div>);
}

// ── New effects ────────────────────────────────────────────────────────────────

export function SnowCanvas({ speed }) {
  const canvasRef = useRef();
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    const flakes = Array.from({ length: 70 }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      r: Math.random() * 3 + 1,
      dy: (Math.random() * 0.8 + 0.4) * speed * 0.5,
      dx: Math.random() * 0.6 - 0.3,
      alpha: Math.random() * 0.5 + 0.4
    }));
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      flakes.forEach((f) => {
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${f.alpha})`;
        ctx.fill();
        f.y += f.dy; f.x += f.dx + Math.sin(f.y / 30) * 0.4;
        if (f.y > canvas.height) { f.y = -5; f.x = Math.random() * canvas.width; }
        if (f.x < 0) f.x = canvas.width; if (f.x > canvas.width) f.x = 0;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [speed]);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

export function RainCanvas({ speed }) {
  const canvasRef = useRef();
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    const drops = Array.from({ length: 90 }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      len: Math.random() * 14 + 8,
      dy: (Math.random() * 3 + 4) * speed * 0.5,
      alpha: Math.random() * 0.3 + 0.15
    }));
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.lineWidth = 1;
      drops.forEach((d) => {
        ctx.strokeStyle = `rgba(190,220,255,${d.alpha})`;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x - 2, d.y + d.len);
        ctx.stroke();
        d.y += d.dy;
        if (d.y > canvas.height) { d.y = -d.len; d.x = Math.random() * canvas.width; }
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [speed]);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

export function FirefliesCanvas({ speed }) {
  const canvasRef = useRef();
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf, t = 0;
    const flies = Array.from({ length: 30 }, () => ({
      x: Math.random() * canvas.offsetWidth,
      y: Math.random() * canvas.offsetHeight,
      r: Math.random() * 2.5 + 1,
      ang: Math.random() * Math.PI * 2,
      pulse: Math.random() * Math.PI * 2
    }));
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      t += 0.02 * speed;
      flies.forEach((f) => {
        f.ang += (Math.random() - 0.5) * 0.3;
        f.x += Math.cos(f.ang) * speed * 0.3;
        f.y += Math.sin(f.ang) * speed * 0.3;
        if (f.x < 0) f.x = canvas.width; if (f.x > canvas.width) f.x = 0;
        if (f.y < 0) f.y = canvas.height; if (f.y > canvas.height) f.y = 0;
        const alpha = 0.25 + 0.75 * Math.abs(Math.sin(t + f.pulse));
        const grad = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 4);
        grad.addColorStop(0, `rgba(200,255,120,${alpha})`);
        grad.addColorStop(1, "rgba(200,255,120,0)");
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * 4, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [speed]);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

export function BubblesLayer({ speed }) {
  const bubbles = Array.from({ length: 14 }, (_, i) => ({
    left: (i * 7 + Math.random() * 5) % 100,
    size: Math.random() * 24 + 10,
    dur: (Math.random() * 6 + 7) / speed,
    delay: Math.random() * -12
  }));
  return (
    <div className="absolute inset-0 overflow-hidden">
      {bubbles.map((b, i) => (
        <div key={i} className="absolute rounded-full"
          style={{
            left: `${b.left}%`,
            bottom: `-10%`,
            width: b.size, height: b.size,
            background: "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35), rgba(255,255,255,0.05))",
            border: "1px solid rgba(255,255,255,0.25)",
            animation: `effBubble ${b.dur}s linear infinite`,
            animationDelay: `${b.delay}s`
          }} />
      ))}
      <style>{`@keyframes effBubble { from { transform: translateY(0); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } to { transform: translateY(-110vh); opacity: 0; } }`}</style>
    </div>);
}

export function LightRays({ speed }) {
  const dur = 14 / speed;
  return (
    <div className="absolute inset-0 overflow-hidden opacity-40"
      style={{ animation: `effRays ${dur}s linear infinite` }}>
      {[15, 35, 55, 75].map((left, i) => (
        <div key={i} className="absolute top-[-30%] h-[160%]"
          style={{
            left: `${left}%`,
            width: 70 + i * 30,
            background: "linear-gradient(to bottom, rgba(255,240,180,0.35), transparent 70%)",
            clipPath: "polygon(40% 0, 60% 0, 100% 100%, 0% 100%)",
            filter: "blur(8px)"
          }} />
      ))}
      <style>{`@keyframes effRays { from { transform: rotate(0deg) scale(1.2); } to { transform: rotate(8deg) scale(1.2); } }`}</style>
    </div>);
}

export function AuroraLayer({ color2, speed }) {
  const dur = 10 / speed;
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ filter: "blur(30px)" }}>
      <div className="absolute top-[-20%] left-[10%] w-[50%] h-[70%] rounded-full"
        style={{
          background: `linear-gradient(120deg, rgba(80,220,160,0.35), ${color2}55)`,
          animation: `effAurora1 ${dur}s ease-in-out infinite alternate` }} />
      <div className="absolute top-[-10%] right-[5%] w-[45%] h-[60%] rounded-full"
        style={{
          background: "linear-gradient(60deg, rgba(100,180,255,0.3), rgba(160,100,255,0.25))",
          animation: `effAurora2 ${dur + 3}s ease-in-out infinite alternate` }} />
      <style>{`
        @keyframes effAurora1 { from { transform: translateX(-15%) skewX(-8deg); } to { transform: translateX(20%) skewX(10deg); } }
        @keyframes effAurora2 { from { transform: translateX(15%) skewX(10deg); } to { transform: translateX(-18%) skewX(-10deg); } }
      `}</style>
    </div>);
}

export function GridPattern({ speed }) {
  const dur = 3 / speed;
  return (
    <div className="absolute inset-0 overflow-hidden opacity-25">
      <div className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.35) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          animation: `effGrid ${dur}s linear infinite`,
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)"
        }} />
      <style>{`@keyframes effGrid { from { transform: perspective(400px) translateY(0); } to { transform: perspective(400px) translateY(48px); } }`}</style>
    </div>);
}

// ── Renderer: draws the enabled composable layers ──────────────────────────────
export default function ExtraEffectLayers({ layers = [], speed, color2, customHtml, customLayers = [] }) {
  if (!layers.length) return null;
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {layers.includes("particles") && <ParticlesCanvas speed={speed} />}
      {layers.includes("stars") && <StarsCanvas speed={speed} />}
      {layers.includes("waves") && <WavesAnimation color2={color2} speed={speed} />}
      {layers.includes("islamic_pattern") && <IslamicPatternSvg color2={color2} speed={speed} />}
      {layers.includes("floating_shapes") && <FloatingShapes color2={color2} speed={speed} />}
      {layers.includes("snow") && <SnowCanvas speed={speed} />}
      {layers.includes("rain") && <RainCanvas speed={speed} />}
      {layers.includes("fireflies") && <FirefliesCanvas speed={speed} />}
      {layers.includes("bubbles") && <BubblesLayer speed={speed} />}
      {layers.includes("light_rays") && <LightRays speed={speed} />}
      {layers.includes("aurora") && <AuroraLayer color2={color2} speed={speed} />}
      {layers.includes("grid") && <GridPattern speed={speed} />}
      {layers.includes("custom_html") && customHtml &&
        <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: customHtml }} />}
      {/* User-defined layers (created in the admin panel) */}
      {customLayers.filter(cl => layers.includes("custom:" + cl.id)).map(cl =>
        cl.url
          ? <MediaLayer key={cl.id} cfg={cl} />
          : cl.effect
            ? <UserLayer key={cl.id} cfg={cl} />
            : <div key={cl.id} className="absolute inset-0" dangerouslySetInnerHTML={{ __html: cl.html }} />)}
    </div>
  );
}