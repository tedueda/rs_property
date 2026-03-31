import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { LoginPage } from '@/app/login/LoginPage'
import { DashboardPage } from '@/app/dashboard/DashboardPage'
import { PropertiesPage } from '@/app/properties/PropertiesPage'
import { PropertyDetailPage } from '@/app/properties/PropertyDetailPage'
import { UnitsPage } from '@/app/units/UnitsPage'
import { UnitDetailPage } from '@/app/units/UnitDetailPage'
import { ApplicationsPage } from '@/app/applications/ApplicationsPage'
import { ApplicationDetailPage } from '@/app/applications/ApplicationDetailPage'
import { NewApplicationPage } from '@/app/applications/NewApplicationPage'
import { OcrJobsPage } from '@/app/ocr-jobs/OcrJobsPage'
import { ContractsPage } from '@/app/contracts/ContractsPage'
import { ContractDetailPage } from '@/app/contracts/ContractDetailPage'
import { TenantsPage } from '@/app/tenants/TenantsPage'
import { TenantDetailPage } from '@/app/tenants/TenantDetailPage'
import { RentPage } from '@/app/rent/RentPage'
import { ArrearsPage } from '@/app/arrears/ArrearsPage'
import { RepairsPage } from '@/app/repairs/RepairsPage'
import { RepairDetailPage } from '@/app/repairs/RepairDetailPage'
import { DocumentsPage } from '@/app/documents/DocumentsPage'
import { TemplateMappingsPage } from '@/app/template-mappings/TemplateMappingsPage'
import { UsersSettingsPage } from '@/app/settings/UsersSettingsPage'
import { NotFoundPage } from '@/app/NotFoundPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="properties" element={<PropertiesPage />} />
          <Route path="properties/:id" element={<PropertyDetailPage />} />
          <Route path="units" element={<UnitsPage />} />
          <Route path="units/:id" element={<UnitDetailPage />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="applications/new" element={<NewApplicationPage />} />
          <Route path="applications/:id" element={<ApplicationDetailPage />} />
          <Route path="ocr-jobs" element={<OcrJobsPage />} />
          <Route path="contracts" element={<ContractsPage />} />
          <Route path="contracts/:id" element={<ContractDetailPage />} />
          <Route path="tenants" element={<TenantsPage />} />
          <Route path="tenants/:id" element={<TenantDetailPage />} />
          <Route path="rent" element={<RentPage />} />
          <Route path="arrears" element={<ArrearsPage />} />
          <Route path="repairs" element={<RepairsPage />} />
          <Route path="repairs/:id" element={<RepairDetailPage />} />
          <Route path="documents" element={<DocumentsPage />} />
          <Route path="template-mappings" element={<TemplateMappingsPage />} />
          <Route path="settings/users" element={<UsersSettingsPage />} />
          <Route path="settings/roles" element={<UsersSettingsPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
