import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Briefcase, Lightbulb, Users, Sparkles, Plus, Clock, MessageSquare } from 'lucide-react';
import { EventPlan, CurrencyCode, BudgetItem, TimelineTask, VendorItem, GuestItem } from './types/event';
import { getSampleWeddingPlan, getSampleBirthdayPlan, getSampleCommunityPlan } from './utils/eventCalculations';
import { Navbar } from './components/Navbar';
import { EventHero } from './components/EventHero';
import { BudgetTab } from './components/BudgetTab';
import { TimelineTab } from './components/TimelineTab';
import { VendorsTab } from './components/VendorsTab';
import { IdeasTab } from './components/IdeasTab';
import { GuestsTab } from './components/GuestsTab';
import { AIPlannerModal } from './components/AIPlannerModal';
import { AIChatConcierge } from './components/AIChatConcierge';
import { DayOfPrintModal } from './components/DayOfPrintModal';

type ActiveTab = 'timeline' | 'budget' | 'vendors' | 'ideas' | 'guests';

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

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('celebrate_ai_active_plan', JSON.stringify(currentPlan));
  }, [currentPlan]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSelectSample = (type: 'wedding' | 'birthday' | 'community') => {
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
  };

  const handlePlanGenerated = (newPlan: EventPlan) => {
    setCurrentPlan(newPlan);
    showToast(`🎉 New AI Plan Created: "${newPlan.title}"!`);
  };

  const handleCurrencyChange = (currency: CurrencyCode) => {
    setCurrentPlan((prev) => ({ ...prev, currency }));
    showToast(`Currency changed to ${currency}`);
  };

  const handleUpdateBudgetItems = (budgetItems: BudgetItem[]) => {
    setCurrentPlan((prev) => ({ ...prev, budgetItems }));
  };

  const handleUpdateTotalBudget = (totalBudget: number) => {
    setCurrentPlan((prev) => ({ ...prev, totalBudget }));
    showToast('Updated budget ceiling!');
  };

  const handleUpdateTimeline = (timeline: TimelineTask[]) => {
    setCurrentPlan((prev) => ({ ...prev, timeline }));
  };

  const handleUpdateVendors = (vendors: VendorItem[]) => {
    setCurrentPlan((prev) => ({ ...prev, vendors }));
  };

  const handleUpdateGuests = (guests: GuestItem[]) => {
    setCurrentPlan((prev) => ({ ...prev, guests }));
  };

  const handleExportPlan = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentPlan, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${currentPlan.title.replace(/\s+/g, '_')}_Plan.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Event plan JSON exported successfully!');
  };

  const tabs: { id: ActiveTab; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: 'timeline',
      label: 'Timeline & Run of Show',
      icon: <Calendar className="h-4 w-4" />,
      count: currentPlan.timeline.length,
    },
    {
      id: 'budget',
      label: 'Budget & Costing',
      icon: <DollarSign className="h-4 w-4" />,
      count: currentPlan.budgetItems.length,
    },
    {
      id: 'vendors',
      label: 'Vendor Checklists',
      icon: <Briefcase className="h-4 w-4" />,
      count: currentPlan.vendors.length,
    },
    {
      id: 'ideas',
      label: 'Personalized Ideas & Mood',
      icon: <Lightbulb className="h-4 w-4" />,
    },
    {
      id: 'guests',
      label: 'Guest RSVPs',
      icon: <Users className="h-4 w-4" />,
      count: currentPlan.guests.length,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Toast notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-gradient-to-r from-rose-600 to-amber-600 text-white px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Sparkles className="h-4 w-4" />
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
        onOpenAIConcierge={() => setIsConciergeOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs Bar */}
        <div className="flex border-b border-slate-800 overflow-x-auto no-scrollbar mb-8">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-rose-500 text-white bg-slate-900/60'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <span className={isActive ? 'text-rose-400' : 'text-slate-500'}>
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

        {/* Tab Views */}
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
      </main>

      {/* Floating AI Concierge FAB */}
      <button
        onClick={() => setIsConciergeOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white font-bold text-xs shadow-xl shadow-rose-500/30 hover:scale-105 active:scale-95 transition-all"
        title="Open GenAI Event Concierge"
      >
        <Sparkles className="h-4 w-4" />
        <span className="hidden sm:inline">Ask Event Concierge</span>
      </button>

      {/* AI Generator Modal */}
      <AIPlannerModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onPlanGenerated={handlePlanGenerated}
      />

      {/* AI Chat Concierge Drawer */}
      <AIChatConcierge
        isOpen={isConciergeOpen}
        onClose={() => setIsConciergeOpen(false)}
        currentPlan={currentPlan}
      />

      {/* Day-Of Printable Run of Show Modal */}
      <DayOfPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        plan={currentPlan}
      />
    </div>
  );
}
