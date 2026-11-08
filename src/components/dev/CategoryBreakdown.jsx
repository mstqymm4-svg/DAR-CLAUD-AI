import { PieChart } from "lucide-react";

export default function CategoryBreakdown({ books = [] }) {
  const counts = books.reduce((acc, b) => {
    const key = b.category || "غير مصنّف";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const rows = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = rows.length ? rows[0][1] : 1;

  if (rows.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <h3 className="font-bold text-sm mb-4 flex items-center gap-2">
        <PieChart className="w-4 h-4 text-primary" /> توزيع الكتب على التصنيفات
      </h3>
      <div className="space-y-2.5">
        {rows.map(([cat, count]) => (
          <div key={cat}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium truncate">{cat}</span>
              <span className="text-muted-foreground tabular-nums shrink-0">{count}</span>
            </div>
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary/80 rounded-full transition-all duration-700"
                style={{ width: `${Math.round((count / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}