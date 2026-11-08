import React, { useState } from 'react';
import { BookOpen, Search, ArrowRight, Sparkles, Filter } from 'lucide-react';
import { PRESET_TEMPLATES, filterTemplates, PromptTemplate } from '../utils/helpers';

interface PromptLibraryProps {
  onSelectTemplate: (template: PromptTemplate) => void;
}

export const PromptLibrary: React.FC<PromptLibraryProps> = ({ onSelectTemplate }) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Android', 'UI', 'AI', 'Kotlin'];
  const filtered = filterTemplates(PRESET_TEMPLATES, query, selectedCategory);

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-slate-950 text-slate-100 p-4 md:p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-emerald-500/20 p-2.5 rounded-xl text-emerald-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Prompt & Template Library</h2>
              <p className="text-sm text-slate-400">Pre-configured templates for Android Compose, Room DB, and Base44 AI flows.</p>
            </div>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <Filter className="w-4 h-4 text-slate-400 mr-1 shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Template Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((t) => (
            <div
              key={t.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between hover:border-emerald-500/50 transition group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    {t.category}
                  </span>
                  <Sparkles className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition" />
                </div>
                <h3 className="font-bold text-base text-white">{t.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{t.description}</p>
                <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl text-xs text-slate-300 font-mono line-clamp-2">
                  {t.prompt}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-end">
                <button
                  onClick={() => onSelectTemplate(t)}
                  className="flex items-center space-x-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition"
                >
                  <span>Use in Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-slate-500">
              No matching prompt templates found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
