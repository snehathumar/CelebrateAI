import { test, assert } from 'vitest';
import {
  calculateBudgetSummary,
  calculateProgress,
  calculateGuestStats,
  formatCurrency,
  getSampleWeddingPlan,
  getSampleBirthdayPlan,
  getSampleCommunityPlan,
  normalizeBudgetItems,
  getValidPhases,
} from './eventCalculations';
import { BudgetItem, TimelineTask, GuestItem } from '../types/event';

test('formatCurrency formats various currencies correctly', () => {
  assert.equal(formatCurrency(2500, 'USD'), '$2,500');
  assert.equal(formatCurrency(150000, 'INR'), '₹150,000');
  assert.equal(formatCurrency(3000, 'EUR'), '€3,000');
  assert.equal(formatCurrency(4500, 'GBP'), '£4,500');
});

test('calculateBudgetSummary calculates totals, remaining, and categories accurately', () => {
  const items: BudgetItem[] = [
    { id: '1', category: 'Venue', name: 'Main Hall', estimatedCost: 5000, actualCost: 4800, paid: true },
    { id: '2', category: 'Catering & Bar', name: 'Dinner Buffet', estimatedCost: 4000, actualCost: 4200, paid: false },
    { id: '3', category: 'Photo & Video', name: 'Photographer', estimatedCost: 1500, actualCost: 0, paid: false },
  ];

  const summary = calculateBudgetSummary(items, 12000);
  assert.equal(summary.totalBudget, 12000);
  assert.equal(summary.totalEstimated, 10500);
  assert.equal(summary.totalActual, 9000); // 4800 + 4200 + 0
  assert.equal(summary.totalPaid, 4800); // only item 1 is paid
  // effectiveSpent = totalActual > 0 ? 9000 : 10500
  assert.equal(summary.remainingBudget, 3000);
  assert.equal(summary.isOverBudget, false);
  assert.equal(summary.percentSpent, 75); // 9000 / 12000 = 75%
  assert.equal(summary.byCategory['Venue'].estimated, 5000);
  assert.equal(summary.byCategory['Venue'].actual, 4800);
  assert.equal(summary.byCategory['Catering & Bar'].count, 1);
});

test('calculateBudgetSummary detects over-budget state', () => {
  const items: BudgetItem[] = [
    { id: '1', category: 'Venue', name: 'Luxury Villa', estimatedCost: 15000, actualCost: 16000, paid: true },
  ];
  const summary = calculateBudgetSummary(items, 10000);
  assert.equal(summary.isOverBudget, true);
  assert.equal(summary.remainingBudget, -6000);
});

test('calculateProgress evaluates completed tasks and urgent pending count', () => {
  const tasks: TimelineTask[] = [
    { id: 't1', title: 'Task 1', phase: '12-6_months', completed: true, priority: 'high' },
    { id: 't2', title: 'Task 2', phase: '6-3_months', completed: true, priority: 'medium' },
    { id: 't3', title: 'Task 3', phase: '3-1_months', completed: false, priority: 'high' },
    { id: 't4', title: 'Task 4', phase: 'day_of', completed: false, priority: 'low' },
  ];

  const progress = calculateProgress(tasks);
  assert.equal(progress.total, 4);
  assert.equal(progress.completed, 2);
  assert.equal(progress.percent, 50);
  assert.equal(progress.urgentPending, 1); // only t3 is not completed & high priority
});

test('calculateGuestStats handles RSVP groups, plus-ones and dietary tags', () => {
  const guests: GuestItem[] = [
    { id: 'g1', name: 'Alice', group: 'Friends', rsvpStatus: 'attending', plusOne: true, dietary: 'Vegan' },
    { id: 'g2', name: 'Bob', group: 'Friends', rsvpStatus: 'attending', plusOne: false, dietary: 'Gluten-Free' },
    { id: 'g3', name: 'Charlie', group: 'Family', rsvpStatus: 'declined', plusOne: false, dietary: '' },
    { id: 'g4', name: 'Diana', group: 'VIP', rsvpStatus: 'pending', plusOne: true, dietary: 'Nut-Free' },
  ];

  const stats = calculateGuestStats(guests);
  assert.equal(stats.total, 4);
  assert.equal(stats.attending, 2);
  assert.equal(stats.declined, 1);
  assert.equal(stats.pending, 1);
  assert.equal(stats.totalWithPlusOnes, 3); // Alice (1+1) + Bob (1) = 3
  assert.equal(stats.dietaryCounts['Vegan'], 2); // Alice + plus-one
  assert.equal(stats.dietaryCounts['Gluten-Free'], 1);
});

test('Sample event generators return valid complete structures', () => {
  const wedding = getSampleWeddingPlan();
  assert.equal(wedding.type, 'wedding');
  assert.ok(wedding.budgetItems.length > 5);
  assert.ok(wedding.timeline.length > 10);
  assert.ok(wedding.vendors.length > 3);
  assert.ok(wedding.ideas.uniqueActivities.length >= 3);

  const birthday = getSampleBirthdayPlan();
  assert.equal(birthday.type, 'birthday');
  assert.ok(birthday.budgetItems.length > 3);

  const community = getSampleCommunityPlan();
  assert.equal(community.type, 'community');
  assert.ok(community.guestCount > 500);
});

test('normalizeBudgetItems scales budget items to equal total budget exactly', () => {
  const items: BudgetItem[] = [
    { id: '1', category: 'Venue', name: 'Venue', estimatedCost: 3000, actualCost: 0, paid: false },
    { id: '2', category: 'Catering & Bar', name: 'Catering', estimatedCost: 3500, actualCost: 0, paid: false },
    { id: '3', category: 'Photo & Video', name: 'Photo', estimatedCost: 1500, actualCost: 0, paid: false },
  ];
  // original sum is 8000, target is 10000
  const normalized = normalizeBudgetItems(items, 10000);
  const sum = normalized.reduce((acc, it) => acc + it.estimatedCost, 0);
  assert.equal(sum, 10000);
  assert.equal(normalized.length, 3);
});

test('getValidPhases excludes phases that have already elapsed', () => {
  const baseDate = new Date('2026-10-30T00:00:00');
  
  // Event in 20 days: should not have 12-6_months or 6-3_months or 3-1_months
  const shortPhases = getValidPhases('2026-11-19', baseDate);
  assert.deepEqual(shortPhases, ['final_weeks', 'day_of']);

  // Event in 100 days: should have 6-3_months, 3-1_months, final_weeks, day_of
  const mediumPhases = getValidPhases('2027-02-07', baseDate);
  assert.ok(mediumPhases.includes('6-3_months'));
  assert.ok(!mediumPhases.includes('12-6_months'));

  // Event in 300 days: should have 12-6_months
  const longPhases = getValidPhases('2027-08-26', baseDate);
  assert.ok(longPhases.includes('12-6_months'));
});
