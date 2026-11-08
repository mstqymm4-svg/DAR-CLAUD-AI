/**
 * MediaLayer — a hero overlay layer built from an uploaded image / GIF / video.
 * No code needed: the admin picks a file, a blend mode, opacity and a motion.
 */
export const BLEND_MODES = [
  { id: "normal",  label: "عادي" },
  { id: "screen",  label: "إضاءة" },
  { id: "overlay", label: "تراكب" },
  { id: "lighten", label: "تفتيح" },
  { id: "soft-light", label: "ضوء ناعم" },
  { id: "multiply", label: "تعتيم" },
];

export const MOTIONS = [
  { id: "none",   label: "ثابت" },
  { id: "drift",  label: "انسياب" },
  { id: "zoom",   label: "تكبير" },
  { id: "spin",   label: "دوران" },
  { id: "pulse",  label: "نبض" },
];

const KEYFRAMES = `
@keyframes mlDrift { from { transform: translate3d(-3%,0,0) scale(1.08); } to { transform: translate3d(3%,-2%,0) scale(1.08); } }
@keyframes mlZoom  { from { transform: scale(1); } to { transform: scale(1.18); } }
@keyframes mlSpin  { from { transform: rotate(0deg) scale(1.3); } to { transform: rotate(360deg) scale(1.3); } }
@keyframes mlPulse { from { opacity: 0.35; } to { opacity: 1; } }
`;

export default function MediaLayer({ cfg }) {
  if (!cfg?.url) return null;
  const speed = Number(cfg.speed) || 5;
  const dur = 20 / speed;
  const anim = {
    drift: `mlDrift ${dur}s ease-in-out infinite alternate`,
    zoom:  `mlZoom ${dur}s ease-in-out infinite alternate`,
    spin:  `mlSpin ${dur * 3}s linear infinite`,
    pulse: `mlPulse ${dur / 2}s ease-in-out infinite alternate`,
  }[cfg.motion] || undefined;

  const style = {
    mixBlendMode: cfg.blend || "normal",
    opacity: (Number(cfg.opacity) || 70) / 100,
    animation: anim,
  };
  const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(cfg.url);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {isVideo ? (
        <video src={cfg.url} className="absolute inset-0 w-full h-full object-cover"
          style={style} muted loop autoPlay playsInline />
      ) : cfg.tile ? (
        <div className="absolute inset-0" style={{
          ...style,
          backgroundImage: `url(${cfg.url})`,
          backgroundRepeat: "repeat",
          backgroundSize: `${cfg.tileSize || 160}px auto`,
        }} />
      ) : (
        <img src={cfg.url} alt="" className="absolute inset-0 w-full h-full object-cover" style={style} />
      )}
      <style>{KEYFRAMES}</style>
    </div>
  );
}