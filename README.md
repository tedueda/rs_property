# RS Property - Fund Management System

Real estate management group fund management web application for 6 companies.

## Overview

This application centralizes fund management for a real estate management group, replacing Excel and bank statement-based manual processes. It enables leadership and managers to view financial status anytime/anywhere and ensures consistency across staff changes.

## Target Companies

- Hayashi Construction Co., Ltd.
- N/Y Corporation Co., Ltd.
- Owners Co., Ltd.
- Teru Co., Ltd.
- Company A (tentative)
- Company B (tentative)

## Tech Stack

- **Frontend**: Vite + React + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage + RLS)
- **State Management**: Zustand
- **Charting**: Recharts
- **Icons**: Lucide React

## Phase 1 Implementation

### 1. Authentication
- Login / Logout
- Password reset flow
- Role-based user management foundation

### 2. Authorization (RBAC)
| Role | Key | Permissions |
|------|-----|-------------|
| President | `president` | View all data |
| Accounting Manager | `accounting_manager` | Full edit access |
| Payment Handler | `payment_staff` | Billing, payment, arrears management |
| Expense/Salary Handler | `expense_staff` | (Phase 2) |
| View-only | `viewer` | Read-only access |

- UI-level permission controls
- Supabase RLS policies prepared
- Designed for future company-level access control

### 3. Common Layout
- Admin panel layout with sidebar navigation
- Responsive design (PC / tablet / mobile)
- Collapsible sidebar with mobile hamburger menu

### 4. Master Data CRUD
- **Company Management** (`/companies`): company_name, company_code, address, phone, notes
- **Property Management** (`/properties-mgmt`): company_id, property_name, address, management_start_date, notes
- **Room Management** (`/rooms`): property_id, room_number, rent, common_fee, water_fee, parking_fee, other_fixed_fee, status
- **Tenant Management** (`/tenants-mgmt`): room_id, tenant_name, phone, email, emergency_contact, contract dates, guarantor, notes

### 5. Monthly Billing Management (`/charges`)
- Monthly billing list with filters (company, property, month, status)
- Create / edit billing records
- Confirm billing (draft -> confirmed)
- Auto-calculate totals from room fees

### 6. Payment Management (`/payments`)
- Payment list with status filter and search
- Register / edit payments
- Link payments to billing records
- Auto-calculate difference and determine status
- Status: unmatched, matched, partial, overpaid, arrears, needs_review

### 7. Arrears/Delinquency Management (`/arrears-mgmt`)
- Arrears list derived from billing vs payment differences
- Status tracking: outstanding, partially_paid, resolved, written_off
- Filter by company, status, month

### 8. Dashboard (`/dashboard`)
- Group-wide KPI summary (companies, properties, rooms, tenants, billing, arrears)
- Payment collection rate with progress bar
- Company-by-company bar chart (billing vs arrears)
- Company summary table

## Phase 2 Implementation

### 1. Employee Management (`/employees`)
- Employee master data CRUD with company filter
- Search by name or employee code
- Status tracking: active, on_leave, retired

### 2. Expense Category Management (`/expense-categories`)
- Expense category master data with sort order
- Simple CRUD for organizing expense types

### 3. Expense Management (`/expenses`)
- Expense record CRUD with company/category/status filters
- Monthly total calculation and display
- Payment method tracking (bank transfer, cash, credit card, direct debit, etc.)
- Status: pending, scheduled, paid, needs_review

### 4. Payroll Management (`/payroll`)
- Payroll record management with company/status filters
- Employee dropdown filtered by selected company
- Auto-calculation: net_payment = base_salary + allowance - deduction
- Monthly total calculation
- Status: draft, confirmed, paid, needs_review

### 5. Bank Account Management (`/bank-accounts`)
- Bank account master data with company filter
- Account number masking (displays only last 4 digits as ****1234)
- Balance summary (total, average, count)
- Account type support: ordinary, checking, savings, time_deposit

### 6. Bank Transaction Management (`/bank-transactions`)
- Bank transaction records with account/type filters
- Transaction types: deposit (green), withdrawal (red)
- Balance after transaction tracking

### 7. Loan Repayment Management (`/loan-repayments`)
- Loan repayment schedule with company filter
- Withdrawal day ordering
- Balance risk detection (highlights when account balance < 2x monthly repayment)
- Monthly repayment total display
- Status: scheduled, completed, needs_review

### 8. Fund Transfer Management (`/fund-transfers`)
- Fund transfer records between bank accounts
- Account filter (shows transfers involving selected account)
- Transfer total calculation
- Validation: prevents same-account transfers

### 9. Dashboard Extension
- Bank account balance totals
- Monthly expense/payroll/repayment totals
- Company-by-company bank account balance table
- Monthly repayment schedule (sorted by withdrawal day)
- Balance risk indicators
- Recent fund transfer history

### Permission Model (Phase 2)
| Role | Phase 2 Access |
|------|----------------|
| Accounting Manager | Full edit access to all Phase 2 features |
| Expense/Salary Handler | Edit access to expenses, payroll, employees |
| Payment Handler | Read-only for Phase 2 features |
| President | Read-only for Phase 2 features |
| View-only | Read-only for Phase 2 features |

## Phase 3 Implementation

### 1. Document Category Management (`/document-categories`)
- Document category master data with sort order
- Categories: lease contracts, loan contracts, guarantor contracts, renewal notices, invoices, receipts, payroll documents, internal applications, etc.

### 2. Document Management (`/documents`)
- Document CRUD with company/category/status filters
- Business data linking (company, property, room, tenant, bank account, loan, expense, payroll)
- Contract date tracking (start, end, renewal)
- Status: active, expired, renewal_pending, cancelled, needs_review

### 3. Document Detail (`/documents/:id`)
- Version history with file upload
- Latest version identification
- Related entity links (many-to-many via document_links table)
- File preview/download infrastructure

### 4. Document Alerts (`/document-alerts`)
- Expiring/expired contract detection
- Categorized views: expired, renewal due, upcoming expiration
- Days remaining calculation with color-coded urgency
- Summary cards for quick status overview

### 5. File Upload (`/file-upload`)
- File upload with type selection (bank statement, receipt/invoice, lease contract, loan contract)
- Supported formats: JPG, PNG, HEIF, PDF, Excel, Word
- Upload status tracking: uploaded, processing, extracted, review_pending, confirmed, error
- Status summary cards

### 6. Import Review (`/import-review`)
- OCR/extraction candidate review (human confirmation mandatory - no auto-confirm)
- Raw text display with editable parsed fields
- Three-action review: approve, reject, needs correction
- Confirmation dialog for approval (irreversible action)
- Review status filter

### 7. Import History (`/import-history`)
- Import log tracking with status filters
- Status: imported, extracted, review_pending, confirmed, error
- Error message display
- Target table and confirmation timestamp tracking
- Clickable status cards for quick filtering

### 8. Dashboard Extension (Phase 3)
- Expiring contracts list with remaining days
- Recent file uploads with status
- Pending import count (human confirmation required)

### Permission Model (Phase 3)
| Role | Phase 3 Access |
|------|----------------|
| Accounting Manager | Full edit access to all document/import features |
| Payment Handler | Edit access to documents |
| Expense/Salary Handler | Edit access to documents |
| President | Read-only for Phase 3 features |
| View-only | Read-only for Phase 3 features |

## Database Schema

Main tables (see `supabase/migrations/`):
- `users`, `roles`, `user_roles`
- `companies`, `properties`, `rooms`, `tenants`
- `monthly_charges`, `payment_records`, `arrears_records`
- `employees`, `expense_categories`, `expense_records` (Phase 2)
- `payroll_records`, `bank_accounts`, `bank_transactions` (Phase 2)
- `loan_repayments`, `fund_transfer_records` (Phase 2)
- `document_categories`, `documents`, `document_versions` (Phase 3)
- `document_links`, `document_alerts` (Phase 3)
- `uploaded_files`, `extracted_data_candidates` (Phase 3)
- `import_logs`, `import_review_histories` (Phase 3)

All tables include: `id`, `created_at`, `updated_at`, `deleted_at`, `created_by`, `updated_by`
Soft delete pattern (logical deletion with `deleted_at`).

## Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_DEMO_MODE=true
```

Set `VITE_DEMO_MODE=true` to run with demo data (no Supabase connection required).

## Setup Instructions

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Database Setup (Supabase)

1. Create a new Supabase project
2. Run migrations in order:
   ```bash
   # Apply Phase 1 schema migration
   psql -f supabase/migrations/00004_fund_management_schema.sql

   # Apply Phase 1 RLS policies
   psql -f supabase/migrations/00005_fund_management_rls.sql

   # Apply Phase 2 schema migration
   psql -f supabase/migrations/00006_phase2_schema.sql

   # Apply Phase 3 schema migration
   psql -f supabase/migrations/00007_phase3_document_management.sql
   ```
3. Set environment variables with your Supabase credentials

### Demo Mode

Set `VITE_DEMO_MODE=true` in `.env` to use the app with demo data without a Supabase backend. All CRUD operations work in-memory.

## Project Structure

```
src/
  app/                    # Page components
    arrears-mgmt/         # Arrears management
    bank-accounts/        # Bank account management (Phase 2)
    bank-transactions/    # Bank transaction management (Phase 2)
    charges/              # Monthly billing
    companies/            # Company management
    dashboard/            # Dashboard
    employees/            # Employee management (Phase 2)
    expense-categories/   # Expense category management (Phase 2)
    expenses/             # Expense management (Phase 2)
    fund-transfers/       # Fund transfer management (Phase 2)
    loan-repayments/      # Loan repayment management (Phase 2)
    document-categories/  # Document category management (Phase 3)
    documents/            # Document management & detail (Phase 3)
    document-alerts/      # Document expiration alerts (Phase 3)
    file-upload/          # File upload infrastructure (Phase 3)
    import-review/        # OCR/extraction review (Phase 3)
    import-history/       # Import history tracking (Phase 3)
    login/                # Login & password reset
    payments/             # Payment management
    payroll/              # Payroll management (Phase 2)
    properties-mgmt/      # Property management
    rooms/                # Room management
    tenants-mgmt/         # Tenant management
    settings/             # User settings
  components/
    layout/               # Layout components (Sidebar, Header, MainLayout)
    shared/               # Shared components (PageHeader, StatusBadge, ConfirmDialog)
    ui/                   # shadcn/ui components
  hooks/                  # Custom React hooks
  lib/                    # Utilities, constants, permissions, Supabase client
  store/                  # Zustand store
  types/                  # TypeScript type definitions
supabase/
  migrations/             # SQL migration files
```

## Lint

```bash
npm run lint
```
