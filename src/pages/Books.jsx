import { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Search, X, LayoutGrid, List, RotateCcw, BookOpen, Star, BookMarked, Heart } from "lucide-react";
import AISearch from "../components/AISearch";
import BookCard from "../components/BookCard";
import { SkeletonGrid } from "../components/Skeleton";
import { Input } from "@/components/ui/input";
import { MobileSelect } from "@/components/ui/mobile-select";
import { useT } from "@/lib/i18n";
import { bookLangLabel, catLabel } from "@/lib/i18n-terms";
import { getBooks, getFavoriteIds, toggleFavorite } from "@/lib/offlineSync";
import { getAccountEmail } from "@/lib/activeUser";
import { useContentRefresh } from "@/hooks/useContentSync";
import PullToRefresh from "@/components/PullToRefresh";
import { forceSyncNow } from "@/lib/contentSyncEngine";
import { Link, useNavigate } from "react-router-dom";
import SmartImage from "@/components/SmartImage";

export default function Books() {
  const t = useT();
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'
  const [user, setUser] = useState(null);
  const [preferredLanguage, setPreferredLanguage] = useState("الكل");
  const [aiResults, setAiResults] = useState(null);
  const [aiLabel, setAiLabel] = useState("");

  const urlParams = new URLSearchParams(window.location.search);
  const categoryParam = urlParams.get("category");

  useEffect(() => {
    if (categoryParam) setActiveCategory(categoryParam);
  }, [categoryParam]);

  const loadData = async () => {
    const u = await base44.auth.me().catch(() => null);
    setUser(u);
    const allBooks = await getBooks();
    setBooks(allBooks || []);
    if (u?.preferred_language && u.preferred_language !== "الكل") {
      setPreferredLanguage(u.preferred_language);
    }
    if (u) {
      const favIds = await getFavoriteIds(getAccountEmail(u));
      setFavorites(favIds);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto-refresh when books change in background
  useContentRefresh(["books"], loadData);

  const handleToggleFavorite = async (bookId) => {
    if (!user) return;
    const added = await toggleFavorite(bookId, getAccountEmail(user));
    setFavorites((prev) =>
      added ? [...prev, bookId] : prev.filter((id) => id !== bookId)
    );
  };

  // Extract unique categories and counts
  const categoriesWithCounts = useMemo(() => {
    const counts = {};
    for (const b of books) {
      if (b.category) {
        counts[b.category] = (counts[b.category] || 0) + 1;
      }
    }
    const list = Object.keys(counts).map((cat) => ({
      name: cat,
      count: counts[cat],
    }));
    list.sort((a, b) => b.count - a.count);
    return [{ name: "الكل", count: books.length }, ...list];
  }, [books]);

  const sortBooks = (list) => {
    const arr = [...list];
    if (sortBy === "title")
      arr.sort((a, b) =>
        String(a.title || "").localeCompare(String(b.title || ""), "ar")
      );
    else if (sortBy === "rating")
      arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sortBy === "oldest")
      arr.sort(
        (a, b) =>
          new Date(a.created_date || 0) - new Date(b.created_date || 0)
      );
    else
      arr.sort(
        (a, b) =>
          new Date(b.created_date || 0) - new Date(a.created_date || 0)
      );
    return arr;
  };

  const filteredBooks =
    aiResults ??
    sortBooks(
      books.filter((book) => {
        const matchesCategory =
          activeCategory === "الكل" || book.category === activeCategory;
        const matchesSearch =
          !searchQuery ||
          book.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.author?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesLanguage =
          preferredLanguage === "الكل" ||
          !book.language ||
          book.language === preferredLanguage;
        return matchesCategory && matchesSearch && matchesLanguage;
      })
    );

  const resetAllFilters = () => {
    setActiveCategory("الكل");
    setSearchQuery("");
    setPreferredLanguage("الكل");
    setAiResults(null);
    setAiLabel("");
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <SkeletonGrid
          count={10}
          cols="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
        />
      </div>
    );
  }

  return (
    <PullToRefresh
      onRefresh={async () => {
        await forceSyncNow();
        await loadData();
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">
              {t.library}
            </h1>
            <p className="text-sm text-muted-foreground">{t.librarySub}</p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-muted/60 p-1 rounded-xl border border-border">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="عرض الشبكة"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              title="عرض القائمة"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* AI Search Engine */}
        <AISearch
          books={books}
          onResults={(results, label) => {
            setAiResults(results);
            setAiLabel(label);
          }}
          onClear={() => {
            setAiResults(null);
            setAiLabel("");
          }}
        />

        {/* Search Bar with Clear Icon */}
        <div className="relative mb-4 group">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 group-focus-within:text-primary transition-colors text-muted-foreground" />
          <Input
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-11 pl-10 h-12 rounded-xl bg-card border-border text-sm focus-visible:border-primary focus-visible:ring-primary/20 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Horizontal Filter Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
          {categoriesWithCounts.map((cat) => {
            const isActive = activeCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-xs font-bold"
                    : "bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <span>{catLabel(cat.name, t.langCode)}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* AI Results Pill */}
        {aiResults && (
          <div className="mb-4 px-4 py-2.5 rounded-xl bg-accent/10 border border-accent/30 text-sm text-foreground flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-accent">✨</span>
              <span>
                {aiLabel} — {aiResults.length} {t.booksCount}
              </span>
            </div>
            <button
              onClick={() => {
                setAiResults(null);
                setAiLabel("");
              }}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              {t.showAll || "إلغاء"}
            </button>
          </div>
        )}

        {/* Controls / Stats Row */}
        <div className="flex items-center justify-between mb-5 gap-2">
          <p className="text-sm text-muted-foreground shrink-0 font-medium">
            {filteredBooks.length} {t.booksCount}
          </p>
          <div className="flex items-center gap-3 min-w-0">
            {preferredLanguage !== "الكل" && (
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground">
                  {t.lang}: {bookLangLabel(preferredLanguage, t.langCode)}
                </span>
                <button
                  onClick={() => setPreferredLanguage("الكل")}
                  className="text-xs text-primary hover:underline"
                >
                  {t.showAll}
                </button>
              </div>
            )}
            <MobileSelect
              value={sortBy}
              onValueChange={setSortBy}
              placeholder={t.sortBy}
              options={[
                { value: "newest", label: t.sortNewest },
                { value: "oldest", label: t.sortOldest },
                { value: "title", label: t.sortTitle },
                { value: "rating", label: t.sortRating },
              ]}
            />
          </div>
        </div>

        {/* Books Content: Grid vs List */}
        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredBooks.map((book, i) => (
              <BookCard
                key={book.id}
                book={book}
                index={i}
                isFavorite={favorites.includes(book.id)}
                onToggleFavorite={user ? handleToggleFavorite : null}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBooks.map((book) => {
              const isFav = favorites.includes(book.id);
              return (
                <div
                  key={book.id}
                  className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-card border border-border/80 hover:border-primary/40 hover:shadow-md transition-all gap-4"
                >
                  <Link
                    to={`/book/${book.id}`}
                    className="flex items-center gap-4 flex-1 min-w-0"
                  >
                    <div className="w-16 h-22 rounded-xl overflow-hidden bg-muted border border-border shrink-0 flex items-center justify-center">
                      {book.cover_image ? (
                        <SmartImage
                          src={book.cover_image}
                          alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <BookOpen className="w-8 h-8 text-muted-foreground/30" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                          {catLabel(book.category, t.langCode)}
                        </span>
                        {book.rating > 0 && (
                          <span className="text-[11px] flex items-center gap-1 text-amber-500 font-bold">
                            <Star className="w-3 h-3 fill-amber-500" />
                            {book.rating}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {book.title}
                      </h3>
                      {book.author && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {book.author}
                        </p>
                      )}
                      {book.description && (
                        <p className="text-xs text-muted-foreground/80 line-clamp-2 mt-1 hidden sm:block">
                          {book.description}
                        </p>
                      )}
                    </div>
                  </Link>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {user && (
                      <button
                        onClick={() => handleToggleFavorite(book.id)}
                        className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-colors ${
                          isFav
                            ? "border-red-300 dark:border-red-900 bg-red-50 dark:bg-red-950/30 text-red-500"
                            : "border-border hover:border-primary/40 text-muted-foreground hover:text-foreground"
                        }`}
                        title={isFav ? t.removeFav : t.addFav}
                      >
                        <Heart
                          className={`w-4 h-4 ${isFav ? "fill-red-500" : ""}`}
                        />
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/read/${book.id}`)}
                      className="px-4 py-2 rounded-[4px_20px_4px_20px] bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                    >
                      <BookMarked className="w-3.5 h-3.5" />
                      {t.readBook || "قراءة"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State with Reset Filters Button */}
        {filteredBooks.length === 0 && (
          <div className="text-center py-20 bg-card/40 rounded-3xl border border-dashed border-border/80 mt-4">
            <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="font-bold text-foreground mb-1">{t.noResults}</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-4">
              {t.noResultsSub}
            </p>
            <button
              onClick={resetAllFilters}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px_20px_4px_20px] bg-primary/10 text-primary hover:bg-primary/20 text-xs font-bold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t.resetFilters || "إعادة ضبط التصفية"}
            </button>
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}