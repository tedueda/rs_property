import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { LoginPage } from '@/app/login/LoginPage'
import { ResetPasswordPage } from '@/app/login/ResetPasswordPage'
import { UpdatePasswordPage } from '@/app/login/UpdatePasswordPage'
import { DashboardPage } from '@/app/dashboard/DashboardPage'
import { CompaniesPage } from '@/app/companies/CompaniesPage'
import { PropertiesMgmtPage } from '@/app/properties-mgmt/PropertiesMgmtPage'
import { RoomsPage } from '@/app/rooms/RoomsPage'
import { TenantsMgmtPage } from '@/app/tenants-mgmt/TenantsMgmtPage'
import { ChargesPage } from '@/app/charges/ChargesPage'
import { PaymentsPage } from '@/app/payments/PaymentsPage'
import { ArrearsMgmtPage } from '@/app/arrears-mgmt/ArrearsMgmtPage'
import { EmployeesPage } from '@/app/employees/EmployeesPage'
import { ExpenseCategoriesPage } from '@/app/expense-categories/ExpenseCategoriesPage'
import { ExpensesPage } from '@/app/expenses/ExpensesPage'
import { PayrollPage } from '@/app/payroll/PayrollPage'
import { BankAccountsPage } from '@/app/bank-accounts/BankAccountsPage'
import { BankTransactionsPage } from '@/app/bank-transactions/BankTransactionsPage'
import { LoanRepaymentsPage } from '@/app/loan-repayments/LoanRepaymentsPage'
import { FundTransfersPage } from '@/app/fund-transfers/FundTransfersPage'
import { DocumentCategoriesPage } from '@/app/document-categories/DocumentCategoriesPage'
import { DocumentsPage } from '@/app/documents/DocumentsPage'
import { DocumentDetailPage } from '@/app/documents/DocumentDetailPage'
import { DocumentAlertsPage } from '@/app/document-alerts/DocumentAlertsPage'
import { MonthlyIncomeExpensePage } from '@/app/monthly-income-expense/MonthlyIncomeExpensePage'
import { UsersSettingsPage } from '@/app/settings/UsersSettingsPage'
import { PropertyLedgerPage } from '@/app/property-ledger/PropertyLedgerPage'
import { NotFoundPage } from '@/app/NotFoundPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/update-password" element={<UpdatePasswordPage />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="companies" element={<CompaniesPage />} />
          <Route path="properties-mgmt" element={<PropertiesMgmtPage />} />
          <Route path="property-ledger" element={<PropertyLedgerPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="tenants-mgmt" element={<TenantsMgmtPage />} />
          <Route path="charges" element={<ChargesPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="arrears-mgmt" element={<ArrearsMgmtPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="expense-categories" element={<ExpenseCategoriesPage />} />
          <Route path="expenses" element={<ExpensesPage />} />
          <Route path="payroll" element={<PayrollPage />} />
          <Route path="bank-accounts" element={<BankAccountsPage />} />
          <Route path="bank-transactions" element={<BankTransactionsPage />} />
          <Route path="loan-repayments" element={<LoanRepaymentsPage />} />
          <Route path="fund-transfers" element={<FundTransfersPage />} />
          <Route path="document-categories" element={<DocumentCategoriesPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="documents/:id" element={<DocumentDetailPage />} />
          <Route path="document-alerts" element={<DocumentAlertsPage />} />
          <Route path="file-upload" element={<Navigate to="/property-ledger" replace />} />
          <Route path="import-review" element={<Navigate to="/property-ledger" replace />} />
          <Route path="import-history" element={<Navigate to="/property-ledger" replace />} />
          <Route path="monthly-income-expense" element={<MonthlyIncomeExpensePage />} />
          <Route path="settings/users" element={<UsersSettingsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
