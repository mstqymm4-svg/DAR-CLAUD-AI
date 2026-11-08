/**
 * luxeLayerFactory — يبني طبقات خلفية فخمة (HTML+CSS) محلياً وفورياً.
 * لا يعتمد على الذكاء الاصطناعي: قوالب مصممة يدوياً + معاملات (نمط، ألوان، سرعة).
 */

export const PALETTES = {
  emerald_gold: { label: "زمردي وذهبي", deep: "#0f3d2e", mid: "#1a6b3c", glow: "#ffd786", spark: "#fff6e0" },
  black_gold:   { label: "أسود وذهبي",  deep: "#0a0a0a", mid: "#2a1f12", glow: "#d4af37", spark: "#fff3cf" },
  night_blue:   { label: "أزرق ليلي",   deep: "#081226", mid: "#123a63", glow: "#9ed8ff", spark: "#ffffff" },
  warm_sand:    { label: "رملي دافئ",   deep: "#2a1d10", mid: "#6b4a22", glow: "#e8c990", spark: "#fff6e6" },
  rose_pearl:   { label: "وردي لؤلؤي",  deep: "#2a1020", mid: "#6b2a4a", glow: "#ffb3c7", spark: "#fff0f5" },
};

export const EFFECTS = {
  dust:   { label: "غبار متصاعد" },
  stars:  { label: "نجوم متلألئة" },
  fall:   { label: "تساقط ناعم" },
  waves:  { label: "موجات حرير" },
  rays:   { label: "أشعة نور" },
  orbs:   { label: "هالات متوهجة" },
};

const KEYWORDS = [
  [/غبار|ذر|dust|رماد/, "dust"],
  [/نجم|نجوم|تلألؤ|لمعان|star|شفق/, "stars"],
  [/ورق|أوراق|ثلج|تساقط|مطر|leaf|snow/, "fall"],
  [/موج|حرير|ماء|سائل|wave|قماش/, "waves"],
  [/شعاع|أشعة|نور|ضوء|ray|light/, "rays"],
  [/دائر|هال|كر|فقاع|orb|bubble|توهج/, "orbs"],
];

export function pickEffect(desc = "") {
  for (const [re, id] of KEYWORDS) if (re.test(desc)) return id;
  return "dust";
}

const rand = (s) => { let x = Math.sin(s) * 10000; return x - Math.floor(x); };

/** يبني طبقة كاملة: <style> + <div> */
export function buildLuxeLayer({ desc = "", palette = "emerald_gold", luxe = "rich", motion = 5, effect, seed = Date.now() }) {
  const p = PALETTES[palette] || PALETTES.emerald_gold;
  const eff = effect || pickEffect(desc);
  const ns = "lx" + Math.abs(Math.floor(rand(seed) * 1e6)).toString(36);
  const count = luxe === "soft" ? 14 : luxe === "ultra" ? 34 : 22;
  const baseOp = luxe === "soft" ? 0.35 : luxe === "ultra" ? 0.85 : 0.6;
  const spd = 34 - motion * 2.4; // ثانية للدورة الأساسية

  const items = Array.from({ length: count }, (_, i) => {
    const r1 = rand(seed + i * 3.1), r2 = rand(seed + i * 7.7), r3 = rand(seed + i * 11.3);
    return {
      left: (r1 * 100).toFixed(2),
      top: (r2 * 100).toFixed(2),
      size: (2 + r3 * (eff === "orbs" ? 26 : eff === "fall" ? 8 : 4)).toFixed(1),
      dur: (spd * (0.6 + r3 * 0.9)).toFixed(1),
      delay: (-r1 * spd * 1.6).toFixed(1),
      drift: ((r2 - 0.5) * 22).toFixed(1),
      op: (0.25 + r3 * 0.6).toFixed(2),
    };
  });

  const glowBase = `
.${ns}{position:absolute;inset:0;overflow:hidden;pointer-events:none;}
.${ns} *{pointer-events:none;}
.${ns}-base{position:absolute;inset:-10%;
  background:
    radial-gradient(45% 55% at 20% 20%, ${p.glow}22 0%, transparent 70%),
    radial-gradient(50% 60% at 85% 75%, ${p.mid}33 0%, transparent 72%),
    radial-gradient(70% 70% at 50% 110%, ${p.deep}55 0%, transparent 70%);
  animation:${ns}-breathe ${(spd * 1.8).toFixed(1)}s cubic-bezier(.45,0,.55,1) infinite;
  opacity:${baseOp};will-change:transform,opacity;}
@keyframes ${ns}-breathe{0%,100%{transform:scale(1) translate3d(0,0,0);opacity:${baseOp}}50%{transform:scale(1.08) translate3d(1%,-1%,0);opacity:${(baseOp * 0.7).toFixed(2)}}}
.${ns}-bloom{position:absolute;inset:0;mix-blend-mode:screen;}
.${ns}-bloom i{position:absolute;border-radius:50%;filter:blur(30px);background:radial-gradient(circle,${p.glow}66 0%,transparent 70%);will-change:transform,opacity;}
@keyframes ${ns}-float{0%{transform:translate3d(0,0,0) scale(1);opacity:.15}50%{transform:translate3d(var(--dx),-6%,0) scale(1.25);opacity:.5}100%{transform:translate3d(0,0,0) scale(1);opacity:.15}}`;

  const bloom = Array.from({ length: luxe === "soft" ? 2 : luxe === "ultra" ? 5 : 3 }, (_, i) => {
    const r = rand(seed + 100 + i), r2 = rand(seed + 200 + i);
    return `<i style="left:${(r * 80 + 5).toFixed(1)}%;top:${(r2 * 70 + 5).toFixed(1)}%;width:${(120 + r * 220).toFixed(0)}px;height:${(120 + r2 * 220).toFixed(0)}px;--dx:${((r - .5) * 12).toFixed(1)}%;animation:${ns}-float ${(spd * (1.2 + r)).toFixed(1)}s ease-in-out ${(-r2 * spd).toFixed(1)}s infinite"></i>`;
  }).join("");

  let css = "", nodes = "";

  if (eff === "dust" || eff === "stars") {
    const upward = eff === "dust";
    css = `
.${ns}-p{position:absolute;inset:0;mix-blend-mode:screen;}
.${ns}-p b{position:absolute;border-radius:50%;background:${p.spark};box-shadow:0 0 8px ${p.glow};will-change:transform,opacity;}
@keyframes ${ns}-rise{0%{transform:translate3d(0,10%,0);opacity:0}15%{opacity:var(--o)}85%{opacity:var(--o)}100%{transform:translate3d(var(--dx),-110%,0);opacity:0}}
@keyframes ${ns}-twinkle{0%,100%{transform:scale(.6);opacity:.1}50%{transform:scale(1.4);opacity:var(--o)}}`;
    nodes = items.map(it =>
      `<b style="left:${it.left}%;top:${it.top}%;width:${it.size}px;height:${it.size}px;--o:${it.op};--dx:${it.drift}%;animation:${ns}-${upward ? "rise" : "twinkle"} ${it.dur}s ${upward ? "linear" : "ease-in-out"} ${it.delay}s infinite"></b>`
    ).join("");
  } else if (eff === "fall") {
    css = `
.${ns}-p{position:absolute;inset:0;}
.${ns}-p b{position:absolute;border-radius:50% 0 50% 0;background:linear-gradient(135deg,${p.glow},${p.spark});will-change:transform,opacity;}
@keyframes ${ns}-drop{0%{transform:translate3d(0,-20%,0) rotate(0deg);opacity:0}12%{opacity:var(--o)}88%{opacity:var(--o)}100%{transform:translate3d(var(--dx),120%,0) rotate(420deg);opacity:0}}`;
    nodes = items.map(it =>
      `<b style="left:${it.left}%;top:-5%;width:${it.size}px;height:${it.size}px;--o:${it.op};--dx:${it.drift}%;animation:${ns}-drop ${it.dur}s linear ${it.delay}s infinite"></b>`
    ).join("");
  } else if (eff === "waves") {
    css = `
.${ns}-p{position:absolute;inset:-20%;mix-blend-mode:screen;}
.${ns}-p b{position:absolute;inset:0;border-radius:45%;
  background:conic-gradient(from 0deg,${p.glow}22,transparent 35%,${p.mid}33 60%,transparent 85%,${p.glow}22);
  filter:blur(24px);will-change:transform,opacity;}
@keyframes ${ns}-spin{0%{transform:rotate(0deg) scale(1)}50%{transform:rotate(180deg) scale(1.12)}100%{transform:rotate(360deg) scale(1)}}`;
    nodes = Array.from({ length: luxe === "ultra" ? 4 : 3 }, (_, i) => {
      const r = rand(seed + 30 + i);
      return `<b style="opacity:${(0.25 + r * 0.35).toFixed(2)};animation:${ns}-spin ${(spd * (2 + i * 0.8)).toFixed(1)}s linear ${(-r * spd).toFixed(1)}s infinite${i % 2 ? " reverse" : ""}"></b>`;
    }).join("");
  } else if (eff === "rays") {
    css = `
.${ns}-p{position:absolute;inset:-30%;mix-blend-mode:screen;transform-origin:50% 0;}
.${ns}-p b{position:absolute;top:0;left:50%;width:14%;height:140%;transform-origin:50% 0;
  background:linear-gradient(to bottom,${p.glow}55,transparent 75%);filter:blur(18px);will-change:transform,opacity;}
@keyframes ${ns}-sweep{0%,100%{transform:rotate(var(--a)) scaleY(.9);opacity:.15}50%{transform:rotate(calc(var(--a) + 6deg)) scaleY(1.1);opacity:var(--o)}}`;
    nodes = Array.from({ length: luxe === "soft" ? 3 : luxe === "ultra" ? 8 : 5 }, (_, i) => {
      const r = rand(seed + 50 + i);
      return `<b style="--a:${(-38 + i * (76 / 5)).toFixed(1)}deg;--o:${(0.25 + r * 0.4).toFixed(2)};animation:${ns}-sweep ${(spd * (1.1 + r)).toFixed(1)}s ease-in-out ${(-r * spd).toFixed(1)}s infinite"></b>`;
    }).join("");
  } else {
    css = `
.${ns}-p{position:absolute;inset:0;mix-blend-mode:screen;}
.${ns}-p b{position:absolute;border-radius:50%;border:1px solid ${p.glow}55;
  background:radial-gradient(circle,${p.glow}22 0%,transparent 65%);will-change:transform,opacity;}
@keyframes ${ns}-expand{0%{transform:scale(.3);opacity:0}25%{opacity:var(--o)}100%{transform:scale(2.4);opacity:0}}`;
    nodes = items.slice(0, luxe === "ultra" ? 18 : 12).map(it =>
      `<b style="left:${it.left}%;top:${it.top}%;width:${(40 + +it.size * 6).toFixed(0)}px;height:${(40 + +it.size * 6).toFixed(0)}px;--o:${it.op};animation:${ns}-expand ${it.dur}s ease-out ${it.delay}s infinite"></b>`
    ).join("");
  }

  const html = `<style>${glowBase}${css}
@media (prefers-reduced-motion: reduce){.${ns} *{animation-duration:0s!important;animation-iteration-count:1!important}}
</style>
<div class="${ns}">
  <div class="${ns}-base"></div>
  <div class="${ns}-bloom">${bloom}</div>
  <div class="${ns}-p">${nodes}</div>
</div>`;

  return { html, effect: eff, name: `${EFFECTS[eff].label} — ${p.label}` };
}