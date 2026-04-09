-- Phase 1: Fund Management Schema Updates
-- This migration updates the schema for the fund management application

-- ============================================================
-- 1. Roles table
-- ============================================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_key TEXT NOT NULL UNIQUE,
  role_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO roles (role_key, role_name, description) VALUES
  ('president', '社長', 'グループ全体の閲覧権限'),
  ('accounting_manager', '経理責任者', '全機能の編集権限'),
  ('payment_staff', '入金担当', '請求・入金・未収管理の編集権限'),
  ('expense_staff', '経費・給与担当', '経費・給与関連の権限（Phase2以降）'),
  ('viewer', '閲覧専用', '全機能の閲覧のみ')
ON CONFLICT (role_key) DO NOTHING;

-- ============================================================
-- 2. User Roles (many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role_id, company_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);

-- ============================================================
-- 3. Update companies table
-- ============================================================
ALTER TABLE companies ADD COLUMN IF NOT EXISTS company_code TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS updated_by UUID;

-- ============================================================
-- 4. Update properties table
-- ============================================================
ALTER TABLE properties ADD COLUMN IF NOT EXISTS management_start_date DATE;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS updated_by UUID;

-- ============================================================
-- 5. Rooms table (maps to user's "部屋管理")
-- ============================================================
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id),
  room_number TEXT NOT NULL,
  rent NUMERIC(10,0) DEFAULT 0,
  common_fee NUMERIC(10,0) DEFAULT 0,
  water_fee NUMERIC(10,0) DEFAULT 0,
  parking_fee NUMERIC(10,0) DEFAULT 0,
  other_fixed_fee NUMERIC(10,0) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'vacant' CHECK (status IN ('vacant', 'occupied', 'reserved', 'maintenance', 'retired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_rooms_property ON rooms(property_id) WHERE deleted_at IS NULL;

-- ============================================================
-- 6. Update tenants table for fund management
-- ============================================================
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS tenant_name TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS contract_start_date DATE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS contract_end_date DATE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS guarantor_company_name TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS updated_by UUID;

-- ============================================================
-- 7. Monthly Charges (家賃請求管理)
-- ============================================================
CREATE TABLE IF NOT EXISTS monthly_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  room_id UUID NOT NULL REFERENCES rooms(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  target_month TEXT NOT NULL,
  rent_amount NUMERIC(10,0) NOT NULL DEFAULT 0,
  common_fee_amount NUMERIC(10,0) NOT NULL DEFAULT 0,
  water_fee_amount NUMERIC(10,0) NOT NULL DEFAULT 0,
  parking_fee_amount NUMERIC(10,0) NOT NULL DEFAULT 0,
  other_amount NUMERIC(10,0) NOT NULL DEFAULT 0,
  billed_total NUMERIC(10,0) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'partial_paid', 'paid', 'overdue', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_monthly_charges_company ON monthly_charges(company_id);
CREATE INDEX IF NOT EXISTS idx_monthly_charges_month ON monthly_charges(target_month);
CREATE INDEX IF NOT EXISTS idx_monthly_charges_status ON monthly_charges(status);
CREATE INDEX IF NOT EXISTS idx_monthly_charges_tenant ON monthly_charges(tenant_id);

-- ============================================================
-- 8. Payment Records (入金管理)
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id UUID,
  payment_date DATE NOT NULL,
  payer_name TEXT NOT NULL,
  description TEXT,
  paid_amount NUMERIC(10,0) NOT NULL DEFAULT 0,
  linked_charge_id UUID REFERENCES monthly_charges(id),
  difference_amount NUMERIC(10,0) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'unmatched' CHECK (status IN ('unmatched', 'matched', 'partial', 'overpaid', 'arrears', 'needs_review')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_payment_records_date ON payment_records(payment_date);
CREATE INDEX IF NOT EXISTS idx_payment_records_status ON payment_records(status);
CREATE INDEX IF NOT EXISTS idx_payment_records_charge ON payment_records(linked_charge_id);

-- ============================================================
-- 9. Arrears Records (未収・滞納管理)
-- ============================================================
CREATE TABLE IF NOT EXISTS arrears_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  monthly_charge_id UUID NOT NULL REFERENCES monthly_charges(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  room_id UUID NOT NULL REFERENCES rooms(id),
  target_month TEXT NOT NULL,
  billed_total NUMERIC(10,0) NOT NULL DEFAULT 0,
  paid_total NUMERIC(10,0) NOT NULL DEFAULT 0,
  arrears_amount NUMERIC(10,0) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'outstanding' CHECK (status IN ('outstanding', 'partially_paid', 'resolved', 'written_off')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_arrears_company ON arrears_records(company_id);
CREATE INDEX IF NOT EXISTS idx_arrears_tenant ON arrears_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_arrears_status ON arrears_records(status);

-- ============================================================
-- 10. Apply updated_at triggers to new tables
-- ============================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['roles', 'user_roles', 'rooms', 'monthly_charges', 'payment_records', 'arrears_records'])
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_updated_at ON %I', tbl);
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()', tbl);
  END LOOP;
END;
$$;

-- ============================================================
-- 11. Insert initial companies
-- ============================================================
INSERT INTO companies (name, company_code, notes) VALUES
  ('林建設株式会社', 'HAYASHI', '不動産管理グループ'),
  ('N・Yコーポレーション株式会社', 'NYCORP', '不動産管理グループ'),
  ('株式会社オーナーズ', 'OWNERS', '不動産管理グループ'),
  ('株式会社照', 'TERU', '不動産管理グループ'),
  ('株式会社A', 'COMP_A', '仮名称'),
  ('株式会社B', 'COMP_B', '仮名称')
ON CONFLICT DO NOTHING;
