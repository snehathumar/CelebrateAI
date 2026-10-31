import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { Calendar, DollarSign, Briefcase, Lightbulb, Users, Sparkles, Loader2 } from 'lucide-react';
import { EventPlan, CurrencyCode, BudgetItem, TimelineTask, VendorItem, GuestItem } from './types/event';
import { getSampleWeddingPlan, getSampleBirthdayPlan, getSampleCommunityPlan } from './utils/eventCalculations';
import { Navbar } from './components/Navbar';
import { EventHero } from './components/EventHero';

// Lazy-load dashboard tabs for optimal frontend bundle splitting and performance
const BudgetTab = lazy(() =>
  import('./components/BudgetTab').then((m) => ({ default: m.BudgetTab }))
);
const TimelineTab = lazy(() =>
  import('./components/TimelineTab').then((m) => ({ default: m.TimelineTab }))
);
const VendorsTab = lazy(() =>
  import('./components/VendorsTab').then((m) => ({ default: m.VendorsTab }))
);
const IdeasTab = lazy(() =>
  import('./components/IdeasTab').then((m) => ({ default: m.IdeasTab }))
);
const GuestsTab = lazy(() =>
  import('./components/GuestsTab').then((m) => ({ default: m.GuestsTab }))
);

// Lazy-load heavier modal & concierge components
const AIPlannerModal = lazy(() =>
  import('./components/AIPlannerModal').then((m) => ({ default: m.AIPlannerModal }))
);
const AIChatConcierge = lazy(() =>
  import('./components/AIChatConcierge').then((m) => ({ default: m.AIChatConcierge }))
);
const DayOfPrintModal = lazy(() =>
  import('./components/DayOfPrintModal').then((m) => ({ default: m.DayOfPrintModal }))
);

type ActiveTab = 'timeline' | 'budget' | 'vendors' | 'ideas' | 'guests';

function TabLoadingFallback() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3"
    >
      <Loader2 className="h-8 w-8 animate-spin text-rose-500" aria-hidden="true" />
      <span className="text-sm font-medium">Loading section details...</span>
    </div>
  );
}

export default function App() {
  const [currentPlan, setCurrentPlan] = useState<EventPlan>(() => {
    const saved = localStorage.getItem('celebrate_ai_active_plan');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.warn('Failed to parse saved plan:', e);
      }
    }
    return getSampleWeddingPlan();
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('timeline');
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isConciergeOpen, setIsConciergeOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [planSource, setPlanSource] = useState<'gemini' | 'template' | undefined>(undefined);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('celebrate_ai_active_plan', JSON.stringify(currentPlan));
  }, [currentPlan]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    const timer = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(timer);
  }, []);

  const handleSelectSample = useCallback(
    (type: 'wedding' | 'birthday' | 'community') => {
      setPlanSource(undefined);
      if (type === 'wedding') {
        setCurrentPlan(getSampleWeddingPlan());
        showToast('Loaded Wedding Celebration plan!');
      } else if (type === 'birthday') {
        setCurrentPlan(getSampleBirthdayPlan());
        showToast('Loaded Milestone Birthday plan!');
      } else {
        setCurrentPlan(getSampleCommunityPlan());
        showToast('Loaded Community Street Festival plan!');
      }
    },
    [showToast]
  );

  const handlePlanGenerated = useCallback(
    (newPlan: EventPlan, source?: 'gemini' | 'template') => {
      setCurrentPlan(newPlan);
      setPlanSource(source);
      if (source === 'template') {
        showToast(`Generated: "${newPlan.title}" (Template Fallback)`);
      } else {
        showToast(`🎉 New AI Plan Created: "${newPlan.title}"!`);
      }
    },
    [showToast]
  );

  const handleCurrencyChange = useCallback(
    (currency: CurrencyCode) => {
      setCurrentPlan((prev) => ({ ...prev, currency }));
      showToast(`Currency changed to ${currency}`);
    },
    [showToast]
  );

  const handleUpdateBudgetItems = useCallback((budgetItems: BudgetItem[]) => {
    setCurrentPlan((prev) => ({ ...prev, budgetItems }));
  }, []);

  const handleUpdateTotalBudget = useCallback(
    (totalBudget: number) => {
      setCurrentPlan((prev) => ({ ...prev, totalBudget }));
      showToast('Updated budget ceiling!');
    },
    [showToast]
  );

  const handleUpdateTimeline = useCallback((timeline: TimelineTask[]) => {
    setCurrentPlan((prev) => ({ ...prev, timeline }));
  }, []);

  const handleUpdateVendors = useCallback((vendors: VendorItem[]) => {
    setCurrentPlan((prev) => ({ ...prev, vendors }));
  }, []);

  const handleUpdateGuests = useCallback((guests: GuestItem[]) => {
    setCurrentPlan((prev) => ({ ...prev, guests }));
  }, []);

  const handleExportPlan = useCallback(() => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(currentPlan, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `${currentPlan.title.replace(/\s+/g, '_')}_Plan.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Event plan JSON exported successfully!');
  }, [currentPlan, showToast]);

  const tabs = useMemo(
    () => [
      {
        id: 'timeline' as const,
        label: 'Timeline & Run of Show',
        icon: <Calendar className="h-4 w-4" aria-hidden="true" />,
        count: currentPlan.timeline.length,
      },
      {
        id: 'budget' as const,
        label: 'Budget & Costing',
        icon: <DollarSign className="h-4 w-4" aria-hidden="true" />,
        count: currentPlan.budgetItems.length,
      },
      {
        id: 'vendors' as const,
        label: 'Vendor Checklists',
        icon: <Briefcase className="h-4 w-4" aria-hidden="true" />,
        count: currentPlan.vendors.length,
      },
      {
        id: 'ideas' as const,
        label: 'Personalized Ideas & Mood',
        icon: <Lightbulb className="h-4 w-4" aria-hidden="true" />,
      },
      {
        id: 'guests' as const,
        label: 'Guest RSVPs',
        icon: <Users className="h-4 w-4" aria-hidden="true" />,
        count: currentPlan.guests.length,
      },
    ],
    [
      currentPlan.timeline.length,
      currentPlan.budgetItems.length,
      currentPlan.vendors.length,
      currentPlan.guests.length,
    ]
  );

  // WAI-ARIA Accessible Keyboard Arrow Navigation across tabs
  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      let targetIndex = index;
      if (e.key === 'ArrowRight') {
        targetIndex = (index + 1) % tabs.length;
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        targetIndex = (index - 1 + tabs.length) % tabs.length;
        e.preventDefault();
      } else if (e.key === 'Home') {
        targetIndex = 0;
        e.preventDefault();
      } else if (e.key === 'End') {
        targetIndex = tabs.length - 1;
        e.preventDefault();
      }

      if (targetIndex !== index) {
        setActiveTab(tabs[targetIndex].id);
        const el = document.getElementById(`tab-${tabs[targetIndex].id}`);
        el?.focus();
      }
    },
    [tabs]
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Skip to Content for Accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-rose-600 focus:text-white focus:rounded-lg focus:shadow-xl focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Toast notification with aria-live */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-20 right-6 z-50 bg-gradient-to-r from-rose-600 to-amber-600 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-bounce"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        currentPlan={currentPlan}
        onSelectSample={handleSelectSample}
        onOpenAIGenerator={() => setIsAIModalOpen(true)}
        onCurrencyChange={handleCurrencyChange}
        onPrintRunOfShow={() => setIsPrintModalOpen(true)}
        onExportPlan={handleExportPlan}
      />

      {/* Hero Banner with metrics & palette */}
      <EventHero
        plan={currentPlan}
        planSource={planSource}
        onOpenAIConcierge={() => setIsConciergeOpen(true)}
      />

      {/* Main Content Area */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 focus:outline-none"
      >
        {/* Navigation Tabs Bar with WAI-ARIA pattern */}
        <div
          role="tablist"
          aria-label="Event Planning Sections"
          className="flex border-b border-slate-800 overflow-x-auto no-scrollbar mb-8"
        >
          {tabs.map((tab, idx) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isActive}
                aria-controls={`panel-${tab.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, idx)}
                className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-rose-500 rounded-t-md cursor-pointer ${
                  isActive
                    ? 'border-rose-500 text-white bg-slate-900/60'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className={isActive ? 'text-rose-400' : 'text-slate-500'} aria-hidden="true">
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Views with TabPanel accessibility and Suspense lazy boundary */}
        <div
          id={`panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`tab-${activeTab}`}
          tabIndex={0}
          className="focus:outline-none"
        >
          <Suspense fallback={<TabLoadingFallback />}>
            {activeTab === 'timeline' && (
              <TimelineTab
                plan={currentPlan}
                onUpdateTimeline={handleUpdateTimeline}
                onPrintDayOf={() => setIsPrintModalOpen(true)}
              />
            )}

            {activeTab === 'budget' && (
              <BudgetTab
                plan={currentPlan}
                onUpdateBudgetItems={handleUpdateBudgetItems}
                onUpdateTotalBudget={handleUpdateTotalBudget}
              />
            )}

            {activeTab === 'vendors' && (
              <VendorsTab
                plan={currentPlan}
                onUpdateVendors={handleUpdateVendors}
              />
            )}

            {activeTab === 'ideas' && (
              <IdeasTab
                plan={currentPlan}
                onOpenAIConcierge={() => setIsConciergeOpen(true)}
              />
            )}

            {activeTab === 'guests' && (
              <GuestsTab
                plan={currentPlan}
                onUpdateGuests={handleUpdateGuests}
              />
            )}
          </Suspense>
        </div>
      </main>

      {/* Floating AI Concierge FAB */}
      <button
        onClick={() => setIsConciergeOpen(true)}
        aria-label="Open GenAI Event Concierge"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white font-bold text-xs shadow-xl shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 focus:ring-offset-slate-950 cursor-pointer"
        title="Open GenAI Event Concierge"
      >
        <Sparkles className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Ask Event Concierge</span>
      </button>

      {/* Suspense-wrapped Modals and Drawers */}
      <Suspense fallback={null}>
        {isAIModalOpen && (
          <AIPlannerModal
            isOpen={isAIModalOpen}
            onClose={() => setIsAIModalOpen(false)}
            onPlanGenerated={handlePlanGenerated}
          />
        )}

        {isConciergeOpen && (
          <AIChatConcierge
            isOpen={isConciergeOpen}
            onClose={() => setIsConciergeOpen(false)}
            currentPlan={currentPlan}
          />
        )}

        {isPrintModalOpen && (
          <DayOfPrintModal
            isOpen={isPrintModalOpen}
            onClose={() => setIsPrintModalOpen(false)}
            plan={currentPlan}
          />
        )}
      </Suspense>
    </div>
  );
}
