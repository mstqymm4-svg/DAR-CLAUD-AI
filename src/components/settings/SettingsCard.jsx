import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const TONES = {
  primary: "bg-primary/10 text-primary ring-primary/15",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/15",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-blue-500/15",
  purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-purple-500/15",
  emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/15",
  teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400 ring-teal-500/15",
  destructive: "bg-destructive/10 text-destructive ring-destructive/15",
};

export default function SettingsCard({
  icon,
  title,
  description,
  badge,
  tone = "primary",
  danger = false,
  open,
  onToggle,
  children,
}) {
  return (
    <section
      className={cn(
        "group relative border rounded-2xl bg-card overflow-hidden transition-all duration-300",
        open
          ? danger
            ? "border-destructive/40 shadow-lg shadow-destructive/5"
            : "border-primary/40 shadow-lg shadow-primary/5"
          : "border-border/80 hover:border-primary/35 hover:shadow-sm"
      )}
    >
      <span
        className={cn(
          "absolute inset-y-0 start-0 w-[3px] transition-colors duration-300",
          open
            ? danger
              ? "bg-destructive/70"
              : "bg-primary/70"
            : "bg-transparent"
        )}
      />

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!!open}
        className="w-full ps-5 pe-4 py-4 flex items-center justify-between gap-3 text-start transition-colors hover:bg-muted/25"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <span
            className={cn(
              "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ring-1 transition-transform duration-300 group-hover:scale-[1.04]",
              TONES[tone] || TONES.primary
            )}
          >
            {icon}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[0.95rem] sm:text-base font-bold text-foreground leading-tight">
                {title}
              </h2>
              {badge}
            </div>
            {/* The caption only appears once the card is opened */}
            {open && description ? (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {description}
              </p>
            ) : null}
          </div>
        </div>

        <span
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 bg-muted text-muted-foreground",
            open &&
              (danger
                ? "rotate-180 bg-destructive/10 text-destructive"
                : "rotate-180 bg-primary/10 text-primary")
          )}
        >
          <ChevronDown className="w-4 h-4" />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="ps-5 pe-4 pb-5 border-t border-border/60">
              <div className="pt-4 space-y-4">{children}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}