import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { LoginPage } from '@/app/login/LoginPage'
import { ResetPasswordPage } from '@/app/login/ResetPasswordPage'
import { DashboardPage } from '@/app/dashboard/DashboardPage'
import { CompaniesPage } from '@/app/companies/CompaniesPage'
import { PropertiesMgmtPage } from '@/app/properties-mgmt/PropertiesMgmtPage'
import { RoomsPage } from '@/app/rooms/RoomsPage'
import { TenantsMgmtPage } from '@/app/tenants-mgmt/TenantsMgmtPage'
import { ChargesPage } from '@/app/charges/ChargesPage'
import { PaymentsPage } from '@/app/payments/PaymentsPage'
import { ArrearsMgmtPage } from '@/app/arrears-mgmt/ArrearsMgmtPage'
import { UsersSettingsPage } from '@/app/settings/UsersSettingsPage'
import { NotFoundPage } from '@/app/NotFoundPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="companies" element={<CompaniesPage />} />
          <Route path="properties-mgmt" element={<PropertiesMgmtPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="tenants-mgmt" element={<TenantsMgmtPage />} />
          <Route path="charges" element={<ChargesPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="arrears-mgmt" element={<ArrearsMgmtPage />} />
          <Route path="settings/users" element={<UsersSettingsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
