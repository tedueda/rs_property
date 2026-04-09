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

## Database Schema

Main tables (see `supabase/migrations/`):
- `users`, `roles`, `user_roles`
- `companies`, `properties`, `rooms`, `tenants`
- `monthly_charges`, `payment_records`, `arrears_records`

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
   # Apply schema migration
   psql -f supabase/migrations/00004_fund_management_schema.sql

   # Apply RLS policies
   psql -f supabase/migrations/00005_fund_management_rls.sql
   ```
3. Set environment variables with your Supabase credentials

### Demo Mode

Set `VITE_DEMO_MODE=true` in `.env` to use the app with demo data without a Supabase backend. All CRUD operations work in-memory.

## Project Structure

```
src/
  app/                    # Page components
    arrears-mgmt/         # Arrears management
    charges/              # Monthly billing
    companies/            # Company management
    dashboard/            # Dashboard
    login/                # Login & password reset
    payments/             # Payment management
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
