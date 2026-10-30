import React from 'react';
import { Sparkles, Calendar, PlusCircle, Printer, Download, RotateCcw, PartyPopper } from 'lucide-react';
import { CurrencyCode, EventPlan } from '../types/event';
import { CURRENCY_SYMBOLS } from '../utils/eventCalculations';

interface NavbarProps {
  currentPlan: EventPlan;
  onSelectSample: (type: 'wedding' | 'birthday' | 'community') => void;
  onOpenAIGenerator: () => void;
  onCurrencyChange: (currency: CurrencyCode) => void;
  onPrintRunOfShow: () => void;
  onExportPlan: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPlan,
  onSelectSample,
  onOpenAIGenerator,
  onCurrencyChange,
  onPrintRunOfShow,
  onExportPlan,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-rose-500 via-amber-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <PartyPopper className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-rose-100 to-amber-200 bg-clip-text text-transparent">
                  CelebrateAI
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  GenAI Planner
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Weddings • Birthdays • Community Galas</p>
            </div>
          </div>

          {/* Quick Preset Selector & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Presets dropdown / chips */}
            <div className="hidden lg:flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700 text-xs">
              <span className="text-slate-400 px-2 font-medium">Presets:</span>
              <button
                onClick={() => onSelectSample('wedding')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  currentPlan.type === 'wedding'
                    ? 'bg-rose-500 text-white font-medium shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                💍 Wedding
              </button>
              <button
                onClick={() => onSelectSample('birthday')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  currentPlan.type === 'birthday'
                    ? 'bg-purple-600 text-white font-medium shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                🎂 Birthday
              </button>
              <button
                onClick={() => onSelectSample('community')}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  currentPlan.type === 'community'
                    ? 'bg-emerald-600 text-white font-medium shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                }`}
              >
                🤝 Community
              </button>
            </div>

            {/* Currency selector */}
            <select
              value={currentPlan.currency}
              onChange={(e) => onCurrencyChange(e.target.value as CurrencyCode)}
              aria-label="Currency"
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              {(Object.keys(CURRENCY_SYMBOLS) as CurrencyCode[]).map((cur) => (
                <option key={cur} value={cur}>
                  {cur} ({CURRENCY_SYMBOLS[cur]})
                </option>
              ))}
            </select>

            {/* Export & Print */}
            <button
              onClick={onPrintRunOfShow}
              title="Print Day-Of Run of Show"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
              aria-label="Print Day-Of Run of Show"
            >
              <Printer className="h-4 w-4" />
            </button>
            <button
              onClick={onExportPlan}
              title="Export Plan JSON"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
              aria-label="Export Plan JSON"
            >
              <Download className="h-4 w-4" />
            </button>

            {/* AI Generator CTA */}
            <button
              onClick={onOpenAIGenerator}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white shadow-md shadow-rose-500/25 transition-all active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              <span>AI Plan Generator</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
