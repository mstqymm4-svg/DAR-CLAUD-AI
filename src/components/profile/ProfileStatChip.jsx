import { motion } from "framer-motion";

const TONES = {
  accent: "text-accent bg-accent/10 border-accent/20",
  primary: "text-primary bg-primary/10 border-primary/20",
  success: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  muted: "text-foreground bg-muted border-border",
};

export default function ProfileStatChip({ icon, value, label, tone, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      className={`rounded-2xl border p-3 flex flex-col items-center gap-1 transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/5 ${TONES[tone] || TONES.muted}`}
    >
      <div className="w-8 h-8 rounded-full bg-card/70 flex items-center justify-center">{icon}</div>
      <span className="text-xl font-black leading-none tabular-nums">{value}</span>
      <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight">{label}</span>
    </motion.div>
  );
}