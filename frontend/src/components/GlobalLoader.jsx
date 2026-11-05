import React, { useEffect, useState } from 'react';
import { Loader2, Scissors } from 'lucide-react';
import { subscribeToLoading } from '../api';

export default function GlobalLoader() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return subscribeToLoading((isLoading) => {
      setLoading(isLoading);
    });
  }, []);

  if (!loading) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[99999] pointer-events-auto flex items-center justify-center select-none"
    >
      {/* Top indeterminate animated progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-amber-950/30 overflow-hidden z-[100000]">
        <div className="h-full bg-gradient-to-r from-amber-500 via-amber-300 to-amber-600 animate-global-progress shadow-sm shadow-amber-500/50" />
      </div>

      {/* Dimmed frosted backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-150" />

      {/* Center glowing loader card */}
      <div className="relative z-10 flex items-center gap-3.5 px-5 py-3.5 rounded-2xl bg-stone-900/95 border border-amber-500/30 text-stone-100 shadow-2xl shadow-black/80 ring-1 ring-white/10">
        <div className="relative flex items-center justify-center w-7 h-7 text-amber-500 shrink-0">
          <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
          <Scissors className="w-3.5 h-3.5 text-amber-300 absolute" />
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 leading-tight">BarberPro</span>
          <span className="text-xs text-stone-300 font-medium leading-tight">Please wait...</span>
        </div>
      </div>
    </div>
  );
}

