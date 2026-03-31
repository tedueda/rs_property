-- Enable RLS on all main tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE applicants ENABLE ROW LEVEL SECURITY;
ALTER TABLE occupants ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE guarantors ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocr_extracted_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_field_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE unmapped_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE arrears_followups ENABLE ROW LEVEL SECURITY;
ALTER TABLE repairs ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's company_id
CREATE OR REPLACE FUNCTION get_user_company_id()
RETURNS UUID AS $$
  SELECT company_id FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function to get user's role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Users: can see users in same company
CREATE POLICY users_select ON users FOR SELECT USING (company_id = get_user_company_id());
CREATE POLICY users_update ON users FOR UPDATE USING (id = auth.uid() OR get_user_role() IN ('super_admin', 'admin'));

-- Properties: company-scoped + soft delete
CREATE POLICY properties_select ON properties FOR SELECT USING (company_id = get_user_company_id() AND deleted_at IS NULL);
CREATE POLICY properties_insert ON properties FOR INSERT WITH CHECK (company_id = get_user_company_id() AND get_user_role() IN ('super_admin', 'admin', 'staff'));
CREATE POLICY properties_update ON properties FOR UPDATE USING (company_id = get_user_company_id() AND get_user_role() IN ('super_admin', 'admin', 'staff'));
CREATE POLICY properties_delete ON properties FOR DELETE USING (company_id = get_user_company_id() AND get_user_role() IN ('super_admin', 'admin'));

-- Units: company-scoped + soft delete
CREATE POLICY units_select ON units FOR SELECT USING (company_id = get_user_company_id() AND deleted_at IS NULL);
CREATE POLICY units_insert ON units FOR INSERT WITH CHECK (company_id = get_user_company_id() AND get_user_role() IN ('super_admin', 'admin', 'staff'));
CREATE POLICY units_update ON units FOR UPDATE USING (company_id = get_user_company_id() AND get_user_role() IN ('super_admin', 'admin', 'staff'));
CREATE POLICY units_delete ON units FOR DELETE USING (company_id = get_user_company_id() AND get_user_role() IN ('super_admin', 'admin'));

-- Applications: company-scoped + soft delete
CREATE POLICY applications_select ON applications FOR SELECT USING (company_id = get_user_company_id() AND deleted_at IS NULL);
CREATE POLICY applications_insert ON applications FOR INSERT WITH CHECK (company_id = get_user_company_id() AND get_user_role() IN ('super_admin', 'admin', 'staff'));
CREATE POLICY applications_update ON applications FOR UPDATE USING (company_id = get_user_company_id() AND get_user_role() IN ('super_admin', 'admin', 'staff'));

-- Related application tables
CREATE POLICY applicants_select ON applicants FOR SELECT USING (
  EXISTS (SELECT 1 FROM applications WHERE applications.id = applicants.application_id AND applications.company_id = get_user_company_id())
);
CREATE POLICY applicants_insert ON applicants FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM applications WHERE applications.id = applicants.application_id AND applications.company_id = get_user_company_id())
);
CREATE POLICY applicants_update ON applicants FOR UPDATE USING (
  EXISTS (SELECT 1 FROM applications WHERE applications.id = applicants.application_id AND applications.company_id = get_user_company_id())
);

-- Occupants
CREATE POLICY occupants_select ON occupants FOR SELECT USING (
  EXISTS (SELECT 1 FROM applications WHERE applications.id = occupants.application_id AND applications.company_id = get_user_company_id())
);
CREATE POLICY occupants_manage ON occupants FOR ALL USING (
  EXISTS (SELECT 1 FROM applications WHERE applications.id = occupants.application_id AND applications.company_id = get_user_company_id())
);

-- Emergency contacts
CREATE POLICY ec_select ON emergency_contacts FOR SELECT USING (
  EXISTS (SELECT 1 FROM applications WHERE applications.id = emergency_contacts.application_id AND applications.company_id = get_user_company_id())
);
CREATE POLICY ec_manage ON emergency_contacts FOR ALL USING (
  EXISTS (SELECT 1 FROM applications WHERE applications.id = emergency_contacts.application_id AND applications.company_id = get_user_company_id())
);

-- Guarantors
CREATE POLICY guarantors_select ON guarantors FOR SELECT USING (
  EXISTS (SELECT 1 FROM applications WHERE applications.id = guarantors.application_id AND applications.company_id = get_user_company_id())
);
CREATE POLICY guarantors_manage ON guarantors FOR ALL USING (
  EXISTS (SELECT 1 FROM applications WHERE applications.id = guarantors.application_id AND applications.company_id = get_user_company_id())
);

-- Application files
CREATE POLICY app_files_select ON application_files FOR SELECT USING (company_id = get_user_company_id());
CREATE POLICY app_files_insert ON application_files FOR INSERT WITH CHECK (company_id = get_user_company_id());

-- OCR jobs
CREATE POLICY ocr_jobs_select ON ocr_jobs FOR SELECT USING (company_id = get_user_company_id());
CREATE POLICY ocr_jobs_insert ON ocr_jobs FOR INSERT WITH CHECK (company_id = get_user_company_id());
CREATE POLICY ocr_jobs_update ON ocr_jobs FOR UPDATE USING (company_id = get_user_company_id());

-- OCR extracted fields
CREATE POLICY ocr_fields_select ON ocr_extracted_fields FOR SELECT USING (
  EXISTS (SELECT 1 FROM ocr_jobs WHERE ocr_jobs.id = ocr_extracted_fields.ocr_job_id AND ocr_jobs.company_id = get_user_company_id())
);
CREATE POLICY ocr_fields_manage ON ocr_extracted_fields FOR ALL USING (
  EXISTS (SELECT 1 FROM ocr_jobs WHERE ocr_jobs.id = ocr_extracted_fields.ocr_job_id AND ocr_jobs.company_id = get_user_company_id())
);

-- Form templates & aliases
CREATE POLICY form_templates_select ON form_templates FOR SELECT USING (company_id = get_user_company_id());
CREATE POLICY form_templates_manage ON form_templates FOR ALL USING (company_id = get_user_company_id());
CREATE POLICY form_aliases_select ON form_field_aliases FOR SELECT USING (
  EXISTS (SELECT 1 FROM form_templates WHERE form_templates.id = form_field_aliases.form_template_id AND form_templates.company_id = get_user_company_id())
);
CREATE POLICY form_aliases_manage ON form_field_aliases FOR ALL USING (
  EXISTS (SELECT 1 FROM form_templates WHERE form_templates.id = form_field_aliases.form_template_id AND form_templates.company_id = get_user_company_id())
);

-- Unmapped fields
CREATE POLICY unmapped_select ON unmapped_fields FOR SELECT USING (company_id = get_user_company_id());
CREATE POLICY unmapped_manage ON unmapped_fields FOR ALL USING (company_id = get_user_company_id());

-- Contracts
CREATE POLICY contracts_select ON contracts FOR SELECT USING (company_id = get_user_company_id() AND deleted_at IS NULL);
CREATE POLICY contracts_insert ON contracts FOR INSERT WITH CHECK (company_id = get_user_company_id());
CREATE POLICY contracts_update ON contracts FOR UPDATE USING (company_id = get_user_company_id());

-- Contract templates
CREATE POLICY ct_select ON contract_templates FOR SELECT USING (company_id = get_user_company_id());
CREATE POLICY ct_manage ON contract_templates FOR ALL USING (company_id = get_user_company_id());

-- Tenants
CREATE POLICY tenants_select ON tenants FOR SELECT USING (company_id = get_user_company_id() AND deleted_at IS NULL);
CREATE POLICY tenants_insert ON tenants FOR INSERT WITH CHECK (company_id = get_user_company_id());
CREATE POLICY tenants_update ON tenants FOR UPDATE USING (company_id = get_user_company_id());

-- Rent charges
CREATE POLICY rc_select ON rent_charges FOR SELECT USING (company_id = get_user_company_id());
CREATE POLICY rc_manage ON rent_charges FOR ALL USING (company_id = get_user_company_id());

-- Rent payments
CREATE POLICY rp_select ON rent_payments FOR SELECT USING (company_id = get_user_company_id());
CREATE POLICY rp_manage ON rent_payments FOR ALL USING (company_id = get_user_company_id());

-- Rent reconciliations
CREATE POLICY rr_select ON rent_reconciliations FOR SELECT USING (company_id = get_user_company_id());
CREATE POLICY rr_manage ON rent_reconciliations FOR ALL USING (company_id = get_user_company_id());

-- Arrears followups
CREATE POLICY af_select ON arrears_followups FOR SELECT USING (company_id = get_user_company_id());
CREATE POLICY af_manage ON arrears_followups FOR ALL USING (company_id = get_user_company_id());

-- Repairs
CREATE POLICY repairs_select ON repairs FOR SELECT USING (company_id = get_user_company_id() AND deleted_at IS NULL);
CREATE POLICY repairs_insert ON repairs FOR INSERT WITH CHECK (company_id = get_user_company_id());
CREATE POLICY repairs_update ON repairs FOR UPDATE USING (company_id = get_user_company_id());

-- Repair files
CREATE POLICY rf_select ON repair_files FOR SELECT USING (company_id = get_user_company_id());
CREATE POLICY rf_manage ON repair_files FOR ALL USING (company_id = get_user_company_id());

-- Audit logs: only super_admin and admin can view
CREATE POLICY al_select ON audit_logs FOR SELECT USING (company_id = get_user_company_id() AND get_user_role() IN ('super_admin', 'admin'));
CREATE POLICY al_insert ON audit_logs FOR INSERT WITH CHECK (company_id = get_user_company_id());
