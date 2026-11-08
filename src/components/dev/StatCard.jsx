export default function StatCard({ icon: Icon, label, value, color, loading = false }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-black truncate">{loading ? "..." : value}</p>
        <p className="text-xs text-muted-foreground font-medium truncate">{label}</p>
      </div>
    </div>
  );
}