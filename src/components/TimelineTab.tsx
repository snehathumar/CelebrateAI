import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle2, Circle, Plus, Trash2, User, AlertCircle, Filter, Printer } from 'lucide-react';
import { TimelinePhase, TimelineTask, EventPlan } from '../types/event';
import { getPhaseLabel, calculateProgress } from '../utils/eventCalculations';

interface TimelineTabProps {
  plan: EventPlan;
  onUpdateTimeline: (tasks: TimelineTask[]) => void;
  onPrintDayOf: () => void;
}

export const TimelineTab: React.FC<TimelineTabProps> = ({
  plan,
  onUpdateTimeline,
  onPrintDayOf,
}) => {
  const [activePhase, setActivePhase] = useState<TimelinePhase | 'all'>('all');
  const [onlyIncomplete, setOnlyIncomplete] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newPhase, setNewPhase] = useState<TimelinePhase>('day_of');
  const [newTargetDate, setNewTargetDate] = useState(plan.date);
  const [newDayOfTime, setNewDayOfTime] = useState('02:00 PM');
  const [newAssignee, setNewAssignee] = useState('Event Coordinator');
  const [newPriority, setNewPriority] = useState<TimelineTask['priority']>('medium');
  const [newNotes, setNewNotes] = useState('');

  const progress = calculateProgress(plan.timeline);

  const phaseOptions: { id: TimelinePhase | 'all'; label: string; count: number }[] = [
    { id: 'all', label: 'All Tasks', count: plan.timeline.length },
    { id: '12-6_months', label: '12-6 Months', count: plan.timeline.filter((t) => t.phase === '12-6_months').length },
    { id: '6-3_months', label: '6-3 Months', count: plan.timeline.filter((t) => t.phase === '6-3_months').length },
    { id: '3-1_months', label: '3-1 Months', count: plan.timeline.filter((t) => t.phase === '3-1_months').length },
    { id: 'final_weeks', label: 'Final Weeks', count: plan.timeline.filter((t) => t.phase === 'final_weeks').length },
    { id: 'day_of', label: '⏰ Day-Of Schedule', count: plan.timeline.filter((t) => t.phase === 'day_of').length },
  ];

  let filtered = plan.timeline;
  if (activePhase !== 'all') {
    filtered = filtered.filter((t) => t.phase === activePhase);
  }
  if (onlyIncomplete) {
    filtered = filtered.filter((t) => !t.completed);
  }

  // Sort day_of tasks chronologically if possible
  if (activePhase === 'day_of') {
    filtered = [...filtered].sort((a, b) => {
      const timeA = a.dayOfTime || '';
      const timeB = b.dayOfTime || '';
      return timeA.localeCompare(timeB);
    });
  }

  const handleToggleTask = (id: string) => {
    const updated = plan.timeline.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    onUpdateTimeline(updated);
  };

  const handleDeleteTask = (id: string) => {
    const updated = plan.timeline.filter((task) => task.id !== id);
    onUpdateTimeline(updated);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const task: TimelineTask = {
      id: `t-${Date.now()}`,
      title: newTitle.trim(),
      phase: newPhase,
      targetDate: newPhase !== 'day_of' ? newTargetDate : undefined,
      dayOfTime: newPhase === 'day_of' ? newDayOfTime : undefined,
      completed: false,
      assignee: newAssignee.trim(),
      priority: newPriority,
      notes: newNotes.trim(),
    };

    onUpdateTimeline([...plan.timeline, task]);
    setNewTitle('');
    setNewNotes('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Timeline Controls & Day-Of Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="h-5 w-5 text-rose-400" />
              Master Countdown & Day-Of Run of Show
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Phased milestone checklist leading up to the celebration, plus hour-by-hour day-of coordination.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onPrintDayOf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition-colors shadow-sm"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Run of Show</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add Milestone</span>
            </button>
          </div>
        </div>

        {/* Phase Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 mt-6 pt-5 border-t border-slate-800">
          {phaseOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setActivePhase(opt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activePhase === opt.id
                  ? opt.id === 'day_of'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-rose-500 text-white font-semibold shadow-md shadow-rose-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
              }`}
            >
              {opt.label} ({opt.count})
            </button>
          ))}

          {/* Toggle incomplete */}
          <div className="ml-auto flex items-center gap-2 pt-2 sm:pt-0">
            <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyIncomplete}
                onChange={(e) => setOnlyIncomplete(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-rose-500"
              />
              Hide completed tasks
            </label>
          </div>
        </div>
      </div>

      {/* Task List Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl divide-y divide-slate-800">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            No tasks found in this phase. Click "Add Milestone" to schedule one!
          </div>
        ) : (
          filtered.map((task) => (
            <div
              key={task.id}
              className={`p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                task.completed ? 'bg-slate-900/40 opacity-75' : 'hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <button
                  onClick={() => handleToggleTask(task.id)}
                  title={task.completed ? 'Mark incomplete' : 'Mark complete'}
                  className={`mt-0.5 transition-colors ${
                    task.completed ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {task.completed ? (
                    <CheckCircle2 className="h-5 w-5 fill-emerald-500/10" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </button>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-sm font-semibold ${
                        task.completed ? 'line-through text-slate-400' : 'text-white'
                      }`}
                    >
                      {task.title}
                    </span>

                    {/* Phase badge */}
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {getPhaseLabel(task.phase)}
                    </span>

                    {/* Day-of Time badge */}
                    {task.dayOfTime && (
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {task.dayOfTime}
                      </span>
                    )}

                    {/* Priority badge */}
                    <span
                      className={`text-[10px] uppercase font-bold px-2 py-0.2 rounded ${
                        task.priority === 'high'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : task.priority === 'medium'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>

                  {task.notes && (
                    <p className="text-xs text-slate-400 mt-1 max-w-2xl">{task.notes}</p>
                  )}

                  {/* Assignee & Date info */}
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
                    {task.assignee && (
                      <span className="flex items-center gap-1 text-slate-300">
                        <User className="h-3 w-3 text-slate-400" />
                        {task.assignee}
                      </span>
                    )}
                    {task.targetDate && task.phase !== 'day_of' && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-slate-400" />
                        Target: {task.targetDate}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center justify-end sm:justify-center">
                <button
                  onClick={() => handleDeleteTask(task.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                  title="Delete task"
                  aria-label={`Delete task ${task.title}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Milestone Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-white">
            <h3 className="text-base font-bold text-white mb-4">Add Event Milestone</h3>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Milestone Title
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Grand Entrance & Speeches"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Timeline Phase
                  </label>
                  <select
                    value={newPhase}
                    onChange={(e) => setNewPhase(e.target.value as TimelinePhase)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="12-6_months">12-6 Months</option>
                    <option value="6-3_months">6-3 Months</option>
                    <option value="3-1_months">3-1 Months</option>
                    <option value="final_weeks">Final Weeks</option>
                    <option value="day_of">Day-Of Run of Show</option>
                  </select>
                </div>

                {newPhase === 'day_of' ? (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Day-Of Time
                    </label>
                    <input
                      type="text"
                      value={newDayOfTime}
                      onChange={(e) => setNewDayOfTime(e.target.value)}
                      placeholder="e.g. 04:30 PM"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Target Date
                    </label>
                    <input
                      type="date"
                      value={newTargetDate}
                      onChange={(e) => setNewTargetDate(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Assignee / Lead
                  </label>
                  <input
                    type="text"
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    placeholder="e.g. Host, DJ, Caterer"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="high">High (Critical)</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notes & Details
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Double check microphone batteries and entrance cue song"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold shadow-md shadow-rose-500/20"
                >
                  Save Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
