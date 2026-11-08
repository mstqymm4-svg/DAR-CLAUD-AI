import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles } from "lucide-react";
import { useT } from "@/lib/i18n";

export default function AISearch({ books, onResults, onClear }) {
  const t = useT();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setActive(true);

    const booksList = books.map((b, i) => `${i + 1}. العنوان: "${b.title}" | المؤلف: ${b.author} | التصنيف: ${b.category} | ID: ${b.id}`).join("\n");

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `أنت مساعد مكتبة إسلامية ذكي. المستخدم يبحث عن: "${query}"\n\nقائمة الكتب المتاحة:\n${booksList}\n\nمهمتك: ابحث في القائمة وأعد IDs الكتب المناسبة للبحث (كل ID في سطر). إذا لم يوجد شيء مناسب، أعد قائمة فارغة. أجب فقط بالـ IDs.`,
      response_json_schema: {
        type: "object",
        properties: {
          matching_ids: { type: "array", items: { type: "string" } },
          explanation: { type: "string" }
        }
      }
    });

    const matchedBooks = books.filter((b) => result.matching_ids?.includes(b.id));
    onResults(matchedBooks, result.explanation || `نتائج البحث عن: "${query}"`);
    setLoading(false);
  };

  const handleClear = () => {
    setQuery("");
    setActive(false);
    onClear();
  };

  return (
    <div className="mb-4">
      





















      
      {active && !loading &&
      <div className="flex items-center gap-1.5 mt-2">
          <Sparkles className="w-3 h-3 text-accent" />
          <span className="text-xs text-muted-foreground">{t.aiSearchActive}</span>
        </div>
      }
    </div>);

}