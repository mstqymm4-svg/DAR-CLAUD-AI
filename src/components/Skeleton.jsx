import { motion } from "framer-motion";


export function SkeletonCard() {
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="h-44 bg-muted animate-pulse" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-20 bg-muted rounded-full animate-pulse" />
        <div className="h-4 w-full bg-muted rounded animate-pulse" />
        <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
        <div className="h-8 w-full bg-muted rounded-lg animate-pulse" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8, cols = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" }) {
  return (
    <div className={`grid ${cols} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.05 }}
        >
          <SkeletonCard />
        </motion.div>
      ))}
    </div>
  );
}

export function PageSpinner() {
  return (
    <div className="p-4 space-y-6 opacity-60">
      <div className="h-6 w-40 bg-muted rounded animate-pulse" />
      <SkeletonGrid count={6} />
    </div>
  );
}