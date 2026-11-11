/**
 * Database client for Group Expense Court.
 *
 * Uses @neondatabase/serverless driver (HTTP/pooled connection safe for AWS Lambda).
 * If DATABASE_URL is not provided (e.g. initial dev or offline), seamlessly falls back
 * to an in-memory court store preloaded with the COURT-4821 Demo Court dataset.
 */

import { Pool } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;

let pool = null;
if (databaseUrl) {
  pool = new Pool({ connectionString: databaseUrl });
}

// In-Memory Fallback Store (Matches seed.sql structure)
const memoryStore = {
  groups: [
    {
      id: '00000000-0000-0000-0000-000000000001',
      code: 'COURT-4821',
      name: 'Demo Court',
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
  ],
  members: [
    { id: '11111111-0000-0000-0000-000000000001', group_id: '00000000-0000-0000-0000-000000000001', name: 'Eyob' },
    { id: '11111111-0000-0000-0000-000000000002', group_id: '00000000-0000-0000-0000-000000000001', name: 'Selam' },
    { id: '11111111-0000-0000-0000-000000000003', group_id: '00000000-0000-0000-0000-000000000001', name: 'Abebe' },
    { id: '11111111-0000-0000-0000-000000000004', group_id: '00000000-0000-0000-0000-000000000001', name: 'Dawit' },
  ],
  expenses: [
    {
      id: '22222222-0000-0000-0000-000000000001',
      group_id: '00000000-0000-0000-0000-000000000001',
      title: 'Dinner at 2000 Habesha Cultural Restaurant',
      paid_by: '11111111-0000-0000-0000-000000000001',
      subtotal_cents: 116000,
      extras_cents: 17400,
      total_cents: 133400,
      created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    },
    {
      id: '22222222-0000-0000-0000-000000000002',
      group_id: '00000000-0000-0000-0000-000000000001',
      title: 'Traditional Coffee Ceremony & Pastries',
      paid_by: '11111111-0000-0000-0000-000000000002',
      subtotal_cents: 30000,
      extras_cents: 4500,
      total_cents: 34500,
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
      id: '22222222-0000-0000-0000-000000000003',
      group_id: '00000000-0000-0000-0000-000000000001',
      title: 'Taxi Ride across Bole',
      paid_by: '11111111-0000-0000-0000-000000000003',
      subtotal_cents: 25000,
      extras_cents: 0,
      total_cents: 25000,
      created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    },
  ],
  expense_items: [
    { id: '33333333-0000-0000-0000-000000000001', expense_id: '22222222-0000-0000-0000-000000000001', name: 'Special Kitfo', price_cents: 45000 },
    { id: '33333333-0000-0000-0000-000000000002', expense_id: '22222222-0000-0000-0000-000000000001', name: 'Shekla Tibs', price_cents: 35000 },
    { id: '33333333-0000-0000-0000-000000000003', expense_id: '22222222-0000-0000-0000-000000000001', name: 'Beyeaynetu Platter', price_cents: 20000 },
    { id: '33333333-0000-0000-0000-000000000004', expense_id: '22222222-0000-0000-0000-000000000001', name: 'Tej (Honey Wine) x4', price_cents: 16000 },
    { id: '33333333-0000-0000-0000-000000000005', expense_id: '22222222-0000-0000-0000-000000000002', name: 'Jebena Buna & Popcorn', price_cents: 12000 },
    { id: '33333333-0000-0000-0000-000000000006', expense_id: '22222222-0000-0000-0000-000000000002', name: 'Baklava & Macchiato', price_cents: 18000 },
    { id: '33333333-0000-0000-0000-000000000007', expense_id: '22222222-0000-0000-0000-000000000003', name: 'Ride Fare', price_cents: 25000 },
  ],
  item_shares: [
    { item_id: '33333333-0000-0000-0000-000000000001', member_id: '11111111-0000-0000-0000-000000000001' },
    { item_id: '33333333-0000-0000-0000-000000000001', member_id: '11111111-0000-0000-0000-000000000002' },
    { item_id: '33333333-0000-0000-0000-000000000001', member_id: '11111111-0000-0000-0000-000000000003' },
    { item_id: '33333333-0000-0000-0000-000000000002', member_id: '11111111-0000-0000-0000-000000000003' },
    { item_id: '33333333-0000-0000-0000-000000000002', member_id: '11111111-0000-0000-0000-000000000004' },
    { item_id: '33333333-0000-0000-0000-000000000003', member_id: '11111111-0000-0000-0000-000000000002' },
    { item_id: '33333333-0000-0000-0000-000000000003', member_id: '11111111-0000-0000-0000-000000000004' },
    { item_id: '33333333-0000-0000-0000-000000000004', member_id: '11111111-0000-0000-0000-000000000001' },
    { item_id: '33333333-0000-0000-0000-000000000004', member_id: '11111111-0000-0000-0000-000000000002' },
    { item_id: '33333333-0000-0000-0000-000000000004', member_id: '11111111-0000-0000-0000-000000000003' },
    { item_id: '33333333-0000-0000-0000-000000000004', member_id: '11111111-0000-0000-0000-000000000004' },
    { item_id: '33333333-0000-0000-0000-000000000005', member_id: '11111111-0000-0000-0000-000000000001' },
    { item_id: '33333333-0000-0000-0000-000000000005', member_id: '11111111-0000-0000-0000-000000000002' },
    { item_id: '33333333-0000-0000-0000-000000000005', member_id: '11111111-0000-0000-0000-000000000003' },
    { item_id: '33333333-0000-0000-0000-000000000005', member_id: '11111111-0000-0000-0000-000000000004' },
    { item_id: '33333333-0000-0000-0000-000000000006', member_id: '11111111-0000-0000-0000-000000000001' },
    { item_id: '33333333-0000-0000-0000-000000000006', member_id: '11111111-0000-0000-0000-000000000002' },
    { item_id: '33333333-0000-0000-0000-000000000007', member_id: '11111111-0000-0000-0000-000000000001' },
    { item_id: '33333333-0000-0000-0000-000000000007', member_id: '11111111-0000-0000-0000-000000000002' },
    { item_id: '33333333-0000-0000-0000-000000000007', member_id: '11111111-0000-0000-0000-000000000003' },
    { item_id: '33333333-0000-0000-0000-000000000007', member_id: '11111111-0000-0000-0000-000000000004' },
  ],
  payments: [
    {
      id: '44444444-0000-0000-0000-000000000001',
      group_id: '00000000-0000-0000-0000-000000000001',
      from_member: '11111111-0000-0000-0000-000000000002',
      to_member: '11111111-0000-0000-0000-000000000001',
      amount_cents: 15000,
      status: 'paid',
      paid_at: new Date(Date.now() - 22 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    },
    {
      id: '44444444-0000-0000-0000-000000000002',
      group_id: '00000000-0000-0000-0000-000000000001',
      from_member: '11111111-0000-0000-0000-000000000003',
      to_member: '11111111-0000-0000-0000-000000000001',
      amount_cents: 20000,
      status: 'paid',
      paid_at: new Date(Date.now() - 10 * 3600000).toISOString(),
      created_at: new Date(Date.now() - 18 * 3600000).toISOString(),
    },
    {
      id: '44444444-0000-0000-0000-000000000003',
      group_id: '00000000-0000-0000-0000-000000000001',
      from_member: '11111111-0000-0000-0000-000000000004',
      to_member: '11111111-0000-0000-0000-000000000001',
      amount_cents: 45000,
      status: 'pending',
      paid_at: null,
      created_at: new Date(Date.now() - 36 * 3600000).toISOString(),
    },
  ],
  claims: [
    {
      id: '55555555-0000-0000-0000-000000000001',
      expense_id: '22222222-0000-0000-0000-000000000001',
      member_id: '11111111-0000-0000-0000-000000000004',
      claim_text: 'I claimed 4 Tejs were ordered for everyone, and the receipt confirms it.',
      claimed_count: 4,
      receipt_count: 4,
      status: 'Verified',
      verdict: 'The court has inspected the scroll: exactly 4 Tejs were recorded on the bill! Your golden glass is fully accounted for, case closed in honor.',
      language: 'en',
      created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
  ],
};

export { memoryStore };

/**
 * Executes a parameterized SQL query against Neon Postgres.
 * If DATABASE_URL is not set, falls back to an internal memory store.
 *
 * @param {string} text SQL statement with $1, $2, ... placeholders
 * @param {Array<any>} params Values corresponding to placeholders
 * @returns {Promise<{rows: Array<any>, rowCount: number}>}
 */
export async function query(text, params = []) {
  if (pool) {
    const res = await pool.query(text, params);
    return res;
  }

  // Neon not configured: simulate simple SELECT 1 health check
  if (text.trim().toUpperCase().startsWith('SELECT 1')) {
    return { rows: [{ '?column?': 1 }], rowCount: 1 };
  }

  throw new Error('DATABASE_URL is not set and custom direct SQL is not supported in memory fallback.');
}

export function isNeonConfigured() {
  return Boolean(pool);
}

