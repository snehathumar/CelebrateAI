import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { BudgetTab } from './BudgetTab';
import { GuestsTab } from './GuestsTab';
import { EventPlan } from '../types/event';
import { getSampleWeddingPlan } from '../utils/eventCalculations';

describe('React Component Unit & Accessibility Tests', () => {
  describe('BudgetTab Component', () => {
    it('displays "Status: Over-Allocated" and overrun warning when expenses exceed totalBudget', () => {
      const basePlan: EventPlan = getSampleWeddingPlan();
      // Ceiling is 10,000, but expenses total 15,000
      const overBudgetPlan: EventPlan = {
        ...basePlan,
        totalBudget: 10000,
        budgetItems: [
          {
            id: 'b1',
            category: 'Venue',
            name: 'Grand Ballroom',
            estimatedCost: 15000,
            actualCost: 15000,
            paid: true,
          },
        ],
      };

      render(
        <BudgetTab
          plan={overBudgetPlan}
          onUpdateBudgetItems={vi.fn()}
          onUpdateTotalBudget={vi.fn()}
        />
      );

      const statusCard = screen.getByTestId('budget-status-card');
      expect(statusCard).toBeInTheDocument();
      expect(statusCard).toHaveTextContent(/Budget Overrun/i);
      expect(statusCard).toHaveTextContent(/Status: Over-Allocated/i);
      expect(statusCard).toHaveTextContent(/Exceeds ceiling limit/i);
    });

    it('displays "Status: Within Budget" and remaining cushion when expenses are under totalBudget', () => {
      const basePlan: EventPlan = getSampleWeddingPlan();
      const underBudgetPlan: EventPlan = {
        ...basePlan,
        totalBudget: 25000,
        budgetItems: [
          {
            id: 'b1',
            category: 'Venue',
            name: 'Garden Terrace',
            estimatedCost: 8000,
            actualCost: 0,
            paid: false,
          },
        ],
      };

      render(
        <BudgetTab
          plan={underBudgetPlan}
          onUpdateBudgetItems={vi.fn()}
          onUpdateTotalBudget={vi.fn()}
        />
      );

      const statusCard = screen.getByTestId('budget-status-card');
      expect(statusCard).toBeInTheDocument();
      expect(statusCard).toHaveTextContent(/Remaining Cushion/i);
      expect(statusCard).toHaveTextContent(/Status: Within Budget/i);
      expect(statusCard).toHaveTextContent(/Available to spend/i);
    });
  });

  describe('GuestsTab Component', () => {
    it('renders non-color-only accessible status labels for RSVP states', () => {
      const planWithGuests: EventPlan = {
        ...getSampleWeddingPlan(),
        guests: [
          { id: 'g1', name: 'John Doe', group: 'VIP', rsvpStatus: 'attending', plusOne: true },
          { id: 'g2', name: 'Jane Smith', group: 'Friends', rsvpStatus: 'pending', plusOne: false },
          { id: 'g3', name: 'Bob Jones', group: 'Family', rsvpStatus: 'declined', plusOne: false },
        ],
      };

      render(<GuestsTab plan={planWithGuests} onUpdateGuests={vi.fn()} />);

      // Check g1: Confirmed Attending
      const selectG1 = screen.getByTestId('guest-rsvp-select-g1') as HTMLSelectElement;
      expect(selectG1.value).toBe('attending');
      expect(selectG1).toHaveTextContent(/Status: Confirmed Attending/i);

      // Check g2: Pending
      const selectG2 = screen.getByTestId('guest-rsvp-select-g2') as HTMLSelectElement;
      expect(selectG2.value).toBe('pending');
      expect(selectG2).toHaveTextContent(/Status: Awaiting \/ Pending/i);

      // Check g3: Declined
      const selectG3 = screen.getByTestId('guest-rsvp-select-g3') as HTMLSelectElement;
      expect(selectG3.value).toBe('declined');
      expect(selectG3).toHaveTextContent(/Status: Declined/i);
    });
  });
});
