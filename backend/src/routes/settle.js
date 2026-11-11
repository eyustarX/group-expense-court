/**
 * Settlement API Routes (Fewest-Payments Algorithm)
 */

import express from 'express';
import { query, isNeonConfigured, memoryStore } from '../db.js';
import { netBalances, minimizePayments } from '../../shared/settle.js';
import { splitExpense } from '../../shared/split.js';

const router = express.Router();

// GET /api/groups/:code/settle - Compute net balances and fewest payments
router.get('/groups/:code/settle', async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();

    let group;
    let members = [];
    let expenses = [];
    let existingPayments = [];

    if (isNeonConfigured()) {
      const grpRes = await query('SELECT * FROM groups WHERE code = $1', [code]);
      if (grpRes.rows.length === 0) {
        return res.status(404).json({ error: 'Court not found' });
      }
      group = grpRes.rows[0];

      const memRes = await query('SELECT * FROM members WHERE group_id = $1', [group.id]);
      members = memRes.rows;

      // Fetch expenses with items and shares
      const expRes = await query('SELECT * FROM expenses WHERE group_id = $1', [group.id]);
      const rawExpenses = expRes.rows;

      for (const e of rawExpenses) {
        const itemsRes = await query(
          `SELECT ei.id, ei.price_cents,
           COALESCE(array_agg(ish.member_id) FILTER (WHERE ish.member_id IS NOT NULL), '{}') as member_ids
           FROM expense_items ei
           LEFT JOIN item_shares ish ON ei.id = ish.item_id
           WHERE ei.expense_id = $1
           GROUP BY ei.id, ei.price_cents`,
          [e.id]
        );

        const items = itemsRes.rows.map((row) => ({
          id: row.id,
          priceCents: Number(row.price_cents),
          memberIds: row.member_ids,
        }));

        const splitResult = splitExpense({
          items,
          extrasCents: Number(e.extras_cents || 0),
        });

        expenses.push({
          id: e.id,
          paidBy: e.paid_by,
          totalCents: Number(e.total_cents),
          perMember: splitResult.perMember,
        });
      }

      const payRes = await query('SELECT * FROM payments WHERE group_id = $1', [group.id]);
      existingPayments = payRes.rows;
    } else {
      // Memory store fallback
      group = memoryStore.groups.find((g) => g.code.toUpperCase() === code);
      if (!group) {
        return res.status(404).json({ error: 'Court not found' });
      }

      members = memoryStore.members.filter((m) => m.group_id === group.id);
      const groupExpenses = memoryStore.expenses.filter((e) => e.group_id === group.id);

      for (const e of groupExpenses) {
        const items = memoryStore.expense_items
          .filter((i) => i.expense_id === e.id)
          .map((i) => ({
            id: i.id,
            priceCents: i.price_cents,
            memberIds: memoryStore.item_shares.filter((s) => s.item_id === i.id).map((s) => s.member_id),
          }));

        const splitResult = splitExpense({
          items,
          extrasCents: e.extras_cents,
        });

        expenses.push({
          id: e.id,
          paidBy: e.paid_by,
          totalCents: e.total_cents,
          perMember: splitResult.perMember,
        });
      }

      existingPayments = memoryStore.payments.filter((p) => p.group_id === group.id);
    }

    // Compute net balances
    const allMemberIds = members.map((m) => m.id);
    const balances = netBalances(expenses, allMemberIds);

    // Compute fewest payments needed (Greedy algorithm)
    const calculatedPayments = minimizePayments(balances);

    // Format balances with member names
    const balancesWithNames = Object.entries(balances).map(([mId, netCents]) => {
      const m = members.find((mem) => mem.id === mId);
      return {
        memberId: mId,
        memberName: m ? m.name : 'Unknown',
        netCents,
      };
    });

    // Pair calculated payments with stored payment status (or create pending)
    const paymentsResult = [];

    for (const cp of calculatedPayments) {
      const fromMem = members.find((m) => m.id === cp.from);
      const toMem = members.find((m) => m.id === cp.to);

      // Check if existing pending or paid payment matches
      let matched = existingPayments.find(
        (p) => p.from_member === cp.from && p.to_member === cp.to && Number(p.amount_cents) === cp.amountCents
      );

      if (!matched) {
        if (isNeonConfigured()) {
          const insertRes = await query(
            `INSERT INTO payments (group_id, from_member, to_member, amount_cents, status)
             VALUES ($1, $2, $3, $4, 'pending')
             RETURNING *`,
            [group.id, cp.from, cp.to, cp.amountCents]
          );
          matched = insertRes.rows[0];
        } else {
          matched = {
            id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            group_id: group.id,
            from_member: cp.from,
            to_member: cp.to,
            amount_cents: cp.amountCents,
            status: 'pending',
            paid_at: null,
            created_at: new Date().toISOString(),
          };
          memoryStore.payments.push(matched);
        }
      }

      paymentsResult.push({
        id: matched.id,
        fromMemberId: cp.from,
        fromMemberName: fromMem ? fromMem.name : 'Unknown',
        toMemberId: cp.to,
        toMemberName: toMem ? toMem.name : 'Unknown',
        amountCents: cp.amountCents,
        status: matched.status,
        paidAt: matched.paid_at,
      });
    }

    // Estimate raw payments count without algorithm (each member pays payer on each bill)
    const rawPaymentsCount = expenses.reduce((acc, exp) => {
      const consumers = Object.keys(exp.perMember).filter((mId) => mId !== exp.paidBy);
      return acc + consumers.length;
    }, 0);

    return res.json({
      balances: balancesWithNames,
      payments: paymentsResult,
      rawCount: Math.max(rawPaymentsCount, calculatedPayments.length),
      reducedCount: calculatedPayments.length,
    });
  } catch (err) {
    console.error('Error settling group expenses:', err);
    return res.status(500).json({ error: 'Failed to calculate settlement' });
  }
});

// PATCH /api/payments/:id/paid - Mark a payment as paid
router.patch('/payments/:id/paid', async (req, res) => {
  try {
    const { id } = req.params;

    if (isNeonConfigured()) {
      const updateRes = await query(
        `UPDATE payments
         SET status = 'paid', paid_at = now()
         WHERE id = $1
         RETURNING *`,
        [id]
      );
      if (updateRes.rows.length === 0) {
        return res.status(404).json({ error: 'Payment not found' });
      }
      return res.json({ payment: updateRes.rows[0] });
    }

    // Memory store fallback
    const payment = memoryStore.payments.find((p) => p.id === id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    payment.status = 'paid';
    payment.paid_at = new Date().toISOString();

    return res.json({ payment });
  } catch (err) {
    console.error('Error marking payment as paid:', err);
    return res.status(500).json({ error: 'Failed to update payment status' });
  }
});

export default router;
