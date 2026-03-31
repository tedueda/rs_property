-- RS Property Management - Initial Schema
-- Companies
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Users (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('super_admin', 'admin', 'staff', 'viewer')),
  company_id UUID REFERENCES companies(id),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Properties
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT,
  prefecture TEXT,
  postal_code TEXT,
  property_type TEXT,
  total_units INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Units
CREATE TABLE IF NOT EXISTS units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id),
  company_id UUID NOT NULL REFERENCES companies(id),
  unit_number TEXT NOT NULL,
  floor INTEGER,
  layout TEXT,
  area_sqm NUMERIC(8,2),
  rent_amount NUMERIC(10,0),
  management_fee NUMERIC(10,0),
  water_fee NUMERIC(10,0),
  parking_fee NUMERIC(10,0),
  deposit NUMERIC(10,0),
  key_money NUMERIC(10,0),
  guarantee_deposit NUMERIC(10,0),
  cancellation_fee NUMERIC(10,0),
  status TEXT NOT NULL DEFAULT 'vacant' CHECK (status IN ('vacant', 'occupied', 'reserved', 'maintenance')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Applications
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  unit_id UUID NOT NULL REFERENCES units(id),
  application_number TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'screening', 'approved', 'rejected', 'cancelled', 'contracted')),
  desired_move_in_date DATE,
  contract_start_date DATE,
  rent_amount NUMERIC(10,0),
  management_fee NUMERIC(10,0),
  water_fee NUMERIC(10,0),
  parking_fee NUMERIC(10,0),
  deposit NUMERIC(10,0),
  key_money NUMERIC(10,0),
  guarantee_deposit NUMERIC(10,0),
  cancellation_fee NUMERIC(10,0),
  purpose_of_use TEXT,
  notes TEXT,
  reception_date DATE,
  staff_name TEXT,
  anti_social_check BOOLEAN DEFAULT false,
  id_verification BOOLEAN DEFAULT false,
  employment_verification BOOLEAN DEFAULT false,
  emergency_contact_verified BOOLEAN DEFAULT false,
  guarantee_company_status TEXT,
  owner_approval_status TEXT,
  contract_creation_status TEXT,
  key_delivery_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Applicants
CREATE TABLE IF NOT EXISTS applicants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  full_name_kana TEXT,
  birth_date DATE,
  age INTEGER,
  gender TEXT,
  phone TEXT,
  email TEXT,
  current_address TEXT,
  current_housing_type TEXT,
  years_at_current INTEGER,
  employer_name TEXT,
  employer_address TEXT,
  employer_phone TEXT,
  department TEXT,
  position TEXT,
  years_employed INTEGER,
  employment_type TEXT,
  annual_income NUMERIC(12,0),
  industry TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Occupants
CREATE TABLE IF NOT EXISTS occupants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  is_same_as_applicant BOOLEAN DEFAULT true,
  full_name TEXT NOT NULL,
  full_name_kana TEXT,
  birth_date DATE,
  relationship TEXT,
  phone TEXT,
  employer_or_school TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Emergency Contacts
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  full_name_kana TEXT,
  relationship TEXT,
  address TEXT,
  phone TEXT,
  mobile TEXT,
  employer_name TEXT,
  employer_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Guarantors
CREATE TABLE IF NOT EXISTS guarantors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  full_name_kana TEXT,
  birth_date DATE,
  age INTEGER,
  relationship TEXT,
  address TEXT,
  phone TEXT,
  mobile TEXT,
  employer_name TEXT,
  employer_address TEXT,
  employer_phone TEXT,
  years_employed INTEGER,
  annual_income NUMERIC(12,0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Application Files
CREATE TABLE IF NOT EXISTS application_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- OCR Jobs
CREATE TABLE IF NOT EXISTS ocr_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  application_id UUID REFERENCES applications(id),
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  ocr_raw_result JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- OCR Extracted Fields
CREATE TABLE IF NOT EXISTS ocr_extracted_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ocr_job_id UUID NOT NULL REFERENCES ocr_jobs(id) ON DELETE CASCADE,
  ocr_label TEXT NOT NULL,
  ocr_value TEXT NOT NULL,
  mapped_field TEXT,
  confidence_score NUMERIC(5,4),
  status TEXT NOT NULL DEFAULT 'needs_review' CHECK (status IN ('auto_confirmed', 'candidate', 'needs_review', 'unmapped')),
  candidates JSONB,
  position_info JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Form Templates
CREATE TABLE IF NOT EXISTS form_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  description TEXT,
  sample_file_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Form Field Aliases (learning table)
CREATE TABLE IF NOT EXISTS form_field_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_template_id UUID NOT NULL REFERENCES form_templates(id) ON DELETE CASCADE,
  ocr_label TEXT NOT NULL,
  system_field TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unmapped Fields
CREATE TABLE IF NOT EXISTS unmapped_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ocr_job_id UUID NOT NULL REFERENCES ocr_jobs(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id),
  ocr_label TEXT NOT NULL,
  ocr_value TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Contracts
CREATE TABLE IF NOT EXISTS contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  application_id UUID REFERENCES applications(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  unit_id UUID NOT NULL REFERENCES units(id),
  tenant_id UUID,
  contract_type TEXT NOT NULL DEFAULT 'new' CHECK (contract_type IN ('new', 'renewal')),
  template_id UUID,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'expired', 'terminated')),
  start_date DATE NOT NULL,
  end_date DATE,
  rent_amount NUMERIC(10,0) NOT NULL,
  management_fee NUMERIC(10,0),
  pdf_file_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Contract Templates
CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'lease' CHECK (template_type IN ('lease', 'confirmation', 'renewal', 'other')),
  html_content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tenants
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  full_name TEXT NOT NULL,
  full_name_kana TEXT,
  birth_date DATE,
  phone TEXT,
  email TEXT,
  current_address TEXT,
  contract_id UUID REFERENCES contracts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Add tenant_id FK to contracts after tenants table exists
ALTER TABLE contracts ADD CONSTRAINT contracts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id);

-- Rent Charges
CREATE TABLE IF NOT EXISTS rent_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  contract_id UUID NOT NULL REFERENCES contracts(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  unit_id UUID NOT NULL REFERENCES units(id),
  charge_month TEXT NOT NULL,
  rent_amount NUMERIC(10,0) NOT NULL,
  management_fee NUMERIC(10,0) NOT NULL DEFAULT 0,
  other_charges NUMERIC(10,0) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,0) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),
  due_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rent Payments
CREATE TABLE IF NOT EXISTS rent_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  contract_id UUID REFERENCES contracts(id),
  tenant_id UUID REFERENCES tenants(id),
  payment_date DATE NOT NULL,
  amount NUMERIC(10,0) NOT NULL,
  payer_name TEXT,
  payment_method TEXT,
  reconciliation_status TEXT NOT NULL DEFAULT 'unmatched' CHECK (reconciliation_status IN ('unmatched', 'matched', 'partial')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Rent Reconciliations
CREATE TABLE IF NOT EXISTS rent_reconciliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  rent_charge_id UUID NOT NULL REFERENCES rent_charges(id),
  rent_payment_id UUID NOT NULL REFERENCES rent_payments(id),
  matched_amount NUMERIC(10,0) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Arrears Followups
CREATE TABLE IF NOT EXISTS arrears_followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  rent_charge_id UUID NOT NULL REFERENCES rent_charges(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  followup_type TEXT NOT NULL CHECK (followup_type IN ('phone', 'email', 'letter', 'visit', 'other')),
  followup_date DATE NOT NULL,
  notes TEXT,
  staff_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Repairs
CREATE TABLE IF NOT EXISTS repairs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  property_id UUID NOT NULL REFERENCES properties(id),
  unit_id UUID REFERENCES units(id),
  contract_id UUID REFERENCES contracts(id),
  tenant_name TEXT,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'investigating', 'vendor_requested', 'quote_pending', 'in_progress', 'completed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  received_date DATE NOT NULL,
  staff_name TEXT,
  vendor_name TEXT,
  estimated_cost NUMERIC(10,0),
  actual_cost NUMERIC(10,0),
  completed_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Repair Files
CREATE TABLE IF NOT EXISTS repair_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_id UUID NOT NULL REFERENCES repairs(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID NOT NULL,
  user_email TEXT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_properties_company ON properties(company_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_units_property ON units(property_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_units_company ON units(company_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_applications_company ON applications(company_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ocr_jobs_company ON ocr_jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_ocr_jobs_status ON ocr_jobs(status);
CREATE INDEX IF NOT EXISTS idx_contracts_company ON contracts(company_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_rent_charges_company ON rent_charges(company_id);
CREATE INDEX IF NOT EXISTS idx_rent_charges_status ON rent_charges(status);
CREATE INDEX IF NOT EXISTS idx_repairs_company ON repairs(company_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON audit_logs(target_type, target_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['companies', 'users', 'properties', 'units', 'applications', 'applicants', 'occupants', 'emergency_contacts', 'guarantors', 'ocr_jobs', 'ocr_extracted_fields', 'form_templates', 'contracts', 'contract_templates', 'tenants', 'rent_charges', 'rent_payments', 'arrears_followups', 'repairs'])
  LOOP
    EXECUTE format('CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()', tbl);
  END LOOP;
END;
$$;
