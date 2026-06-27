-- Property Ledgers (物件管理台帳)
CREATE TABLE IF NOT EXISTS property_ledgers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_name TEXT NOT NULL DEFAULT '',
  created_date TEXT,
  tenant_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  guarantor TEXT,
  move_in_date TEXT,
  rent TEXT,
  guarantee_company TEXT,
  house_cleaning_fee TEXT,
  water_fee TEXT,
  common_fee TEXT,
  deposit TEXT,
  deduction TEXT,
  penalty TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE TRIGGER set_updated_at_property_ledgers
  BEFORE UPDATE ON property_ledgers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE property_ledgers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to property_ledgers" ON property_ledgers
  FOR ALL USING (true) WITH CHECK (true);
