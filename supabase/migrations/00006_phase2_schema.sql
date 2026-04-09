-- Phase 2: Expense, Payroll, Banking, Repayment, Fund Transfer Schema
-- This migration adds tables for Phase 2 fund management features

-- ============================================================
-- 1. Employees
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  employee_name TEXT NOT NULL,
  employee_code TEXT,
  department TEXT,
  position TEXT,
  phone TEXT,
  email TEXT,
  joined_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'retired')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status) WHERE deleted_at IS NULL;

-- ============================================================
-- 2. Expense Categories
-- ============================================================
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================
-- 3. Bank Accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  bank_name TEXT NOT NULL,
  branch_name TEXT,
  account_type TEXT NOT NULL DEFAULT 'ordinary' CHECK (account_type IN ('ordinary', 'checking', 'savings', 'time_deposit')),
  account_number TEXT NOT NULL,
  account_holder TEXT NOT NULL,
  current_balance NUMERIC(14,0) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_company ON bank_accounts(company_id) WHERE deleted_at IS NULL;

-- ============================================================
-- 4. Expense Records
-- ============================================================
CREATE TABLE IF NOT EXISTS expense_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  payment_date DATE NOT NULL,
  vendor_name TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,0) NOT NULL DEFAULT 0,
  category_id UUID REFERENCES expense_categories(id),
  payment_method TEXT DEFAULT 'bank_transfer' CHECK (payment_method IN ('bank_transfer', 'cash', 'credit_card', 'direct_debit', 'other')),
  bank_account_id UUID REFERENCES bank_accounts(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'paid', 'needs_review')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_expense_records_company ON expense_records(company_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_expense_records_date ON expense_records(payment_date);
CREATE INDEX IF NOT EXISTS idx_expense_records_category ON expense_records(category_id);
CREATE INDEX IF NOT EXISTS idx_expense_records_status ON expense_records(status);

-- ============================================================
-- 5. Payroll Records
-- ============================================================
CREATE TABLE IF NOT EXISTS payroll_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  target_month TEXT NOT NULL,
  base_salary NUMERIC(12,0) NOT NULL DEFAULT 0,
  allowance NUMERIC(12,0) NOT NULL DEFAULT 0,
  deduction NUMERIC(12,0) NOT NULL DEFAULT 0,
  net_payment NUMERIC(12,0) NOT NULL DEFAULT 0,
  payment_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'paid', 'needs_review')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_payroll_company ON payroll_records(company_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payroll_employee ON payroll_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_month ON payroll_records(target_month);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON payroll_records(status);

-- ============================================================
-- 6. Bank Transactions
-- ============================================================
CREATE TABLE IF NOT EXISTS bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id UUID NOT NULL REFERENCES bank_accounts(id),
  transaction_date DATE NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('deposit', 'withdrawal')),
  description TEXT,
  amount NUMERIC(14,0) NOT NULL DEFAULT 0,
  balance_after NUMERIC(14,0),
  related_type TEXT,
  related_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_bank_transactions_account ON bank_transactions(bank_account_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_bank_transactions_date ON bank_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_type ON bank_transactions(transaction_type);

-- ============================================================
-- 7. Loan Repayments
-- ============================================================
CREATE TABLE IF NOT EXISTS loan_repayments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  bank_account_id UUID REFERENCES bank_accounts(id),
  lender_name TEXT NOT NULL,
  monthly_repayment_amount NUMERIC(12,0) NOT NULL DEFAULT 0,
  withdrawal_day INTEGER NOT NULL DEFAULT 27 CHECK (withdrawal_day BETWEEN 1 AND 31),
  next_withdrawal_date DATE,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'needs_review')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_loan_repayments_company ON loan_repayments(company_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_loan_repayments_account ON loan_repayments(bank_account_id);
CREATE INDEX IF NOT EXISTS idx_loan_repayments_status ON loan_repayments(status);

-- ============================================================
-- 8. Fund Transfer Records
-- ============================================================
CREATE TABLE IF NOT EXISTS fund_transfer_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_date DATE NOT NULL,
  from_account_id UUID NOT NULL REFERENCES bank_accounts(id),
  to_account_id UUID NOT NULL REFERENCES bank_accounts(id),
  amount NUMERIC(14,0) NOT NULL DEFAULT 0,
  reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_fund_transfers_date ON fund_transfer_records(transfer_date);
CREATE INDEX IF NOT EXISTS idx_fund_transfers_from ON fund_transfer_records(from_account_id);
CREATE INDEX IF NOT EXISTS idx_fund_transfers_to ON fund_transfer_records(to_account_id);

-- ============================================================
-- 9. Apply updated_at triggers to new tables
-- ============================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['employees', 'expense_categories', 'expense_records', 'payroll_records', 'bank_accounts', 'bank_transactions', 'loan_repayments', 'fund_transfer_records'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I', tbl);
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()', tbl);
  END LOOP;
END;
$$;

-- ============================================================
-- 10. Seed default expense categories
-- ============================================================
INSERT INTO expense_categories (category_name, sort_order, notes)
SELECT v.category_name, v.sort_order, v.notes
FROM (VALUES
  ('事務用品費', 1, '文房具・事務用品'),
  ('通信費', 2, '電話・インターネット'),
  ('水道光熱費', 3, '電気・ガス・水道'),
  ('修繕費', 4, '建物・設備の修繕'),
  ('保険料', 5, '火災保険・賠償保険'),
  ('租税公課', 6, '固定資産税・印紙税'),
  ('交通費', 7, '出張・移動'),
  ('交際費', 8, '接待・贈答'),
  ('広告宣伝費', 9, '広告・宣伝'),
  ('雑費', 10, 'その他')
) AS v(category_name, sort_order, notes)
WHERE NOT EXISTS (SELECT 1 FROM expense_categories ec WHERE ec.category_name = v.category_name);

-- ============================================================
-- 11. RLS policies for Phase 2 tables
-- ============================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['employees', 'expense_categories', 'expense_records', 'payroll_records', 'bank_accounts', 'bank_transactions', 'loan_repayments', 'fund_transfer_records'])
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    -- Read: authenticated users
    EXECUTE format('CREATE POLICY %I ON %I FOR SELECT TO authenticated USING (true)', tbl || '_select', tbl);
    -- Insert: accounting_manager or expense_staff
    EXECUTE format('CREATE POLICY %I ON %I FOR INSERT TO authenticated WITH CHECK (user_can_edit() OR user_has_role(''expense_staff''))', tbl || '_insert', tbl);
    -- Update: accounting_manager or expense_staff
    EXECUTE format('CREATE POLICY %I ON %I FOR UPDATE TO authenticated USING (user_can_edit() OR user_has_role(''expense_staff''))', tbl || '_update', tbl);
    -- Delete: accounting_manager only
    EXECUTE format('CREATE POLICY %I ON %I FOR DELETE TO authenticated USING (user_can_edit())', tbl || '_delete', tbl);
  END LOOP;
END;
$$;
