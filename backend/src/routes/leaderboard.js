/**
 * Hall of Shame Leaderboard API Routes
 *
 * Ranks members by payment punctuality: average hours between payment creation and paid_at,
 * plus total count of still-pending debts.
 * Assigns humorous courtroom titles to each member.
 */

import express from 'express';
import { query, isNeonConfigured, memoryStore } from '../db.js';

const router = express.Router();

function getCourtroomTitle(avgHours, pendingCount, paidCount) {
  if (pendingCount >= 3 || avgHours > 48) {
    return 'The Tomorrow Guy ("Nege Inkedalelen")';
  }
  if (pendingCount > 0 && paidCount === 0) {
    return 'The Professional Dodger';
  }
  if (avgHours !== null && avgHours < 2) {
    return 'Courtroom Saint (Bole Jet ⚡)';
  }
  if (avgHours !== null && avgHours < 8) {
    return 'The Dutiful Citizen';
  }
  if (avgHours !== null && avgHours < 24) {
    return 'Buna First, Birr Later ☕';
  }
  return 'The Contemplating Juror';
}

// GET /api/groups/:code/leaderboard - Hall of Shame rankings
router.get('/groups/:code/leaderboard', async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();

    let group;
    let members = [];
    let payments = [];

    if (isNeonConfigured()) {
      const grpRes = await query('SELECT * FROM groups WHERE code = $1', [code]);
      if (grpRes.rows.length === 0) {
        return res.status(404).json({ error: 'Court not found' });
      }
      group = grpRes.rows[0];

      const memRes = await query('SELECT * FROM members WHERE group_id = $1', [group.id]);
      members = memRes.rows;

      const payRes = await query(
        `SELECT * FROM payments WHERE group_id = $1`,
        [group.id]
      );
      payments = payRes.rows;
    } else {
      group = memoryStore.groups.find((g) => g.code.toUpperCase() === code);
      if (!group) {
        return res.status(404).json({ error: 'Court not found' });
      }
      members = memoryStore.members.filter((m) => m.group_id === group.id);
      payments = memoryStore.payments.filter((p) => p.group_id === group.id);
    }

    // Calculate metrics per member
    const leaderboard = members.map((mem) => {
      // Debts owed by this member
      const memberPayments = payments.filter((p) => (p.from_member || p.fromMemberId) === mem.id);
      const paidPayments = memberPayments.filter((p) => p.status === 'paid' && (p.paid_at || p.paidAt));
      const pendingPayments = memberPayments.filter((p) => p.status === 'pending');

      let totalHours = 0;
      for (const p of paidPayments) {
        const created = new Date(p.created_at || p.createdAt).getTime();
        const paid = new Date(p.paid_at || p.paidAt).getTime();
        const diffHours = Math.max(0, (paid - created) / (1000 * 60 * 60));
        totalHours += diffHours;
      }

      const avgHours = paidPayments.length > 0 ? Number((totalHours / paidPayments.length).toFixed(1)) : null;
      const title = getCourtroomTitle(avgHours, pendingPayments.length, paidPayments.length);

      return {
        memberId: mem.id,
        name: mem.name,
        avgHours,
        paidCount: paidPayments.length,
        pendingCount: pendingPayments.length,
        title,
      };
    });

    // Rank by shame: higher pending count, then higher avg hours
    leaderboard.sort((a, b) => {
      if (b.pendingCount !== a.pendingCount) {
        return b.pendingCount - a.pendingCount; // Most pending first
      }
      if (a.avgHours === null && b.avgHours !== null) return 1;
      if (b.avgHours === null && a.avgHours !== null) return -1;
      return (b.avgHours || 0) - (a.avgHours || 0); // Slower first
    });

    return res.json({ leaderboard });
  } catch (err) {
    console.error('Error fetching leaderboard:', err);
    return res.status(500).json({ error: 'Failed to retrieve Hall of Shame leaderboard' });
  }
});

export default router;

