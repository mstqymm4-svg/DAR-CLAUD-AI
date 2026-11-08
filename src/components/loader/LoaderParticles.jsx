import React, { useMemo } from "react";

const COLORS = ["#155e75", "#0891b2", "#22d3ee", "#a5f3fc", "rgba(255,255,255,0.9)"];

/**
 * PHASE 1 — 18 geometric particles that curve inward and settle on the mark.
 */
export default function LoaderParticles({ count = 18 }) {
  const dots = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2;
        const from = 150 + (i % 4) * 26;
        const to = 46 + (i % 5) * 18;
        return {
          fx: Math.cos(angle) * from,
          fy: Math.sin(angle) * from * 0.86,
          tx: Math.cos(angle + 0.5) * to,
          ty: Math.sin(angle + 0.5) * to * 0.86,
          color: COLORS[i % COLORS.length],
          delay: i * 34,
        };
      }),
    [count]
  );

  return (
    <div className="dau-particles" aria-hidden="true">
      {dots.map((d, i) => (
        <span
          key={i}
          className="dau-particle"
          style={{
            background: d.color,
            boxShadow: `0 0 6px ${d.color}`,
            animationDelay: `${d.delay}ms`,
            "--fx": `${d.fx}px`,
            "--fy": `${d.fy}px`,
            "--tx": `${d.tx}px`,
            "--ty": `${d.ty}px`,
          }}
        />
      ))}
    </div>
  );
}