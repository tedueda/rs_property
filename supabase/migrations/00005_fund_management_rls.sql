-- Phase 1: RLS Policies for Fund Management Tables

-- Enable RLS on new tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE arrears_records ENABLE ROW LEVEL SECURITY;

-- Helper: get user role keys as array
CREATE OR REPLACE FUNCTION get_user_role_keys()
RETURNS TEXT[] AS $$
  SELECT COALESCE(
    array_agg(r.role_key),
    ARRAY[]::TEXT[]
  )
  FROM user_roles ur
  JOIN roles r ON r.id = ur.role_id
  WHERE ur.user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper: check if user has any of given roles
CREATE OR REPLACE FUNCTION user_has_role(role_keys TEXT[])
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND r.role_key = ANY(role_keys)
  )
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper: check if user can edit (president reads, accounting_manager full, payment_staff billing)
CREATE OR REPLACE FUNCTION user_can_edit()
RETURNS BOOLEAN AS $$
  SELECT user_has_role(ARRAY['accounting_manager'])
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION user_can_edit_payments()
RETURNS BOOLEAN AS $$
  SELECT user_has_role(ARRAY['accounting_manager', 'payment_staff'])
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- Roles: everyone can read roles
-- ============================================================
CREATE POLICY roles_select ON roles FOR SELECT TO authenticated USING (true);

-- ============================================================
-- User Roles: authenticated users can see their own; admins can manage
-- ============================================================
CREATE POLICY user_roles_select ON user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_has_role(ARRAY['president', 'accounting_manager']));

CREATE POLICY user_roles_insert ON user_roles FOR INSERT TO authenticated
  WITH CHECK (user_can_edit());

CREATE POLICY user_roles_update ON user_roles FOR UPDATE TO authenticated
  USING (user_can_edit());

CREATE POLICY user_roles_delete ON user_roles FOR DELETE TO authenticated
  USING (user_can_edit());

-- ============================================================
-- Rooms: company-scoped via property
-- ============================================================
CREATE POLICY rooms_select ON rooms FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY rooms_insert ON rooms FOR INSERT TO authenticated
  WITH CHECK (user_can_edit() OR user_can_edit_payments());

CREATE POLICY rooms_update ON rooms FOR UPDATE TO authenticated
  USING (user_can_edit() OR user_can_edit_payments());

CREATE POLICY rooms_delete ON rooms FOR DELETE TO authenticated
  USING (user_can_edit());

-- ============================================================
-- Monthly Charges
-- ============================================================
CREATE POLICY mc_select ON monthly_charges FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY mc_insert ON monthly_charges FOR INSERT TO authenticated
  WITH CHECK (user_can_edit_payments());

CREATE POLICY mc_update ON monthly_charges FOR UPDATE TO authenticated
  USING (user_can_edit_payments());

CREATE POLICY mc_delete ON monthly_charges FOR DELETE TO authenticated
  USING (user_can_edit());

-- ============================================================
-- Payment Records
-- ============================================================
CREATE POLICY pr_select ON payment_records FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY pr_insert ON payment_records FOR INSERT TO authenticated
  WITH CHECK (user_can_edit_payments());

CREATE POLICY pr_update ON payment_records FOR UPDATE TO authenticated
  USING (user_can_edit_payments());

CREATE POLICY pr_delete ON payment_records FOR DELETE TO authenticated
  USING (user_can_edit());

-- ============================================================
-- Arrears Records
-- ============================================================
CREATE POLICY ar_select ON arrears_records FOR SELECT TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY ar_insert ON arrears_records FOR INSERT TO authenticated
  WITH CHECK (user_can_edit_payments());

CREATE POLICY ar_update ON arrears_records FOR UPDATE TO authenticated
  USING (user_can_edit_payments());

CREATE POLICY ar_delete ON arrears_records FOR DELETE TO authenticated
  USING (user_can_edit());
