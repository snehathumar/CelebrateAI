import React from 'react';
import { X, Printer, Calendar, Clock, MapPin, Phone, User, CheckSquare } from 'lucide-react';
import { EventPlan } from '../types/event';

interface DayOfPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: EventPlan;
}

export const DayOfPrintModal: React.FC<DayOfPrintModalProps> = ({
  isOpen,
  onClose,
  plan,
}) => {
  if (!isOpen) return null;

  const dayOfTasks = plan.timeline
    .filter((t) => t.phase === 'day_of')
    .sort((a, b) => (a.dayOfTime || '').localeCompare(b.dayOfTime || ''));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-white my-8 max-h-[90vh] overflow-y-auto print:bg-white print:text-black print:border-none print:shadow-none print:max-h-none print:overflow-visible">
        {/* Modal Controls (hidden on print) */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-amber-400" />
            <h3 className="font-bold text-base text-white">Day-Of Run of Show Itinerary</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg shadow-md transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white"
              aria-label="Close print preview"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="space-y-6 text-xs text-slate-200 print:text-black">
          {/* Header */}
          <div className="border-b border-slate-800 print:border-gray-300 pb-4">
            <div className="text-[10px] uppercase font-bold tracking-widest text-amber-400 print:text-gray-600">
              Official Day-Of Coordination Itinerary
            </div>
            <h1 className="text-xl font-extrabold text-white print:text-black mt-1">
              {plan.title}
            </h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-300 print:text-gray-700 mt-2 text-xs">
              <span className="flex items-center gap-1 font-medium">
                <Calendar className="h-3.5 w-3.5" /> Date: {plan.date}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> Venue: {plan.location}
              </span>
              <span>Guests: {plan.guestCount}</span>
            </div>
          </div>

          {/* Hourly Timeline */}
          <div>
            <h2 className="text-sm font-bold text-amber-300 print:text-black uppercase tracking-wider mb-3">
              Chronological Master Schedule
            </h2>

            {dayOfTasks.length === 0 ? (
              <p className="text-slate-300 print:text-gray-600 italic">
                No tasks set for Day-Of phase. Add items under Timeline with phase "Day-Of Schedule".
              </p>
            ) : (
              <div className="space-y-2.5">
                {dayOfTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-lg border border-slate-800 print:border-gray-300 bg-slate-800/40 print:bg-gray-50 flex items-start justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="font-mono font-bold text-amber-400 print:text-gray-900 text-xs w-20 flex-shrink-0">
                        {task.dayOfTime || 'TBD'}
                      </div>
                      <div>
                        <div className="font-semibold text-white print:text-black text-xs">
                          {task.title}
                        </div>
                        {task.notes && (
                          <div className="text-[11px] text-slate-300 print:text-gray-600 mt-0.5">
                            {task.notes}
                          </div>
                        )}
                      </div>
                    </div>
                    {task.assignee && (
                      <div className="text-[10px] bg-slate-800 print:bg-gray-200 text-slate-300 print:text-gray-800 px-2 py-0.5 rounded font-medium flex-shrink-0">
                        {task.assignee}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Key Vendor Contacts Sheet */}
          <div className="pt-4 border-t border-slate-800 print:border-gray-300">
            <h2 className="text-sm font-bold text-indigo-300 print:text-black uppercase tracking-wider mb-3">
              Emergency Vendor Contacts & Leads
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {plan.vendors.map((v) => (
                <div
                  key={v.id}
                  className="p-2.5 rounded-lg border border-slate-800 print:border-gray-300 text-xs"
                >
                  <div className="font-bold text-white print:text-black">
                    {v.category}: {v.name}
                  </div>
                  <div className="text-slate-300 print:text-gray-600 text-[11px] mt-0.5">
                    {v.contactPerson && <span>Contact: {v.contactPerson} • </span>}
                    {v.phone && <span>Tel: {v.phone}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Coordinator Checklist */}
          <div className="pt-4 border-t border-slate-800 print:border-gray-300">
            <h2 className="text-xs font-bold text-slate-300 print:text-black uppercase tracking-wider mb-2">
              Coordinator Day-Of Quick Reminders
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-slate-300 print:text-gray-700">
              <li>☐ Cash vendor tip envelopes with named receipts</li>
              <li>☐ Emergency bridal/host kit (safety pins, stain remover, mints, tape)</li>
              <li>☐ Verified ceremony microphone batteries and audio backup track</li>
              <li>☐ Guest seating list printed with dietary tags marked</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
