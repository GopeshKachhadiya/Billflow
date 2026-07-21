-- Migration 004_phase2_business_os.sql
-- Phase 2: Expense Tracking and Document Types (Quotations, Estimates, Credit Notes)

-- 1. Create expenses table for business expenditure and GST input tax credit tracking
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL DEFAULT 'General',
    vendor_name TEXT DEFAULT '',
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    gst_amount NUMERIC(15, 2) DEFAULT 0.00,
    bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
    receipt_url TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

-- Index for fast queries on expenses by owner and date
CREATE INDEX IF NOT EXISTS idx_expenses_owner_date ON expenses(owner_id, bill_date DESC) WHERE deleted_at IS NULL;

-- Enable Row Level Security (RLS) on expenses table
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own expenses" ON public.expenses;
CREATE POLICY "Users manage own expenses" ON public.expenses FOR ALL USING (auth.uid() = owner_id);

-- 2. Add doc_type to bills table to support Quotations, Estimates, and Credit Notes alongside Invoices
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bills' AND column_name = 'doc_type') THEN
        ALTER TABLE bills ADD COLUMN doc_type TEXT DEFAULT 'invoice';
    END IF;
END $$;

-- Index on doc_type for fast filtering
CREATE INDEX IF NOT EXISTS idx_bills_owner_doctype ON bills(owner_id, doc_type) WHERE deleted_at IS NULL;
