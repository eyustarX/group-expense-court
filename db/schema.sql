-- Group Expense Court - PostgreSQL Database Schema (Neon Serverless)
-- All money columns stored as BIGINT (integer cents) to avoid float inaccuracies.

-- 1. Groups table
CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Group members (identity scoped per group, remembered in client localStorage)
CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(group_id, name)
);

-- 3. Case Files (Expenses)
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    paid_by UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    subtotal_cents BIGINT NOT NULL,
    extras_cents BIGINT NOT NULL DEFAULT 0,
    total_cents BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Line items for an expense
CREATE TABLE IF NOT EXISTS expense_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price_cents BIGINT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Member participation per item (many-to-many)
CREATE TABLE IF NOT EXISTS item_shares (
    item_id UUID NOT NULL REFERENCES expense_items(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY(item_id, member_id)
);

-- 6. Settlement Payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    from_member UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    to_member UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    amount_cents BIGINT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    paid_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Claims filed with the AI Debt Detective Court
CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    claim_text TEXT NOT NULL,
    claimed_count INT NOT NULL,
    receipt_count INT NOT NULL,
    status TEXT NOT NULL,
    verdict TEXT NOT NULL,
    language TEXT NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Foreign Key Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_members_group_id ON members(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_group_id ON expenses(group_id);
CREATE INDEX IF NOT EXISTS idx_expenses_paid_by ON expenses(paid_by);
CREATE INDEX IF NOT EXISTS idx_expense_items_expense_id ON expense_items(expense_id);
CREATE INDEX IF NOT EXISTS idx_item_shares_member_id ON item_shares(member_id);
CREATE INDEX IF NOT EXISTS idx_payments_group_id ON payments(group_id);
CREATE INDEX IF NOT EXISTS idx_payments_from_member ON payments(from_member);
CREATE INDEX IF NOT EXISTS idx_payments_to_member ON payments(to_member);
CREATE INDEX IF NOT EXISTS idx_claims_expense_id ON claims(expense_id);
CREATE INDEX IF NOT EXISTS idx_claims_member_id ON claims(member_id);

