import { describe, it, expect } from 'vitest';
import { netBalances, minimizePayments } from './settle.js';
import { splitExpense } from './split.js';

describe('shared/settle.js', () => {
  // Test C (settle): balances Eyob +75000, Selam +15000, Abebe -45000, Dawit -45000
  // -> exactly 3 payments, and applying them brings every balance to 0.
  it('Test C: greedy minimization produces exactly 3 payments and settles all balances to 0', () => {
    const balances = {
      Eyob: 75000,
      Selam: 15000,
      Abebe: -45000,
      Dawit: -45000,
    };

    const payments = minimizePayments(balances);

    // Must be exactly 3 payments
    expect(payments.length).toBe(3);

    // Apply payments to verify balances reach zero
    const settled = { ...balances };
    for (const p of payments) {
      expect(p.amountCents).toBeGreaterThan(0);
      settled[p.from] += p.amountCents;
      settled[p.to] -= p.amountCents;
    }

    for (const [member, bal] of Object.entries(settled)) {
      expect(bal).toBe(0);
    }
  });

  // Test D: nets always sum to 0 for random inputs (property-style test, 100 runs)
  it('Test D: nets always sum to 0 across 100 random multi-item, multi-member expenses', () => {
    const members = ['Selam', 'Eyob', 'Abebe', 'Dawit', 'Tigist', 'Kidus'];

    for (let run = 0; run < 100; run++) {
      const numExpenses = Math.floor(Math.random() * 5) + 1; // 1 to 5 expenses
      const expenses = [];

      for (let e = 0; e < numExpenses; e++) {
        const payer = members[Math.floor(Math.random() * members.length)];
        const numItems = Math.floor(Math.random() * 6) + 1; // 1 to 6 items
        const items = [];

        for (let i = 0; i < numItems; i++) {
          const priceCents = Math.floor(Math.random() * 50000) + 100; // 1 to 500 ETB
          // Random 1 to 4 members assigned to item
          const shuffled = [...members].sort(() => 0.5 - Math.random());
          const assignedCount = Math.floor(Math.random() * 3) + 1;
          const assigned = shuffled.slice(0, assignedCount);

          items.push({
            id: `item_${e}_${i}`,
            priceCents,
            memberIds: assigned,
          });
        }

        const extrasCents = Math.floor(Math.random() * 10000); // 0 to 100 ETB extras
        const split = splitExpense({ items, extrasCents });

        expenses.push({
          id: `exp_${e}`,
          paidBy: payer,
          totalCents: split.totalCents,
          perMember: split.perMember,
        });
      }

      const balances = netBalances(expenses, members);
      const totalNet = Object.values(balances).reduce((sum, val) => sum + val, 0);

      // Invariant: sum of net balances MUST be exactly 0
      expect(totalNet).toBe(0);

      // Verify minimized payments settle the generated random balances
      const payments = minimizePayments(balances);
      const settled = { ...balances };
      for (const p of payments) {
        settled[p.from] += p.amountCents;
        settled[p.to] -= p.amountCents;
      }
      for (const bal of Object.values(settled)) {
        expect(bal).toBe(0);
      }
    }
  });

  it('handles already settled groups with 0 payments', () => {
    const balances = { Selam: 0, Eyob: 0, Abebe: 0 };
    const payments = minimizePayments(balances);
    expect(payments).toEqual([]);
  });
});

