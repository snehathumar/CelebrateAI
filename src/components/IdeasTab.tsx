import React, { useState } from 'react';
import { Sparkles, Palette, GlassWater, Utensils, Music, Gift, Lightbulb, Check, Copy } from 'lucide-react';
import { EventPlan, EventIdeas } from '../types/event';

interface IdeasTabProps {
  plan: EventPlan;
  onOpenAIConcierge: () => void;
}

export const IdeasTab: React.FC<IdeasTabProps> = ({ plan, onOpenAIConcierge }) => {
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const ideas = plan.ideas;

  const handleCopyHex = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedColor(hex);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Theme & Concept Hero Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 uppercase tracking-wider">
                Personalized Creative Concept
              </span>
              <span className="text-xs text-slate-400 capitalize">• {plan.type} Edition</span>
            </div>
            <h2 className="text-2xl font-extrabold text-white mt-1.5">
              {ideas.themeName || `${plan.vibe} Aesthetic`}
            </h2>
            <p className="text-sm text-slate-300 max-w-3xl mt-1 leading-relaxed">
              {ideas.themeDescription || 'A tailored visual identity and memorable hospitality experience for your event.'}
            </p>
          </div>

          <button
            onClick={onOpenAIConcierge}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white shadow-md shadow-rose-500/20 transition-all self-start sm:self-auto flex-shrink-0"
          >
            <Sparkles className="h-4 w-4" />
            <span>Ask AI For More Ideas</span>
          </button>
        </div>

        {/* Color Palette Moodboard */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Palette className="h-4 w-4 text-rose-400" /> Color Story & Moodboard Swatches
            </span>
            <span className="text-[11px] text-slate-400">Click any color to copy HEX code</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {plan.colorPalette.map((color, idx) => (
              <button
                key={idx}
                onClick={() => handleCopyHex(color.hex)}
                className="group p-3 rounded-xl border border-slate-800 bg-slate-800/40 hover:bg-slate-800/80 hover:border-slate-700 transition-all text-left flex flex-col justify-between h-24 relative overflow-hidden"
              >
                <div
                  className="h-7 w-full rounded-lg shadow-inner border border-white/10 group-hover:scale-[1.02] transition-transform"
                  style={{ backgroundColor: color.hex }}
                />
                <div className="flex items-center justify-between text-xs mt-2">
                  <div className="truncate">
                    <div className="font-semibold text-white truncate text-[11px]">{color.name}</div>
                    <div className="font-mono text-[10px] text-slate-400">{color.hex}</div>
                  </div>
                  {copiedColor === color.hex ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid: 4 Core Idea Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Unique Activities & Games */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Lightbulb className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Interactive Guest Activities & Moments</h3>
              <p className="text-[11px] text-slate-400">Engaging experiences that leave a lasting impression</p>
            </div>
          </div>

          <div className="space-y-3">
            {ideas.uniqueActivities.map((act, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="font-bold text-xs text-amber-200">{act.title}</div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{act.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Signature Food & Sips */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <div className="h-8 w-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <GlassWater className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Signature Sips & Culinary Highlights</h3>
              <p className="text-[11px] text-slate-400">Custom cocktail & themed menu recommendations</p>
            </div>
          </div>

          <div className="space-y-3">
            {ideas.signatureFoodAndDrink.map((item, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-rose-200">{item.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 uppercase font-semibold">
                    {item.type}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Decor & Ambience Styling */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Decor & Atmospheric Styling</h3>
              <p className="text-[11px] text-slate-400">Lighting, florals, and spatial design touches</p>
            </div>
          </div>

          <div className="space-y-3">
            {ideas.decorVibes.map((decor, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="font-bold text-xs text-emerald-200">{decor.title}</div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{decor.tips}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Music, Playlist Progression & Keepsake Favors */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Music className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Music Pacing & Guest Keepsakes</h3>
              <p className="text-[11px] text-slate-400">Sonic energy flow and unforgettable guest gifts</p>
            </div>
          </div>

          {/* Music tips */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300">Playlist Pacing Strategy:</div>
            <ul className="space-y-1.5">
              {ideas.musicAndVibeTips.map((tip, i) => (
                <li key={i} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-800/30 p-2 rounded-lg">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Favors */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Gift className="h-3.5 w-3.5 text-pink-400" />
              <span>Recommended Guest Favors:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {ideas.favorsAndGifts.map((favor, i) => (
                <div key={i} className="text-xs bg-slate-800 text-rose-200 px-3 py-1.5 rounded-lg border border-slate-700">
                  🎁 {favor}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
