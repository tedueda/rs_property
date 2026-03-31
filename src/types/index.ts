export type UserRole = 'super_admin' | 'admin' | 'staff' | 'viewer'

export interface Company {
  id: string
  name: string
  address?: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  company_id: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Property {
  id: string
  company_id: string
  name: string
  address: string
  city?: string
  prefecture?: string
  postal_code?: string
  property_type?: string
  total_units: number
  description?: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface Unit {
  id: string
  property_id: string
  company_id: string
  unit_number: string
  floor?: number
  layout?: string
  area_sqm?: number
  rent_amount?: number
  management_fee?: number
  water_fee?: number
  parking_fee?: number
  deposit?: number
  key_money?: number
  guarantee_deposit?: number
  cancellation_fee?: number
  status: 'vacant' | 'occupied' | 'reserved' | 'maintenance'
  description?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  property?: Property
}

export type ApplicationStatus = 'draft' | 'submitted' | 'screening' | 'approved' | 'rejected' | 'cancelled' | 'contracted'

export interface Application {
  id: string
  company_id: string
  property_id: string
  unit_id: string
  application_number?: string
  status: ApplicationStatus
  desired_move_in_date?: string
  contract_start_date?: string
  rent_amount?: number
  management_fee?: number
  water_fee?: number
  parking_fee?: number
  deposit?: number
  key_money?: number
  guarantee_deposit?: number
  cancellation_fee?: number
  purpose_of_use?: string
  notes?: string
  reception_date?: string
  staff_name?: string
  anti_social_check?: boolean
  id_verification?: boolean
  employment_verification?: boolean
  emergency_contact_verified?: boolean
  guarantee_company_status?: string
  owner_approval_status?: string
  contract_creation_status?: string
  key_delivery_date?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  property?: Property
  unit?: Unit
  applicant?: Applicant
}

export interface Applicant {
  id: string
  application_id: string
  full_name: string
  full_name_kana?: string
  birth_date?: string
  age?: number
  gender?: string
  phone?: string
  email?: string
  current_address?: string
  current_housing_type?: string
  years_at_current?: number
  employer_name?: string
  employer_address?: string
  employer_phone?: string
  department?: string
  position?: string
  years_employed?: number
  employment_type?: string
  annual_income?: number
  industry?: string
  created_at: string
  updated_at: string
}

export interface Occupant {
  id: string
  application_id: string
  is_same_as_applicant: boolean
  full_name: string
  full_name_kana?: string
  birth_date?: string
  relationship?: string
  phone?: string
  employer_or_school?: string
  created_at: string
  updated_at: string
}

export interface EmergencyContact {
  id: string
  application_id: string
  full_name: string
  full_name_kana?: string
  relationship?: string
  address?: string
  phone?: string
  mobile?: string
  employer_name?: string
  employer_phone?: string
  created_at: string
  updated_at: string
}

export interface Guarantor {
  id: string
  application_id: string
  full_name: string
  full_name_kana?: string
  birth_date?: string
  age?: number
  relationship?: string
  address?: string
  phone?: string
  mobile?: string
  employer_name?: string
  employer_address?: string
  employer_phone?: string
  years_employed?: number
  annual_income?: number
  created_at: string
  updated_at: string
}

export interface OcrJob {
  id: string
  company_id: string
  application_id?: string
  file_path: string
  file_name: string
  file_type: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  ocr_raw_result?: Record<string, unknown>
  error_message?: string
  created_at: string
  updated_at: string
}

export interface OcrExtractedField {
  id: string
  ocr_job_id: string
  ocr_label: string
  ocr_value: string
  mapped_field?: string
  confidence_score?: number
  status: 'auto_confirmed' | 'candidate' | 'needs_review' | 'unmapped'
  candidates?: FieldCandidate[]
  position_info?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface FieldCandidate {
  field_name: string
  score: number
  description?: string
}

export interface FormTemplate {
  id: string
  company_id: string
  name: string
  description?: string
  sample_file_path?: string
  created_at: string
  updated_at: string
}

export interface FormFieldAlias {
  id: string
  form_template_id: string
  ocr_label: string
  system_field: string
  priority: number
  created_at: string
}

export interface Contract {
  id: string
  company_id: string
  application_id: string
  property_id: string
  unit_id: string
  tenant_id?: string
  contract_type: 'new' | 'renewal'
  template_id?: string
  status: 'draft' | 'active' | 'expired' | 'terminated'
  start_date: string
  end_date?: string
  rent_amount: number
  management_fee?: number
  pdf_file_path?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  property?: Property
  unit?: Unit
}

export interface ContractTemplate {
  id: string
  company_id: string
  name: string
  template_type: 'lease' | 'confirmation' | 'renewal' | 'other'
  html_content: string
  created_at: string
  updated_at: string
}

export interface Tenant {
  id: string
  company_id: string
  full_name: string
  full_name_kana?: string
  birth_date?: string
  phone?: string
  email?: string
  current_address?: string
  contract_id?: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface RentCharge {
  id: string
  company_id: string
  contract_id: string
  tenant_id: string
  unit_id: string
  charge_month: string
  rent_amount: number
  management_fee: number
  other_charges: number
  total_amount: number
  status: 'pending' | 'partial' | 'paid' | 'overdue'
  due_date: string
  created_at: string
  updated_at: string
}

export interface RentPayment {
  id: string
  company_id: string
  contract_id?: string
  tenant_id?: string
  payment_date: string
  amount: number
  payer_name?: string
  payment_method?: string
  reconciliation_status: 'unmatched' | 'matched' | 'partial'
  notes?: string
  created_at: string
  updated_at: string
}

export interface ArrearsFollowup {
  id: string
  company_id: string
  rent_charge_id: string
  tenant_id: string
  followup_type: 'phone' | 'email' | 'letter' | 'visit' | 'other'
  followup_date: string
  notes?: string
  staff_name?: string
  created_at: string
  updated_at: string
}

export type RepairStatus = 'received' | 'investigating' | 'vendor_requested' | 'quote_pending' | 'in_progress' | 'completed'

export interface Repair {
  id: string
  company_id: string
  property_id: string
  unit_id?: string
  contract_id?: string
  tenant_name?: string
  title: string
  description?: string
  status: RepairStatus
  priority: 'low' | 'medium' | 'high' | 'urgent'
  received_date: string
  staff_name?: string
  vendor_name?: string
  estimated_cost?: number
  actual_cost?: number
  completed_date?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  property?: Property
  unit?: Unit
}

export interface AuditLog {
  id: string
  company_id: string
  user_id: string
  user_email?: string
  action: string
  target_type: string
  target_id?: string
  details?: Record<string, unknown>
  ip_address?: string
  created_at: string
}

export interface DashboardStats {
  total_properties: number
  total_units: number
  occupied_units: number
  vacant_units: number
  pending_applications: number
  contracts_this_month: number
  arrears_count: number
  active_repairs: number
}

export interface DashboardAlerts {
  ocr_unconfirmed: number
  mapping_unconfirmed: number
  contracts_not_created: number
  payments_unconfirmed: number
  arrears_count: number
  repairs_incomplete: number
  new_templates_detected: number
}
