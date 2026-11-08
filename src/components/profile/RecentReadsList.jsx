import { Link } from "react-router-dom";
import { BookOpen, ChevronLeft } from "lucide-react";
import SmartImage from "@/components/SmartImage";
import { useT } from "@/lib/i18n";

export default function RecentReadsList({ items }) {
  const t = useT();
  if (!items.length) return null;

  return (
    <div className="space-y-2">
      {items.map((r) => {
        const pct = r.book.pages_count
          ? Math.min(100, Math.round((r.page / r.book.pages_count) * 100))
          : null;
        return (
          <Link
            key={r.id}
            to={`/read/${r.id}`}
            className="group flex items-center gap-3 p-2.5 rounded-xl border border-border hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5 transition-all bg-background/50"
          >
            <div className="w-11 h-14 rounded-lg overflow-hidden bg-muted shrink-0 flex items-center justify-center">
              {r.book.cover_image ? (
                <SmartImage
                  src={r.book.cover_image}
                  alt={r.book.title}
                  className="w-full h-full object-cover"
                  fallback={() => <BookOpen className="w-5 h-5 text-muted-foreground" />}
                />
              ) : (
                <BookOpen className="w-5 h-5 text-muted-foreground/40" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground truncate">{r.book.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t.pageNo} {r.page}{pct !== null ? ` · ${pct}%` : ""}
              </p>
              <div className="h-1.5 rounded-full bg-muted mt-1.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-l from-primary to-accent rounded-full transition-all"
                  style={{ width: `${pct ?? Math.min(100, r.page)}%` }}
                />
              </div>
            </div>
            <ChevronLeft className="w-4 h-4 text-muted-foreground/50 shrink-0 group-hover:text-primary transition-colors" />
          </Link>
        );
      })}
    </div>
  );
}