-- Phase 4: Import workflow, tenant name matching, monthly income/expense
-- Migration: 00008_phase4_import_workflow.sql

-- ============================================================
-- 1. Tenant aliases table (表記ゆれ対応)
-- ============================================================
CREATE TABLE IF NOT EXISTS tenant_aliases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  alias_name TEXT NOT NULL,
  alias_name_normalized TEXT NOT NULL,
  source TEXT DEFAULT 'manual', -- manual, bank_statement, import, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenant_aliases_tenant_id ON tenant_aliases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_aliases_normalized ON tenant_aliases(alias_name_normalized);

-- ============================================================
-- 2. Payer name aliases table (振込人名の別名管理)
-- ============================================================
CREATE TABLE IF NOT EXISTS payer_name_aliases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payer_name TEXT NOT NULL,
  payer_name_normalized TEXT NOT NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payer_name_aliases_normalized ON payer_name_aliases(payer_name_normalized);
CREATE INDEX IF NOT EXISTS idx_payer_name_aliases_tenant ON payer_name_aliases(tenant_id);

-- ============================================================
-- 3. Match history table (照合履歴)
-- ============================================================
CREATE TABLE IF NOT EXISTS match_history_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payer_name TEXT NOT NULL,
  matched_tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  match_reason TEXT, -- exact, normalized_exact, kana_match, alias_match, similar, etc.
  confidence_score NUMERIC(5,4), -- 0.0000 to 1.0000
  confirmed_by UUID REFERENCES auth.users(id),
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_history_payer ON match_history_records(payer_name);
CREATE INDEX IF NOT EXISTS idx_match_history_tenant ON match_history_records(matched_tenant_id);

-- ============================================================
-- 4. Add tenant_name_normalized and tenant_name_kana to tenants
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='tenant_name_normalized') THEN
    ALTER TABLE tenants ADD COLUMN tenant_name_normalized TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='tenant_name_kana') THEN
    ALTER TABLE tenants ADD COLUMN tenant_name_kana TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tenants' AND column_name='bank_payer_name') THEN
    ALTER TABLE tenants ADD COLUMN bank_payer_name TEXT; -- 通帳表記名
  END IF;
END $$;

-- ============================================================
-- 5. Add import_target to uploaded_files and extracted_data_candidates
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='uploaded_files' AND column_name='import_target') THEN
    ALTER TABLE uploaded_files ADD COLUMN import_target TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='extracted_data_candidates' AND column_name='ocr_confidence') THEN
    ALTER TABLE extracted_data_candidates ADD COLUMN ocr_confidence NUMERIC(5,4);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='extracted_data_candidates' AND column_name='ocr_provider') THEN
    ALTER TABLE extracted_data_candidates ADD COLUMN ocr_provider TEXT;
  END IF;
END $$;

-- ============================================================
-- 6. Monthly income/expense materialized view (optional, for production)
-- ============================================================
-- This is a helper view for monthly income/expense queries.
-- In demo mode, data is generated client-side.
CREATE OR REPLACE VIEW monthly_income_summary AS
SELECT
  c.id AS company_id,
  c.name AS company_name,
  to_char(pr.payment_date::date, 'YYYY-MM') AS month,
  SUM(pr.paid_amount) AS income_total
FROM payment_records pr
JOIN monthly_charges mc ON pr.linked_charge_id = mc.id
JOIN companies c ON mc.company_id = c.id
WHERE pr.deleted_at IS NULL AND mc.deleted_at IS NULL
GROUP BY c.id, c.name, to_char(pr.payment_date::date, 'YYYY-MM');

CREATE OR REPLACE VIEW monthly_expense_summary AS
SELECT
  c.id AS company_id,
  c.name AS company_name,
  to_char(e.expense_date::date, 'YYYY-MM') AS month,
  SUM(e.amount) AS expense_total
FROM expenses e
JOIN companies c ON e.company_id = c.id
WHERE e.deleted_at IS NULL
GROUP BY c.id, c.name, to_char(e.expense_date::date, 'YYYY-MM');

-- ============================================================
-- 7. RLS Policies for new tables
-- ============================================================
ALTER TABLE tenant_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE payer_name_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_history_records ENABLE ROW LEVEL SECURITY;

-- Read access for all authenticated users
CREATE POLICY "tenant_aliases_select" ON tenant_aliases FOR SELECT TO authenticated USING (true);
CREATE POLICY "payer_name_aliases_select" ON payer_name_aliases FOR SELECT TO authenticated USING (true);
CREATE POLICY "match_history_select" ON match_history_records FOR SELECT TO authenticated USING (true);

-- Write access for accounting managers and payment staff
CREATE POLICY "tenant_aliases_insert" ON tenant_aliases FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role IN ('accounting_manager', 'payment_staff')));
CREATE POLICY "payer_name_aliases_insert" ON payer_name_aliases FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role IN ('accounting_manager', 'payment_staff')));
CREATE POLICY "match_history_insert" ON match_history_records FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role IN ('accounting_manager', 'payment_staff')));

-- Update for accounting managers
CREATE POLICY "tenant_aliases_update" ON tenant_aliases FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'accounting_manager'));
CREATE POLICY "payer_name_aliases_update" ON payer_name_aliases FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'accounting_manager'));

-- Delete for accounting managers
CREATE POLICY "tenant_aliases_delete" ON tenant_aliases FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'accounting_manager'));
CREATE POLICY "payer_name_aliases_delete" ON payer_name_aliases FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE user_id = auth.uid() AND role = 'accounting_manager'));
