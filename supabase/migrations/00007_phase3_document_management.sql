-- Phase 3: Document Management, File Upload, OCR Confirmation Flow
-- Migration: 00007_phase3_document_management.sql

-- ============================================================
-- 1. Document Categories
-- ============================================================
CREATE TABLE IF NOT EXISTS document_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- ============================================================
-- 2. Documents
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES document_categories(id),
  title TEXT NOT NULL,
  company_id UUID REFERENCES companies(id),
  property_id UUID REFERENCES properties(id),
  room_id UUID REFERENCES rooms(id),
  tenant_id UUID REFERENCES tenants(id),
  bank_account_id UUID REFERENCES bank_accounts(id),
  related_loan_repayment_id UUID REFERENCES loan_repayments(id),
  issue_date DATE,
  contract_start_date DATE,
  contract_end_date DATE,
  renewal_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  file_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID
);

-- ============================================================
-- 3. Document Versions
-- ============================================================
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  uploaded_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. Document Links (polymorphic linking)
-- ============================================================
CREATE TABLE IF NOT EXISTS document_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  target_label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. Document Alerts
-- ============================================================
CREATE TABLE IF NOT EXISTS document_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  alert_date DATE NOT NULL,
  is_resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. Uploaded Files
-- ============================================================
CREATE TABLE IF NOT EXISTS uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  uploaded_by UUID,
  status TEXT NOT NULL DEFAULT 'uploaded',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. Extracted Data Candidates
-- ============================================================
CREATE TABLE IF NOT EXISTS extracted_data_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_file_id UUID NOT NULL REFERENCES uploaded_files(id) ON DELETE CASCADE,
  extraction_type TEXT NOT NULL,
  raw_text TEXT,
  parsed_json JSONB,
  review_status TEXT NOT NULL DEFAULT 'pending',
  reviewer_id UUID,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. Import Logs
-- ============================================================
CREATE TABLE IF NOT EXISTS import_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_file_id UUID NOT NULL REFERENCES uploaded_files(id) ON DELETE CASCADE,
  extraction_type TEXT,
  status TEXT NOT NULL DEFAULT 'imported',
  error_message TEXT,
  confirmed_by UUID,
  confirmed_at TIMESTAMPTZ,
  target_table TEXT,
  target_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. Import Review Histories
-- ============================================================
CREATE TABLE IF NOT EXISTS import_review_histories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extracted_data_candidate_id UUID NOT NULL REFERENCES extracted_data_candidates(id) ON DELETE CASCADE,
  reviewer_id UUID,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 10. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_documents_company_id ON documents(company_id);
CREATE INDEX IF NOT EXISTS idx_documents_category_id ON documents(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_contract_end_date ON documents(contract_end_date);
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_links_document_id ON document_links(document_id);
CREATE INDEX IF NOT EXISTS idx_document_links_target ON document_links(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_document_alerts_document_id ON document_alerts(document_id);
CREATE INDEX IF NOT EXISTS idx_document_alerts_resolved ON document_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_status ON uploaded_files(status);
CREATE INDEX IF NOT EXISTS idx_extracted_data_candidates_file ON extracted_data_candidates(uploaded_file_id);
CREATE INDEX IF NOT EXISTS idx_import_logs_file ON import_logs(uploaded_file_id);

-- ============================================================
-- 11. RLS Policies
-- ============================================================
ALTER TABLE document_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_data_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_review_histories ENABLE ROW LEVEL SECURITY;

-- Read access for all authenticated users
CREATE POLICY "document_categories_select" ON document_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "documents_select" ON documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "document_versions_select" ON document_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "document_links_select" ON document_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "document_alerts_select" ON document_alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "uploaded_files_select" ON uploaded_files FOR SELECT TO authenticated USING (true);
CREATE POLICY "extracted_data_candidates_select" ON extracted_data_candidates FOR SELECT TO authenticated USING (true);
CREATE POLICY "import_logs_select" ON import_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "import_review_histories_select" ON import_review_histories FOR SELECT TO authenticated USING (true);

-- Write access: accounting_manager, payment_staff, expense_staff
CREATE POLICY "document_categories_insert" ON document_categories FOR INSERT TO authenticated
  WITH CHECK (user_has_role(ARRAY['accounting_manager'::TEXT]));
CREATE POLICY "document_categories_update" ON document_categories FOR UPDATE TO authenticated
  USING (user_has_role(ARRAY['accounting_manager'::TEXT]));
CREATE POLICY "document_categories_delete" ON document_categories FOR DELETE TO authenticated
  USING (user_has_role(ARRAY['accounting_manager'::TEXT]));

CREATE POLICY "documents_insert" ON documents FOR INSERT TO authenticated
  WITH CHECK (user_has_role(ARRAY['accounting_manager'::TEXT, 'payment_staff'::TEXT, 'expense_staff'::TEXT]));
CREATE POLICY "documents_update" ON documents FOR UPDATE TO authenticated
  USING (user_has_role(ARRAY['accounting_manager'::TEXT, 'payment_staff'::TEXT, 'expense_staff'::TEXT]));
CREATE POLICY "documents_delete" ON documents FOR DELETE TO authenticated
  USING (user_has_role(ARRAY['accounting_manager'::TEXT, 'payment_staff'::TEXT, 'expense_staff'::TEXT]));

CREATE POLICY "document_versions_insert" ON document_versions FOR INSERT TO authenticated
  WITH CHECK (user_has_role(ARRAY['accounting_manager'::TEXT, 'payment_staff'::TEXT, 'expense_staff'::TEXT]));

CREATE POLICY "document_links_insert" ON document_links FOR INSERT TO authenticated
  WITH CHECK (user_has_role(ARRAY['accounting_manager'::TEXT, 'payment_staff'::TEXT, 'expense_staff'::TEXT]));
CREATE POLICY "document_links_delete" ON document_links FOR DELETE TO authenticated
  USING (user_has_role(ARRAY['accounting_manager'::TEXT, 'payment_staff'::TEXT, 'expense_staff'::TEXT]));

CREATE POLICY "document_alerts_update" ON document_alerts FOR UPDATE TO authenticated
  USING (user_has_role(ARRAY['accounting_manager'::TEXT, 'payment_staff'::TEXT, 'expense_staff'::TEXT]));

CREATE POLICY "uploaded_files_insert" ON uploaded_files FOR INSERT TO authenticated
  WITH CHECK (user_has_role(ARRAY['accounting_manager'::TEXT, 'payment_staff'::TEXT, 'expense_staff'::TEXT]));
CREATE POLICY "uploaded_files_update" ON uploaded_files FOR UPDATE TO authenticated
  USING (user_has_role(ARRAY['accounting_manager'::TEXT, 'payment_staff'::TEXT, 'expense_staff'::TEXT]));

CREATE POLICY "extracted_data_candidates_insert" ON extracted_data_candidates FOR INSERT TO authenticated
  WITH CHECK (user_has_role(ARRAY['accounting_manager'::TEXT, 'payment_staff'::TEXT, 'expense_staff'::TEXT]));
CREATE POLICY "extracted_data_candidates_update" ON extracted_data_candidates FOR UPDATE TO authenticated
  USING (user_has_role(ARRAY['accounting_manager'::TEXT, 'payment_staff'::TEXT, 'expense_staff'::TEXT]));

CREATE POLICY "import_logs_insert" ON import_logs FOR INSERT TO authenticated
  WITH CHECK (user_has_role(ARRAY['accounting_manager'::TEXT, 'payment_staff'::TEXT, 'expense_staff'::TEXT]));
CREATE POLICY "import_logs_update" ON import_logs FOR UPDATE TO authenticated
  USING (user_has_role(ARRAY['accounting_manager'::TEXT, 'payment_staff'::TEXT, 'expense_staff'::TEXT]));

CREATE POLICY "import_review_histories_insert" ON import_review_histories FOR INSERT TO authenticated
  WITH CHECK (user_has_role(ARRAY['accounting_manager'::TEXT, 'payment_staff'::TEXT, 'expense_staff'::TEXT]));

-- ============================================================
-- 12. Seed Data - Document Categories
-- ============================================================
INSERT INTO document_categories (category_name, sort_order, notes)
SELECT * FROM (VALUES
  ('入居契約書', 1, '賃貸借契約書'),
  ('借入契約書', 2, '金融機関との借入契約'),
  ('保証会社契約書', 3, '保証会社との契約'),
  ('更新契約書', 4, '契約更新に関する書類'),
  ('解約通知書', 5, '契約解約に関する通知'),
  ('請求書', 6, '取引先からの請求書'),
  ('領収書', 7, '支払い済みの領収書'),
  ('給与資料', 8, '給与明細・源泉徴収票等'),
  ('社内申請書', 9, '社内の各種申請書類'),
  ('その他', 10, 'その他の書類')
) AS v(category_name, sort_order, notes)
WHERE NOT EXISTS (SELECT 1 FROM document_categories LIMIT 1);

-- ============================================================
-- 13. Seed Data - Sample Documents (for demo)
-- ============================================================
INSERT INTO documents (title, category_id, company_id, status, issue_date, contract_start_date, contract_end_date, renewal_date, notes)
SELECT
  v.title,
  (SELECT id FROM document_categories WHERE category_name = v.cat_name LIMIT 1),
  (SELECT id FROM companies WHERE name = v.company_name LIMIT 1),
  v.status,
  v.issue_date::DATE,
  v.contract_start_date::DATE,
  v.contract_end_date::DATE,
  v.renewal_date::DATE,
  v.notes
FROM (VALUES
  ('林建設 賃貸借契約書 101号室', '入居契約書', '林建設株式会社', 'active', '2024-04-01', '2024-04-01', '2026-03-31', '2026-02-01', '2年契約'),
  ('林建設 借入契約書 三井住友銀行', '借入契約書', '林建設株式会社', 'active', '2023-01-15', '2023-01-15', '2028-01-14', '2027-11-15', '5年ローン'),
  ('NYコーポ 保証会社契約', '保証会社契約書', 'N・Yコーポレーション株式会社', 'renewal_pending', '2023-06-01', '2023-06-01', '2025-05-31', '2025-04-01', '更新手続き中'),
  ('オーナーズ 事務所賃貸契約', '入居契約書', '株式会社オーナーズ', 'active', '2024-01-01', '2024-01-01', '2026-12-31', NULL, '3年契約'),
  ('照 給与規程', '給与資料', '株式会社照', 'active', '2024-04-01', NULL, NULL, NULL, '最新版'),
  ('林建設 オフィス賃貸解約通知', '解約通知書', '林建設株式会社', 'cancelled', '2025-01-15', NULL, NULL, NULL, '2025年3月末解約'),
  ('NYコーポ 修繕工事請求書', '請求書', 'N・Yコーポレーション株式会社', 'needs_review', '2025-03-20', NULL, NULL, NULL, '外壁塗装工事'),
  ('オーナーズ 火災保険証券', '保証会社契約書', '株式会社オーナーズ', 'expired', '2022-04-01', '2022-04-01', '2025-03-31', NULL, '期限切れ - 要更新')
) AS v(title, cat_name, company_name, status, issue_date, contract_start_date, contract_end_date, renewal_date, notes)
WHERE NOT EXISTS (SELECT 1 FROM documents LIMIT 1);

-- ============================================================
-- 14. Supabase Storage bucket for documents
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
SELECT 'documents', 'documents', false
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'documents');
