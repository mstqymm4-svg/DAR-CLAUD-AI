import React from 'react';
import { Smartphone, Monitor, Github, Cpu, Sparkles } from 'lucide-react';

interface NavbarProps {
  isMobileView: boolean;
  setIsMobileView: (val: boolean) => void;
  activeTab: string;
}

export const Navbar: React.FC<NavbarProps> = ({ isMobileView, setIsMobileView, activeTab }) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        <div className="bg-gradient-to-tr from-emerald-500 to-cyan-500 p-2 rounded-xl shadow-lg shadow-emerald-500/20">
          <Sparkles className="w-6 h-6 text-slate-950 font-bold" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent">
              Dar Base44 AI Android
            </h1>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-2 py-0.5 rounded-full font-medium flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1"></span>
              Connected
            </span>
          </div>
          <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
            <Github className="w-3 h-3 inline mr-1 text-slate-400" />
            <span>mstqymm4-svg/Dar-base44-ai-android.git</span>
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <div className="hidden md:flex items-center bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs font-medium">
          <button
            onClick={() => setIsMobileView(false)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              !isMobileView ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Desktop View</span>
          </button>
          <button
            onClick={() => setIsMobileView(true)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              isMobileView ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android Frame</span>
          </button>
        </div>

        <div className="hidden lg:flex items-center space-x-2 bg-slate-800/50 border border-slate-700/50 px-3 py-1.5 rounded-xl text-xs text-slate-300">
          <Cpu className="w-4 h-4 text-emerald-400" />
          <span>Gemini 2.5 Flash Active</span>
        </div>
      </div>
    </header>
  );
};
