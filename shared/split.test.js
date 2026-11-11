import { describe, it, expect } from 'vitest';
import { splitExpense } from './split.js';
import { toCents, formatETB } from './money.js';

describe('shared/money.js', () => {
  it('converts birr float or string to integer cents', () => {
    expect(toCents(562.5)).toBe(56250);
    expect(toCents('562.50')).toBe(56250);
    expect(toCents('1,250.75 ETB')).toBe(125075);
    expect(toCents(0)).toBe(0);
  });

  it('formats cents to ETB string', () => {
    expect(formatETB(56250)).toBe('562.50 ETB');
    expect(formatETB(0)).toBe('0.00 ETB');
    expect(formatETB(-45000)).toBe('-450.00 ETB');
    expect(formatETB(99)).toBe('0.99 ETB');
  });
});

describe('shared/split.js', () => {
  // Test A (split): items Shiro 20000 (Selam), Kitfo 45000 (Eyob), Tibs 35000 (Abebe),
  // extras 25000 -> Selam 25000, Eyob 56250, Abebe 43750, sum 125000.
  it('Test A: proportionally distributes extras to item subtotals', () => {
    const result = splitExpense({
      items: [
        { id: '1', name: 'Shiro', priceCents: 20000, memberIds: ['Selam'] },
        { id: '2', name: 'Kitfo', priceCents: 45000, memberIds: ['Eyob'] },
        { id: '3', name: 'Tibs', priceCents: 35000, memberIds: ['Abebe'] },
      ],
      extrasCents: 25000,
    });

    expect(result.perMember['Selam']).toBe(25000);
    expect(result.perMember['Eyob']).toBe(56250);
    expect(result.perMember['Abebe']).toBe(43750);
    expect(result.totalCents).toBe(125000);

    const sumOfShares = Object.values(result.perMember).reduce((a, b) => a + b, 0);
    expect(sumOfShares).toBe(125000);
  });

  // Test B (shared item): one 30000 item shared by 3 people with 1 cent remainder
  // cases -> shares sum exactly to the price.
  it('Test B: shared items with remainder cases divide without losing cents', () => {
    // 30000 cleanly divided by 3
    const cleanSplit = splitExpense({
      items: [
        { id: 'item1', name: 'Platter', priceCents: 30000, memberIds: ['A', 'B', 'C'] },
      ],
      extrasCents: 0,
    });
    expect(cleanSplit.perMember['A']).toBe(10000);
    expect(cleanSplit.perMember['B']).toBe(10000);
    expect(cleanSplit.perMember['C']).toBe(10000);
    expect(cleanSplit.totalCents).toBe(30000);

    // 1 cent remainder: 30001 / 3 -> 10000, 10000, 10001
    const rem1 = splitExpense({
      items: [
        { id: 'item2', name: 'Platter + 1 cent', priceCents: 30001, memberIds: ['A', 'B', 'C'] },
      ],
      extrasCents: 0,
    });
    const sum1 = Object.values(rem1.perMember).reduce((a, b) => a + b, 0);
    expect(sum1).toBe(30001);

    // 2 cents remainder: 30002 / 3 -> 10001, 10001, 10000
    const rem2 = splitExpense({
      items: [
        { id: 'item3', name: 'Platter + 2 cents', priceCents: 30002, memberIds: ['A', 'B', 'C'] },
      ],
      extrasCents: 0,
    });
    const sum2 = Object.values(rem2.perMember).reduce((a, b) => a + b, 0);
    expect(sum2).toBe(30002);

    // Shared item + odd extras
    const remWithExtras = splitExpense({
      items: [
        { id: 'item4', name: 'Shared Dish', priceCents: 30000, memberIds: ['A', 'B', 'C'] },
      ],
      extrasCents: 10, // 10 cents extras shared 3 ways
    });
    const sumWithExtras = Object.values(remWithExtras.perMember).reduce((a, b) => a + b, 0);
    expect(sumWithExtras).toBe(30010);
  });

  it('throws a clear error if an item has no members', () => {
    expect(() => {
      splitExpense({
        items: [
          { id: 'orphaned', name: 'Mystery Dish', priceCents: 5000, memberIds: [] },
        ],
        extrasCents: 0,
      });
    }).toThrow(/must have at least one member assigned/i);
  });
});

