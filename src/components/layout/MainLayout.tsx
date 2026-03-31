import { Outlet, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/store/app'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

export function MainLayout() {
  const { isAuthenticated, isLoading } = useAuth()
  const { sidebarCollapsed } = useAppStore()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Header />
      <main className={`pt-14 transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-60'}`}>
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
