import React, { useState } from 'react';
import { Wand2, Code, Copy, Check, Sparkles, Terminal, Layers, Play } from 'lucide-react';
import { formatCodeSnippet } from '../utils/helpers';

export const AppGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('Create a modern Android dashboard with user profile card, analytics chart, and bottom action buttons in Jetpack Compose.');
  const [targetLang, setTargetLang] = useState<'kotlin' | 'compose' | 'repository' | 'xml'>('compose');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    try {
      const fullPrompt = `Generate production-ready ${targetLang.toUpperCase()} code for the following request: "${prompt}". Provide clean code with comments.`;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt })
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedCode(formatCodeSnippet(data.response, targetLang));
      } else {
        setGeneratedCode(`// Error generating code: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      setGeneratedCode(`// Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-slate-950 text-slate-100 p-4 md:p-6 overflow-y-auto">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900/40 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center space-x-3 mb-2">
            <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400">
              <Wand2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Base44 AI Android Studio</h2>
              <p className="text-sm text-slate-400">Generate Android code, Jetpack Compose UI, and data layers instantly using Gemini AI.</p>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleGenerate} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              App Component or Screen Description
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              placeholder="Describe what you want to build..."
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-medium">Target Format:</span>
              {(['compose', 'kotlin', 'repository', 'xml'] as const).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setTargetLang(lang)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition ${
                    targetLang === lang
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-medium text-sm flex items-center space-x-2 transition shadow-lg shadow-emerald-600/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Generating...' : 'Generate Code'}</span>
            </button>
          </div>
        </form>

        {/* Output Area */}
        {generatedCode && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-sm font-semibold text-emerald-400">
                <Code className="w-4 h-4" />
                <span>Generated Output ({targetLang.toUpperCase()})</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-medium transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy Code'}</span>
              </button>
            </div>

            <pre className="bg-slate-950 p-4 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto max-h-96 leading-relaxed border border-slate-800/80">
              <code>{generatedCode}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
