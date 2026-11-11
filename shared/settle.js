/**
 * Settlement algorithms for Group Expense Court.
 *
 * Computes net balances per member and calculates the fewest payments needed
 * to settle all debts.
 */

import { splitExpense } from './split.js';

/**
 * Calculates net balance for each member across a list of expenses.
 *
 * For each member:
 * net = (total amount paid by member) - (total amount owed by member across all shares).
 *
 * A positive net means the group owes this member (creditor).
 * A negative net means this member owes the group (debtor).
 * Zero means fully settled.
 *
 * Mathematical invariant: The sum of all net balances MUST equal 0.
 *
 * @param {Array<Object>} expenses List of expenses. Each expense has:
 *   - paidBy (or paid_by): string member ID
 *   - totalCents (or total_cents): number
 *   - perMember (or per_member): Record<string, number> (optional if items provided)
 *   - items: Array (optional if perMember provided)
 *   - extrasCents (or extras_cents): number (optional)
 * @param {Array<string>} [allMemberIds=[]] Optional list of all group member IDs so even members with 0 balance are included.
 * @returns {Record<string, number>} Map of memberId -> net balance in cents
 */
export function netBalances(expenses = [], allMemberIds = []) {
  const balances = {};

  // Initialize all known members to 0
  for (const mId of allMemberIds) {
    balances[mId] = 0;
  }

  for (const exp of expenses) {
    const payerId = exp.paidBy || exp.paid_by;
    if (!payerId) {
      throw new Error('Expense missing payer (paidBy)');
    }

    let shares = exp.perMember || exp.per_member;
    let totalCents = Number(exp.totalCents ?? exp.total_cents);

    // If perMember was not precomputed, compute it from items & extras
    if (!shares && exp.items) {
      const splitResult = splitExpense({
        items: exp.items,
        extrasCents: exp.extrasCents ?? exp.extras_cents ?? 0,
      });
      shares = splitResult.perMember;
      totalCents = splitResult.totalCents;
    }

    if (!shares) {
      throw new Error(`Expense "${exp.title || exp.id}" has no shares or items to compute shares`);
    }

    // Ensure payer exists in balance map
    if (!(payerId in balances)) {
      balances[payerId] = 0;
    }

    // Payer is credited the full total
    balances[payerId] += totalCents;

    // Each consumer is debited their share
    for (const [memberId, owedCents] of Object.entries(shares)) {
      if (!(memberId in balances)) {
        balances[memberId] = 0;
      }
      balances[memberId] -= Number(owedCents);
    }
  }

  return balances;
}

/**
 * Minimizes the number of peer-to-peer payments needed to settle all balances.
 *
 * ALGORITHM: Greedy Settling Heuristic.
 * Repeatedly pairs the debtor who owes the most with the creditor who is owed the most,
 * transferring min(debt, credit).
 *
 * Note: Finding the theoretical global minimum number of transactions is equivalent
 * to the Subset Sum problem and is NP-hard. In practice, this greedy heuristic
 * produces an optimal or near-optimal solution in O(N log N) time and is the standard
 * algorithm used by bill-splitting platforms.
 *
 * @param {Record<string, number> | Array<{memberId: string, netCents: number}>} balances
 * @returns {Array<{from: string, to: string, amountCents: number}>} List of minimal payment transactions
 */
export function minimizePayments(balances) {
  // Normalize input into an array of { memberId, net }
  const entries = Array.isArray(balances)
    ? balances.map((b) => ({ memberId: b.memberId, net: Math.round(Number(b.netCents)) }))
    : Object.entries(balances).map(([memberId, net]) => ({
        memberId,
        net: Math.round(Number(net)),
      }));

  // Separate into debtors (net < 0) and creditors (net > 0)
  // Store debts as positive numbers for intuitive comparison
  const debtors = entries
    .filter((e) => e.net < 0)
    .map((e) => ({ memberId: e.memberId, debt: -e.net }));

  const creditors = entries
    .filter((e) => e.net > 0)
    .map((e) => ({ memberId: e.memberId, credit: e.net }));

  const payments = [];

  // Greedy matching: match largest debtor with largest creditor
  while (debtors.length > 0 && creditors.length > 0) {
    // Sort descending by amount
    debtors.sort((a, b) => b.debt - a.debt);
    creditors.sort((a, b) => b.credit - a.credit);

    const largestDebtor = debtors[0];
    const largestCreditor = creditors[0];

    const amount = Math.min(largestDebtor.debt, largestCreditor.credit);

    if (amount > 0) {
      payments.push({
        from: largestDebtor.memberId,
        to: largestCreditor.memberId,
        amountCents: amount,
      });
    }

    largestDebtor.debt -= amount;
    largestCreditor.credit -= amount;

    if (largestDebtor.debt === 0) {
      debtors.shift();
    }
    if (largestCreditor.credit === 0) {
      creditors.shift();
    }
  }

  return payments;
}

