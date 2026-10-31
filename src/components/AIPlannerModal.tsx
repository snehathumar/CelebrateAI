import React, { useState } from 'react';
import { X, Sparkles, Loader2, Calendar, MapPin, Users, DollarSign, Wand2 } from 'lucide-react';
import { EventPlan, EventType, CurrencyCode } from '../types/event';
import { CURRENCY_SYMBOLS } from '../utils/eventCalculations';

interface AIPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanGenerated: (plan: EventPlan, source?: 'gemini' | 'template') => void;
}

const VIBE_SUGGESTIONS: Record<EventType, string[]> = {
  wedding: [
    'Modern Botanical & Candlelight Elegance',
    'Black-Tie Luxe & Champagne Glamour',
    'Boho Desert Chic & Warm Terracotta',
    'Rustic Tuscan Vineyard & Fairy Lights',
    'Intimate Secret Garden & Acoustic Soul',
  ],
  birthday: [
    'Level 30: Cyberpunk & Retro Arcade',
    'Golden Hour Rooftop & Disco Fever',
    'Enchanted Forest & Whimsical Tea Party',
    'Festival Glamping & Acoustic Campfire',
    'Casino Royale Mystery Gala',
  ],
  community: [
    'Harvest & Roots Street Fair',
    'Spring Bloom Eco & Makers Fest',
    'Global Flavors & World Music Carnival',
    'Neighborhood Block Party & Open-Air Cinema',
    'Tech & Art Innovation Showcase',
  ],
  custom: [
    'Retro Nostalgia & Neon Cocktail Lounge',
    'Minimalist Scandinavian & Warm Amber',
    'Tropical Sunset & Reggae Grooves',
  ],
};

export const AIPlannerModal: React.FC<AIPlannerModalProps> = ({
  isOpen,
  onClose,
  onPlanGenerated,
}) => {
  const [type, setType] = useState<EventType>('wedding');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('2026-12-18');
  const [location, setLocation] = useState('Austin, TX');
  const [guestCount, setGuestCount] = useState(120);
  const [totalBudget, setTotalBudget] = useState(25000);
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [vibe, setVibe] = useState('Modern Botanical & Candlelight Elegance');
  const [preferences, setPreferences] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusStep, setStatusStep] = useState(0);

  if (!isOpen) return null;

  const handleTypeChange = (newType: EventType) => {
    setType(newType);
    if (VIBE_SUGGESTIONS[newType]?.[0]) {
      setVibe(VIBE_SUGGESTIONS[newType][0]);
    }
    if (newType === 'wedding') {
      setTitle('Sophia & Alex’s Wedding Celebration');
      setTotalBudget(30000);
      setGuestCount(130);
    } else if (newType === 'birthday') {
      setTitle('Maya’s 25th Golden Hour Rooftop Birthday');
      setTotalBudget(5000);
      setGuestCount(50);
    } else if (newType === 'community') {
      setTitle('Maplewood Neighborhood Fall Block Festival');
      setTotalBudget(15000);
      setGuestCount(500);
    } else {
      setTitle('Midsummer Night Gala');
      setTotalBudget(12000);
      setGuestCount(80);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setStatusStep(0);

    const steps = [
      'Synthesizing theme, palette & creative ideas...',
      'Structuring budget allocation and vendor estimates...',
      'Crafting countdown timeline & day-of run of show...',
      'Curating actionable vendor checklists...',
    ];

    const interval = setInterval(() => {
      setStatusStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 900);

    try {
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title: title || `${type} Celebration`,
          date,
          location,
          guestCount: Number(guestCount),
          totalBudget: Number(totalBudget),
          currency,
          vibe,
          preferences,
        }),
      });

      const data = await response.json();
      clearInterval(interval);
      if (data.success && data.plan) {
        onPlanGenerated(data.plan, data.source || 'gemini');
        onClose();
      } else {
        alert('Could not generate plan. Please try again.');
      }
    } catch (err) {
      console.error('Error in plan generation:', err);
      clearInterval(interval);
      alert('Network or server error generating plan.');
    } finally {
      setIsGenerating(false);
    }
  };

  const stepsList = [
    'Synthesizing theme, palette & creative ideas...',
    'Structuring budget allocation and vendor estimates...',
    'Crafting countdown timeline & day-of run of show...',
    'Curating actionable vendor checklists...',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 text-white">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-rose-950/50 via-slate-900 to-indigo-950/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                GenAI Event Planner Wizard
              </h2>
              <p className="text-xs text-slate-300">
                Generate an end-to-end celebration plan with budgets, schedules, vendors & ideas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleGenerate} className="p-6 space-y-5">
          {/* 1. Event Type Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              1. What kind of event are you organizing?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {[
                { id: 'wedding', label: '💍 Wedding', desc: 'Ceremony & reception' },
                { id: 'birthday', label: '🎂 Birthday', desc: 'Milestone & celebration' },
                { id: 'community', label: '🤝 Community', desc: 'Festival & gathering' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleTypeChange(opt.id as EventType)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    type === opt.id
                      ? 'border-rose-500 bg-rose-500/10 text-white shadow-md'
                      : 'border-slate-800 bg-slate-800/60 text-slate-300 hover:border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-semibold text-sm">{opt.label}</div>
                  <div className="text-[11px] text-slate-300 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Event Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Event Title / Name
            </label>
            <input
              type="text"
              required
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Maya & Leo's Rooftop Wedding"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* 3. Date, Location & Guest Count */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-rose-400" /> Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-emerald-400" /> Location / Venue
              </label>
              <input
                type="text"
                required
                maxLength={200}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City or venue name"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-blue-400" /> Guest Count
              </label>
              <input
                type="number"
                min="1"
                max="10000"
                required
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>
          </div>

          {/* 4. Budget & Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-amber-400" /> Total Target Budget
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="1000000000"
                  step="500"
                  required
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 pl-9 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <span className="absolute left-3 top-2.5 text-slate-300 font-semibold text-sm">
                  {CURRENCY_SYMBOLS[currency] || '$'}
                </span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                {(Object.keys(CURRENCY_SYMBOLS) as CurrencyCode[]).map((cur) => (
                  <option key={cur} value={cur}>
                    {cur} ({CURRENCY_SYMBOLS[cur]})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. Vibe / Theme suggestions */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
              <Wand2 className="h-3.5 w-3.5 text-rose-400" /> Aesthetic, Vibe & Theme
            </label>
            <input
              type="text"
              required
              maxLength={200}
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
              placeholder="e.g. Romantic candlelit botanical, retro arcade synthwave..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            {/* Quick chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] text-slate-300 py-0.5">Quick picks:</span>
              {(VIBE_SUGGESTIONS[type] || []).map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setVibe(sug)}
                  className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700 transition-colors"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* 6. Special Preferences */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Special Preferences, Dietary or Cultural Needs (Optional)
            </label>
            <textarea
              rows={2}
              maxLength={500}
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              placeholder="e.g. Outdoor garden setting, vegan appetizers, live saxophonist, audio guestbook, dog-friendly..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Progress Animation during AI generation */}
          {isGenerating && (
            <div className="p-4 rounded-xl bg-slate-950/70 border border-rose-500/30 space-y-2">
              <div className="flex items-center gap-2 text-rose-300 text-xs font-medium">
                <Loader2 className="h-4 w-4 animate-spin text-rose-400" />
                <span>{stepsList[statusStep]}</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-rose-500 via-amber-500 to-indigo-500 h-full transition-all duration-700"
                  style={{ width: `${((statusStep + 1) / stepsList.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white shadow-lg shadow-rose-500/25 transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Crafting Your Plan...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Full Event Plan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
