-- Fix: Include 'president' role in edit permission functions
-- The super_admin user maps to 'president' but was excluded from write operations

-- ============================================================
-- 1. Fix helper functions
-- ============================================================
CREATE OR REPLACE FUNCTION user_can_edit()
RETURNS BOOLEAN AS $$
  SELECT user_has_role(ARRAY['president', 'accounting_manager'])
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION user_can_edit_payments()
RETURNS BOOLEAN AS $$
  SELECT user_has_role(ARRAY['president', 'accounting_manager', 'payment_staff'])
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================================
-- 2. Fix document-related RLS policies (from 00007)
--    These used user_has_role() directly without 'president'
-- ============================================================

-- document_categories: add president to write policies
DROP POLICY IF EXISTS "document_categories_insert" ON document_categories;
DROP POLICY IF EXISTS "document_categories_update" ON document_categories;
DROP POLICY IF EXISTS "document_categories_delete" ON document_categories;
CREATE POLICY "document_categories_insert" ON document_categories FOR INSERT TO authenticated
  WITH CHECK (user_has_role(ARRAY['president'::TEXT, 'accounting_manager'::TEXT]));
CREATE POLICY "document_categories_update" ON document_categories FOR UPDATE TO authenticated
  USING (user_has_role(ARRAY['president'::TEXT, 'accounting_manager'::TEXT]));
CREATE POLICY "document_categories_delete" ON document_categories FOR DELETE TO authenticated
  USING (user_has_role(ARRAY['president'::TEXT, 'accounting_manager'::TEXT]));

-- documents: add president to write policies
DROP POLICY IF EXISTS "documents_insert" ON documents;
DROP POLICY IF EXISTS "documents_update" ON documents;
DROP POLICY IF EXISTS "documents_delete" ON documents;
CREATE POLICY "documents_insert" ON documents FOR INSERT TO authenticated
  WITH CHECK (user_has_role(ARRAY['president'::TEXT, 'accounting_manager'::TEXT, 'payment_staff'::TEXT, 'expense_staff'::TEXT]));
CREATE POLICY "documents_update" ON documents FOR UPDATE TO authenticated
  USING (user_has_role(ARRAY['president'::TEXT, 'accounting_manager'::TEXT, 'payment_staff'::TEXT, 'expense_staff'::TEXT]));
CREATE POLICY "documents_delete" ON documents FOR DELETE TO authenticated
  USING (user_has_role(ARRAY['president'::TEXT, 'accounting_manager'::TEXT, 'payment_staff'::TEXT, 'expense_staff'::TEXT]));

-- document_versions: add president
DROP POLICY IF EXISTS "document_versions_insert" ON document_versions;
CREATE POLICY "document_versions_insert" ON document_versions FOR INSERT TO authenticated
  WITH CHECK (user_has_role(ARRAY['president'::TEXT, 'accounting_manager'::TEXT, 'payment_staff'::TEXT, 'expense_staff'::TEXT]));

-- document_links: add president
DROP POLICY IF EXISTS "document_links_insert" ON document_links;
DROP POLICY IF EXISTS "document_links_delete" ON document_links;
CREATE POLICY "document_links_insert" ON document_links FOR INSERT TO authenticated
  WITH CHECK (user_has_role(ARRAY['president'::TEXT, 'accounting_manager'::TEXT, 'payment_staff'::TEXT, 'expense_staff'::TEXT]));
CREATE POLICY "document_links_delete" ON document_links FOR DELETE TO authenticated
  USING (user_has_role(ARRAY['president'::TEXT, 'accounting_manager'::TEXT, 'payment_staff'::TEXT, 'expense_staff'::TEXT]));

-- document_alerts: add president
DROP POLICY IF EXISTS "document_alerts_update" ON document_alerts;
CREATE POLICY "document_alerts_update" ON document_alerts FOR UPDATE TO authenticated
  USING (user_has_role(ARRAY['president'::TEXT, 'accounting_manager'::TEXT, 'payment_staff'::TEXT, 'expense_staff'::TEXT]));

-- uploaded_files: add president
DROP POLICY IF EXISTS "uploaded_files_insert" ON uploaded_files;
DROP POLICY IF EXISTS "uploaded_files_update" ON uploaded_files;
CREATE POLICY "uploaded_files_insert" ON uploaded_files FOR INSERT TO authenticated
  WITH CHECK (user_has_role(ARRAY['president'::TEXT, 'accounting_manager'::TEXT, 'payment_staff'::TEXT, 'expense_staff'::TEXT]));
CREATE POLICY "uploaded_files_update" ON uploaded_files FOR UPDATE TO authenticated
  USING (user_has_role(ARRAY['president'::TEXT, 'accounting_manager'::TEXT, 'payment_staff'::TEXT, 'expense_staff'::TEXT]));

-- extracted_data_candidates: add president
DROP POLICY IF EXISTS "extracted_data_candidates_insert" ON extracted_data_candidates;
DROP POLICY IF EXISTS "extracted_data_candidates_update" ON extracted_data_candidates;
CREATE POLICY "extracted_data_candidates_insert" ON extracted_data_candidates FOR INSERT TO authenticated
  WITH CHECK (user_has_role(ARRAY['president'::TEXT, 'accounting_manager'::TEXT, 'payment_staff'::TEXT, 'expense_staff'::TEXT]));
CREATE POLICY "extracted_data_candidates_update" ON extracted_data_candidates FOR UPDATE TO authenticated
  USING (user_has_role(ARRAY['president'::TEXT, 'accounting_manager'::TEXT, 'payment_staff'::TEXT, 'expense_staff'::TEXT]));

-- import_logs: add president
DROP POLICY IF EXISTS "import_logs_insert" ON import_logs;
DROP POLICY IF EXISTS "import_logs_update" ON import_logs;
CREATE POLICY "import_logs_insert" ON import_logs FOR INSERT TO authenticated
  WITH CHECK (user_has_role(ARRAY['president'::TEXT, 'accounting_manager'::TEXT, 'payment_staff'::TEXT, 'expense_staff'::TEXT]));
CREATE POLICY "import_logs_update" ON import_logs FOR UPDATE TO authenticated
  USING (user_has_role(ARRAY['president'::TEXT, 'accounting_manager'::TEXT, 'payment_staff'::TEXT, 'expense_staff'::TEXT]));

-- import_review_histories: add president
DROP POLICY IF EXISTS "import_review_histories_insert" ON import_review_histories;
CREATE POLICY "import_review_histories_insert" ON import_review_histories FOR INSERT TO authenticated
  WITH CHECK (user_has_role(ARRAY['president'::TEXT, 'accounting_manager'::TEXT, 'payment_staff'::TEXT, 'expense_staff'::TEXT]));
