import React, { useState } from 'react';
import { Users, UserPlus, Trash2, CheckCircle2, Clock, XCircle, Utensils, Search, Filter } from 'lucide-react';
import { GuestItem, EventPlan } from '../types/event';
import { calculateGuestStats } from '../utils/eventCalculations';

interface GuestsTabProps {
  plan: EventPlan;
  onUpdateGuests: (guests: GuestItem[]) => void;
}

export const GuestsTab: React.FC<GuestsTabProps> = ({ plan, onUpdateGuests }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New guest state
  const [newName, setNewName] = useState('');
  const [newGroup, setNewGroup] = useState<GuestItem['group']>('Friends');
  const [newRsvp, setNewRsvp] = useState<GuestItem['rsvpStatus']>('attending');
  const [newPlusOne, setNewPlusOne] = useState(false);
  const [newDietary, setNewDietary] = useState('');
  const [newTable, setNewTable] = useState('Table 1');

  const stats = calculateGuestStats(plan.guests);

  const filteredGuests = plan.guests.filter((g) => {
    const matchesSearch = g.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (g.table && g.table.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (g.dietary && g.dietary.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || g.rsvpStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateRsvp = (id: string, rsvpStatus: GuestItem['rsvpStatus']) => {
    const updated = plan.guests.map((g) => (g.id === id ? { ...g, rsvpStatus } : g));
    onUpdateGuests(updated);
  };

  const handleDeleteGuest = (id: string) => {
    onUpdateGuests(plan.guests.filter((g) => g.id !== id));
  };

  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newGuest: GuestItem = {
      id: `g-${Date.now()}`,
      name: newName.trim(),
      group: newGroup,
      rsvpStatus: newRsvp,
      plusOne: newPlusOne,
      dietary: newDietary.trim(),
      table: newTable.trim(),
    };

    onUpdateGuests([...plan.guests, newGuest]);
    setNewName('');
    setNewDietary('');
    setNewPlusOne(false);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & RSVP Stats */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-400" />
              Guest List & RSVP Manager
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Track invitations, plus-ones, meal requirements, and table seating arrangements.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20 transition-all self-start sm:self-auto"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Guest</span>
          </button>
        </div>

        {/* 4 RSVP KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60">
            <div className="text-[11px] text-slate-300 font-medium">Total In List</div>
            <div className="text-xl font-bold text-white mt-1">{stats.total}</div>
            <div className="text-[10px] text-slate-300 mt-0.5">Invited contacts</div>
          </div>

          <div className="bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/30">
            <div className="text-[11px] text-emerald-300 font-medium flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Attending
            </div>
            <div className="text-xl font-bold text-emerald-400 mt-1">
              {stats.attending}{' '}
              <span className="text-xs font-normal text-emerald-300">
                ({stats.totalWithPlusOnes} with +1s)
              </span>
            </div>
            <div className="text-[10px] text-emerald-400/80 mt-0.5">Confirmed headcount</div>
          </div>

          <div className="bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/30">
            <div className="text-[11px] text-amber-300 font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" /> Awaiting RSVP
            </div>
            <div className="text-xl font-bold text-amber-400 mt-1">{stats.pending}</div>
            <div className="text-[10px] text-amber-400/80 mt-0.5">Follow-up needed</div>
          </div>

          <div className="bg-rose-500/10 p-3.5 rounded-xl border border-rose-500/30">
            <div className="text-[11px] text-rose-300 font-medium flex items-center gap-1">
              <XCircle className="h-3 w-3" /> Declined
            </div>
            <div className="text-xl font-bold text-rose-400 mt-1">{stats.declined}</div>
            <div className="text-[10px] text-rose-400/80 mt-0.5">Regrets received</div>
          </div>
        </div>

        {/* Dietary breakdown pill tags */}
        {Object.keys(stats.dietaryCounts).length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-300 flex items-center gap-1 font-medium">
              <Utensils className="h-3 w-3 text-amber-400" /> Dietary Accommodations:
            </span>
            {Object.entries(stats.dietaryCounts).map(([diet, count]) => (
              <span
                key={diet}
                className="text-xs bg-slate-800 text-amber-200 border border-slate-700 px-2.5 py-0.5 rounded-full"
              >
                {diet}: <strong className="text-white">{count}</strong>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Guest Table & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <Search className="h-4 w-4 text-slate-300" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, table, diet..."
              className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-3 py-1.5 text-white w-full focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="h-3.5 w-3.5 text-slate-300" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-rose-500"
            >
              <option value="all">All RSVP Statuses</option>
              <option value="attending">Confirmed Attending</option>
              <option value="pending">Pending</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        </div>

        {/* List */}
        <div className="divide-y divide-slate-800">
          {filteredGuests.length === 0 ? (
            <div className="p-8 text-center text-slate-300 text-sm">
              No guests found matching filters.
            </div>
          ) : (
            filteredGuests.map((guest) => {
              const statusBadges = {
                attending: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                declined: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
              }[guest.rsvpStatus];

              return (
                <div
                  key={guest.id}
                  className="p-4 hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">{guest.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {guest.group}
                      </span>
                      {guest.plusOne && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30">
                          +1 Included
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-300">
                      {guest.table && (
                        <span className="text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded">
                          🪑 {guest.table}
                        </span>
                      )}
                      {guest.dietary && (
                        <span className="text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          🥗 {guest.dietary}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <select
                      value={guest.rsvpStatus}
                      onChange={(e) => handleUpdateRsvp(guest.id, e.target.value as GuestItem['rsvpStatus'])}
                      className={`text-xs font-semibold rounded-lg px-2.5 py-1 border focus:outline-none ${statusBadges}`}
                    >
                      <option value="attending">✓ Attending</option>
                      <option value="pending">? Pending</option>
                      <option value="declined">✗ Declined</option>
                    </select>

                    <button
                      onClick={() => handleDeleteGuest(guest.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Remove guest"
                      aria-label={`Delete ${guest.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Guest Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-white">
            <h3 className="text-base font-bold text-white mb-4">Add Guest / Invitee</h3>
            <form onSubmit={handleAddGuest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name / Household
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Group / Affiliation
                  </label>
                  <select
                    value={newGroup}
                    onChange={(e) => setNewGroup(e.target.value as GuestItem['group'])}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Family">Family</option>
                    <option value="Friends">Friends</option>
                    <option value="VIP">VIP / Honor</option>
                    <option value="Colleagues">Colleagues</option>
                    <option value="Community">Community</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    RSVP Status
                  </label>
                  <select
                    value={newRsvp}
                    onChange={(e) => setNewRsvp(e.target.value as GuestItem['rsvpStatus'])}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="attending">Attending</option>
                    <option value="pending">Pending</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Table / Seating
                  </label>
                  <input
                    type="text"
                    value={newTable}
                    onChange={(e) => setNewTable(e.target.value)}
                    placeholder="e.g. Table 4"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={newPlusOne}
                      onChange={(e) => setNewPlusOne(e.target.checked)}
                      className="rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-rose-500"
                    />
                    Include Plus-One (+1)
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dietary Restrictions / Allergies
                </label>
                <input
                  type="text"
                  value={newDietary}
                  onChange={(e) => setNewDietary(e.target.value)}
                  placeholder="e.g. Vegetarian, Nut Allergy, Halal"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-xs font-semibold shadow-md shadow-rose-500/20"
                >
                  Save Guest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
