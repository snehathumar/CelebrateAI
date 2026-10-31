import React, { useState } from 'react';
import { Briefcase, CheckSquare, Square, Mail, Sparkles, Plus, Trash2, DollarSign, Check, Copy, Loader2, X, Phone, MessageSquare } from 'lucide-react';
import { VendorItem, VendorStatus, EventPlan } from '../types/event';
import { formatCurrency } from '../utils/eventCalculations';

interface VendorsTabProps {
  plan: EventPlan;
  onUpdateVendors: (vendors: VendorItem[]) => void;
}

export const VendorsTab: React.FC<VendorsTabProps> = ({ plan, onUpdateVendors }) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // AI Negotiator Modal state
  const [negotiatingVendor, setNegotiatingVendor] = useState<VendorItem | null>(null);
  const [negotiationData, setNegotiationData] = useState<{
    inquiryEmail?: string;
    negotiationPitch?: string;
    questionsToCheck?: string[];
    source?: 'gemini' | 'template';
  } | null>(null);
  const [isLoadingNegotiation, setIsLoadingNegotiation] = useState(false);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // New vendor form state
  const [newCategory, setNewCategory] = useState('Catering');
  const [newName, setNewName] = useState('');
  const [newContactPerson, setNewContactPerson] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newQuote, setNewQuote] = useState(2000);
  const [newStatus, setNewStatus] = useState<VendorStatus>('researching');
  const [newNotes, setNewNotes] = useState('');

  const statusList: { id: VendorStatus | 'all'; label: string }[] = [
    { id: 'all', label: 'All Vendors' },
    { id: 'researching', label: '🔍 Researching' },
    { id: 'contacted', label: '✉️ Contacted' },
    { id: 'quoted', label: '📋 Quoted' },
    { id: 'booked', label: '🤝 Booked' },
    { id: 'paid', label: '💳 Paid in Full' },
  ];

  const filteredVendors = React.useMemo(() => {
    return selectedStatus === 'all'
      ? plan.vendors
      : plan.vendors.filter((v) => v.status === selectedStatus);
  }, [plan.vendors, selectedStatus]);

  const handleUpdateStatus = (id: string, status: VendorStatus) => {
    const updated = plan.vendors.map((v) => (v.id === id ? { ...v, status } : v));
    onUpdateVendors(updated);
  };

  const handleToggleChecklistItem = (vendorId: string, itemIdx: number) => {
    const updated = plan.vendors.map((v) => {
      if (v.id !== vendorId) return v;
      const checklist = [...v.checklist];
      const item = checklist[itemIdx];
      if (item.startsWith('[✓] ')) {
        checklist[itemIdx] = item.replace('[✓] ', '');
      } else {
        checklist[itemIdx] = `[✓] ${item}`;
      }
      return { ...v, checklist };
    });
    onUpdateVendors(updated);
  };

  const handleDeleteVendor = (id: string) => {
    onUpdateVendors(plan.vendors.filter((v) => v.id !== id));
  };

  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newVendor: VendorItem = {
      id: `v-${Date.now()}`,
      category: newCategory,
      name: newName.trim(),
      contactPerson: newContactPerson.trim(),
      email: newEmail.trim(),
      phone: newPhone.trim(),
      status: newStatus,
      quoteAmount: Number(newQuote),
      depositPaid: 0,
      notes: newNotes.trim(),
      checklist: [
        'Review license and commercial insurance',
        'Verify cancellation and force majeure clause',
        'Confirm load-in setup timeline',
      ],
    };

    onUpdateVendors([...plan.vendors, newVendor]);
    setNewName('');
    setNewContactPerson('');
    setNewEmail('');
    setNewPhone('');
    setNewNotes('');
    setShowAddModal(false);
  };

  const handleOpenAINegotiator = async (vendor: VendorItem) => {
    setNegotiatingVendor(vendor);
    setIsLoadingNegotiation(true);
    setNegotiationData(null);

    try {
      const res = await fetch('/api/vendor-negotiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorCategory: vendor.category,
          vendorName: vendor.name,
          quoteAmount: vendor.quoteAmount || 2500,
          targetBudget: Math.round((vendor.quoteAmount || 2500) * 0.85),
          eventTitle: plan.title,
          eventType: plan.type,
          eventDate: plan.date,
          currency: plan.currency,
          requirements: vendor.notes || 'Full package service for our celebration',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNegotiationData(data);
      }
    } catch (err) {
      console.error('Failed to generate vendor negotiation:', err);
    } finally {
      setIsLoadingNegotiation(false);
    }
  };

  const handleCopyText = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-indigo-400" />
              Vendor Checklist & Contract Pipeline
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Manage inquiries, quote negotiations, vetting checklists, and confirmed bookings.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20 transition-all self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Add Vendor</span>
          </button>
        </div>

        {/* Status filters */}
        <div className="flex flex-wrap items-center gap-1.5 mt-6 pt-5 border-t border-slate-800">
          {statusList.map((st) => (
            <button
              key={st.id}
              onClick={() => setSelectedStatus(st.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedStatus === st.id
                  ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
              }`}
            >
              {st.label}{' '}
              {st.id !== 'all' && (
                <span className="text-[10px] opacity-75">
                  ({plan.vendors.filter((v) => v.status === st.id).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Vendor Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredVendors.length === 0 ? (
          <div className="lg:col-span-2 p-10 bg-slate-900 border border-slate-800 rounded-2xl text-center text-slate-300 text-sm">
            No vendors match this filter. Click "Add Vendor" to add a new supplier.
          </div>
        ) : (
          filteredVendors.map((vendor) => {
            const statusColors: Record<VendorStatus, string> = {
              researching: 'bg-slate-700 text-slate-200 border-slate-600',
              contacted: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
              quoted: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
              booked: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
              paid: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
            };

            return (
              <div
                key={vendor.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                          {vendor.category}
                        </span>
                        <h3 className="text-base font-bold text-white">{vendor.name}</h3>
                      </div>
                      {vendor.contactPerson && (
                        <p className="text-xs text-slate-300 mt-1">
                          Contact: <span className="text-slate-300">{vendor.contactPerson}</span>
                        </p>
                      )}
                    </div>

                    {/* Status selector */}
                    <select
                      value={vendor.status}
                      onChange={(e) => handleUpdateStatus(vendor.id, e.target.value as VendorStatus)}
                      className={`text-xs font-medium rounded-lg px-2.5 py-1 border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                        statusColors[vendor.status]
                      }`}
                    >
                      <option value="researching">Researching</option>
                      <option value="contacted">Contacted</option>
                      <option value="quoted">Quoted</option>
                      <option value="booked">Booked</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>

                  {/* Financial & Contact metrics */}
                  <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                    <div>
                      <div className="text-slate-300 text-[10px]">Quote Amount</div>
                      <div className="font-bold text-amber-200 text-sm">
                        {formatCurrency(vendor.quoteAmount, plan.currency)}
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-300 text-[10px]">Deposit Paid</div>
                      <div className="font-bold text-emerald-300 text-sm">
                        {formatCurrency(vendor.depositPaid, plan.currency)}
                      </div>
                    </div>
                    {vendor.email && (
                      <div className="col-span-2 flex items-center gap-1.5 text-slate-300 truncate pt-1">
                        <Mail className="h-3 w-3 text-slate-300" />
                        <span className="truncate">{vendor.email}</span>
                      </div>
                    )}
                    {vendor.phone && (
                      <div className="col-span-2 flex items-center gap-1.5 text-slate-300 truncate">
                        <Phone className="h-3 w-3 text-slate-300" />
                        <span>{vendor.phone}</span>
                      </div>
                    )}
                  </div>

                  {vendor.notes && (
                    <p className="text-xs text-slate-300 mt-3 italic bg-slate-800/20 p-2 rounded-lg border border-slate-800/60">
                      "{vendor.notes}"
                    </p>
                  )}

                  {/* Checklist */}
                  <div className="mt-4">
                    <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>Vetting Checklist</span>
                      <span className="text-[10px] text-slate-300 font-normal">
                        {vendor.checklist.filter((i) => i.startsWith('[✓] ')).length} / {vendor.checklist.length} done
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {vendor.checklist.map((item, idx) => {
                        const isDone = item.startsWith('[✓] ');
                        const displayItem = isDone ? item.replace('[✓] ', '') : item;
                        return (
                          <div
                            key={idx}
                            onClick={() => handleToggleChecklistItem(vendor.id, idx)}
                            className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer group hover:text-white"
                          >
                            <span className="mt-0.5 text-slate-300 group-hover:text-indigo-400">
                              {isDone ? (
                                <CheckSquare className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <Square className="h-3.5 w-3.5" />
                              )}
                            </span>
                            <span className={isDone ? 'line-through text-slate-500' : ''}>
                              {displayItem}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenAINegotiator(vendor)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 text-indigo-300 border border-indigo-500/40 transition-all shadow-sm"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                    <span>AI Negotiator & Questions</span>
                  </button>

                  <button
                    onClick={() => handleDeleteVendor(vendor.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Remove vendor"
                    aria-label={`Delete ${vendor.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* AI Negotiator & Email Generator Modal */}
      {negotiatingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-white my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    AI Vendor Strategy: {negotiatingVendor.name}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Category: {negotiatingVendor.category} • Quoted: {formatCurrency(negotiatingVendor.quoteAmount, plan.currency)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNegotiatingVendor(null)}
                className="text-slate-300 hover:text-white p-1"
                aria-label="Close negotiator"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isLoadingNegotiation ? (
              <div className="py-16 text-center space-y-3">
                <Loader2 className="h-8 w-8 text-indigo-400 animate-spin mx-auto" />
                <p className="text-sm text-slate-300">
                  Generating custom inquiry emails, negotiation script & vetting questions...
                </p>
              </div>
            ) : negotiationData ? (
              <div className="space-y-6 pt-4 text-xs">
                {negotiationData.source === 'template' && (
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                    Template result (AI unavailable)
                  </div>
                )}
                {/* 1. Initial Inquiry Draft */}
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-amber-300 flex items-center gap-1.5">
                      <Mail className="h-4 w-4" /> Initial Reach-Out / Availability Email
                    </span>
                    <button
                      onClick={() => handleCopyText(negotiationData.inquiryEmail || '', 'inquiry')}
                      className="flex items-center gap-1 text-[11px] bg-slate-700 hover:bg-slate-600 px-2.5 py-1 rounded-md text-white transition-colors"
                    >
                      {copiedType === 'inquiry' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedType === 'inquiry' ? 'Copied!' : 'Copy Email'}</span>
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs leading-relaxed">
                    {negotiationData.inquiryEmail}
                  </pre>
                </div>

                {/* 2. Negotiation & Counter-Offer Pitch */}
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-rose-300 flex items-center gap-1.5">
                      <MessageSquare className="h-4 w-4" /> Tactful Negotiation / Value-Add Pitch
                    </span>
                    <button
                      onClick={() => handleCopyText(negotiationData.negotiationPitch || '', 'pitch')}
                      className="flex items-center gap-1 text-[11px] bg-slate-700 hover:bg-slate-600 px-2.5 py-1 rounded-md text-white transition-colors"
                    >
                      {copiedType === 'pitch' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedType === 'pitch' ? 'Copied!' : 'Copy Script'}</span>
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap font-sans text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-xs leading-relaxed">
                    {negotiationData.negotiationPitch}
                  </pre>
                </div>

                {/* 3. Top 5 Questions To Ask */}
                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
                  <h4 className="font-bold text-sm text-indigo-300 mb-2.5">
                    Crucial Vetting Questions To Ask Before Signing
                  </h4>
                  <ul className="space-y-2">
                    {(negotiationData.questionsToCheck || []).map((q, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-300 leading-snug">
                        <span className="font-bold text-indigo-400 mt-0.5">{i + 1}.</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-300">
                Failed to generate strategy. Please try again.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Vendor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-white">
            <h3 className="text-base font-bold text-white mb-4">Add Vendor Partner</h3>
            <form onSubmit={handleAddVendor} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    required
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="e.g. Photography, Catering"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as VendorStatus)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="researching">Researching</option>
                    <option value="contacted">Contacted</option>
                    <option value="quoted">Quoted</option>
                    <option value="booked">Booked</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Vendor / Business Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Luminary Visuals Co."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={newContactPerson}
                    onChange={(e) => setNewContactPerson(e.target.value)}
                    placeholder="e.g. Sarah Miller"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Quote ({plan.currency})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={newQuote}
                    onChange={(e) => setNewQuote(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="contact@vendor.com"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Deliverables & Notes
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. 8 hours coverage, online gallery, drone video included"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20"
                >
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
