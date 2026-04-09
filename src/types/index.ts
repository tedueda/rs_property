// ============================================================
// Role & Permission Types
// ============================================================
export type RoleKey = 'president' | 'accounting_manager' | 'payment_staff' | 'expense_staff' | 'viewer'

export interface Role {
  id: string
  role_key: RoleKey
  role_name: string
  description?: string
  created_at: string
  updated_at: string
}

export interface UserRole {
  id: string
  user_id: string
  role_id: string
  company_id?: string
  created_at: string
  updated_at: string
  role?: Role
}

// ============================================================
// User Types
// ============================================================
export interface User {
  id: string
  email: string
  full_name: string
  role: string
  company_id: string
  avatar_url?: string
  created_at: string
  updated_at: string
  user_roles?: UserRole[]
}

// ============================================================
// Company Types
// ============================================================
export interface Company {
  id: string
  name: string
  company_code?: string
  address?: string
  phone?: string
  notes?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  created_by?: string
  updated_by?: string
}

// ============================================================
// Property Types
// ============================================================
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
  management_start_date?: string
  notes?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  created_by?: string
  updated_by?: string
  company?: Company
}

// ============================================================
// Room Types
// ============================================================
export type RoomStatus = 'vacant' | 'occupied' | 'reserved' | 'maintenance' | 'retired'

export interface Room {
  id: string
  property_id: string
  room_number: string
  rent: number
  common_fee: number
  water_fee: number
  parking_fee: number
  other_fixed_fee: number
  status: RoomStatus
  created_at: string
  updated_at: string
  deleted_at?: string
  created_by?: string
  updated_by?: string
  property?: Property
}

// ============================================================
// Tenant Types
// ============================================================
export interface Tenant {
  id: string
  company_id: string
  room_id?: string
  tenant_name?: string
  full_name: string
  full_name_kana?: string
  birth_date?: string
  phone?: string
  email?: string
  current_address?: string
  emergency_contact?: string
  contract_start_date?: string
  contract_end_date?: string
  guarantor_company_name?: string
  notes?: string
  contract_id?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  created_by?: string
  updated_by?: string
  room?: Room
}

// ============================================================
// Monthly Charge Types
// ============================================================
export type ChargeStatus = 'draft' | 'confirmed' | 'partial_paid' | 'paid' | 'overdue' | 'cancelled'

export interface MonthlyCharge {
  id: string
  company_id: string
  property_id: string
  room_id: string
  tenant_id: string
  target_month: string
  rent_amount: number
  common_fee_amount: number
  water_fee_amount: number
  parking_fee_amount: number
  other_amount: number
  billed_total: number
  status: ChargeStatus
  created_at: string
  updated_at: string
  deleted_at?: string
  created_by?: string
  updated_by?: string
  company?: Company
  property?: Property
  room?: Room
  tenant?: Tenant
}

// ============================================================
// Payment Record Types
// ============================================================
export type PaymentStatus = 'unmatched' | 'matched' | 'partial' | 'overpaid' | 'arrears' | 'needs_review'

export interface PaymentRecord {
  id: string
  bank_account_id?: string
  payment_date: string
  payer_name: string
  description?: string
  paid_amount: number
  linked_charge_id?: string
  difference_amount: number
  status: PaymentStatus
  created_at: string
  updated_at: string
  deleted_at?: string
  created_by?: string
  updated_by?: string
  linked_charge?: MonthlyCharge
}

// ============================================================
// Arrears Record Types
// ============================================================
export type ArrearsStatus = 'outstanding' | 'partially_paid' | 'resolved' | 'written_off'

export interface ArrearsRecord {
  id: string
  company_id: string
  monthly_charge_id: string
  tenant_id: string
  room_id: string
  target_month: string
  billed_total: number
  paid_total: number
  arrears_amount: number
  status: ArrearsStatus
  notes?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  created_by?: string
  updated_by?: string
  company?: Company
  tenant?: Tenant
  room?: Room
  monthly_charge?: MonthlyCharge
}

// ============================================================
// Employee Types
// ============================================================
export type EmployeeStatus = 'active' | 'on_leave' | 'retired'

export interface Employee {
  id: string
  company_id: string
  employee_name: string
  employee_code?: string
  department?: string
  position?: string
  phone?: string
  email?: string
  joined_date?: string
  status: EmployeeStatus
  notes?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  created_by?: string
  updated_by?: string
  company?: Company
}

// ============================================================
// Expense Category Types
// ============================================================
export interface ExpenseCategory {
  id: string
  category_name: string
  sort_order: number
  notes?: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

// ============================================================
// Bank Account Types
// ============================================================
export type AccountType = 'ordinary' | 'checking' | 'savings' | 'time_deposit'

export interface BankAccount {
  id: string
  company_id: string
  bank_name: string
  branch_name?: string
  account_type: AccountType
  account_number: string
  account_holder: string
  current_balance: number
  notes?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  created_by?: string
  updated_by?: string
  company?: Company
}

// ============================================================
// Expense Record Types
// ============================================================
export type ExpenseStatus = 'pending' | 'scheduled' | 'paid' | 'needs_review'
export type PaymentMethod = 'bank_transfer' | 'cash' | 'credit_card' | 'direct_debit' | 'other'

export interface ExpenseRecord {
  id: string
  company_id: string
  payment_date: string
  vendor_name: string
  description?: string
  amount: number
  category_id?: string
  payment_method: PaymentMethod
  bank_account_id?: string
  status: ExpenseStatus
  notes?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  created_by?: string
  updated_by?: string
  company?: Company
  category?: ExpenseCategory
  bank_account?: BankAccount
}

// ============================================================
// Payroll Record Types
// ============================================================
export type PayrollStatus = 'draft' | 'confirmed' | 'paid' | 'needs_review'

export interface PayrollRecord {
  id: string
  company_id: string
  employee_id: string
  target_month: string
  base_salary: number
  allowance: number
  deduction: number
  net_payment: number
  payment_date?: string
  status: PayrollStatus
  notes?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  created_by?: string
  updated_by?: string
  company?: Company
  employee?: Employee
}

// ============================================================
// Bank Transaction Types
// ============================================================
export type TransactionType = 'deposit' | 'withdrawal'

export interface BankTransaction {
  id: string
  bank_account_id: string
  transaction_date: string
  transaction_type: TransactionType
  description?: string
  amount: number
  balance_after?: number
  related_type?: string
  related_id?: string
  notes?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  created_by?: string
  updated_by?: string
  bank_account?: BankAccount
}

// ============================================================
// Loan Repayment Types
// ============================================================
export type LoanRepaymentStatus = 'scheduled' | 'completed' | 'needs_review'

export interface LoanRepayment {
  id: string
  company_id: string
  bank_account_id?: string
  lender_name: string
  monthly_repayment_amount: number
  withdrawal_day: number
  next_withdrawal_date?: string
  status: LoanRepaymentStatus
  notes?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  created_by?: string
  updated_by?: string
  company?: Company
  bank_account?: BankAccount
}

// ============================================================
// Fund Transfer Types
// ============================================================
export interface FundTransfer {
  id: string
  transfer_date: string
  from_account_id: string
  to_account_id: string
  amount: number
  reason?: string
  notes?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  created_by?: string
  updated_by?: string
  from_account?: BankAccount
  to_account?: BankAccount
}

// ============================================================
// Dashboard Types
// ============================================================
export interface DashboardStats {
  total_companies: number
  total_properties: number
  total_rooms: number
  occupied_rooms: number
  vacant_rooms: number
  total_tenants: number
  monthly_charges_count: number
  monthly_charges_total: number
  payments_count: number
  payments_total: number
  arrears_count: number
  arrears_total: number
}

export interface CompanySummary {
  company_id: string
  company_name: string
  properties_count: number
  rooms_count: number
  charges_count: number
  charges_total: number
  payments_count: number
  payments_total: number
  arrears_count: number
  arrears_total: number
}

export interface BankAccountBalance {
  account_id: string
  company_name: string
  bank_name: string
  branch_name: string
  account_number_masked: string
  current_balance: number
}

export interface RepaymentSchedule {
  id: string
  company_name: string
  lender_name: string
  monthly_repayment_amount: number
  withdrawal_day: number
  next_withdrawal_date: string
  account_balance: number
  is_at_risk: boolean
}

// ============================================================
// Document Category Types
// ============================================================
export interface DocumentCategory {
  id: string
  category_name: string
  sort_order: number
  notes?: string
  created_at: string
  updated_at: string
  deleted_at?: string
}

// ============================================================
// Document Types
// ============================================================
export type DocumentStatus = 'active' | 'expired' | 'renewal_pending' | 'cancelled' | 'needs_review'

export interface Document {
  id: string
  category_id?: string
  title: string
  company_id?: string
  property_id?: string
  room_id?: string
  tenant_id?: string
  bank_account_id?: string
  related_loan_repayment_id?: string
  issue_date?: string
  contract_start_date?: string
  contract_end_date?: string
  renewal_date?: string
  status: DocumentStatus
  file_path?: string
  notes?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  created_by?: string
  updated_by?: string
  category?: DocumentCategory
  company?: Company
  property?: Property
  room?: Room
  tenant?: Tenant
  bank_account?: BankAccount
}

// ============================================================
// Document Version Types
// ============================================================
export interface DocumentVersion {
  id: string
  document_id: string
  version_number: number
  file_path: string
  file_name: string
  file_size?: number
  mime_type?: string
  uploaded_by?: string
  notes?: string
  created_at: string
}

// ============================================================
// Document Link Types
// ============================================================
export type DocumentLinkTargetType = 'company' | 'property' | 'room' | 'tenant' | 'bank_account' | 'loan_repayment' | 'expense' | 'payroll'

export interface DocumentLink {
  id: string
  document_id: string
  target_type: DocumentLinkTargetType
  target_id: string
  target_label?: string
  created_at: string
}

// ============================================================
// Document Alert Types
// ============================================================
export type AlertType = 'expiring_soon' | 'expired' | 'renewal_due'

export interface DocumentAlert {
  id: string
  document_id: string
  alert_type: AlertType
  alert_date: string
  is_resolved: boolean
  resolved_at?: string
  resolved_by?: string
  created_at: string
  document?: Document
}

// ============================================================
// Uploaded File Types
// ============================================================
export type UploadedFileStatus = 'uploaded' | 'processing' | 'extracted' | 'review_pending' | 'confirmed' | 'error'

export interface UploadedFile {
  id: string
  file_name: string
  file_path: string
  file_size: number
  mime_type: string
  uploaded_by?: string
  status: UploadedFileStatus
  notes?: string
  created_at: string
  updated_at: string
}

// ============================================================
// Extracted Data Candidate Types
// ============================================================
export type ExtractionType = 'bank_statement' | 'receipt_invoice' | 'lease_contract' | 'loan_contract'
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'needs_correction'

export interface ExtractedDataCandidate {
  id: string
  uploaded_file_id: string
  extraction_type: ExtractionType
  raw_text?: string
  parsed_json?: Record<string, unknown>
  review_status: ReviewStatus
  reviewer_id?: string
  reviewed_at?: string
  notes?: string
  created_at: string
  updated_at: string
  uploaded_file?: UploadedFile
}

// ============================================================
// Import Log Types
// ============================================================
export type ImportStatus = 'imported' | 'extracted' | 'review_pending' | 'confirmed' | 'error'

export interface ImportLog {
  id: string
  uploaded_file_id: string
  extraction_type?: ExtractionType
  status: ImportStatus
  error_message?: string
  confirmed_by?: string
  confirmed_at?: string
  target_table?: string
  target_id?: string
  notes?: string
  created_at: string
  updated_at: string
  uploaded_file?: UploadedFile
}
