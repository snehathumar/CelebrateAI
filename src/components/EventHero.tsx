import React, { useState } from 'react';
import { Calendar, MapPin, Users, DollarSign, CheckCircle2, Clock, Sparkles, Copy, Check } from 'lucide-react';
import { EventPlan } from '../types/event';
import { calculateBudgetSummary, calculateProgress, calculateGuestStats, formatCurrency } from '../utils/eventCalculations';

interface EventHeroProps {
  plan: EventPlan;
  onOpenEditModal?: () => void;
  onOpenAIConcierge: () => void;
}

export const EventHero: React.FC<EventHeroProps> = ({ plan, onOpenAIConcierge }) => {
  const [copiedHex, setCopiedHex] = useState<string | null>(null);

  const budgetSummary = calculateBudgetSummary(plan.budgetItems, plan.totalBudget);
  const progress = calculateProgress(plan.timeline);
  const guestStats = calculateGuestStats(plan.guests);

  // Compute countdown in days
  const eventDate = new Date(plan.date);
  const today = new Date();
  const diffTime = eventDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const countdownText = diffDays > 0 ? `${diffDays} days away` : diffDays === 0 ? 'Today is the day!' : 'Event completed';

  const handleCopyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  const typeConfig = {
    wedding: {
      badge: 'Wedding Celebration',
      badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      gradient: 'from-rose-950/40 via-slate-900 to-slate-950',
    },
    birthday: {
      badge: 'Birthday Celebration',
      badgeBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      gradient: 'from-purple-950/40 via-slate-900 to-slate-950',
    },
    community: {
      badge: 'Community Event',
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      gradient: 'from-emerald-950/40 via-slate-900 to-slate-950',
    },
    custom: {
      badge: 'Special Celebration',
      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      gradient: 'from-amber-950/40 via-slate-900 to-slate-950',
    },
  }[plan.type] || {
    badge: 'Celebration',
    badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
    gradient: 'from-indigo-950/40 via-slate-900 to-slate-950',
  };

  return (
    <div className={`relative bg-gradient-to-b ${typeConfig.gradient} border-b border-slate-800 pt-8 pb-10 text-white overflow-hidden`}>
      {/* Background ambient decorative blurs */}
      <div className="absolute top-0 right-10 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Main Titles */}
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${typeConfig.badgeBg}`}>
                {typeConfig.badge}
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                <Clock className="h-3 w-3 text-amber-400" />
                {countdownText}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              {plan.title}
            </h1>

            <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-sm text-slate-300">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-rose-400" />
                <span>{new Date(plan.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-emerald-400" />
                <span className="truncate max-w-xs">{plan.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-blue-400" />
                <span>{plan.guestCount} Planned Guests</span>
              </div>
            </div>

            {/* Vibe and Theme Tagline */}
            <div className="pt-1 flex flex-wrap items-center gap-3">
              <span className="text-xs text-slate-400 font-medium">Vibe & Theme:</span>
              <span className="text-xs text-rose-200 bg-rose-500/10 px-2.5 py-1 rounded-md border border-rose-500/20 italic">
                "{plan.vibe}"
              </span>
            </div>

            {/* Color Palette Swatches */}
            {plan.colorPalette && plan.colorPalette.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-slate-400 font-medium">Palette:</span>
                <div className="flex items-center gap-1.5">
                  {plan.colorPalette.map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleCopyColor(color.hex)}
                      title={`${color.name} (${color.hex}) - Click to copy hex`}
                      className="group relative flex items-center justify-center h-6 w-6 rounded-full border border-white/20 shadow-sm transition-transform hover:scale-110 active:scale-95"
                      style={{ backgroundColor: color.hex }}
                    >
                      {copiedHex === color.hex ? (
                        <Check className="h-3 w-3 text-slate-900 drop-shadow" />
                      ) : null}
                      <span className="sr-only">{color.name}</span>
                    </button>
                  ))}
                  {copiedHex && (
                    <span className="text-xs text-emerald-400 ml-1 font-mono animate-pulse">
                      Copied {copiedHex}!
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick AI Concierge Trigger Card */}
          <div className="flex-shrink-0">
            <button
              onClick={onOpenAIConcierge}
              className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-800/90 to-slate-800/50 border border-slate-700/80 hover:border-rose-500/50 shadow-xl transition-all group"
            >
              <div className="h-11 w-11 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold uppercase tracking-wider text-rose-300">
                  GenAI Event Concierge
                </div>
                <div className="text-sm font-bold text-white flex items-center gap-1.5">
                  Ask budget advice or ideas
                  <span className="text-rose-400 group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
                <div className="text-xs text-slate-400">Context-aware planning copilot</div>
              </div>
            </button>
          </div>
        </div>

        {/* 3 Metric Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {/* Card 1: Budget */}
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/60 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Budget</span>
              <DollarSign className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="text-2xl font-bold text-white">
                {formatCurrency(plan.totalBudget, plan.currency)}
              </div>
              <div className={`text-xs font-medium ${budgetSummary.isOverBudget ? 'text-rose-400' : 'text-emerald-400'}`}>
                {budgetSummary.isOverBudget
                  ? `${formatCurrency(Math.abs(budgetSummary.remainingBudget), plan.currency)} over`
                  : `${formatCurrency(budgetSummary.remainingBudget, plan.currency)} left`}
              </div>
            </div>
            <div className="mt-3">
              <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    budgetSummary.isOverBudget ? 'bg-rose-500' : 'bg-gradient-to-r from-amber-500 to-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, budgetSummary.percentSpent)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                <span>Allocated: {formatCurrency(budgetSummary.totalEstimated, plan.currency)}</span>
                <span>{budgetSummary.percentSpent}% utilized</span>
              </div>
            </div>
          </div>

          {/* Card 2: Timeline Progress */}
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/60 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Timeline Progress</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="text-2xl font-bold text-white">
                {progress.completed} <span className="text-sm font-normal text-slate-400">/ {progress.total} tasks</span>
              </div>
              <div className="text-xs font-medium text-emerald-400">
                {progress.percent}% done
              </div>
            </div>
            <div className="mt-3">
              <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                <span>{plan.timeline.filter(t => t.phase === 'day_of').length} Day-Of milestones</span>
                {progress.urgentPending > 0 ? (
                  <span className="text-amber-400 font-medium">{progress.urgentPending} urgent pending</span>
                ) : (
                  <span className="text-emerald-400">All urgent complete</span>
                )}
              </div>
            </div>
          </div>

          {/* Card 3: Guests & RSVPs */}
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700/60 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Guest RSVPs</span>
              <Users className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <div className="text-2xl font-bold text-white">
                {guestStats.attending} <span className="text-sm font-normal text-slate-400">confirmed</span>
              </div>
              <div className="text-xs text-indigo-300 font-medium">
                {guestStats.totalWithPlusOnes} total heads
              </div>
            </div>
            <div className="mt-3">
              <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${guestStats.total > 0 ? (guestStats.attending / guestStats.total) * 100 : 0}%` }}
                />
                <div
                  className="h-full bg-amber-500"
                  style={{ width: `${guestStats.total > 0 ? (guestStats.pending / guestStats.total) * 100 : 0}%` }}
                />
                <div
                  className="h-full bg-rose-500"
                  style={{ width: `${guestStats.total > 0 ? (guestStats.declined / guestStats.total) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
                <span className="text-emerald-400">✓ {guestStats.attending} Yes</span>
                <span className="text-amber-400">? {guestStats.pending} Pending</span>
                <span className="text-rose-400">✗ {guestStats.declined} No</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
