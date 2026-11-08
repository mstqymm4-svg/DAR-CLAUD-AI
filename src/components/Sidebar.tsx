import React from 'react';
import { MessageSquareCode, Wand2, BookOpen, Settings, Smartphone, Cpu } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileView: boolean;
  setIsMobileView: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isMobileView, setIsMobileView }) => {
  const navItems = [
    { id: 'chat', label: 'AI Assistant', icon: MessageSquareCode, badge: 'Live' },
    { id: 'generator', label: 'Base44 Studio', icon: Wand2, badge: 'Android' },
    { id: 'library', label: 'Prompt Library', icon: BookOpen },
    { id: 'settings', label: 'Repo & Settings', icon: Settings }
  ];

  return (
    <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
      <div className="p-4 space-y-1">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
          Navigation
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
                isActive
                  ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-semibold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-800 space-y-3">
        {/* Mobile toggle for small screens */}
        <div className="md:hidden flex items-center justify-between bg-slate-800/60 p-2 rounded-xl">
          <span className="text-xs text-slate-300 font-medium">Device View</span>
          <button
            onClick={() => setIsMobileView(!isMobileView)}
            className="text-xs bg-emerald-600 text-white px-2.5 py-1 rounded-lg flex items-center space-x-1"
          >
            {isMobileView ? <Smartphone className="w-3.5 h-3.5" /> : <Cpu className="w-3.5 h-3.5" />}
            <span>{isMobileView ? 'Android' : 'Desktop'}</span>
          </button>
        </div>

        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900 p-3 rounded-xl border border-slate-700/50">
          <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Dar Base44 Connected</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Repository synced successfully. Ready to build Android & AI experiences.
          </p>
        </div>
      </div>
    </aside>
  );
};
