import React from 'react';
import { Wifi, Battery, Signal } from 'lucide-react';

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-65px)] bg-slate-950 p-4 md:p-8">
      <div className="relative w-full max-w-[410px] h-[820px] bg-slate-900 border-[10px] border-slate-800 rounded-[50px] shadow-2xl overflow-hidden flex flex-col">
        {/* Android status bar */}
        <div className="bg-slate-950 text-white px-6 py-2 flex items-center justify-between text-xs shrink-0 select-none">
          <span className="font-semibold">09:41</span>
          <div className="w-20 h-4 bg-slate-900 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2"></div>
          <div className="flex items-center space-x-2 text-slate-300">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>

        {/* Screen content */}
        <div className="flex-1 overflow-y-auto bg-slate-950">
          {children}
        </div>

        {/* Android bottom nav bar indicator */}
        <div className="bg-slate-950 py-3 flex justify-center shrink-0">
          <div className="w-32 h-1 bg-slate-700 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
