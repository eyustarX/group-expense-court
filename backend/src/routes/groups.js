/**
 * Groups & Members API Routes
 */

import express from 'express';
import { query, isNeonConfigured, memoryStore } from '../db.js';

const router = express.Router();

function generateCourtCode() {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `COURT-${num}`;
}

// POST /api/groups - Create a new court
router.post('/groups', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    const trimmedName = name.trim();
    const code = generateCourtCode();

    if (isNeonConfigured()) {
      const result = await query(
        'INSERT INTO groups (code, name) VALUES ($1, $2) RETURNING id, code, name, created_at',
        [code, trimmedName]
      );
      return res.status(201).json({ group: result.rows[0], code });
    }

    // Memory store fallback
    const newGroup = {
      id: `grp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      code,
      name: trimmedName,
      created_at: new Date().toISOString(),
    };
    memoryStore.groups.push(newGroup);
    return res.status(201).json({ group: newGroup, code });
  } catch (err) {
    console.error('Error creating group:', err);
    return res.status(500).json({ error: 'Failed to create group' });
  }
});

// POST /api/groups/join - Join existing court with member name (No login required)
router.post('/groups/join', async (req, res) => {
  try {
    const { code, memberName } = req.body;
    if (!code || !memberName) {
      return res.status(400).json({ error: 'Court code and member name are required' });
    }

    const cleanCode = code.trim().toUpperCase();
    const cleanName = memberName.trim();

    if (isNeonConfigured()) {
      const grpResult = await query('SELECT * FROM groups WHERE code = $1', [cleanCode]);
      if (grpResult.rows.length === 0) {
        return res.status(404).json({ error: `Court with code "${cleanCode}" not found` });
      }
      const group = grpResult.rows[0];

      // Upsert member
      let memResult = await query(
        'SELECT * FROM members WHERE group_id = $1 AND LOWER(name) = LOWER($2)',
        [group.id, cleanName]
      );

      let member;
      if (memResult.rows.length > 0) {
        member = memResult.rows[0];
      } else {
        const insertRes = await query(
          'INSERT INTO members (group_id, name) VALUES ($1, $2) RETURNING id, group_id, name, created_at',
          [group.id, cleanName]
        );
        member = insertRes.rows[0];
      }

      return res.json({ group, member });
    }

    // Memory store fallback
    const group = memoryStore.groups.find((g) => g.code.toUpperCase() === cleanCode);
    if (!group) {
      return res.status(404).json({ error: `Court with code "${cleanCode}" not found` });
    }

    let member = memoryStore.members.find(
      (m) => m.group_id === group.id && m.name.toLowerCase() === cleanName.toLowerCase()
    );

    if (!member) {
      member = {
        id: `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        group_id: group.id,
        name: cleanName,
        created_at: new Date().toISOString(),
      };
      memoryStore.members.push(member);
    }

    return res.json({ group, member });
  } catch (err) {
    console.error('Error joining group:', err);
    return res.status(500).json({ error: 'Failed to join group' });
  }
});

// GET /api/groups/:code - Get court details, members, and expenses summary
router.get('/groups/:code', async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();

    if (isNeonConfigured()) {
      const grpResult = await query('SELECT * FROM groups WHERE code = $1', [code]);
      if (grpResult.rows.length === 0) {
        return res.status(404).json({ error: 'Court not found' });
      }
      const group = grpResult.rows[0];

      const memResult = await query('SELECT * FROM members WHERE group_id = $1 ORDER BY name ASC', [group.id]);
      const expResult = await query(
        `SELECT e.*, m.name as payer_name,
         (SELECT count(*) FROM expense_items WHERE expense_id = e.id) as item_count
         FROM expenses e
         JOIN members m ON e.paid_by = m.id
         WHERE e.group_id = $1
         ORDER BY e.created_at DESC`,
        [group.id]
      );

      return res.json({
        group,
        members: memResult.rows,
        expenses: expResult.rows,
      });
    }

    // Memory store fallback
    const group = memoryStore.groups.find((g) => g.code.toUpperCase() === code);
    if (!group) {
      return res.status(404).json({ error: 'Court not found' });
    }

    const members = memoryStore.members.filter((m) => m.group_id === group.id);
    const expenses = memoryStore.expenses
      .filter((e) => e.group_id === group.id)
      .map((e) => {
        const payer = members.find((m) => m.id === e.paid_by);
        const itemCount = memoryStore.expense_items.filter((item) => item.expense_id === e.id).length;
        return {
          ...e,
          payer_name: payer ? payer.name : 'Unknown',
          item_count: itemCount,
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.json({ group, members, expenses });
  } catch (err) {
    console.error('Error getting group:', err);
    return res.status(500).json({ error: 'Failed to retrieve group data' });
  }
});

export default router;
