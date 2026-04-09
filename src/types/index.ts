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
