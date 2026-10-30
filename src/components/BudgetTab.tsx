import React, { useState } from 'react';
import { DollarSign, Plus, Trash2, CheckCircle2, AlertTriangle, Download, Filter, Tag } from 'lucide-react';
import { BudgetItem, CurrencyCode, EventPlan } from '../types/event';
import { calculateBudgetSummary, formatCurrency } from '../utils/eventCalculations';

interface BudgetTabProps {
  plan: EventPlan;
  onUpdateBudgetItems: (items: BudgetItem[]) => void;
  onUpdateTotalBudget: (total: number) => void;
}

export const BudgetTab: React.FC<BudgetTabProps> = ({
  plan,
  onUpdateBudgetItems,
  onUpdateTotalBudget,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isEditingBudgetLimit, setIsEditingBudgetLimit] = useState(false);
  const [newBudgetLimit, setNewBudgetLimit] = useState(plan.totalBudget);

  // New item form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<BudgetItem['category']>('Catering & Bar');
  const [newItemEstimated, setNewItemEstimated] = useState(500);
  const [newItemNotes, setNewItemNotes] = useState('');

  const summary = calculateBudgetSummary(plan.budgetItems, plan.totalBudget);

  const categories: BudgetItem['category'][] = [
    'Venue',
    'Catering & Bar',
    'Decor & Florals',
    'Photo & Video',
    'Music & Entertainment',
    'Attire & Beauty',
    'Favors & Gifts',
    'Logistics & Tech',
    'Emergency Buffer',
  ];

  const filteredItems = selectedCategory === 'All'
    ? plan.budgetItems
    : plan.budgetItems.filter((item) => item.category === selectedCategory);

  const handleTogglePaid = (id: string) => {
    const updated = plan.budgetItems.map((item) =>
      item.id === id ? { ...item, paid: !item.paid } : item
    );
    onUpdateBudgetItems(updated);
  };

  const handleUpdateCost = (id: string, field: 'estimatedCost' | 'actualCost', value: number) => {
    const updated = plan.budgetItems.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    );
    onUpdateBudgetItems(updated);
  };

  const handleDeleteItem = (id: string) => {
    const updated = plan.budgetItems.filter((item) => item.id !== id);
    onUpdateBudgetItems(updated);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: BudgetItem = {
      id: `b-${Date.now()}`,
      category: newItemCategory,
      name: newItemName.trim(),
      estimatedCost: Number(newItemEstimated),
      actualCost: 0,
      paid: false,
      notes: newItemNotes.trim(),
    };

    onUpdateBudgetItems([...plan.budgetItems, newItem]);
    setNewItemName('');
    setNewItemNotes('');
    setNewItemEstimated(500);
    setShowAddModal(false);
  };

  const handleExportCSV = () => {
    const headers = ['Category', 'Item Name', 'Estimated Cost', 'Actual Cost', 'Paid', 'Notes'];
    const rows = plan.budgetItems.map((i) => [
      `"${i.category}"`,
      `"${i.name.replace(/"/g, '""')}"`,
      i.estimatedCost,
      i.actualCost,
      i.paid ? 'Yes' : 'No',
      `"${(i.notes || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${plan.title.replace(/\s+/g, '_')}_Budget.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Budget Ceiling Adjuster */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-amber-400" />
              Event Budget & Cost Controller
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Track estimates against actual invoices, manage cash flow, and avoid budget surprises.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* Financial KPI Dashboard */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium">Budget Ceiling</div>
            {isEditingBudgetLimit ? (
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="number"
                  value={newBudgetLimit}
                  onChange={(e) => setNewBudgetLimit(Number(e.target.value))}
                  className="w-28 bg-slate-700 text-white text-sm px-2 py-1 rounded"
                />
                <button
                  onClick={() => {
                    onUpdateTotalBudget(newBudgetLimit);
                    setIsEditingBudgetLimit(false);
                  }}
                  className="text-xs bg-emerald-600 text-white px-2 py-1 rounded"
                >
                  Save
                </button>
              </div>
            ) : (
              <div
                onClick={() => {
                  setNewBudgetLimit(plan.totalBudget);
                  setIsEditingBudgetLimit(true);
                }}
                className="text-2xl font-bold text-white mt-1 cursor-pointer hover:text-amber-300 transition-colors"
                title="Click to edit budget limit"
              >
                {formatCurrency(plan.totalBudget, plan.currency)}
                <span className="text-[10px] text-slate-400 ml-1.5 font-normal">✎ Edit</span>
              </div>
            )}
            <div className="text-[11px] text-slate-400 mt-1">Total planned ceiling</div>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium">Total Estimated</div>
            <div className="text-2xl font-bold text-amber-300 mt-1">
              {formatCurrency(summary.totalEstimated, plan.currency)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Sum of expected quotes</div>
          </div>

          <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60">
            <div className="text-xs text-slate-400 font-medium">Actual Invoiced</div>
            <div className="text-2xl font-bold text-indigo-300 mt-1">
              {formatCurrency(summary.totalActual, plan.currency)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Paid: {formatCurrency(summary.totalPaid, plan.currency)}
            </div>
          </div>

          <div className={`p-4 rounded-xl border ${
            summary.isOverBudget
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}>
            <div className="text-xs font-medium">
              {summary.isOverBudget ? 'Budget Overrun' : 'Remaining Cushion'}
            </div>
            <div className="text-2xl font-bold mt-1">
              {formatCurrency(Math.abs(summary.remainingBudget), plan.currency)}
            </div>
            <div className="text-[11px] mt-1">
              {summary.isOverBudget ? '⚠️ Exceeds ceiling limit' : '✓ Available to spend'}
            </div>
          </div>
        </div>

        {/* Category breakdown bar cards */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Category Allocations
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(summary.byCategory).map(([cat, val]) => {
              const catPercent = plan.totalBudget > 0 ? Math.round((val.estimated / plan.totalBudget) * 100) : 0;
              return (
                <div
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? 'All' : cat)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    selectedCategory === cat
                      ? 'border-rose-500 bg-rose-500/10'
                      : 'border-slate-800 bg-slate-800/40 hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white">{cat}</span>
                    <span className="text-slate-400">{catPercent}%</span>
                  </div>
                  <div className="flex items-baseline justify-between mt-1 text-sm">
                    <span className="font-bold text-amber-200">
                      {formatCurrency(val.estimated, plan.currency)}
                    </span>
                    <span className="text-[11px] text-slate-400">{val.count} items</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-700 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${Math.min(100, catPercent)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Expense Items Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Table Filter Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-300">Filter Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="All">All Categories ({plan.budgetItems.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="text-xs text-slate-400">
            Showing <span className="font-bold text-white">{filteredItems.length}</span> line items
          </div>
        </div>

        {/* Line Items List */}
        <div className="divide-y divide-slate-800">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No items in this category yet. Click "Add Expense" to create one.
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-4 hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => handleTogglePaid(item.id)}
                    title={item.paid ? 'Mark unpaid' : 'Mark paid'}
                    className={`mt-0.5 p-1 rounded-md transition-colors ${
                      item.paid ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-white">{item.name}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {item.category}
                      </span>
                      {item.paid && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          Paid
                        </span>
                      )}
                    </div>
                    {item.notes && <p className="text-xs text-slate-400 mt-0.5">{item.notes}</p>}
                  </div>
                </div>

                {/* Amount inputs and actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="flex items-center gap-3 text-xs">
                    <div>
                      <div className="text-slate-400 text-[10px]">Estimated</div>
                      <input
                        type="number"
                        value={item.estimatedCost}
                        onChange={(e) =>
                          handleUpdateCost(item.id, 'estimatedCost', Number(e.target.value))
                        }
                        className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-amber-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <div className="text-slate-400 text-[10px]">Actual</div>
                      <input
                        type="number"
                        value={item.actualCost}
                        onChange={(e) =>
                          handleUpdateCost(item.id, 'actualCost', Number(e.target.value))
                        }
                        placeholder="0"
                        className="w-20 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-indigo-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete item"
                    aria-label={`Delete ${item.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-white">
            <h3 className="text-base font-bold text-white mb-4">Add Budget Expense</h3>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Item Description
                </label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Acoustic Guitarist for Ceremony"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Category
                </label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Estimated Cost ({plan.currency})
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newItemEstimated}
                  onChange={(e) => setNewItemEstimated(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Notes / Supplier Reference
                </label>
                <input
                  type="text"
                  value={newItemNotes}
                  onChange={(e) => setNewItemNotes(e.target.value)}
                  placeholder="e.g. Deposit required 30 days prior"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
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
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
