/**
 * avatarPresets — Curated, offline-ready Islamic and scholarly avatar presets
 * SVG data URLs that load instantly without external dependencies.
 */

const makeSvgAvatar = (emoji, bgFrom, bgTo, label) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${bgFrom}" />
        <stop offset="100%" stop-color="${bgTo}" />
      </linearGradient>
      <radialGradient id="ring" cx="50%" cy="50%" r="50%">
        <stop offset="70%" stop-color="#ffffff" stop-opacity="0.15" />
        <stop offset="100%" stop-color="#000000" stop-opacity="0.25" />
      </radialGradient>
    </defs>
    <rect width="120" height="120" rx="60" fill="url(#g)" />
    <circle cx="60" cy="60" r="54" fill="none" stroke="#ffffff" stroke-width="2" stroke-opacity="0.3" stroke-dasharray="4 3" />
    <circle cx="60" cy="60" r="60" fill="url(#ring)" />
    <text x="60" y="72" font-size="52" text-anchor="middle" dominant-baseline="middle" font-family="'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif">${emoji}</text>
  </svg>`;
  return {
    id: label,
    label,
    emoji,
    url: `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`,
  };
};

export const AVATAR_PRESETS = [
  makeSvgAvatar("🎓", "#134e2a", "#1a6b3c", "طالب علم"),
  makeSvgAvatar("📚", "#0f766e", "#14b8a6", "باحث ومحقق"),
  makeSvgAvatar("🕌", "#065f46", "#059669", "دار العلوم"),
  makeSvgAvatar("📖", "#1e3a8a", "#3b82f6", "قارئ شغوف"),
  makeSvgAvatar("✍️", "#7c2d12", "#ea580c", "مؤلف وكاتب"),
  makeSvgAvatar("🌿", "#14532d", "#22c55e", "نور المعرفة"),
  makeSvgAvatar("🌙", "#312e81", "#6366f1", "هلال العلم"),
  makeSvgAvatar("✨", "#701a75", "#d946ef", "نجم الهدى"),
  makeSvgAvatar("🕋", "#18181b", "#3f3f46", "زائر الحرمين"),
  makeSvgAvatar("🌴", "#115e59", "#10b981", "النخلة المباركة"),
  makeSvgAvatar("🖋️", "#831843", "#ec4899", "خطاط ومحقق"),
  makeSvgAvatar("💡", "#854d0e", "#eab308", "مفكر وباحث"),
];
