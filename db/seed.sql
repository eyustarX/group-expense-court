-- Demo Court Seed Data for Group Expense Court
-- Code: COURT-4821, Name: "Demo Court"
-- 4 Members: Eyob, Selam, Abebe, Dawit
-- 3 Realistic Ethiopian Expenses with Item shares, Extras, Payments, and Claims

-- 1. Insert Demo Group
INSERT INTO groups (id, code, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'COURT-4821', 'Demo Court')
ON CONFLICT (code) DO NOTHING;

-- 2. Insert Members
INSERT INTO members (id, group_id, name) VALUES
('11111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Eyob'),
('11111111-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Selam'),
('11111111-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Abebe'),
('11111111-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Dawit')
ON CONFLICT (group_id, name) DO NOTHING;

-- 3. Case File 1: Dinner at 2000 Habesha Cultural Restaurant (Paid by Eyob)
-- Subtotal: 116000 cents (1,160 ETB), Extras: 17400 cents (15% VAT), Total: 133400 cents (1,334 ETB)
INSERT INTO expenses (id, group_id, title, paid_by, subtotal_cents, extras_cents, total_cents, created_at)
VALUES (
    '22222222-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Dinner at 2000 Habesha Cultural Restaurant',
    '11111111-0000-0000-0000-000000000001',
    116000,
    17400,
    133400,
    now() - interval '3 days'
) ON CONFLICT (id) DO NOTHING;

-- Items for Expense 1
INSERT INTO expense_items (id, expense_id, name, price_cents) VALUES
('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'Special Kitfo', 45000),
('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', 'Shekla Tibs', 35000),
('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000001', 'Beyeaynetu Platter', 20000),
('33333333-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000001', 'Tej (Honey Wine) x4', 16000)
ON CONFLICT (id) DO NOTHING;

-- Item Shares for Expense 1
-- Special Kitfo (Eyob, Selam, Abebe)
INSERT INTO item_shares (item_id, member_id) VALUES
('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001'),
('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000002'),
('33333333-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000003'),
-- Shekla Tibs (Abebe, Dawit)
('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000003'),
('33333333-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000004'),
-- Beyeaynetu Platter (Selam, Dawit)
('33333333-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000002'),
('33333333-0000-0000-0000-000000000003', '11111111-0000-0000-0000-000000000004'),
-- Tej x4 (All 4 members)
('33333333-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000001'),
('33333333-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000002'),
('33333333-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000003'),
('33333333-0000-0000-0000-000000000004', '11111111-0000-0000-0000-000000000004')
ON CONFLICT DO NOTHING;

-- 4. Case File 2: Traditional Coffee Ceremony & Pastries (Paid by Selam)
-- Subtotal: 30000 cents (300 ETB), Extras: 4500 cents (45 ETB), Total: 34500 cents (345 ETB)
INSERT INTO expenses (id, group_id, title, paid_by, subtotal_cents, extras_cents, total_cents, created_at)
VALUES (
    '22222222-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Traditional Coffee Ceremony & Pastries',
    '11111111-0000-0000-0000-000000000002',
    30000,
    4500,
    34500,
    now() - interval '2 days'
) ON CONFLICT (id) DO NOTHING;

-- Items for Expense 2
INSERT INTO expense_items (id, expense_id, name, price_cents) VALUES
('33333333-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000002', 'Jebena Buna & Popcorn', 12000),
('33333333-0000-0000-0000-000000000006', '22222222-0000-0000-0000-000000000002', 'Baklava & Macchiato', 18000)
ON CONFLICT (id) DO NOTHING;

-- Item Shares for Expense 2
-- Jebena Buna (All 4 members)
INSERT INTO item_shares (item_id, member_id) VALUES
('33333333-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000001'),
('33333333-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000002'),
('33333333-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000003'),
('33333333-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000004'),
-- Baklava (Eyob, Selam)
('33333333-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000001'),
('33333333-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

-- 5. Case File 3: Taxi Ride across Bole (Paid by Abebe)
-- Subtotal: 25000 cents (250 ETB), Extras: 0 cents, Total: 25000 cents (250 ETB)
INSERT INTO expenses (id, group_id, title, paid_by, subtotal_cents, extras_cents, total_cents, created_at)
VALUES (
    '22222222-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Taxi Ride across Bole',
    '11111111-0000-0000-0000-000000000003',
    25000,
    0,
    25000,
    now() - interval '1 day'
) ON CONFLICT (id) DO NOTHING;

-- Items for Expense 3
INSERT INTO expense_items (id, expense_id, name, price_cents) VALUES
('33333333-0000-0000-0000-000000000007', '22222222-0000-0000-0000-000000000003', 'Ride Fare', 25000)
ON CONFLICT (id) DO NOTHING;

-- Item Shares for Expense 3 (All 4 members)
INSERT INTO item_shares (item_id, member_id) VALUES
('33333333-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000001'),
('33333333-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000002'),
('33333333-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000003'),
('33333333-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000004')
ON CONFLICT DO NOTHING;

-- 6. Sample Historic Payments for Hall of Shame Leaderboard
-- Selam paid Eyob 150.00 ETB after 1.5 hours (The Responsible Citizen)
INSERT INTO payments (id, group_id, from_member, to_member, amount_cents, status, paid_at, created_at)
VALUES (
    '44444444-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000002',
    '11111111-0000-0000-0000-000000000001',
    15000,
    'paid',
    now() - interval '22 hours',
    now() - interval '24 hours'
) ON CONFLICT (id) DO NOTHING;

-- Abebe paid Eyob 200.00 ETB after 8 hours (The Reasonable One)
INSERT INTO payments (id, group_id, from_member, to_member, amount_cents, status, paid_at, created_at)
VALUES (
    '44444444-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000003',
    '11111111-0000-0000-0000-000000000001',
    20000,
    'paid',
    now() - interval '10 hours',
    now() - interval '18 hours'
) ON CONFLICT (id) DO NOTHING;

-- Dawit has a pending payment of 450.00 ETB (The Tomorrow Guy)
INSERT INTO payments (id, group_id, from_member, to_member, amount_cents, status, paid_at, created_at)
VALUES (
    '44444444-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000004',
    '11111111-0000-0000-0000-000000000001',
    45000,
    'pending',
    NULL,
    now() - interval '36 hours'
) ON CONFLICT (id) DO NOTHING;

-- 7. Sample Filed Claim on Dinner Expense
INSERT INTO claims (
    id, expense_id, member_id, claim_text, claimed_count, receipt_count, status, verdict, language, created_at
) VALUES (
    '55555555-0000-0000-0000-000000000001',
    '22222222-0000-0000-0000-000000000001',
    '11111111-0000-0000-0000-000000000004',
    'I claimed 4 Tejs were ordered for everyone, and the receipt confirms it.',
    4,
    4,
    'Verified',
    'The court has inspected the scroll: exactly 4 Tejs were recorded on the bill! Your golden glass is fully accounted for, case closed in honor.',
    'en',
    now() - interval '2 days'
) ON CONFLICT (id) DO NOTHING;

