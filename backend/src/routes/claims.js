/**
 * Claims & AI Debt Detective API Routes
 */

import express from 'express';
import { query, isNeonConfigured, memoryStore } from '../db.js';
import { judgeClaim } from '../judge.js';

const router = express.Router();

// POST /api/expenses/:id/claims - File a claim about an expense
router.post('/expenses/:id/claims', async (req, res) => {
  try {
    const expenseId = req.params.id;
    const { memberId, claimText, claimedCount, language = 'en' } = req.body;

    if (!memberId || !claimText) {
      return res.status(400).json({ error: 'memberId and claimText are required' });
    }

    let receiptCount = 0;

    if (isNeonConfigured()) {
      // Find matching items count from expense
      const countRes = await query(
        'SELECT count(*) as total FROM expense_items WHERE expense_id = $1',
        [expenseId]
      );
      receiptCount = parseInt(countRes.rows[0]?.total || 0, 10);
    } else {
      const items = memoryStore.expense_items.filter((i) => i.expense_id === expenseId);
      receiptCount = items.length;
    }

    // Default to at least claimedCount if receipt has items or client provided
    if (req.body.receiptCount !== undefined) {
      receiptCount = parseInt(req.body.receiptCount, 10) || 0;
    }

    // Call AI Debt Detective (Code decides status, Bedrock narrates verdict)
    const { status, verdict } = await judgeClaim({
      claimText,
      claimedCount: parseInt(claimedCount, 10) || 0,
      receiptCount,
      language,
    });

    // Save claim in database
    if (isNeonConfigured()) {
      const insertRes = await query(
        `INSERT INTO claims (expense_id, member_id, claim_text, claimed_count, receipt_count, status, verdict, language)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [expenseId, memberId, claimText.trim(), claimedCount || 0, receiptCount, status, verdict, language]
      );
      return res.status(201).json({ claim: insertRes.rows[0], status, verdict });
    }

    // Memory store fallback
    const newClaim = {
      id: `claim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      expense_id: expenseId,
      member_id: memberId,
      claim_text: claimText.trim(),
      claimed_count: claimedCount || 0,
      receipt_count: receiptCount,
      status,
      verdict,
      language,
      created_at: new Date().toISOString(),
    };
    memoryStore.claims.push(newClaim);

    return res.status(201).json({ claim: newClaim, status, verdict });
  } catch (err) {
    console.error('Error filing claim:', err);
    return res.status(500).json({ error: 'Failed to file claim' });
  }
});

// GET /api/expenses/:id/claims - Get all claims for an expense
router.get('/expenses/:id/claims', async (req, res) => {
  try {
    const expenseId = req.params.id;

    if (isNeonConfigured()) {
      const result = await query(
        `SELECT c.*, m.name as member_name
         FROM claims c
         JOIN members m ON c.member_id = m.id
         WHERE c.expense_id = $1
         ORDER BY c.created_at DESC`,
        [expenseId]
      );
      return res.json({ claims: result.rows });
    }

    const claims = memoryStore.claims
      .filter((c) => c.expense_id === expenseId)
      .map((c) => {
        const m = memoryStore.members.find((mem) => mem.id === c.member_id);
        return {
          ...c,
          member_name: m ? m.name : 'Unknown',
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.json({ claims });
  } catch (err) {
    console.error('Error getting claims:', err);
    return res.status(500).json({ error: 'Failed to retrieve claims' });
  }
});

export default router;

