-- Fix: Include 'president' role in edit permission functions
-- The super_admin user maps to 'president' but was excluded from write operations

CREATE OR REPLACE FUNCTION user_can_edit()
RETURNS BOOLEAN AS $$
  SELECT user_has_role(ARRAY['president', 'accounting_manager'])
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION user_can_edit_payments()
RETURNS BOOLEAN AS $$
  SELECT user_has_role(ARRAY['president', 'accounting_manager', 'payment_staff'])
$$ LANGUAGE SQL SECURITY DEFINER STABLE;
