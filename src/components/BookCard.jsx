import { Link, useNavigate } from "react-router-dom";
import { Heart, Star, BookOpen, BookMarked } from "lucide-react";
import { motion } from "framer-motion";
import { useT } from "@/lib/i18n";
import { catLabel } from "@/lib/i18n-terms";
import SmartImage from "./SmartImage";

const categoryColors = {
  "القرآن وعلومه": "from-emerald-500/20 to-emerald-600/5",
  "الحديث الشريف": "from-amber-500/20 to-amber-600/5",
  "الفقه الإسلامي": "from-blue-500/20 to-blue-600/5",
  "السيرة النبوية": "from-rose-500/20 to-rose-600/5",
  "العقيدة": "from-violet-500/20 to-violet-600/5",
  "التزكية والرقائق": "from-teal-500/20 to-teal-600/5",
  "التاريخ الإسلامي": "from-orange-500/20 to-orange-600/5",
  "أخرى": "from-gray-500/20 to-gray-600/5"
};

export default function BookCard({ book, isFavorite, onToggleFavorite, index = 0 }) {
  const t = useT();
  const navigate = useNavigate();
  const gradient = categoryColors[book.category] || categoryColors["أخرى"];

  const handleRead = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Warm the PDF chunk, worker and document while the reader page loads —
    // the book opens visibly faster.
    if (book.pdf_url) {
      import("@/lib/pdfLoader")
        .then(({ prefetchPdf }) => prefetchPdf(book.pdf_url, { bookId: book.id, title: book.title }))
        .catch(() => {});
    }
    navigate(`/read/${book.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.3) }}
      className="h-full">
      
      <Link
        to={`/book/${book.id}`}
        className="group relative block h-full bg-card rounded-2xl border border-border overflow-hidden hover:shadow-2xl hover:shadow-primary/10 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1.5">
        
        {/* Cover Image */}
        <div className={`relative h-48 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}>
          {book.cover_image ?
          <SmartImage
            src={book.cover_image}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            fallback={() => <BookOpen className="w-12 h-12 text-primary/30" />} /> :


          <BookOpen className="w-12 h-12 text-primary/30" />
          }
          {/* Gradient overlay for better text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

          {onToggleFavorite &&
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(book.id);
            }}
            className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/80 dark:bg-black/50 backdrop-blur-md flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-all border border-white/20">
            
              <Heart className={`w-4 h-4 transition-colors ${isFavorite ? "fill-red-500 text-red-500" : "text-gray-600 dark:text-gray-300"}`} />
            </button>
          }

          {book.is_featured &&
          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold shadow-lg flex items-center gap-1">
              <Star className="w-2.5 h-2.5 fill-current" />
              {t.featured}
            </div>
          }

          {book.pages_count > 0 &&
          <div className="absolute bottom-3 right-3 rounded-full backdrop-blur-md text-white text-[10px] font-medium flex items-center gap-1 border border-white/10 px-4 bg-gray-900">
              <BookOpen className="w-2.5 h-2.5" />
              {book.pages_count} {t.pages}
            </div>
          }
        </div>

        {/* Content */}
        <div className="py-4 px-4">
          <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold mb-2">
            {catLabel(book.category, t.langCode)}
          </span>
          <h3
            className="font-bold text-foreground text-sm leading-relaxed line-clamp-2 mb-1 group-hover:text-primary transition-colors"
            style={{ fontFamily: "var(--font-title, var(--font-heading, inherit))" }}>
            
            {book.title}
          </h3>
          <p
            className="text-xs text-muted-foreground line-clamp-1"
            style={{ fontFamily: "var(--font-title, var(--font-heading, inherit))" }}>
            
            {book.author}
          </p>

          {book.rating > 0 &&
          <div className="flex items-center gap-1 mt-2">
              {[...Array(5)].map((_, i) =>
            <Star
              key={i}
              className={`w-3 h-3 ${i < Math.round(book.rating) ? "fill-accent text-accent" : "text-border"}`} />

            )}
              <span className="text-[10px] text-muted-foreground mr-1">{book.rating}</span>
            </div>
          }

          <button
            onClick={handleRead}
            className="w-full flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground transition-all active:scale-95 shadow-sm hover:shadow-md hover:shadow-primary/20 text-xs font-bold py-2 rounded-[4px_20px_4px_20px]">
            
            <BookMarked className="w-3.5 h-3.5" />
            {t.readBook}
          </button>
        </div>
      </Link>
    </motion.div>);

}