import React from "react";

/**
 * Vector rebuild of the Dar Al Uloom mark ("D" arch + mihrab + crescent +
 * blue bars + base + floating squares). Every element is its own node so the
 * loader can assemble the logo piece by piece. No box, no card, no background.
 */

const SQUARES = [
  { x: 196, y: 276, s: 44, tone: "cyan" },
  { x: 258, y: 336, s: 42, tone: "blue" },
  { x: 104, y: 348, s: 42, tone: "blue" },
  { x: 186, y: 398, s: 40, tone: "cyan" },
  { x: 306, y: 412, s: 34, tone: "blue" },
  { x: 104, y: 442, s: 42, tone: "blue" },
  { x: 186, y: 470, s: 40, tone: "cyan" },
  { x: 258, y: 470, s: 34, tone: "blue" },
  { x: 104, y: 534, s: 42, tone: "blue" },
  { x: 186, y: 542, s: 40, tone: "cyan" },
  { x: 258, y: 538, s: 34, tone: "blue" },
  { x: 186, y: 616, s: 40, tone: "cyan" },
  { x: 104, y: 626, s: 42, tone: "blue" },
  { x: 104, y: 690, s: 42, tone: "blue" },
  { x: 104, y: 752, s: 42, tone: "blue" },
];

const BARS = [
  "M410,542 L446,522 L446,806 L410,806 Z",
  "M466,522 L502,500 L502,784 L466,784 Z",
  "M556,500 L592,522 L592,784 L556,784 Z",
  "M612,522 L648,542 L648,806 L612,806 Z",
];

const ARCH_PATH =
  "M300,120 L648,120 C846,120 908,318 908,516 C908,742 786,916 586,916";

const INNER_PATH =
  "M368,860 L368,556 C368,438 448,352 512,300 C576,352 656,438 656,556 L656,860";

export default function DarLogoSVG({ className = "" }) {
  return (
    <svg
      className={`dau-logo ${className}`}
      viewBox="0 0 1024 1024"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="dauBlue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="42%" stopColor="#0891b2" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
        <linearGradient id="dauBar" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#cffafe" />
          <stop offset="38%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
        <linearGradient id="dauBase" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7dd3fc" />
          <stop offset="55%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#172554" />
        </linearGradient>
        {/* polished metal: highlight → shade → highlight for a real bevel */}
        <linearGradient id="dauSilver" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="30%" stopColor="#eef2f7" />
          <stop offset="58%" stopColor="#a8b4c4" />
          <stop offset="80%" stopColor="#dfe6ee" />
          <stop offset="100%" stopColor="#8494a8" />
        </linearGradient>
        <linearGradient id="dauCrescent" x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#fffef2" />
          <stop offset="60%" stopColor="#fde68a" />
          <stop offset="100%" stopColor="#d9f99d" />
        </linearGradient>
        <radialGradient id="dauGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </radialGradient>

        {/* Islamic lattice used inside the arch band — 8-point star grid */}
        <pattern id="dauGeo" width="72" height="72" patternUnits="userSpaceOnUse">
          <rect width="72" height="72" fill="url(#dauBlue)" />
          <g stroke="#bef2ff" strokeWidth="3.2" opacity="0.92" fill="none">
            <path d="M0,36 L36,0 L72,36 L36,72 Z" />
            <rect x="14" y="14" width="44" height="44" />
            <path d="M-18,18 L18,-18 M54,90 L90,54 M-18,54 L18,90 M54,-18 L90,18" />
            <circle cx="36" cy="36" r="9" />
          </g>
          <g fill="#e0fbff" opacity="0.5">
            <circle cx="0" cy="0" r="3.2" />
            <circle cx="72" cy="0" r="3.2" />
            <circle cx="0" cy="72" r="3.2" />
            <circle cx="72" cy="72" r="3.2" />
          </g>
        </pattern>

        <mask id="dauSweepMask">
          <rect width="1024" height="1024" fill="white" />
        </mask>

        <linearGradient id="dauSweepGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#a5f3fc" stopOpacity="0" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#a5f3fc" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* ambient glow behind the mark */}
      <circle className="dau-halo" cx="560" cy="520" r="430" fill="url(#dauGlow)" />

      {/* ── Left floating squares ── */}
      <g className="dau-squares">
        {SQUARES.map((sq, i) => (
          <g key={i} className="dau-square" style={{ "--i": i }}>
            <rect
              x={sq.x}
              y={sq.y}
              width={sq.s}
              height={sq.s}
              rx="4"
              fill={sq.tone === "cyan" ? "#22d3ee" : "#1d4ed8"}
              stroke="#0f172a"
              strokeWidth="7"
            />
            <rect
              x={sq.x + 6}
              y={sq.y + 6}
              width={sq.s * 0.42}
              height={sq.s * 0.42}
              rx="2"
              fill="#ffffff"
              opacity="0.38"
            />
          </g>
        ))}
      </g>

      {/* ── Outer arch: dark edge, silver frame, then drawn blue band ── */}
      <g className="dau-arch">
        <path
          className="dau-arch-edge"
          d={ARCH_PATH}
          stroke="#0f172a"
          strokeWidth="126"
          strokeLinecap="butt"
        />
        <path
          className="dau-arch-frame"
          d={ARCH_PATH}
          stroke="url(#dauSilver)"
          strokeWidth="112"
          strokeLinecap="butt"
        />
        <path
          className="dau-arch-band"
          d={ARCH_PATH}
          stroke="url(#dauGeo)"
          strokeWidth="84"
          strokeLinecap="butt"
        />
        {/* thin bright inlays that separate metal frame from the lattice */}
        <path className="dau-arch-inlay" d={ARCH_PATH} stroke="#ffffff" strokeWidth="3" opacity="0.55" />
        <path className="dau-arch-inlay" d={ARCH_PATH} stroke="#f8fafc" strokeWidth="98" opacity="0.14" />
      </g>

      {/* the small step that closes the top-left of the D */}
      <g className="dau-arch-step">
        <path d="M300,120 L300,352" stroke="#0f172a" strokeWidth="126" />
        <path d="M300,120 L300,352" stroke="url(#dauSilver)" strokeWidth="112" />
        <path
          className="dau-step-band"
          d="M300,120 L300,352"
          stroke="url(#dauGeo)"
          strokeWidth="84"
        />
      </g>

      {/* ── Bottom blue base (L shape) ── */}
      <g className="dau-base">
        <path
          d="M250,596 L348,596 L348,864 L536,864 L536,936 L250,936 Z"
          fill="url(#dauBase)"
          stroke="#0f172a"
          strokeWidth="16"
        />
        <path
          d="M272,620 L326,620 L326,886 L514,886 L514,914 L272,914 Z"
          fill="none"
          stroke="#ffffff"
          strokeWidth="9"
          opacity="0.85"
        />
        {/* specular edge on the vertical leg */}
        <path d="M262,606 L262,926" stroke="#ffffff" strokeWidth="6" opacity="0.35" />
      </g>

      {/* ── Vertical blue elements ── */}
      <g className="dau-bars">
        {BARS.map((d, i) => (
          <g key={i} className="dau-bar" style={{ "--i": i }}>
            <path d={d} fill="url(#dauBar)" stroke="#0f172a" strokeWidth="10" />
          </g>
        ))}
      </g>

      {/* ── Inner mihrab arch ── */}
      <g className="dau-inner">
        <path
          className="dau-inner-stroke"
          d={INNER_PATH}
          stroke="#0f172a"
          strokeWidth="46"
        />
        <path
          className="dau-inner-stroke"
          d={INNER_PATH}
          stroke="url(#dauSilver)"
          strokeWidth="30"
        />
        <path
          className="dau-inner-stroke"
          d={INNER_PATH}
          stroke="#ffffff"
          strokeWidth="5"
          opacity="0.6"
        />
      </g>

      {/* ── Crescent + star ── */}
      <g className="dau-crescent">
        <path
          d="M470,244 C470,300 520,326 566,306 C540,336 486,338 462,306 C442,280 446,252 470,244 Z"
          fill="url(#dauCrescent)"
          stroke="#0f172a"
          strokeWidth="9"
        />
        <path
          d="M592,236 L601,258 L624,262 L607,278 L611,301 L592,289 L573,301 L577,278 L560,262 L583,258 Z"
          fill="url(#dauCrescent)"
          stroke="#0f172a"
          strokeWidth="7"
        />
      </g>

      {/* ── Light sweep ── */}
      <g className="dau-sweep" mask="url(#dauSweepMask)">
        <rect x="-260" y="0" width="180" height="1024" fill="url(#dauSweepGrad)" />
      </g>
    </svg>
  );
}