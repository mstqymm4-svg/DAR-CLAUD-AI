import React from 'react';
import { Settings, Github, CheckCircle2, ShieldCheck, Cpu, Database, RefreshCw } from 'lucide-react';

export const SettingsView: React.FC = () => {
  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-slate-950 text-slate-100 p-4 md:p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex items-center space-x-4">
          <div className="bg-emerald-500/20 p-3 rounded-2xl text-emerald-400">
            <Settings className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Repository & System Settings</h2>
            <p className="text-sm text-slate-400">Manage repository linkage, API keys, and runtime status.</p>
          </div>
        </div>

        {/* Repository Linkage Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="font-bold text-base text-white flex items-center space-x-2">
            <Github className="w-5 h-5 text-emerald-400" />
            <span>Linked GitHub Repository</span>
          </h3>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-xs text-slate-400 block mb-1">Repository URL</span>
              <a
                href="https://github.com/mstqymm4-svg/Dar-base44-ai-android.git"
                target="_blank"
                rel="noreferrer"
                className="text-sm font-mono text-emerald-400 hover:underline flex items-center space-x-1.5"
              >
                <span>https://github.com/mstqymm4-svg/Dar-base44-ai-android.git</span>
              </a>
            </div>
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-3 py-1 rounded-full font-semibold flex items-center space-x-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Synced & Running</span>
            </span>
          </div>
        </div>

        {/* Gemini AI Status Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="font-bold text-base text-white flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <span>Gemini API & Server Status</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-xs text-slate-400 block">Model Engine</span>
              <span className="text-sm font-semibold text-white">Gemini 2.5 Flash</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-xs text-slate-400 block">API Status</span>
              <span className="text-sm font-semibold text-emerald-400 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active & Secure</span>
              </span>
            </div>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-1">
              <span className="text-xs text-slate-400 block">Proxy Route</span>
              <span className="text-sm font-semibold text-white font-mono">/api/chat</span>
            </div>
          </div>
        </div>

        {/* Platform Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="font-bold text-base text-white flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Environment & Compliance</span>
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Dar Base44 AI Android runs securely in the AI Studio environment with Express backend proxy, Vite hot-reloading disabled for stability, and Tailwind CSS v4 styling.
          </p>
        </div>
      </div>
    </div>
  );
};
