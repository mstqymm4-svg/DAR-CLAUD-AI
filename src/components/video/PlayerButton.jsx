/**
 * Single control button for the video player.
 * Variants: primary (main play/pause), active (toggled on), default.
 */
export default function PlayerButton({ children, onClick, disabled, title, active, primary, size = "md" }) {
  const dims =
    size === "lg" ? "w-14 h-14" :
    size === "sm" ? "w-10 h-10" : "w-11 h-11";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`${dims} rounded-full flex items-center justify-center text-white transition-all shrink-0 disabled:opacity-25 disabled:cursor-default active:scale-90 backdrop-blur-md ring-1 ${
        primary
          ? "bg-gradient-to-br from-primary to-primary/70 hover:brightness-110 ring-white/25 shadow-lg shadow-primary/40"
          : active
          ? "bg-primary/85 ring-white/25 shadow-md shadow-primary/30"
          : "bg-white/10 hover:bg-white/20 ring-white/10"
      }`}
    >
      {children}
    </button>
  );
}