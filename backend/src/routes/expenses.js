/**
 * Expenses & Case Files API Routes
 */

import express from 'express';
import { query, isNeonConfigured, memoryStore } from '../db.js';
import { splitExpense } from '../../shared/split.js';

const router = express.Router();

// POST /api/groups/:code/expenses - Add an expense (Case File)
router.post('/groups/:code/expenses', async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const { title, paidBy, items, extrasCents } = req.body;

    if (!title || !paidBy || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Title, paidBy, and items array are required' });
    }

    // Split expense with Largest-Remainder proportional allocation
    const splitResult = splitExpense({
      items,
      extrasCents: extrasCents || 0,
    });

    if (isNeonConfigured()) {
      const grpRes = await query('SELECT id FROM groups WHERE code = $1', [code]);
      if (grpRes.rows.length === 0) {
        return res.status(404).json({ error: 'Court not found' });
      }
      const groupId = grpRes.rows[0].id;

      // Insert expense
      const expRes = await query(
        `INSERT INTO expenses (group_id, title, paid_by, subtotal_cents, extras_cents, total_cents)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [groupId, title.trim(), paidBy, splitResult.subtotalCents, splitResult.extrasCents, splitResult.totalCents]
      );
      const expense = expRes.rows[0];

      // Insert items and their shares
      for (const item of items) {
        const itemRes = await query(
          'INSERT INTO expense_items (expense_id, name, price_cents) VALUES ($1, $2, $3) RETURNING id',
          [expense.id, item.name, Math.round(Number(item.priceCents))]
        );
        const itemId = itemRes.rows[0].id;

        for (const mId of item.memberIds) {
          await query(
            'INSERT INTO item_shares (item_id, member_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [itemId, mId]
          );
        }
      }

      return res.status(201).json({
        expense,
        shares: splitResult.perMember,
      });
    }

    // Memory store fallback
    const group = memoryStore.groups.find((g) => g.code.toUpperCase() === code);
    if (!group) {
      return res.status(404).json({ error: 'Court not found' });
    }

    const expenseId = `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newExpense = {
      id: expenseId,
      group_id: group.id,
      title: title.trim(),
      paid_by: paidBy,
      subtotal_cents: splitResult.subtotalCents,
      extras_cents: splitResult.extrasCents,
      total_cents: splitResult.totalCents,
      created_at: new Date().toISOString(),
    };
    memoryStore.expenses.push(newExpense);

    for (const item of items) {
      const itemId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      memoryStore.expense_items.push({
        id: itemId,
        expense_id: expenseId,
        name: item.name,
        price_cents: Math.round(Number(item.priceCents)),
      });

      for (const mId of item.memberIds) {
        memoryStore.item_shares.push({
          item_id: itemId,
          member_id: mId,
        });
      }
    }

    return res.status(201).json({
      expense: newExpense,
      shares: splitResult.perMember,
    });
  } catch (err) {
    console.error('Error creating expense:', err);
    return res.status(500).json({ error: err.message || 'Failed to create expense' });
  }
});

// GET /api/expenses/:id - Case File Detail
router.get('/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (isNeonConfigured()) {
      const expRes = await query(
        `SELECT e.*, m.name as payer_name
         FROM expenses e
         JOIN members m ON e.paid_by = m.id
         WHERE e.id = $1`,
        [id]
      );
      if (expRes.rows.length === 0) {
        return res.status(404).json({ error: 'Case File not found' });
      }
      const expense = expRes.rows[0];

      // Get items with assigned members
      const itemsRes = await query(
        `SELECT ei.id, ei.name, ei.price_cents,
         COALESCE(json_agg(json_build_object('id', m.id, 'name', m.name)) FILTER (WHERE m.id IS NOT NULL), '[]') as members
         FROM expense_items ei
         LEFT JOIN item_shares ish ON ei.id = ish.item_id
         LEFT JOIN members m ON ish.member_id = m.id
         WHERE ei.expense_id = $1
         GROUP BY ei.id, ei.name, ei.price_cents`,
        [id]
      );

      // Get claims on this expense
      const claimsRes = await query(
        `SELECT c.*, m.name as member_name
         FROM claims c
         JOIN members m ON c.member_id = m.id
         WHERE c.expense_id = $1
         ORDER BY c.created_at DESC`,
        [id]
      );

      return res.json({
        expense,
        items: itemsRes.rows,
        claims: claimsRes.rows,
      });
    }

    // Memory store fallback
    const expense = memoryStore.expenses.find((e) => e.id === id);
    if (!expense) {
      return res.status(404).json({ error: 'Case File not found' });
    }

    const payer = memoryStore.members.find((m) => m.id === expense.paid_by);
    const items = memoryStore.expense_items
      .filter((i) => i.expense_id === id)
      .map((item) => {
        const memberIds = memoryStore.item_shares
          .filter((s) => s.item_id === item.id)
          .map((s) => s.member_id);
        const assignedMembers = memoryStore.members.filter((m) => memberIds.includes(m.id));
        return {
          ...item,
          members: assignedMembers,
        };
      });

    const claims = memoryStore.claims
      .filter((c) => c.expense_id === id)
      .map((c) => {
        const m = memoryStore.members.find((mem) => mem.id === c.member_id);
        return {
          ...c,
          member_name: m ? m.name : 'Unknown',
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.json({
      expense: { ...expense, payer_name: payer ? payer.name : 'Unknown' },
      items,
      claims,
    });
  } catch (err) {
    console.error('Error getting expense detail:', err);
    return res.status(500).json({ error: 'Failed to retrieve case file' });
  }
});

export default router;
